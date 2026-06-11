/* ============================================================
   tenancy/ui.jsx — shared primitives: Icon, Meter, Pod, KBox, ControlPlane,
   AWS account boundary, lenses. Plain React.createElement (no JSX/Babel),
   loaded as a normal <script> so the site works from file:// too.
   Exposes everything on window for the other scripts.
   ============================================================ */
(function () {
  var React = window.React;
  var h = React.createElement;
  var useRef = React.useRef, useEffect = React.useEffect;

  /* ---- Icon: imperative Lucide host so React never reconciles the swapped <svg> ---- */
  function Icon(props) {
    var name = props.name;
    var size = props.size === undefined ? 18 : props.size;
    var strokeWidth = props.strokeWidth === undefined ? 2 : props.strokeWidth;
    var className = props.className || '';
    var style = props.style || {};
    var ref = useRef(null);

    useEffect(function () {
      var host = ref.current;
      if (!host || !window.lucide) return;
      host.innerHTML = '';
      var i = document.createElement('i');
      i.setAttribute('data-lucide', name);
      host.appendChild(i);
      try {
        window.lucide.createIcons({
          attrs: { width: size, height: size, 'stroke-width': strokeWidth },
          nameAttr: 'data-lucide',
        });
      } catch (e) { /* icon name unknown — leave empty */ }
    }, [name, size, strokeWidth]);

    return h('span', {
      ref: ref,
      className: 'icon ' + className,
      style: Object.assign({ display: 'inline-flex', width: size, height: size, lineHeight: 0 }, style),
      'aria-hidden': 'true',
    });
  }

  /* ---- Animated meter bar (width driven by value; CSS transition animates on change,
     so a frozen animation clock can never leave it empty) ---- */
  function Meter(props) {
    var value = props.value, label = props.label, icon = props.icon, hint = props.hint;
    var delay = props.delay === undefined ? 0 : props.delay;
    var band = value >= 75 ? 'hi' : value >= 45 ? 'mid' : 'lo';
    return h('div', { className: 'meter', title: hint },
      h('div', { className: 'meter-head' },
        h('span', { className: 'meter-label' }, h(Icon, { name: icon, size: 15 }), ' ', label),
        h('span', { className: 'meter-val ' + band }, Math.round(value))
      ),
      h('div', { className: 'meter-track' },
        h('div', { className: 'meter-fill ' + band, style: { width: value + '%', transitionDelay: delay + 'ms' } },
          h('span', { className: 'meter-shine' })
        )
      )
    );
  }

  /* ---- Diagram primitives ---------------------------------------------------- */

  /* A pod: small glowing tile, tenant-colored. Pods are always tenant-owned. */
  function Pod(props) {
    var t = props.t === undefined ? 0 : props.t;
    var i = props.i === undefined ? 0 : props.i;
    return h('span', { className: 'k-pod', 'data-t': t, 'data-owner': 'tenant', style: { '--d': (i * 0.05) + 's' } });
  }

  /* A row/grid of pods for tenant t. */
  function Pods(props) {
    var t = props.t === undefined ? 0 : props.t;
    var n = props.n === undefined ? 4 : props.n;
    var start = props.start === undefined ? 0 : props.start;
    var pods = [];
    for (var i = 0; i < n; i++) pods.push(h(Pod, { key: i, t: t, i: start + i }));
    return h('span', { className: 'k-pods' }, pods);
  }

  /* Container box: cluster / node / namespace / cell / vcluster. owner = who runs it. */
  var OWNER_BY_KIND = { namespace: 'tenant', vcluster: 'tenant', node: 'platform', pool: 'platform', cluster: 'platform', cell: 'platform', repo: 'platform', fleet: 'platform' };
  function KBox(props) {
    var kind = props.kind || 'cluster';
    var label = props.label, t = props.t, owner = props.owner;
    var glow = props.glow || false;
    var className = props.className || '';
    var style = props.style || {};
    return h('div', {
      className: 'k-box k-' + kind + ' ' + (glow ? 'glow' : '') + ' ' + className,
      'data-t': t,
      'data-owner': owner || OWNER_BY_KIND[kind] || 'platform',
      style: style,
    },
      label ? h('span', { className: 'k-tab' }, label) : null,
      h('div', { className: 'k-body' }, props.children)
    );
  }

  /* Control-plane pill with a flowing shimmer. */
  function ControlPlane(props) {
    var label = props.label === undefined ? 'control plane' : props.label;
    var t = props.t;
    var owner = props.owner === undefined ? 'platform' : props.owner;
    var mini = props.mini || false;
    return h('div', { className: 'k-cp ' + (mini ? 'mini' : ''), 'data-t': t, 'data-owner': owner },
      h(Icon, { name: 'cpu', size: mini ? 12 : 14 }),
      h('span', null, label),
      h('span', { className: 'k-cp-flow' })
    );
  }

  /* A labelled tag chip (customer= / tier= / app=) used by the ISV model. */
  function TagChip(props) {
    return h('span', { className: 'tag-chip' }, props.children);
  }

  /* ---- AWS account boundary ---------------------------------------------------
     Wraps one or more clusters to show the AWS account they live in. `tone`
     distinguishes workload accounts from the management/hub account. */
  function AwsAccount(props) {
    var alias = props.alias, id = props.id, role = props.role;
    var tone = props.tone || 'workload';
    var className = props.className || '';
    var style = props.style || {};
    return h('div', { className: 'aws-account tone-' + tone + ' ' + className, style: style },
      h('span', { className: 'aws-account-tab' },
        h(Icon, { name: 'cloud', size: 11 }),
        h('span', { className: 'aws-acct-alias' }, alias),
        id ? h('span', { className: 'aws-acct-id' }, id) : null
      ),
      role ? h('span', { className: 'aws-account-role' }, h(Icon, { name: 'id-card', size: 10 }), ' ', role) : null,
      h('div', { className: 'aws-account-body' }, props.children)
    );
  }

  /* Optional pass-through: wrap in an AWS account only when `on` is true. */
  function MaybeAccount(props) {
    if (!props.on) return props.children;
    var rest = {};
    for (var k in props) {
      if (k !== 'on' && k !== 'children') rest[k] = props[k];
    }
    return h(AwsAccount, rest, props.children);
  }

  function TenantChip(props) {
    return h('span', { className: 'tenant-chip', 'data-t': props.t },
      h('span', { className: 'tenant-dot' }), props.label
    );
  }

  /* ---- Lens helpers ---------------------------------------------------------- */

  /* Legend shown when the AWS Accounts lens is active. */
  function AccountLegend(props) {
    var note = props.note;
    return h('div', { className: 'acct-legend' },
      h('span', { className: 'acct-legend-key' }, h('span', { className: 'acct-legend-swatch workload' }), ' Workload account'),
      h('span', { className: 'acct-legend-key' }, h('span', { className: 'acct-legend-swatch mgmt' }), ' Management / hub account'),
      note ? h('span', { className: 'acct-legend-note' }, h(Icon, { name: 'info', size: 12 }), ' ', note) : null
    );
  }

  /* Legend shown when the Ownership lens is active. */
  function OwnershipLegend() {
    return h('div', { className: 'own-legend' },
      h('span', { className: 'own-key platform' }, h('span', { className: 'own-swatch' }), h(Icon, { name: 'users', size: 13 }), ' Central platform team'),
      h('span', { className: 'own-key tenant' }, h('span', { className: 'own-swatch' }), h(Icon, { name: 'box', size: 13 }), ' Tenant / app owner')
    );
  }

  /* The platform add-on stack — shown when the Add-ons lens is active. */
  function AddonRail(props) {
    var caption = props.caption;
    return h('div', { className: 'addon-rail' },
      h('div', { className: 'addon-cap' }, h(Icon, { name: 'package', size: 14 }), ' ', caption),
      h('div', { className: 'addon-chips' },
        window.ADDONS.map(function (a) {
          return h('span', { className: 'addon-chip', key: a.name },
            h(Icon, { name: a.icon, size: 14 }),
            h('span', { className: 'addon-name' }, a.name),
            h('span', { className: 'addon-role' }, a.role)
          );
        })
      )
    );
  }

  /* "Who owns what" split card for the info panel (ownership / add-ons lenses). */
  function WhoOwns(props) {
    var model = props.model;
    return h('div', { className: 'who-owns' },
      h('div', { className: 'who-col platform' },
        h('h3', null, h(Icon, { name: 'users', size: 15 }), ' Central team owns'),
        h('ul', null, model.central.map(function (x, i) { return h('li', { key: i, style: { '--i': i } }, x); }))
      ),
      h('div', { className: 'who-col tenant' },
        h('h3', null, h(Icon, { name: 'box', size: 15 }), ' Tenant owns'),
        h('ul', null, model.tenant.map(function (x, i) { return h('li', { key: i, style: { '--i': i } }, x); }))
      )
    );
  }

  Object.assign(window, { Icon: Icon, Meter: Meter, Pod: Pod, Pods: Pods, KBox: KBox, ControlPlane: ControlPlane, TenantChip: TenantChip, TagChip: TagChip, AwsAccount: AwsAccount, MaybeAccount: MaybeAccount, AccountLegend: AccountLegend, OwnershipLegend: OwnershipLegend, AddonRail: AddonRail, WhoOwns: WhoOwns });
})();
