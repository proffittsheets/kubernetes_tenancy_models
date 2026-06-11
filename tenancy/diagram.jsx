/* ============================================================
   tenancy/diagram.jsx — per-model EKS topology diagrams composed from
   ui.jsx primitives. Each diagram takes an `acct` flag: when true, clusters
   are wrapped in their AWS account boundary; when false, the diagram shows
   EKS topology only. Plain React.createElement (no JSX/Babel).
   ============================================================ */
(function () {
  var React = window.React;
  var h = React.createElement;
  var KBox = window.KBox, Pod = window.Pod, Pods = window.Pods, ControlPlane = window.ControlPlane,
      TagChip = window.TagChip, MaybeAccount = window.MaybeAccount, DIcon = window.Icon;

  var TNAMES = ['team-alpha', 'team-beta', 'team-delta', 'team-gamma'];
  var CUST = ['AlphaCo', 'BetaCo', 'GammaCo'];
  /* Illustrative, obviously-fake AWS account IDs — all-numeric placeholders
     (AWS docs use values like 012345678901; real IDs are 12 random digits). */
  var AID = ['0123-4567-8910', '1234-5678-9012', '2345-6789-0123', '3456-7890-1234'];

  /* 1 — Single-Tenant Clusters: a dedicated EKS cluster per team, each in its own account */
  function DSingle(props) {
    var acct = props.acct;
    return h('div', { className: 'row gap-lg fill stretch' },
      [0, 1, 2].map(function (t) {
        return h(MaybeAccount, { key: t, on: acct, alias: TNAMES[t], id: AID[t], role: 'own IAM · KMS · VPC', className: 'grow acct-grow acct-compact' },
          h(KBox, { kind: 'cluster', t: t, label: TNAMES[t] + ' · EKS', className: 'grow tcluster', glow: true },
            h(ControlPlane, { label: 'EKS control plane', t: t, mini: true }),
            h('div', { className: 'col snode-stack' },
              [0, 1].map(function (n) {
                return h(KBox, { key: n, kind: 'node', t: t, label: 'managed node group', className: 'snode' },
                  h(Pods, { t: t, n: 4, start: n * 4 })
                );
              })
            )
          )
        );
      })
    );
  }

  /* 2 — Multi-Tenant NaaS: one shared EKS cluster, namespace per team, one platform account */
  function DNaas(props) {
    var acct = props.acct;
    return h(MaybeAccount, { on: acct, alias: 'platform-prod', id: AID[0], role: 'platform account · one shared cluster', className: 'fill' },
      h(KBox, { kind: 'cluster', label: 'shared EKS cluster', glow: true, className: 'dnaas' },
        h(ControlPlane, { label: 'EKS control plane · access entries + admission' }),
        h('div', { className: 'row fill naas-row' },
          [0, 1, 2].map(function (t) {
            return h(KBox, { key: t, kind: 'namespace', t: t, label: 'ns / ' + TNAMES[t], className: 'grow' },
              h(Pods, { t: t, n: 4, start: t * 4 })
            );
          })
        ),
        h('div', { className: 'k-noderow' },
          h('span', { className: 'k-mini-tab' }, 'shared managed node group · VPC CNI · Karpenter · Container Insights'),
          h('div', { className: 'row naas-row' },
            [0, 1, 2].map(function (n) {
              return h(KBox, { key: n, kind: 'node', label: 'mng-nodegroup-' + (n + 1), className: 'grow' },
                h('span', { className: 'k-pods' },
                  h(Pod, { t: 0, i: n }), h(Pod, { t: 1, i: n + 1 }), h(Pod, { t: 2, i: n + 2 })
                )
              );
            })
          )
        )
      )
    );
  }

  /* 3 — ISV / MSP: env-scoped namespaces, customers identified by labels, one provider account */
  function DIsv(props) {
    var acct = props.acct;
    return h(MaybeAccount, { on: acct, alias: 'provider-prod', id: AID[0], role: 'provider account · all customers', className: 'fill' },
      h(KBox, { kind: 'cluster', label: 'provider EKS cluster', glow: true },
        h(ControlPlane, { label: 'EKS control plane · OPA label policy' }),
        h('div', { className: 'row gap-md fill' },
          ['prod', 'staging'].map(function (env, ei) {
            return h(KBox, { key: env, kind: 'namespace', t: 3, label: 'ns / ' + env, className: 'grow' },
              h('div', { className: 'col gap-sm' },
                [0, 1, 2].map(function (c) {
                  return h('div', { className: 'isv-wl', key: c, 'data-t': c },
                    h('span', { className: 'isv-tags' },
                      h(TagChip, null, 'customer=', CUST[c]),
                      h(TagChip, null, 'tier=', env)
                    ),
                    h(Pods, { t: c, n: 3, start: ei * 3 + c })
                  );
                })
              )
            );
          })
        )
      )
    );
  }

  /* 4 — Regional / Sharded Fleet: Git reconciled to a few MULTI-TENANT regional shards,
     one management account + one workload account per region */
  function DGitops(props) {
    var acct = props.acct;
    var REGIONS = ['region · us-east', 'region · eu-west'];
    var RSLUG = ['us-east', 'eu-west'];
    return h('div', { className: 'col gap-md fill' },
      h('div', { className: 'row gap-md fill stretch' },
        h(MaybeAccount, { on: acct, alias: 'platform-mgmt', id: AID[3], tone: 'mgmt', role: 'management account', className: 'gitops-mgmt-acct' },
          h(KBox, { kind: 'repo', label: 'git · source', className: 'gitops-repo' },
            h('div', { className: 'repo-line' }, h(DIcon, { name: 'folder', size: 13 }), ' clusters/'),
            h('div', { className: 'repo-line' }, h(DIcon, { name: 'folder', size: 13 }), ' addons/'),
            h('div', { className: 'repo-line' }, h(DIcon, { name: 'folder', size: 13 }), ' policies/'),
            h('div', { className: 'repo-line' }, h(DIcon, { name: 'folder', size: 13 }), ' apps/')
          )
        ),
        h('div', { className: 'gitops-flow' },
          h('span', { className: 'gitops-arrow' }, h(DIcon, { name: 'arrow-right', size: 16 })),
          h('span', { className: 'gitops-sync' }, 'ArgoCD / Flux', h('br'), 'cross-account sync')
        ),
        h('div', { className: 'col gap-sm grow' },
          REGIONS.map(function (r, ci) {
            return h(MaybeAccount, { key: r, on: acct, alias: 'workload-' + RSLUG[ci], id: AID[ci], role: 'region account · own VPC', className: 'acct-grow' },
              h(KBox, { kind: 'cluster', label: 'EKS shard · ' + r, className: 'gitops-cl' },
                h('span', { className: 'gitops-cl-note' }, h(DIcon, { name: 'users', size: 11 }), ' multi-tenant · 3 teams'),
                h('div', { className: 'row gap-sm' },
                  [0, 1, 2].map(function (t) {
                    return h('div', { className: 'gitops-ns', 'data-t': t, key: t },
                      h(Pods, { t: t, n: 2, start: ci * 6 + t * 2 })
                    );
                  })
                )
              )
            );
          })
        )
      )
    );
  }

  /* 5 — Virtual Clusters: vclusters inside a shared host EKS cluster, one host account */
  function DVcluster(props) {
    var acct = props.acct;
    return h(MaybeAccount, { on: acct, alias: 'host-prod', id: AID[0], role: 'single host account · IAM stays host-scoped', className: 'fill' },
      h(KBox, { kind: 'cluster', label: 'host EKS cluster · shared nodes / VPC CNI / EBS', glow: true },
        h(ControlPlane, { label: 'EKS control plane (host)' }),
        h('div', { className: 'row gap-md fill' },
          [0, 1, 2].map(function (t) {
            return h(KBox, { key: t, kind: 'vcluster', t: t, label: 'vcluster · ' + TNAMES[t], className: 'grow', glow: true },
              h(ControlPlane, { label: 'virtual API server', t: t, owner: 'tenant', mini: true }),
              h(Pods, { t: t, n: 5, start: t * 5 })
            );
          })
        )
      )
    );
  }

  /* 6 — Cell-Based: customers routed to isolated cells by a global AWS service (Route 53 /
     Global Accelerator) that sits IN FRONT of the cells; a hub account provisions them. */
  function DCell(props) {
    var acct = props.acct;
    return h('div', { className: 'col fill cell-arch' },
      /* Global front door — a shared AWS service, not an account */
      h('div', { className: 'cell-frontdoor' },
        h('span', { className: 'cell-frontdoor-tab' }, h(DIcon, { name: 'cloud', size: 11 }), ' AWS global service · not an account'),
        h('span', { className: 'cell-frontdoor-badge' }, h(DIcon, { name: 'route', size: 19 })),
        h('div', { className: 'cell-frontdoor-txt' },
          h('span', { className: 'cell-frontdoor-title' }, 'Route 53 / Global Accelerator'),
          h('span', { className: 'cell-frontdoor-sub' }, 'global front door — routes each customer to their cell')
        )
      ),
      /* routing fan: front door → each cell */
      h('div', { className: 'cell-fan svc-fan' },
        h('span', { className: 'cell-fan-stem' }),
        h('span', { className: 'cell-fan-bus' }),
        [0, 1, 2].map(function (t) {
          return h('span', { className: 'cell-fan-drop', key: t, style: { left: (16.667 + t * 33.333) + '%', '--d': (t * 0.25) + 's' } },
            h('span', { className: 'cell-flow' })
          );
        }),
        h('span', { className: 'cell-fan-label' }, 'customer traffic → cell')
      ),
      /* the isolated cells */
      h('div', { className: 'row gap-md fill stretch' },
        [0, 1, 2].map(function (t) {
          return h(MaybeAccount, { key: t, on: acct, alias: CUST[t] + '-cell', id: AID[t], role: 'cell account', className: 'grow acct-grow acct-compact' },
            h(KBox, { kind: 'cell', t: t, label: 'cell · ' + CUST[t], className: 'grow', glow: true },
              h(KBox, { kind: 'cluster', t: t, label: 'isolated EKS cluster', className: 'tcluster' },
                h(ControlPlane, { label: 'cp', t: t, mini: true }),
                h(Pods, { t: t, n: 4, start: t * 4 })
              )
            )
          );
        })
      ),
      /* control plane: the hub account that provisions the cells */
      h('div', { className: 'cell-mgmt-row' },
        h(MaybeAccount, { on: acct, alias: 'platform-hub', id: AID[3], tone: 'mgmt', role: 'management account', className: 'cell-hub-acct' },
          h(KBox, { kind: 'cluster', label: 'hub / management EKS cluster', className: 'cell-hub', glow: true },
            h(ControlPlane, { label: 'Cluster API + ArgoCD' }),
            h('span', { className: 'cell-hub-note' }, h(DIcon, { name: 'info', size: 11 }), ' provisions & syncs every cell via GitOps · no app workloads')
          )
        )
      )
    );
  }

  var DIAGRAMS = {
    single: DSingle,
    naas: DNaas,
    isv: DIsv,
    gitops: DGitops,
    vcluster: DVcluster,
    cell: DCell,
  };

  function Diagram(props) {
    var id = props.id;
    var acct = props.acct || false;
    var Comp = DIAGRAMS[id] || DNaas;
    return h('div', { className: 'diagram' + (acct ? ' has-accounts' : ''), key: id + (acct ? '-a' : '') },
      h(Comp, { acct: acct })
    );
  }

  Object.assign(window, { Diagram: Diagram });
})();
