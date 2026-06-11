/* ============================================================
   tenancy/app.jsx — main interactive explorer: spectrum selector, lens
   switch, info panel, comparison matrix, and the app shell. Plain
   React.createElement (no JSX/Babel), loaded as a normal <script> so the
   site works from file:// too.
   ============================================================ */
(function () {
  var React = window.React;
  var h = React.createElement;
  var useState = React.useState, useEffect = React.useEffect, useCallback = React.useCallback;
  var Diagram = window.Diagram, Meter = window.Meter, Icon = window.Icon, TenantChip = window.TenantChip,
      OwnershipLegend = window.OwnershipLegend, AccountLegend = window.AccountLegend,
      AddonRail = window.AddonRail, WhoOwns = window.WhoOwns, AIOps = window.AIOps;
  var MODELS = window.MODELS;
  var METERS = window.METERS;

  var LS_KEY = 'k8s-mt-model';

  function useStickyIndex() {
    var state = useState(function () {
      var v = parseInt(localStorage.getItem(LS_KEY), 10);
      return Number.isFinite(v) && v >= 0 && v < MODELS.length ? v : 0;
    });
    var i = state[0], setI = state[1];
    useEffect(function () { localStorage.setItem(LS_KEY, String(i)); }, [i]);
    return [i, setI];
  }

  /* ---- Spectrum selector ---------------------------------------------------- */
  function Spectrum(props) {
    var index = props.index, onPick = props.onPick;
    return h('div', { className: 'spectrum' },
      h('span', { className: 'spectrum-end left' },
        h('strong', null, 'shared'), h('span', null, 'cheap · soft boundary')
      ),
      h('div', { className: 'spectrum-rail' },
        h('div', { className: 'spectrum-line' }),
        h('div', { className: 'spectrum-fill', style: { width: (index / (MODELS.length - 1) * 100) + '%' } }),
        MODELS.map(function (p, i) {
          return h('button', {
            key: p.id,
            className: 'spectrum-node' + (i === index ? ' active' : '') + (i < index ? ' past' : ''),
            style: { left: (i / (MODELS.length - 1) * 100) + '%' },
            onClick: function () { onPick(i); },
            title: p.name,
          },
            h('span', { className: 'spectrum-dot' }, h(Icon, { name: p.icon, size: 16 })),
            h('span', { className: 'spectrum-cap' }, p.num)
          );
        })
      ),
      h('span', { className: 'spectrum-end right' },
        h('strong', null, 'isolated'), h('span', null, 'costly · hard boundary')
      )
    );
  }

  /* ---- Lens switch ---------------------------------------------------------- */
  var LENSES = [
    { id: 'none', label: 'Topology', icon: 'box' },
    { id: 'ownership', label: 'Ownership', icon: 'users' },
  ];
  function LensSwitch(props) {
    var lens = props.lens, onPick = props.onPick;
    return h('div', { className: 'lens-switch' },
      h('span', { className: 'lens-cap' }, 'LENS'),
      LENSES.map(function (l) {
        return h('button', { key: l.id, className: 'lens-btn' + (lens === l.id ? ' on' : ''), onClick: function () { onPick(l.id); } },
          h(Icon, { name: l.icon, size: 14 }), ' ', l.label
        );
      })
    );
  }

  /* ---- Autonomy zone badge (links Explore ↔ AI Ops) ------------------------- */
  function ZONE_BY_ID(id) {
    var zones = window.AI_ZONES || [];
    for (var i = 0; i < zones.length; i++) {
      if (zones[i].id === id) return zones[i];
    }
    return undefined;
  }
  function AutonomyBadge(props) {
    var model = props.model, onJump = props.onJump;
    var z1 = ZONE_BY_ID(model.aiZone);
    var z2 = model.aiZoneTo ? ZONE_BY_ID(model.aiZoneTo) : null;
    if (!z1) return null;
    return h('button', { className: 'autonomy', onClick: function () { onJump(model.aiZone); }, title: 'Open AI Ops — show this zone' },
      h('span', { className: 'autonomy-top' },
        h('span', { className: 'autonomy-cap' }, h(Icon, { name: 'bot', size: 12 }), ' AI autonomy'),
        h('span', { className: 'autonomy-zones' },
          h('span', { className: 'zone-pill', style: { '--zc': z1.accent } },
            h(Icon, { name: z1.icon, size: 12 }), ' Zone ', z1.num, ' · ', z1.label
          ),
          z2 ? h('span', { className: 'zone-arrow' }, h(Icon, { name: 'arrow-right', size: 12 })) : null,
          z2 ? h('span', { className: 'zone-pill', style: { '--zc': z2.accent } },
            h(Icon, { name: z2.icon, size: 12 }), ' Zone ', z2.num, ' · ', z2.label
          ) : null
        )
      ),
      h('span', { className: 'autonomy-text' }, model.aiHook),
      h('span', { className: 'autonomy-go' }, 'Open AI Ops ', h(Icon, { name: 'arrow-up-right', size: 13 }))
    );
  }

  /* ---- AWS account summary chip -------------------------------------------- */
  function AwsStrip(props) {
    var aws = props.aws;
    if (!aws) return null;
    return h('div', { className: 'aws-strip' },
      h('div', { className: 'aws-strip-top' },
        h('span', { className: 'aws-strip-badge' }, h(Icon, { name: 'cloud', size: 16 })),
        h('span', { className: 'aws-strip-model' }, aws.model),
        h('span', { className: 'aws-strip-pill' }, aws.boundary, ' boundary')
      ),
      h('p', { className: 'aws-strip-detail' }, aws.detail),
      h('span', { className: 'aws-strip-meta' }, h(Icon, { name: 'server', size: 11 }), ' Data plane · ', aws.dataPlane)
    );
  }

  /* ---- Info panel ------------------------------------------------------------ */
  function InfoPanel(props) {
    var p = props.p, lens = props.lens, onJumpZone = props.onJumpZone;
    return h('div', { className: 'info', key: p.id + lens },
      h('div', { className: 'info-head' },
        h('span', { className: 'info-num' }, h(Icon, { name: p.icon, size: 22 })),
        h('div', null,
          h('span', { className: 'info-kicker' }, p.tag),
          h('h2', { className: 'info-name' }, p.name),
          h('p', { className: 'info-tag' }, p.tagline)
        )
      ),
      h('p', { className: 'info-summary' }, p.summary),

      lens === 'ownership' ? h(AwsStrip, { aws: p.aws }) : null,

      lens === 'none' ? h('div', { className: 'meters' },
        METERS.map(function (m, i) {
          return h(Meter, { key: m.key, value: p.meters[m.key], label: m.label, icon: m.icon, hint: m.hint, delay: i * 90 });
        })
      ) : null,

      lens === 'ownership' ? h(WhoOwns, { model: p }) : null,

      lens === 'ownership' ? h('div', { className: 'addon-note' }, h(Icon, { name: 'package', size: 15 }), ' ', h('span', null, p.addonDelivery)) : null,

      lens === 'none' ? h(AutonomyBadge, { model: p, onJump: onJumpZone }) : null
    );
  }

  /* ---- Comparison matrix ------------------------------------------------------ */
  var SCORE_BANDS = window.SCORE_BANDS;
  function Compare(props) {
    var index = props.index, onPick = props.onPick;
    var axisState = useState('isolation'), axis = axisState[0], setAxis = axisState[1];
    var sel = METERS.find(function (m) { return m.key === axis; }) || METERS[0];
    return h('div', { className: 'compare axis-' + axis },
      h('div', { className: 'compare-key' },
        h('div', { className: 'ck-lead' },
          h('span', { className: 'ck-cap' }, h(Icon, { name: 'info', size: 12 }), ' How to read this'),
          h('p', { className: 'ck-note' }, 'Every model is scored ', h('strong', null, '0–100 on each axis — higher is always better.'), ' Bar color shows the band:')
        ),
        h('div', { className: 'ck-bands' },
          SCORE_BANDS.map(function (b) {
            return h('span', { key: b.band, className: 'ck-band' },
              h('span', { className: 'ck-swatch ' + b.band }),
              h('span', { className: 'ck-band-txt' }, h('strong', null, b.label), ' ', h('span', { className: 'ck-range' }, b.range), ' — ', b.desc)
            );
          })
        )
      ),

      h('div', { className: 'compare-grid' },
        h('div', { className: 'compare-col head-col' },
          h('div', { className: 'ch-spacer' }),
          METERS.map(function (m) {
            return h('div', { key: m.key, className: 'ch-row' + (m.key === axis ? ' sel' : ''), 'data-metric': m.key },
              h(Icon, { name: m.icon, size: 14 }), ' ', m.label
            );
          })
        ),
        MODELS.map(function (p, i) {
          return h('button', { key: p.id, className: 'compare-col' + (i === index ? ' active' : ''), onClick: function () { onPick(i); } },
            h('div', { className: 'cc-head' },
              h('span', { className: 'cc-num' }, h(Icon, { name: p.icon, size: 16 })),
              h('span', { className: 'cc-name' }, p.name)
            ),
            METERS.map(function (m) {
              var v = p.meters[m.key];
              var band = v >= 75 ? 'hi' : v >= 45 ? 'mid' : 'lo';
              return h('div', { key: m.key, className: 'cc-cell' + (m.key === axis ? ' sel' : ''), 'data-metric': m.key },
                h('div', { className: 'cc-bar' }, h('div', { className: 'cc-fill ' + band, style: { width: v + '%' } })),
                h('span', { className: 'cc-num-val' }, v)
              );
            })
          );
        })
      ),

      h('div', { className: 'compare-defs' },
        h('span', { className: 'cd-cap' }, h(Icon, { name: 'ruler', size: 12 }), ' What each axis means · ', h('span', { className: 'cd-cap-hint' }, 'click an axis to see how the score is calculated')),
        h('div', { className: 'cd-grid', role: 'tablist' },
          METERS.map(function (m) {
            return h('button', {
              key: m.key,
              role: 'tab',
              'aria-selected': m.key === axis,
              className: 'cd-item' + (m.key === axis ? ' on' : ''),
              onClick: function () { setAxis(m.key); },
            },
              h('span', { className: 'cd-head' }, h(Icon, { name: m.icon, size: 15 }), ' ', m.label, ' ', h(Icon, { name: 'chevron-down', size: 14, className: 'cd-caret' })),
              h('span', { className: 'cd-text' }, m.def)
            );
          })
        ),

        h('div', { className: 'cd-detail', key: axis },
          h('div', { className: 'cd-detail-head' },
            h('span', { className: 'cd-detail-badge' }, h(Icon, { name: sel.icon, size: 16 })),
            h('div', null,
              h('span', { className: 'cd-detail-cap' }, h(Icon, { name: 'calculator', size: 11 }), ' How we get to the ', sel.label, ' score'),
              h('p', { className: 'cd-detail-lead' }, sel.lead)
            )
          ),
          h('div', { className: 'cd-factors' },
            sel.factors.map(function (f, i) {
              return h('div', { key: i, className: 'cd-factor ' + f.dir, style: { '--i': i } },
                h('span', { className: 'cd-factor-icon' }, h(Icon, { name: f.dir === 'up' ? 'arrow-up' : 'arrow-down', size: 13 })),
                h('span', { className: 'cd-factor-txt' }, f.text)
              );
            })
          ),
          h('div', { className: 'cd-factor-legend' },
            h('span', { className: 'cd-fl up' }, h('span', { className: 'cd-fl-dot' }, h(Icon, { name: 'arrow-up', size: 11 })), ' raises the score'),
            h('span', { className: 'cd-fl down' }, h('span', { className: 'cd-fl-dot' }, h(Icon, { name: 'arrow-down', size: 11 })), ' lowers the score')
          )
        )
      )
    );
  }

  /* ---- App -------------------------------------------------------------------- */
  function App() {
    var indexState = useStickyIndex(), index = indexState[0], setIndex = indexState[1];
    var modeState = useState('explore'), mode = modeState[0], setMode = modeState[1];
    var lensState = useState('none'), lens = lensState[0], setLens = lensState[1];
    var highlightState = useState(null), highlightZone = highlightState[0], setHighlightZone = highlightState[1];
    var p = MODELS[index];

    var jumpToZone = useCallback(function (zoneId) {
      setHighlightZone(zoneId);
      setMode('ai');
    }, []);

    var go = useCallback(function (d) {
      setIndex(function (i) { return (i + d + MODELS.length) % MODELS.length; });
    }, [setIndex]);

    useEffect(function () {
      var onKey = function (e) {
        if (mode !== 'explore') return;
        if (e.key === 'ArrowRight') go(1);
        if (e.key === 'ArrowLeft') go(-1);
      };
      window.addEventListener('keydown', onKey);
      return function () { window.removeEventListener('keydown', onKey); };
    }, [go, mode]);

    return h('div', { className: 'app' },
      h('header', { className: 'top' },
        h('div', { className: 'brand' },
          h('span', { className: 'brand-mark' }, h(Icon, { name: 'hexagon', size: 20 })),
          h('div', { className: 'brand-txt' },
            h('h1', null, 'Kubernetes Tenancy Models in EKS'),
            h('p', null, 'Six EKS platform models, drawn account-first — every cluster inside its AWS account boundary.')
          )
        ),
        h('div', { className: 'top-controls' },
          h('nav', { className: 'mode-toggle', 'aria-label': 'View' },
            h('button', { className: mode === 'explore' ? 'on' : '', onClick: function () { setMode('explore'); } },
              h(Icon, { name: 'scan-search', size: 17 }), ' Explore'
            ),
            h('button', { className: mode === 'compare' ? 'on' : '', onClick: function () { setMode('compare'); } },
              h(Icon, { name: 'layout-grid', size: 17 }), ' Compare'
            ),
            h('button', { className: mode === 'ai' ? 'on' : '', onClick: function () { setHighlightZone(null); setMode('ai'); } },
              h(Icon, { name: 'bot', size: 17 }), ' AI Ops'
            )
          )
        )
      ),

      mode === 'explore' ? h(Spectrum, { index: index, onPick: setIndex }) : null,

      mode === 'explore' ? h('main', { className: 'stage-wrap' },
        h(InfoPanel, { p: p, lens: lens, onJumpZone: jumpToZone }),
        h('section', { className: 'stage lens-' + lens },
          h('div', { className: 'stage-top' },
            h('span', { className: 'stage-step' }, 'MODEL ', p.num, ' / 6'),
            h(LensSwitch, { lens: lens, onPick: setLens })
          ),
          h(AccountLegend, { note: p.aws && p.aws.model }),
          lens === 'ownership' ? h(OwnershipLegend) : null,
          h(Diagram, { id: p.diagram, acct: true }),
          lens === 'ownership' ? h(AddonRail, { caption: 'Amazon EKS add-on stack — owned & version-controlled by the central team' }) : null,
          h('div', { className: 'nav' },
            h('button', { onClick: function () { go(-1); }, className: 'nav-btn' }, h(Icon, { name: 'arrow-left', size: 18 })),
            h('span', { className: 'nav-name' }, p.name),
            h('button', { onClick: function () { go(1); }, className: 'nav-btn' }, h(Icon, { name: 'arrow-right', size: 18 }))
          )
        )
      ) : null,

      mode === 'compare' ? h(Compare, { index: index, onPick: function (i) { setIndex(i); setMode('explore'); } }) : null,

      mode === 'ai' ? h(AIOps, { highlightZone: highlightZone, onConsumeHighlight: function () { setHighlightZone(null); } }) : null,

      h('footer', { className: 'site-footer' },
        'This website was designed by ',
        h('a', { href: 'https://mollysheets.com', target: '_blank', rel: 'noopener noreferrer' }, 'Molly Sheets'),
        ' © 2026 with the help of Claude Code, Claude Design, and the blood, sweat, and tears of 20 years of engineering pain from websites.'
      )
    );
  }

  ReactDOM.createRoot(document.getElementById('root')).render(h(App));
})();
