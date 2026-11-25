// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
// The web pages that OBS loads as browser sources. One page, one panel per address.

export const PANELS = [
  { id: 'duel', label: '1v1 timer' },
  { id: 'scoreboard', label: 'Scoreboard (tournament)' },
  { id: 'match', label: 'Match result (tournament sets)' },
  { id: 'streak', label: 'Streak tracker' },
  { id: 'streakbar', label: 'Streak (compact bar)' },
  { id: 'streakhistory', label: 'Streak history (dots)' },
  { id: 'streakboth', label: 'Streak (killer and survivor)' },
  { id: 'ladder', label: 'Ladder rank card' },
  { id: 'ladderlist', label: 'Ladder recent matches' },
  { id: 'timers', label: 'Multi timers' },
  { id: 'countdown', label: 'Countdown timer' },
  { id: 'savetimer', label: 'Save timer (shows while it runs)' },
  { id: 'map', label: 'Map' }
]

const style = `
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: transparent; overflow: hidden; }
body { font-family: 'Segoe UI', system-ui, sans-serif; color: #e8e8ea; padding: 8px; }
body.bg { background: rgba(20, 20, 22, 0.88); }
.mono { font-family: 'Cascadia Mono', Consolas, monospace; font-variant-numeric: tabular-nums; }
.panel { text-shadow: 0 1px 4px rgba(0, 0, 0, 0.7); }
.row { display: flex; align-items: baseline; gap: 12px; padding: 6px 12px; border-radius: 8px; color: #b9b9bf; }
.row.active { background: rgba(179, 58, 58, 0.28); color: #fff; }
.name { flex: 1; font-size: 22px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.score { font-size: 26px; font-weight: 700; min-width: 30px; text-align: right; }
.time { font-size: 30px; min-width: 150px; text-align: right; }
.running { color: #ff8a8a; }
.near { color: #e0a458 !important; }
.close { color: #ef5b5b !important; }
.passed { color: #ef5b5b !important; }
.off { opacity: 0.25; }
.gap { font-size: 16px; }
.dline { display: flex; align-items: stretch; gap: 8px; }
.dside { display: flex; flex: 1; min-width: 0; align-items: baseline; gap: 10px; padding: 8px 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background: rgba(20,20,22,0.6); color: #b9b9bf; }
.dside.right { flex-direction: row-reverse; }
.dside.right .name { text-align: right; }
.dside.right .time { text-align: left; }
.dside.active { border-color: rgba(255,255,255,0.28); color: #fff; }
.dside .time { min-width: 120px; font-size: 30px; }
.dscore { display: flex; align-items: center; gap: 6px; padding: 0 16px; border-radius: 12px; background: rgba(0,0,0,0.65); color: #fff; font-size: 34px; }
.dscore b { min-width: 20px; text-align: center; font-weight: 800; }
.dscore i { color: #6b6b72; font-style: normal; }
.title { text-align: center; font-size: 20px; letter-spacing: 0.08em; text-transform: uppercase; color: #d46a6a; }
.sub { text-align: center; font-size: 14px; color: #9a9aa0; margin-bottom: 8px; }
.board { display: flex; align-items: center; justify-content: center; gap: 24px; }
.board .team { flex: 1; font-size: 28px; font-weight: 600; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.board .big { font-size: 56px; font-weight: 700; min-width: 56px; text-align: center; }
.board .dash { font-size: 40px; color: #6b6b72; }
.bar { display: flex; align-items: baseline; gap: 18px; padding: 8px 16px; border-radius: 10px; background: rgba(20, 20, 22, 0.75); border: 1px solid #2a2a2e; font-size: 22px; white-space: nowrap; }
.bar .role { color: #d46a6a; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; font-size: 16px; }
.bar b { font-size: 32px; }
.bar .muted { color: #9a9aa0; font-size: 18px; }
.mrows { margin-top: 10px; display: flex; flex-direction: column; gap: 5px; min-width: 520px; }
.mrow { display: flex; align-items: center; gap: 12px; padding: 6px 12px; border-radius: 6px; background: rgba(20, 20, 22, 0.78); border-left: 3px solid #b33a3a; font-size: 18px; white-space: nowrap; }
.mrow .mset { font-weight: 700; color: #d46a6a; letter-spacing: 0.06em; }
.mrow .mtext { flex: 1; overflow: hidden; text-overflow: ellipsis; }
.mrow .mtext i { color: #9a9aa0; }
.mrow .mscore { font-weight: 700; }
.mrow .won { padding: 1px 8px; border-radius: 4px; background: rgba(179, 58, 58, 0.35); font-size: 14px; text-transform: uppercase; letter-spacing: 0.06em; }
.newbest { color: #ffd23f; font-weight: 700; letter-spacing: 0.1em; font-size: 16px; }
.dots { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 10px; }
.dot { width: 18px; height: 18px; border-radius: 50%; }
.dot.win { background: #5fae6a; }
.dot.loss { background: #b33a3a; }
.dot.survivor { border-radius: 4px; }
.cols { display: flex; gap: 12px; }
.cols .hero { flex: 1; padding: 10px 18px; border-radius: 10px; background: rgba(20, 20, 22, 0.75); border: 1px solid #2a2a2e; }
.cols .hero .number { font-size: 64px; }
.rank { text-align: center; padding: 10px 20px; border-radius: 12px; background: rgba(20, 20, 22, 0.75); border: 1px solid #2a2a2e; }
.rank .number { font-size: 72px; font-weight: 700; line-height: 1; }
.rank .label { color: #b9b9bf; font-size: 18px; margin-top: 6px; }
.match { display: flex; align-items: baseline; gap: 12px; padding: 5px 12px; font-size: 20px; }
.match .tag { font-weight: 700; min-width: 34px; }
.match .tag.win { color: #5fae6a; }
.match .tag.loss { color: #ef5b5b; }
.match .opp { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.match .sc { color: #9a9aa0; }
.hero { text-align: center; }
.hero .number { font-size: 96px; font-weight: 700; line-height: 1; }
.hero .label { font-size: 18px; color: #b9b9bf; margin-top: 6px; }
.big-time { text-align: center; font-size: 96px; font-weight: 600; }
.save { display: flex; align-items: baseline; gap: 14px; padding: 8px 16px; border-radius: 10px; color: #fff; min-width: 420px; }
.save .sname { flex: 1; font-size: 20px; }
.save .stime { font-size: 40px; }
.save .slabel { min-width: 120px; text-align: right; font-size: 20px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }
.save.wait, .save.late { background: #b3281b; }
.save.ready { background: #c99512; color: #1a1400; }
.save.now { background: #1f9d55; }
img.map { display: block; width: 100%; height: calc(100vh - 16px); object-fit: contain; }
`

