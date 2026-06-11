/* ============================================================
   tenancy/aiops.jsx — AI-Augmented Platform Operations mode: the three
   autonomy zones + an animated self-healing demo. Plain React.createElement
   (no JSX/Babel), loaded as a normal <script> so the site works from file://.
   ============================================================ */
(function () {
  var React = window.React;
  var h = React.createElement;
  var useState = React.useState, useEffect = React.useEffect, useRef = React.useRef;
  var AIcon = window.Icon;

  /* ---- Animated self-healing demo ------------------------------------------- */
  function SelfHealing() {
    var steps = window.HEAL_STEPS;
    var activeState = useState(0), active = activeState[0], setActive = activeState[1];
    var runningState = useState(true), running = runningState[0], setRunning = runningState[1];
    var timer = useRef(null);

    useEffect(function () {
      if (!running) return;
      timer.current = setInterval(function () {
        setActive(function (a) { return (a + 1) % steps.length; });
      }, 2100);
      return function () { clearInterval(timer.current); };
    }, [running, steps.length]);

    // node-2: healthy → failing (1-2) → cordoned (3) → drained/ok (4)
    var node2State = active >= 4 ? 'ok' : active === 3 ? 'act' : active >= 1 ? 'bad' : 'ok';
    var node1Boosted = active >= 3;

    return h('div', { className: 'heal' },
      h('div', { className: 'heal-head' },
        h('div', null,
          h('h3', { className: 'heal-title' }, h(AIcon, { name: 'heart-pulse', size: 18 }), ' Self-healing in action'),
          h('p', { className: 'heal-sub' }, 'A Zone-3 autonomous agent detects, diagnoses and remediates — every action written to the audit log.')
        ),
        h('button', { className: 'heal-replay', onClick: function () { setActive(0); setRunning(true); } },
          h(AIcon, { name: 'rotate-ccw', size: 14 }), ' Replay'
        )
      ),

      h('div', { className: 'heal-stage' },
        h('div', { className: 'heal-nodes' },
          h('div', { className: 'heal-node ' + (node1Boosted ? 'boost' : 'ok') },
            h('span', { className: 'heal-node-tab' }, h(AIcon, { name: 'server', size: 13 }), ' node-1'),
            h('div', { className: 'heal-pods' },
              Array.from({ length: node1Boosted ? 6 : 4 }).map(function (_, i) {
                return h('span', { key: i, className: 'heal-pod' + (node1Boosted && i >= 4 ? ' migrated' : '') });
              })
            ),
            node1Boosted ? h('span', { className: 'heal-badge in' }, h(AIcon, { name: 'arrow-down-left', size: 12 }), ' rescheduled') : null
          ),

          h('div', { className: 'heal-node ' + node2State },
            h('span', { className: 'heal-node-tab' }, h(AIcon, { name: 'server', size: 13 }), ' node-2'),
            h('div', { className: 'heal-pods' },
              Array.from({ length: node2State === 'bad' ? 2 : (active >= 4 ? 0 : 2) }).map(function (_, i) {
                return h('span', { key: i, className: 'heal-pod' + (node2State === 'bad' ? ' crash' : '') });
              }),
              active >= 4 ? h('span', { className: 'heal-empty' }, 'drained') : null
            ),
            (node2State === 'bad' && active < 3) ? h('span', { className: 'heal-badge bad' }, h(AIcon, { name: 'alert-triangle', size: 12 }), ' disk pressure') : null,
            active === 3 ? h('span', { className: 'heal-badge act' }, h(AIcon, { name: 'ban', size: 12 }), ' cordoned') : null,
            active >= 4 ? h('span', { className: 'heal-badge in' }, h(AIcon, { name: 'check', size: 12 }), ' healthy') : null
          )
        ),

        h('div', { className: 'heal-log' },
          steps.map(function (s, i) {
            return h('div', { key: i, className: 'heal-line ' + s.tone + (i === active ? ' on' : '') + (i < active ? ' done' : '') },
              h('span', { className: 'heal-tag' }, s.tag),
              h('span', { className: 'heal-text' }, s.text),
              i === active ? h('span', { className: 'heal-cursor' }) : null
            );
          })
        )
      ),

      h('div', { className: 'heal-track' },
        steps.map(function (s, i) {
          return h('button', {
            key: i,
            className: 'heal-dot ' + (i === active ? 'on' : '') + (i < active ? ' past' : ''),
            onClick: function () { setRunning(false); setActive(i); },
            title: s.tag,
          });
        })
      )
    );
  }

  /* ---- Autonomy zone card --------------------------------------------------- */
  function ZoneCard(props) {
    var zone = props.zone, n = props.n, flash = props.flash;
    return h('div', { className: 'zone' + (flash ? ' flash' : ''), 'data-zone': zone.id, 'data-zoneid': zone.id, style: { '--zi': n } },
      h('div', { className: 'zone-head' },
        h('span', { className: 'zone-badge' }, h(AIcon, { name: zone.icon, size: 20 })),
        h('div', null,
          h('span', { className: 'zone-step' }, 'ZONE ' + (n + 1)),
          h('h3', { className: 'zone-name' }, zone.label),
          h('p', { className: 'zone-sub' }, zone.sub)
        )
      ),
      h('p', { className: 'zone-desc' }, zone.desc),
      h('div', { className: 'zone-guard' }, h(AIcon, { name: 'shield-check', size: 14 }), ' ', zone.guardrail),
      h('div', { className: 'zone-tools' },
        zone.tools.map(function (tl) {
          return h('div', { className: 'zone-tool', key: tl.name },
            h('span', { className: 'zone-tool-name' }, tl.name),
            h('span', { className: 'zone-tool-desc' }, tl.desc)
          );
        })
      ),
      h('div', { className: 'zone-applies' },
        h('span', { className: 'zone-applies-cap' }, h(AIcon, { name: 'git-fork', size: 12 }), ' Where it fits'),
        h('ul', null, zone.applies.map(function (a, i) { return h('li', { key: i }, a); }))
      )
    );
  }

  /* ---- AI Ops mode root ----------------------------------------------------- */
  function AIOps(props) {
    var highlightZone = props.highlightZone, onConsumeHighlight = props.onConsumeHighlight;
    var zones = window.AI_ZONES;
    var flashState = useState(null), flash = flashState[0], setFlash = flashState[1];

    useEffect(function () {
      if (!highlightZone) return;
      setFlash(highlightZone);
      // bring the zone strip into view without scrollIntoView
      var el = document.querySelector('.zones [data-zoneid="' + highlightZone + '"]');
      if (el) {
        var y = el.getBoundingClientRect().top + window.pageYOffset - 90;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      }
      var t = setTimeout(function () { setFlash(null); onConsumeHighlight && onConsumeHighlight(); }, 2400);
      return function () { clearTimeout(t); };
    }, [highlightZone]);

    return h('div', { className: 'aiops' },
      h('div', { className: 'aiops-intro' },
        h('span', { className: 'aiops-kicker' }, h(AIcon, { name: 'bot', size: 15 }), ' MODEL 7 · CROSS-CUTTING LAYER'),
        h('h2', { className: 'aiops-title' }, 'AI-Augmented Platform Operations'),
        h('p', { className: 'aiops-lede' },
          "AI doesn't replace these tenancy models — it operates them. Autonomy grows left-to-right, " +
          "and every increase is paid for with a stronger guardrail: human approval, then GitOps + RBAC, then scoped blast radius with full audit trails."
        )
      ),

      h('div', { className: 'aiops-spectrum' },
        h('span', { className: 'aiops-spectrum-end' }, 'human control'),
        h('div', { className: 'aiops-spectrum-bar' }, h('span')),
        h('span', { className: 'aiops-spectrum-end right' }, 'machine autonomy')
      ),

      h('div', { className: 'zones' },
        zones.map(function (z, i) { return h(ZoneCard, { key: z.id, zone: z, n: i, flash: flash === z.id }); })
      ),

      h(SelfHealing)
    );
  }

  Object.assign(window, { AIOps: AIOps });
})();