const script = `
(function () {
  var panel = PANEL_ID;
  var params = new URLSearchParams(location.search);
  var scale = parseFloat(params.get('scale')) || 1;
  document.documentElement.style.zoom = scale;
  if (params.get('bg') === '1') document.body.classList.add('bg');
  var root = document.getElementById('root');
  var snap = null, offset = 0, last = '';

  function now() { return Date.now() + offset; }
  function esc(t) {
    return String(t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function pad(n, l) { return String(n).padStart(l || 2, '0'); }

  function fmtMs(ms, precision) {
    var total = Math.max(Math.floor(ms), 0);
    var m = Math.floor(total / 60000), s = Math.floor((total % 60000) / 1000), r = total % 1000;
    var base = pad(m) + ':' + pad(s);
    if (precision === 's') return base;
    if (precision === 'cs') return base + '.' + pad(Math.floor(r / 10));
    return base + '.' + pad(r, 3);
  }
  function fmtTenths(ms) {
    var t = Math.ceil(ms / 100);
    return pad(Math.floor(t / 600)) + ':' + pad(Math.floor((t % 600) / 10)) + '.' + (t % 10);
  }
  function fmtClock(sec) { return pad(Math.floor(sec / 60)) + ':' + pad(sec % 60); }

  function sideTime(d, side) {
    var running = d.runningSince !== null && d.active === side;
    return d.elapsed[side] + (running ? Math.max(now() - d.runningSince, 0) : 0);
  }
  function proximity(d) {
    var other = d.active === 0 ? 1 : 0, target = d.elapsed[other];
    if (!d.warnEnabled || target <= 0) return null;
    var gap = target - sideTime(d, d.active);
    if (gap > d.warnNear * 1000) return null;
    if (gap <= 0) return { gap: gap, level: 'passed' };
    return { gap: gap, level: gap <= d.warnClose * 1000 ? 'close' : 'near' };
  }
  function fmtGap(g) { return (g < 0 ? '+' : '-') + (Math.abs(g) / 1000).toFixed(1) + ' s'; }
  function blinkOff(d) { return d.blink && Math.floor(now() / 250) % 2 === 1; }

  function rgba(hex, a) {
    var v = parseInt(hex.slice(1), 16);
    return 'rgba(' + ((v >> 16) & 255) + ',' + ((v >> 8) & 255) + ',' + (v & 255) + ',' + a + ')';
  }
  function rowLook(d, active) {
    var idle = d.nameBg === 'black' ? '#000' : d.nameBg === 'light' ? '#fff' : 'transparent';
    var color = d.nameBg === 'light' && !active ? ';color:#111' : '';
    return ' style="background:' + (active ? rgba(d.accent, 0.4) : idle) + color + '"';
  }

  function renderDuel(d) {
    var run = d.runningSince !== null, near = run ? proximity(d) : null, sides = [];
    for (var side = 0; side < 2; side++) {
      var active = d.active === side;
      var cls = 'time mono' + (active && run ? ' running' : '');
      var gap = '';
      if (active && near) {
        cls += ' ' + near.level + (near.level === 'close' && blinkOff(d) ? ' off' : '');
        gap = '<span class="gap mono ' + near.level + '">' + fmtGap(near.gap) + '</span>';
      }
      sides.push('<div class="dside' + (side === 1 ? ' right' : '') + (active ? ' active' : '') + '"' + rowLook(d, active) +
        '><span class="name">' + esc(d.names[side]) + '</span>' + gap +
        '<span class="' + cls + '">' + fmtMs(sideTime(d, side), d.precision) + '</span></div>');
    }
    return '<div class="panel dline">' + sides[0] + '<div class="dscore"><b>' + d.scores[0] + '</b><i>:</i><b>' +
      d.scores[1] + '</b></div>' + sides[1] + '</div>';
  }

  function renderScoreboard(d) {
    var round = d.scores[0] + d.scores[1] + 1;
    return '<div class="panel">' + (d.title ? '<div class="title">' + esc(d.title) + '</div>' : '') +
      '<div class="sub">Best of ' + d.bestOf + ' &middot; Round ' + round + '</div>' +
      '<div class="board"><span class="team">' + esc(d.names[0]) + '</span><span class="big">' + d.scores[0] +
      '</span><span class="dash">:</span><span class="big">' + d.scores[1] + '</span><span class="team">' +
      esc(d.names[1]) + '</span></div></div>';
  }

  function renderMatch(m) {
    var a = 0, b = 0, rows = '';
    m.sets.forEach(function (s, i) {
      if (s.winner === 0) a++; else if (s.winner === 1) b++;
      var won = s.winner === null ? '' : '<span class="won">' + esc(m.teams[s.winner]) + ' won</span>';
      rows += '<div class="mrow"><span class="mset">SET ' + (i + 1) + '</span><span class="mtext">' + esc(s.killer || 'Killer') +
        (s.player ? ' (' + esc(s.player) + ')' : '') + (s.map ? ' <i>' + esc(s.map) + '</i>' : '') +
        '</span><span class="mscore">' + s.stages + ' STAGES &middot; ' + s.frees + 'F</span>' + won + '</div>';
    });
    return '<div class="panel">' + (m.title ? '<div class="title">' + esc(m.title) + '</div>' : '') +
      '<div class="sub">Best of ' + m.bestOf + '</div>' +
      '<div class="board"><span class="team">' + esc(m.teams[0]) + '</span><span class="big">' + a +
      '</span><span class="dash">:</span><span class="big">' + b + '</span><span class="team">' + esc(m.teams[1]) +
      '</span></div><div class="mrows">' + rows + '</div></div>';
  }

  function renderStreak(s) {
    var st = s.stats[s.role], total = st.wins + st.losses;
    var rate = total === 0 ? '-' : Math.round(st.wins / total * 100) + '%';
    return '<div class="panel hero"><div class="title">' + (s.role === 'killer' ? 'Killer' : 'Survivor') +
      ' streak</div><div class="number">' + st.streak + '</div><div class="label">Best ' + st.best + ' &middot; ' +
      st.wins + 'W ' + st.losses + 'L &middot; ' + rate + '</div>' + bestFlash(s) + '</div>';
  }

  function bestFlash(s) {
    if (!s.lastBestAt || now() - s.lastBestAt > 8000) return '';
    return '<span class="newbest' + (Math.floor(now() / 400) % 2 ? ' off' : '') + '">NEW BEST!</span>';
  }

  function renderStreakBar(s) {
    var st = s.stats[s.role], total = st.wins + st.losses;
    var rate = total === 0 ? '-' : Math.round(st.wins / total * 100) + '%';
    return '<div class="panel bar"><span class="role">' + (s.role === 'killer' ? 'Killer' : 'Survivor') +
      '</span><span>Streak <b>' + st.streak + '</b></span><span class="muted">Best ' + st.best + '</span>' +
      '<span class="muted">' + st.wins + 'W ' + st.losses + 'L &middot; ' + rate + '</span>' + bestFlash(s) + '</div>';
  }

  function renderStreakHistory(s) {
    var st = s.stats[s.role], dots = '';
    s.history.slice(-20).forEach(function (h) {
      dots += '<span class="dot ' + h.result + ' ' + h.role + '"></span>';
    });
    return '<div class="panel hero"><div class="title">' + (s.role === 'killer' ? 'Killer' : 'Survivor') +
      ' streak ' + st.streak + '</div><div class="dots">' + dots + '</div></div>';
  }

  function renderStreakBoth(s) {
    var out = '';
    ['killer', 'survivor'].forEach(function (role) {
      var st = s.stats[role], total = st.wins + st.losses;
      var rate = total === 0 ? '-' : Math.round(st.wins / total * 100) + '%';
      out += '<div class="hero"><div class="title">' + (role === 'killer' ? 'Killer' : 'Survivor') +
        '</div><div class="number">' + st.streak + '</div><div class="label">Best ' + st.best + ' &middot; ' +
        st.wins + 'W ' + st.losses + 'L &middot; ' + rate + '</div></div>';
    });
    return '<div class="panel cols">' + out + '</div>' + (bestFlash(s) ? '<div class="sub" style="margin-top:6px">' + bestFlash(s) + '</div>' : '');
  }

  function ladderRecord(l) {
    var w = 0, n = 0;
    l.matches.forEach(function (m) { if (m.result === 'win') w++; else n++; });
    return { w: w, l: n };
  }

  function renderLadder(l) {
    var rec = ladderRecord(l);
    return '<div class="panel rank"><div class="title">' + esc(l.title) + '</div><div class="number">' +
      (l.rank === null ? '-' : '#' + l.rank) + '</div><div class="label">' + l.points + ' pts &middot; ' +
      rec.w + 'W ' + rec.l + 'L</div></div>';
  }

  function renderLadderList(l) {
    var out = '';
    l.matches.slice(0, 5).forEach(function (m) {
      out += '<div class="match"><span class="tag ' + m.result + '">' + (m.result === 'win' ? 'WIN' : 'LOSS') +
        '</span><span class="opp">' + esc(m.opponent) + '</span><span class="sc">' + esc(m.score) + '</span></div>';
    });
    return '<div class="panel">' + (l.title ? '<div class="title" style="margin-bottom:6px">' + esc(l.title) + '</div>' : '') + out + '</div>';
  }

  function renderTimers(list) {
    var out = '';
    list.forEach(function (t) {
      var run = t.runningSince !== null;
      var left = Math.max(t.duration * 1000 - t.elapsed - (run ? Math.max(now() - t.runningSince, 0) : 0), 0);
      var cls = 'time mono' + (left === 0 ? ' passed' : run && left <= 10000 ? ' near' : run ? ' running' : '');
      out += '<div class="row"><span class="name">' + esc(t.name) + '</span><span class="' + cls + '">' + fmtTenths(left) + '</span></div>';
    });
    return '<div class="panel">' + out + '</div>';
  }

  function renderCountdown(c) {
    return '<div class="panel big-time mono' + (c.running ? ' running' : '') + '">' + fmtClock(c.remaining) + '</div>';
  }

  function renderSaveTimer(s) {
    var t = null;
    s.presets.forEach(function (p) { if (p.id === s.runningId) t = p; });
    if (!t || s.startedAt === null) return '';
    var sec = Math.max(now() - s.startedAt, 0) / 1000;
    var cue = Math.max(t.target - t.lead, 0);
    var phase = sec < Math.max(cue - t.ready, 0) ? 'wait' : sec < cue ? 'ready' : sec < cue + t.hold ? 'now' : 'late';
    var label = { wait: 'Wait', ready: 'Get ready', now: 'NOW', late: 'Too late' }[phase];
    return '<div class="panel save ' + phase + '"><span class="sname">' + esc(t.name) + '</span><span class="stime mono">' +
      sec.toFixed(2) + '</span><span class="slabel">' + label + '</span></div>';
  }

  function renderMap(m) {
    if (!m.visible) return '';
    return '<img class="map" style="opacity:' + m.opacity + '" alt="" src="/map-image?v=' + encodeURIComponent(m.version) + '">';
  }

  function render() {
    if (!snap) return;
    var html = '';
    if (panel === 'duel') html = renderDuel(snap.duel);
    else if (panel === 'scoreboard') html = renderScoreboard(snap.duel);
    else if (panel === 'match') html = renderMatch(snap.match);
    else if (panel === 'streak') html = renderStreak(snap.streak) + '';
    else if (panel === 'streakbar') html = renderStreakBar(snap.streak);
    else if (panel === 'streakhistory') html = renderStreakHistory(snap.streak);
    else if (panel === 'streakboth') html = renderStreakBoth(snap.streak);
    else if (panel === 'ladder') html = renderLadder(snap.ladder);
    else if (panel === 'ladderlist') html = renderLadderList(snap.ladder);
    else if (panel === 'timers') html = renderTimers(snap.timers);
    else if (panel === 'countdown') html = renderCountdown(snap.countdown);
    else if (panel === 'savetimer') html = renderSaveTimer(snap.saveTimer);
    else if (panel === 'map') html = renderMap(snap.map);
    if (html !== last) { root.innerHTML = html; last = html; }
  }

  var source = new EventSource('/events');
  source.onmessage = function (event) {
    snap = JSON.parse(event.data);
    offset = snap.now - Date.now();
    render();
  };
  setInterval(render, 50);
})();
`

export function pageHtml(panel: string): string {
  const safe = JSON.stringify(panel)
  return (
    '<!doctype html><html><head><meta charset="utf-8"><title>GKC overlay</title><style>' +
    style +
    '</style></head><body><div id="root"></div><script>' +
    script.replace('PANEL_ID', safe) +
    '</script></body></html>'
  )
}
