'use strict';

/* =========================================================
   Treino & Dieta — v1.1 (visual novo, só celular)
   Dados salvos no próprio aparelho (localStorage).
   ========================================================= */

const STORE_KEY = 'treino-dieta-v1';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const uid = () => Math.random().toString(36).slice(2, 10);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const todayKey = (d = new Date()) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const keyToDate = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const fmtDay = (k) => keyToDate(k).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '');
const fmtDayLong = (k) => keyToDate(k).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' }).replace('.', '');
const fmtClock = (sec) => { const s = Math.max(0, Math.round(Math.abs(sec))); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const num = (v) => { const n = parseFloat(String(v ?? '').replace(',', '.')); return Number.isFinite(n) ? n : null; };
const br = (n, d = 1) => (n == null ? '—' : n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: d }));
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/* ---------------- Ícones (traço único, 24px) ---------------- */
const ICONS = {
  home: '<path d="M3.5 10.5 12 3.5l8.5 7"/><path d="M5.5 9v11h13V9"/><path d="M10 20v-5h4v5"/>',
  dumbbell: '<path d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11"/>',
  meal: '<path d="M7 3v7M4.5 3v4.5a2.5 2.5 0 0 0 5 0V3M7 10v11"/><path d="M18 3c-2.2 1.4-3.5 4-3.5 7.5H18V21"/>',
  chart: '<path d="M4 4v16h16"/><path d="m7.5 14.5 3.5-4 3 2.5 5-6"/>',
  sliders: '<path d="M4 7h9M17 7h3M4 12h3M11 12h9M4 17h11M19 17h1"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="17" r="2"/>',
  scale: '<rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><path d="M8.5 9.5a5 5 0 0 1 7 0"/><path d="m12 12 1.5-2"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  left: '<path d="m14.5 5.5-6.5 6.5 6.5 6.5"/>',
  right: '<path d="m9.5 5.5 6.5 6.5-6.5 6.5"/>',
  pulse: '<path d="M3 12h4l2.5-6 5 12 2.5-6h4"/>',
  pencil: '<path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3z"/>',
  play: '<path d="M8 5.5v13l10.5-6.5z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>',
  swap: '<path d="M5 8h13l-3.5-3.5M19 16H6l3.5 3.5"/>',
  history: '<path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5"/><path d="M4 4v4.5h4.5"/><path d="M12 8v4l3 2"/>',
};
const ic = (n, cls = 'i') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n]}</svg>`;

/* ---------------- Modelos de treino (emagrecimento) ---------------- */
const ex = (name, reps, rest = 60, tipo = 'carga', sets) => ({ name, reps, rest, tipo, sets });
const TEMPLATES = [
  { name: 'Corpo todo 1', exercises: [
    ex('Agachamento goblet', '12-15'), ex('Supino reto com halteres', '12'),
    ex('Remada baixa no cabo', '12'), ex('Elevação pélvica', '15'),
    ex('Desenvolvimento com halteres', '12'), ex('Prancha', '30-45s', 45, 'tempo'),
    ex('Esteira inclinada', '15 min', 0, 'cardio', 1),
  ] },
  { name: 'Corpo todo 2', exercises: [
    ex('Leg press 45°', '15'), ex('Puxada frontal', '12'),
    ex('Supino inclinado na máquina', '12'), ex('Stiff com halteres', '12'),
    ex('Elevação lateral', '15', 45), ex('Abdominal infra', '15', 45),
    ex('Bike intervalada (30s forte, 60s leve)', '15 min', 0, 'cardio', 1),
  ] },
  { name: 'Corpo todo 3', exercises: [
    ex('Passada (cada perna)', '12'), ex('Remada curvada com halteres', '12'),
    ex('Crucifixo na máquina', '12'), ex('Mesa flexora', '15'),
    ex('Rosca direta + tríceps corda', '12'), ex('Agachamento com salto', '10'),
    ex('Elíptico ou escada', '15 min', 0, 'cardio', 1),
  ] },
  { name: 'Cardio e core', exercises: [
    ex('Caminhada rápida ou trote', '25 min', 0, 'cardio', 1),
    ex('Prancha lateral (cada lado)', '30s', 30, 'tempo'),
    ex('Abdominal bicicleta', '20', 30), ex('Mountain climber', '30s', 30, 'tempo'),
    ex('Superman', '15', 30),
  ] },
  { name: 'Inferiores e cardio', exercises: [
    ex('Agachamento no Smith', '12'), ex('Cadeira extensora', '15'),
    ex('Cadeira abdutora', '15', 45), ex('Panturrilha em pé', '15', 45),
    ex('Esteira inclinada', '20 min', 0, 'cardio', 1),
  ] },
];
const LEVEL = { iniciante: { sets: 3, mul: 1.2 }, intermediario: { sets: 3, mul: 1 }, avancado: { sets: 4, mul: 0.8 } };
const LEVEL_LABEL = { iniciante: 'Iniciante', intermediario: 'Intermediário', avancado: 'Avançado' };

function generatePlan(p) {
  const lv = LEVEL[p.nivel] || LEVEL.iniciante;
  const order = { 2: [0, 1], 3: [0, 1, 2], 4: [0, 1, 2, 3], 5: [0, 1, 2, 3, 4], 6: [0, 1, 2, 3, 4, 3] }[p.dias] || [0, 1, 2];
  return {
    source: 'modelo',
    workouts: order.map((i, k) => ({
      id: uid(),
      letter: String.fromCharCode(65 + k),
      name: TEMPLATES[i].name,
      exercises: TEMPLATES[i].exercises.map((e) => ({
        id: uid(), name: e.name, reps: e.reps, tipo: e.tipo, sets: e.sets ?? lv.sets,
        rest: e.rest ? Math.round((e.rest * lv.mul) / 5) * 5 : 0, notes: '',
      })),
    })),
  };
}

/* ---------------- Estado ---------------- */
const defaultState = () => {
  const profile = { objetivo: 'emagrecimento', dias: 3, nivel: 'iniciante' };
  return { version: 2, profile, plan: generatePlan(profile), sessions: [], active: null,
    diet: { raw: '', groups: [] }, dietLog: {}, morning: [], activities: [], ui: { tab: 'hoje' } };
};

function migrate(s) {
  if (s.diet && s.diet.meals && !s.diet.groups) {
    s.diet.groups = s.diet.meals.map((m) => ({ id: m.id, name: m.name, time: m.time,
      options: [{ id: uid(), foods: (m.items || []).map((i) => ({ ...splitFood(i), subs: [] })), notes: '' }] }));
    delete s.diet.meals;
  }
  if (!s.diet.groups) s.diet.groups = [];
  if (!['hoje', 'treino', 'dieta', 'progresso', 'perfil'].includes(s.ui?.tab)) s.ui = { ...(s.ui || {}), tab: 'hoje' };
  s.plan.workouts.forEach((w, k) => {
    if (!w.letter) {
      const m = w.name.match(/^([A-Z])\s*[—–-]\s*(.*)$/);
      w.letter = m ? m[1] : String.fromCharCode(65 + k);
      if (m) w.name = m[2];
    }
  });
  return s;
}

let state;
try { state = migrate(Object.assign(defaultState(), JSON.parse(localStorage.getItem(STORE_KEY) || 'null') || {})); }
catch { state = defaultState(); }

function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
  catch (e) { alert('Não consegui salvar no celular: ' + e.message); }
}

/* ---------------- Consultas ---------------- */
const finished = () => state.sessions.filter((s) => s.end);
function nextWorkout() {
  const ws = state.plan.workouts;
  if (!ws.length) return null;
  const last = state.sessions[state.sessions.length - 1];
  if (!last) return ws[0];
  const i = ws.findIndex((w) => w.id === last.workoutId);
  return ws[(i + 1) % ws.length] || ws[0];
}
function lastPerformance(name) {
  for (let i = state.sessions.length - 1; i >= 0; i--) {
    const e = state.sessions[i].exercises.find((x) => x.name === name);
    if (e && e.sets.some((s) => s.done)) return e;
  }
  return null;
}
function dayLog(key) {
  if (!state.dietLog[key]) state.dietLog[key] = { checked: {}, extras: [] };
  return state.dietLog[key];
}
const estMinutes = (w) => Math.round(w.exercises.reduce((t, e) => t + (e.tipo === 'cardio' ? (num(e.reps) || 15) : e.sets * (0.75 + (e.rest || 0) / 60)), 0) / 5) * 5;
const morningSorted = () => state.morning.slice().sort((a, b) => a.date.localeCompare(b.date));

/* Lê o plano da nutricionista em texto.
   Entende: "07:30 - Café da manhã - Opção 2", "Almoço 12:00", "Jantar:";
   alimentos "Banana - 1 unidade ou 110g" (ou nome e quantidade em linhas separadas);
   "Substituição: Salada de frutas - 1 porção" logo abaixo do alimento;
   "Observação:" e o texto que vier depois. */
const MEAL_RE = /^(caf[eé][- ]da[- ]manh[ãa]|desjejum|almo[cç]o\b|jantar\b|janta\b|lanche\b|ceia\b|colaç[aã]o|pr[eé][- ]?treino|p[oó]s[- ]?treino|refei[cç][aã]o\b|\d+ª?\s*refei)/i;
const QTY_RE = /^\d+([.,]\d+)?\s*(un|colher|g\b|gr|ml|fil[eé]|fatia|x[ií]cara|copo|por[cç]|concha|escumadeira|pegador|pedaço|ramo|folha|pote)/i;
const hhmm = (h, m) => `${String(h).padStart(2, '0')}:${m || '00'}`;
function splitFood(str) {
  let m = str.match(/^(.+?)\s+[-–—:]\s+(.+)$/);
  if (m) return { name: m[1].trim(), qty: m[2].trim() };
  m = str.match(/^(.+?)\s*\((.+)\)\s*$/);
  if (m && /\d/.test(m[2])) return { name: m[1].trim(), qty: m[2].trim() };
  m = str.match(/^([^\d]+?)\s+(\d.*)$/);
  if (m) return { name: m[1].trim(), qty: m[2].trim() };
  return { name: str.trim(), qty: '' };
}
function parsePlan(text) {
  const groups = [];
  let opt = null, food = null, inNotes = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim().replace(/^[-•*▪◦·]\s*/, '');
    if (!line || /^ver op[cç][õo]es/i.test(line)) continue;
    let header = null;
    const tm = line.match(/^(\d{1,2})[:h](\d{2})?\s*[-–—]?\s*(.+)$/);
    if (tm && MEAL_RE.test(tm[3].trim())) header = { time: hhmm(tm[1], tm[2]), rest: tm[3] };
    else if (MEAL_RE.test(line) && line.length < 60 && !/\d\s?g\b/.test(line)) {
      const t = line.match(/\b(\d{1,2})[:h](\d{2})?\b/);
      header = { time: t ? hhmm(t[1], t[2]) : '', rest: line.replace(/\(?\s*(às\s*)?\d{1,2}[:h]\d{0,2}\s*\)?/i, '') };
    }
    if (header) {
      let name = header.rest.replace(/:\s*$/, '').trim();
      const om = name.match(/\s*[-–—(]?\s*op[çc][aã]o\s*(\d+)\s*\)?\s*$/i);
      if (om) name = name.slice(0, om.index);
      name = cap(name.replace(/[-–—\s]+$/, '').replace(/caf[eé]-da-manh/i, 'Café da manh').trim()) || 'Refeição';
      let g = groups.find((x) => x.name.toLowerCase() === name.toLowerCase() && x.time === header.time);
      if (!g) { g = { id: uid(), name, time: header.time, options: [] }; groups.push(g); }
      opt = { id: uid(), foods: [], notes: '' }; g.options.push(opt);
      food = null; inNotes = false;
      continue;
    }
    if (!opt) { opt = { id: uid(), foods: [], notes: '' }; groups.push({ id: uid(), name: 'Refeição', time: '', options: [opt] }); }
    const obs = line.match(/^(obs(erva[cç](ão|ões))?\.?|orienta[cç](ão|ões))\s*:?\s*(.*)$/i);
    if (obs) { inNotes = true; if (obs[5]) opt.notes += obs[5] + '\n'; continue; }
    if (inNotes) { opt.notes += raw.trim() + '\n'; continue; }
    const sub = line.match(/^(substitui[cç](ão|ões)|substituir|troca[rs]?|ou)\s*(por)?\s*:\s*(.+)$/i) || line.match(/^(⇄|↔|>)\s*(.+)$/);
    if (sub && food) { food.subs.push(splitFood(sub[sub.length - 1])); continue; }
    if (food && !food.qty && QTY_RE.test(line)) { food.qty = line; continue; }
    food = { ...splitFood(line), subs: [] };
    opt.foods.push(food);
  }
  groups.forEach((g) => g.options.forEach((o) => { o.notes = o.notes.trim(); }));
  return groups;
}
const mealCheck = (log, g) => { const c = log.checked[g.id]; return c == null ? null : (typeof c === 'object' ? c : { opt: 0 }); };

/* ---------------- Gráfico de linha (uma série, toque para ver o valor) ---------------- */
const chartData = {};
function chartSlot(id, points, unit) {
  chartData[id] = { points, unit };
  if (points.length < 2) return `<div class="empty">${ic('chart')}<div>Registre pelo menos dois dias para ver a linha.</div></div>`;
  return `<div class="chart-wrap" data-chart="${id}"></div>`;
}
function drawChart(el) {
  const { points, unit } = chartData[el.dataset.chart];
  const W = el.clientWidth - 16, H = 180, P = { l: 6, r: 40, t: 30, b: 22 };
  const ys = points.map((p) => p.y);
  let lo = Math.min(...ys), hi = Math.max(...ys);
  if (hi - lo < 1) { lo -= 0.5; hi += 0.5; }
  const span = hi - lo; lo -= span * 0.1; hi += span * 0.1;
  const X = (i) => P.l + (i * (W - P.l - P.r)) / (points.length - 1);
  const Y = (v) => P.t + ((hi - v) * (H - P.t - P.b)) / (hi - lo);
  const ticks = [lo + (hi - lo) * 0.15, (lo + hi) / 2, hi - (hi - lo) * 0.15];
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(p.y).toFixed(1)}`).join(' ');
  const area = `${d} L${X(points.length - 1).toFixed(1)} ${H - P.b} L${P.l} ${H - P.b} Z`;
  const last = points.length - 1;
  el.innerHTML = `<svg class="chart" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico em ${esc(unit)}">
    ${ticks.map((t) => `<line class="grid" x1="${P.l}" x2="${W - P.r + 6}" y1="${Y(t)}" y2="${Y(t)}"/><text class="ax" x="${W - P.r + 10}" y="${Y(t) + 4}">${br(t)}</text>`).join('')}
    <path class="area" d="${area}"/><path class="line" d="${d}"/>
    <text class="ax" x="${P.l}" y="${H - 4}">${esc(points[0].label)}</text>
    <text class="ax" x="${X(last)}" y="${H - 4}" text-anchor="end">${esc(points[last].label)}</text>
    <line class="cross hidden" y1="${P.t - 6}" y2="${H - P.b}"/>
    <circle class="pt" r="5" cx="${X(last)}" cy="${Y(points[last].y)}"/>
  </svg><div class="tip hidden"></div>`;
  const svg = el.firstElementChild, cross = $('.cross', svg), pt = $('.pt', svg), tip = $('.tip', el);
  const show = (i) => {
    const x = X(i), y = Y(points[i].y);
    cross.setAttribute('x1', x); cross.setAttribute('x2', x); cross.classList.remove('hidden');
    pt.setAttribute('cx', x); pt.setAttribute('cy', y);
    tip.textContent = `${br(points[i].y)} ${unit} · ${points[i].label}`;
    tip.classList.remove('hidden');
    const tw = tip.offsetWidth / 2 + 4;
    tip.style.left = Math.min(Math.max(x + 8, tw), el.clientWidth - tw) + 'px';
  };
  const pick = (ev) => {
    const r = svg.getBoundingClientRect();
    const i = Math.round(((ev.clientX - r.left - P.l) / (W - P.l - P.r)) * last);
    show(Math.max(0, Math.min(last, i)));
  };
  el.onpointerdown = pick; el.onpointermove = (ev) => { if (ev.buttons || ev.pointerType === 'mouse') pick(ev); };
  el.onpointerleave = (ev) => { if (ev.pointerType !== 'mouse') return; cross.classList.add('hidden'); tip.classList.add('hidden'); pt.setAttribute('cx', X(last)); pt.setAttribute('cy', Y(points[last].y)); };
}

/* ---------------- Peças de tela ---------------- */
const head = (kicker, title, action = '') => `<header class="head"><div><div class="kicker">${kicker}</div><h1>${title}</h1></div>${action}</header>`;
const section = (title, body, action = '') => `<section class="section"><div class="section-title"><span>${title}</span>${action}</div>${body}</section>`;
const initials = (n) => n.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
const greet = () => { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; };

/* ---------------- Tela: Hoje ---------------- */
const views = {};

views.hoje = () => {
  const key = todayKey();
  const nw = nextWorkout();
  const doneToday = finished().filter((s) => todayKey(new Date(s.start)) === key);
  const ms = morningSorted();
  const m = ms.find((x) => x.date === key);
  const prev = ms.filter((x) => x.date < key && x.peso != null).pop();
  const meals = state.diet.groups;
  const log = dayLog(key);
  const mealsDone = meals.filter((x) => mealCheck(log, x)).length;
  const p = state.profile;
  const acts = state.activities.filter((a) => a.date === key);

  const pesagem = `<button class="row" data-act="morning">
      <span class="badge ${m ? 'done' : ''}">${ic(m ? 'check' : 'scale')}</span>
      <span class="body"><div class="t">Pesagem</div>
        <div class="s">${m ? `<span class="num">${br(m.peso)} kg</span>${prev && m.peso != null ? ` · ${m.peso - prev.peso > 0 ? '+' : ''}${br(m.peso - prev.peso)} desde ${fmtDay(prev.date)}` : ''}` : 'Em jejum, antes do café'}</div></span>
      <span class="end">${ic('right')}</span></button>`;

  let treino;
  if (state.active) {
    treino = `<button class="row" data-act="goto" data-v="treino">
      <span class="badge accent">${ic('play')}</span>
      <span class="body"><div class="t">Treino em andamento</div><div class="s">${esc(state.active.workoutLetter || '')} · ${esc(state.active.workoutName)}</div></span>
      <span class="end">Continuar ${ic('right')}</span></button>`;
  } else if (doneToday.length) {
    const s = doneToday[doneToday.length - 1];
    treino = `<button class="row" data-act="session" data-v="${s.id}">
      <span class="badge done">${ic('check')}</span>
      <span class="body"><div class="t">Treino feito</div><div class="s">${esc(s.workoutName)} · ${Math.round((s.end - s.start) / 60000)} min</div></span>
      <span class="end">${ic('right')}</span></button>`;
  } else if (nw) {
    treino = `<div class="row" data-act="workout" data-v="${nw.id}">
      <span class="badge">${esc(nw.letter)}</span>
      <span class="body"><div class="t">${esc(nw.name)}</div><div class="s">${nw.exercises.length} exercícios · ~${estMinutes(nw)} min</div></span>
      <button class="btn sm" data-act="start" data-v="${nw.id}">Começar</button></div>`;
  } else {
    treino = `<button class="row" data-act="goto" data-v="treino"><span class="badge">${ic('dumbbell')}</span><span class="body"><div class="t">Treino</div><div class="s">Monte seu plano</div></span></button>`;
  }

  const alimentacao = `<button class="row" data-act="goto" data-v="dieta">
      <span class="badge ${meals.length && mealsDone === meals.length ? 'done' : ''}">${ic(meals.length && mealsDone === meals.length ? 'check' : 'meal')}</span>
      <span class="body"><div class="t">Alimentação</div>
        ${meals.length ? `<div class="s">${mealsDone} de ${meals.length} refeições${log.extras.length ? ` · ${log.extras.length} fora do plano` : ''}</div><div class="bar"><i style="width:${(mealsDone / meals.length) * 100}%"></i></div>`
          : '<div class="s">Adicione o plano da nutricionista</div>'}</span>
      <span class="end">${ic('right')}</span></button>`;

  const atividade = `<button class="row" data-act="activity">
      <span class="badge ${acts.length ? 'done' : ''}">${ic(acts.length ? 'check' : 'pulse')}</span>
      <span class="body"><div class="t">Atividade extra</div>
        <div class="s">${acts.length ? acts.map((a) => `${esc(a.tipo)}${a.minutos ? ` ${a.minutos} min` : ''}`).join(', ') : 'Caminhada, bike… toque para registrar'}</div></span>
      <span class="end">${ic('plus')}</span></button>`;

  const incomplete = !p.nome || !p.altura;
  return head(cap(new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })),
      greet() + (p.nome ? `, ${esc(p.nome.split(' ')[0])}` : ''),
      `<button class="avatar" data-act="goto" data-v="perfil" aria-label="Perfil">${p.nome ? esc(initials(p.nome)) : ic('user')}</button>`)
    + (incomplete ? `<div class="section"><button class="row group" data-act="edit-profile">
        <span class="badge accent">${ic('user')}</span>
        <span class="body"><div class="t">Complete seu perfil</div><div class="s">Nome, altura, peso e meta</div></span>
        <span class="end">${ic('right')}</span></button></div>` : '')
    + section('Seu dia', `<div class="group">${pesagem}${treino}${alimentacao}${atividade}</div>`)
    + section('Esta semana', weekStrip());
};

function weekStrip() {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const monday = new Date(now); monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const trained = new Set(finished().map((s) => todayKey(new Date(s.start))));
  state.activities.forEach((a) => trained.add(a.date));
  const names = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
  let html = '';
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday); d.setDate(monday.getDate() + i);
    const k = todayKey(d);
    html += `<div><div class="d">${names[i]}</div><div class="dot ${trained.has(k) ? 'on' : ''} ${k === todayKey() ? 'today' : ''}">${d.getDate()}</div></div>`;
  }
  const count = finished().filter((s) => new Date(s.start) >= monday).length;
  return `<div class="group"><div class="week">${html}</div>
    <div class="pad" style="padding-top:0" ><div class="hint">${count} de ${state.profile.dias} treinos da semana</div>
    <div class="bar"><i style="width:${Math.min(100, (count / state.profile.dias) * 100)}%;background:var(--accent)"></i></div></div></div>`;
}

/* ---------------- Tela: Treino ---------------- */
views.treino = () => {
  if (state.active) return activeView();
  const nw = nextWorkout();
  const ws = state.plan.workouts;
  return head(`${state.profile.dias}x por semana · ${LEVEL_LABEL[state.profile.nivel]}`, 'Treino',
      `<button class="icon-btn" data-act="plan" aria-label="Ajustar plano">${ic('sliders')}</button>`)
    + section('Seus treinos', ws.length ? `<div class="group">${ws.map((w) => `
        <button class="row" data-act="workout" data-v="${w.id}">
          <span class="badge ${nw && w.id === nw.id ? 'accent' : ''}">${esc(w.letter)}</span>
          <span class="body"><div class="t">${esc(w.name)}</div><div class="s">${w.exercises.length} exercícios · ~${estMinutes(w)} min</div></span>
          <span class="end">${nw && w.id === nw.id ? '<span class="tag accent">Próximo</span>' : ''}${ic('right')}</span>
        </button>`).join('')}</div>` : `<div class="group empty">${ic('dumbbell')}<div>Nenhum treino no plano.</div></div>`,
      `<button class="text-btn" data-act="add-workout">+ Novo</button>`)
    + (state.plan.source === 'personalizado' ? '<p class="hint" style="padding:10px 4px 0">Plano editado por você.</p>' : '');
};

function activeView() {
  const s = state.active;
  const total = s.exercises.reduce((n, e) => n + e.sets.length, 0);
  const done = s.exercises.reduce((n, e) => n + e.sets.filter((x) => x.done).length, 0);
  return `<div class="session-head">
      <div class="body"><div class="t">${esc(s.workoutLetter || '')} · ${esc(s.workoutName)}</div>
      <div class="s num"><span id="elapsed">${fmtClock((Date.now() - s.start) / 1000)}</span> · ${done} de ${total} séries</div></div>
      <button class="btn sm" data-act="finish">Concluir</button></div>
    ${s.exercises.map((e, ei) => {
      const prev = lastPerformance(e.name);
      const carga = e.tipo === 'carga';
      const h1 = carga ? 'kg' : e.tipo === 'cardio' ? 'min' : 'seg';
      const h2 = carga ? 'reps' : e.tipo === 'cardio' ? 'km' : '—';
      return `<div class="ex">
        <div class="ex-top"><div>
          <div class="ex-name">${esc(e.name)}</div>
          <div class="ex-meta num">${e.sets.length} × ${esc(e.reps)}${e.rest ? ` · descanso ${e.rest}s` : ''}</div>
          ${e.notes ? `<div class="ex-note">${esc(e.notes)}</div>` : ''}
        </div></div>
        <div class="sets">
          <div class="h">Série</div><div class="h">Anterior</div><div class="h">${h1}</div><div class="h">${h2}</div><div class="h"></div>
          ${e.sets.map((st, si) => {
            const pv = prev?.sets[si];
            const pvTxt = pv ? (carga ? `${br(num(pv.kg))} × ${pv.reps}` : `${pv.kg || '—'} ${h1}`) : '—';
            return `<div class="set ${st.done ? 'done' : ''}">
              <div class="n">${si + 1}</div>
              <button class="prev num" data-act="copy-prev" data-v="${ei}.${si}" ${pv ? '' : 'disabled'} aria-label="Usar valores anteriores">${esc(pvTxt)}</button>
              <input inputmode="decimal" data-set="${ei}.${si}.kg" value="${esc(st.kg)}" placeholder="${esc(pv?.kg ?? '')}" aria-label="${h1}, série ${si + 1}">
              <input inputmode="decimal" data-set="${ei}.${si}.reps" value="${esc(st.reps)}" placeholder="${esc(pv?.reps ?? (carga ? String(e.reps).split('-')[0] : ''))}" aria-label="${h2}, série ${si + 1}" ${!carga && e.tipo !== 'cardio' ? 'disabled' : ''}>
              <button class="chk" data-act="toggle-set" data-v="${ei}.${si}" aria-label="Concluir série ${si + 1}">${ic('check')}</button>
            </div>`;
          }).join('')}
        </div>
        <button class="add-set" data-act="add-set" data-v="${ei}">+ Adicionar série</button>
      </div>`;
    }).join('')}
    <div class="stack-btns"><button class="btn danger block" data-act="cancel-workout">Descartar treino</button></div>`;
}

/* ---------------- Tela: Dieta ---------------- */
views.dieta = () => {
  const groups = state.diet.groups;
  if (!groups.length) {
    return head('Plano da nutricionista', 'Alimentação')
      + section('Adicionar plano', `<div class="group pad">
        <p class="hint" style="margin-bottom:12px">Cole o texto do plano. Pode ter opções, substituições e observações, assim:</p>
        <textarea id="diet-raw" placeholder="07:30 - Café da manhã&#10;Iogurte desnatado - 170 g&#10;Aveia em flocos - 30 g&#10;Morango - 10 unidades ou 120 g&#10;Substituição: Salada de frutas - 1 porção&#10;&#10;07:30 - Café da manhã - Opção 2&#10;Pão integral - 2 fatias&#10;&#10;12:00 - Almoço&#10;Arroz branco cozido - 125 g&#10;Peito de frango grelhado - 150 g&#10;Observação: legumes e folhas à vontade">${esc(state.diet.raw)}</textarea>
        <div class="stack-btns"><button class="btn block" data-act="save-diet">Salvar plano</button></div></div>`);
  }
  const key = state.ui.dietDay || todayKey();
  const log = dayLog(key);
  const done = groups.filter((g) => mealCheck(log, g)).length;
  return head('Plano da nutricionista', 'Alimentação',
      `<button class="icon-btn" data-act="edit-diet" aria-label="Editar plano">${ic('pencil')}</button>`)
    + `<div class="section"><div class="day-switch">
        <button class="icon-btn" data-act="diet-day" data-v="-1" aria-label="Dia anterior">${ic('left')}</button>
        <b>${key === todayKey() ? 'Hoje' : cap(fmtDayLong(key))}</b>
        <button class="icon-btn" data-act="diet-day" data-v="1" aria-label="Próximo dia" ${key >= todayKey() ? 'disabled style="opacity:.3"' : ''}>${ic('right')}</button>
      </div></div>`
    + section('Refeições', `<div class="group">${groups.map((g) => {
        const c = mealCheck(log, g);
        const o = g.options[c ? c.opt : 0] || g.options[0];
        const sub = c ? `Registrada${g.options.length > 1 ? ` · Opção ${c.opt + 1}` : ''}`
          : `${g.options.length > 1 ? `${g.options.length} opções · ` : ''}${o.foods.slice(0, 3).map((f) => f.name).join(', ')}${o.foods.length > 3 ? '…' : ''}`;
        return `<div class="meal-row ${c ? 'done' : ''}">
          <button class="circle" data-act="meal-quick" data-v="${g.id}" aria-pressed="${!!c}" aria-label="Marcar ${esc(g.name)}">${ic('check')}</button>
          <button class="meal-open" data-act="meal-open" data-v="${g.id}">
            <span class="body"><div class="t">${g.time ? `<span class="time num">${esc(g.time)}</span>` : ''}${esc(g.name)}</div><div class="s">${esc(sub)}</div></span>
            <span class="end">${ic('right')}</span>
          </button></div>`;
      }).join('')}</div>`, `<span class="tag ${done === groups.length ? 'ok' : ''}">${done}/${groups.length}</span>`)
    + section('Fora do plano', log.extras.length
        ? `<div class="group">${log.extras.map((x, i) => `<div class="row plain"><span class="body"><div class="t" style="font-weight:500">${esc(x.text)}</div><div class="s num">${esc(x.time)}</div></span><button class="text-btn" style="color:var(--ink-3)" data-act="del-extra" data-v="${i}">Remover</button></div>`).join('')}</div>`
        : `<div class="group empty">Comeu algo diferente? Registre aqui, sem culpa.</div>`,
      `<button class="text-btn" data-act="add-extra">+ Adicionar</button>`);
};

/* ---------------- Tela: Perfil ---------------- */
const IMC_FAIXA = (v) => (v < 18.5 ? 'abaixo do peso' : v < 25 ? 'peso adequado' : v < 30 ? 'sobrepeso' : 'obesidade');
const latestWeight = () => morningSorted().filter((x) => x.peso != null).pop()?.peso ?? null;
views.perfil = () => {
  const p = state.profile;
  const w = latestWeight();
  const imc = w && p.altura ? w / ((p.altura / 100) ** 2) : null;
  const kv = (label, value) => `<button class="row plain kv" data-act="edit-profile"><span class="body"><div class="t">${label}</div></span><span class="end">${value != null && value !== '' ? `<span class="v num">${value}</span>` : '<span>Adicionar</span>'}</span></button>`;
  return `<header class="head profile-head"><div class="avatar big">${p.nome ? esc(initials(p.nome)) : ic('user')}</div>
      <div><div class="kicker">Seu perfil</div><h1>${esc(p.nome || 'Perfil')}</h1></div></header>`
    + (imc || (w && p.meta) ? `<div class="section two">
        ${imc ? `<div class="group pad"><div class="hint">IMC</div><div class="stat num">${br(imc)}</div><div class="hint">${IMC_FAIXA(imc)}</div></div>` : ''}
        ${w && p.meta ? `<div class="group pad"><div class="hint">Até a meta</div><div class="stat num">${Math.abs(w - p.meta) < 0.05 ? 'Chegou!' : br(Math.abs(w - p.meta)) + '<small> kg</small>'}</div><div class="hint">meta de ${br(p.meta)} kg</div></div>` : ''}
      </div>` : '')
    + section('Dados pessoais', `<div class="group">
        ${kv('Nome', p.nome ? esc(p.nome) : '')}
        ${kv('Idade', p.idade ? `${p.idade} anos` : '')}
        ${kv('Sexo', p.sexo ? (p.sexo === 'm' ? 'Masculino' : 'Feminino') : '')}
        ${kv('Altura', p.altura ? `${br(p.altura / 100, 2)} m` : '')}
        ${kv('Peso atual', w != null ? `${br(w)} kg` : '')}
        ${kv('Meta de peso', p.meta ? `${br(p.meta)} kg` : '')}
        ${kv('Nutricionista', p.nutri ? esc(p.nutri) : '')}
      </div>`, `<button class="text-btn" data-act="edit-profile">Editar</button>`)
    + section('Treino', `<div class="group"><button class="row plain" data-act="plan"><span class="body"><div class="t">Plano de treino</div>
        <div class="s">Emagrecimento · ${p.dias}x por semana · ${LEVEL_LABEL[p.nivel]}</div></span><span class="end">${ic('right')}</span></button></div>`)
    + section('Seus dados', `<div class="group">
        <button class="row plain" data-act="export"><span class="body"><div class="t">Exportar backup</div><div class="s">Salva um arquivo com todos os seus dados</div></span></button>
        <button class="row plain" data-act="import"><span class="body"><div class="t">Importar backup</div><div class="s">Restaura a partir de um arquivo</div></span></button>
      </div>
      <p class="hint" style="padding:10px 4px 0">Tudo fica salvo só neste celular. Em breve: assistente com IA e atividades automáticas do relógio.</p>
      <div class="stack-btns"><button class="btn danger block" data-act="reset">Apagar todos os dados</button></div>`);
};

/* ---------------- Tela: Progresso ---------------- */
views.progresso = () => {
  const ms = morningSorted().filter((x) => x.peso != null).slice(-60);
  const wPts = ms.map((x) => ({ y: x.peso, label: fmtDay(x.date) }));
  const cur = ms[ms.length - 1], first = ms[0];
  const pesoHero = cur ? `<div class="hero"><div class="label">Peso atual</div>
      <div class="big">${br(cur.peso)}<small>kg</small></div>
      ${ms.length > 1 ? `<div class="delta num">${cur.peso - first.peso > 0 ? '+' : ''}${br(cur.peso - first.peso)} kg desde ${fmtDay(first.date)}</div>` : ''}</div>` : '';

  const names = [...new Set(finished().flatMap((s) => s.exercises.filter((e) => e.tipo === 'carga' && e.sets.some((x) => num(x.kg))).map((e) => e.name)))];
  const sel = names.includes(state.ui.progressEx) ? state.ui.progressEx : names[0];
  const lPts = sel ? finished().map((s) => {
    const e = s.exercises.find((x) => x.name === sel);
    const kgs = e ? e.sets.map((x) => num(x.kg)).filter((v) => v != null) : [];
    return kgs.length ? { y: Math.max(...kgs), label: fmtDay(todayKey(new Date(s.start))) } : null;
  }).filter(Boolean) : [];

  const recent = finished().slice(-12).reverse();
  return head('Seu progresso', 'Progresso')
    + section('Peso', `<div class="group">${pesoHero}${chartSlot('peso', wPts, 'kg')}</div>`,
      `<button class="text-btn" data-act="morning">+ Pesagem</button>`)
    + section('Carga por exercício', names.length ? `<div class="group">
        <div class="pad" style="padding-bottom:0"><select data-act="progress-ex" aria-label="Exercício">${names.map((n) => `<option ${n === sel ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div>
        ${lPts.length ? `<div class="hero" style="padding-top:12px"><div class="label">Maior carga recente</div><div class="big">${br(lPts[lPts.length - 1].y)}<small>kg</small></div></div>` : ''}
        ${chartSlot('carga', lPts, 'kg')}</div>`
      : `<div class="group empty">${ic('chart')}<div>Depois de alguns treinos, a evolução de cada exercício aparece aqui.</div></div>`)
    + section('Treinos recentes', recent.length ? `<div class="group">${recent.map((s) => {
        const sets = s.exercises.reduce((n, e) => n + e.sets.length, 0);
        return `<button class="row plain" data-act="session" data-v="${s.id}"><span class="body"><div class="t">${esc(s.workoutName)}</div>
          <div class="s num">${cap(fmtDayLong(todayKey(new Date(s.start))))} · ${Math.round((s.end - s.start) / 60000)} min · ${sets} séries</div></span><span class="end">${ic('right')}</span></button>`;
      }).join('')}</div>` : `<div class="group empty">${ic('history')}<div>Seus treinos concluídos aparecem aqui.</div></div>`)
    + section('Atividades extras', state.activities.length ? `<div class="group">${state.activities.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10).map((a) => `
        <div class="row plain"><span class="body"><div class="t">${esc(a.tipo)}</div>
        <div class="s num">${fmtDay(a.date)}${a.minutos ? ` · ${a.minutos} min` : ''}${a.kcal ? ` · ${a.kcal} kcal` : ''}${a.passos ? ` · ${a.passos.toLocaleString('pt-BR')} passos` : ''}</div></span>
        <button class="text-btn" style="color:var(--ink-3)" data-act="del-activity" data-v="${a.id}">Remover</button></div>`).join('')}</div>`
      : `<div class="group empty">Nada registrado ainda.</div>`, `<button class="text-btn" data-act="activity">+ Adicionar</button>`);
};

/* ---------------- Render ---------------- */
const TABS = [['hoje', 'Hoje', 'home'], ['treino', 'Treino', 'dumbbell'], ['dieta', 'Dieta', 'meal'], ['progresso', 'Progresso', 'chart'], ['perfil', 'Perfil', 'user']];
function render() {
  const tab = state.ui.tab;
  $('#view').innerHTML = views[tab]();
  $('#tabs').innerHTML = TABS.map(([k, label, icon]) => `<button data-tab="${k}" class="${k === tab ? 'active' : ''}" aria-current="${k === tab ? 'page' : 'false'}"><span class="pill">${ic(icon)}</span>${label}</button>`).join('');
  $$('[data-chart]').forEach(drawChart);
}
function go(tab) { state.ui.tab = tab; save(); render(); window.scrollTo(0, 0); }

setInterval(() => { const el = $('#elapsed'); if (el && state.active) el.textContent = fmtClock((Date.now() - state.active.start) / 1000); }, 1000);
let resizeT; window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(() => $$('[data-chart]').forEach(drawChart), 150); });

/* ---------------- Timer de descanso ---------------- */
const timer = { end: 0, total: 0, beeped: false, iv: null };
function startTimer(sec) {
  if (!sec) return;
  Object.assign(timer, { total: sec, end: Date.now() + sec * 1000, beeped: false });
  $('#timer').classList.remove('hidden', 'over'); document.body.classList.add('timer-on');
  clearInterval(timer.iv); timer.iv = setInterval(tick, 250); tick();
}
function stopTimer() { clearInterval(timer.iv); timer.end = 0; $('#timer').classList.add('hidden'); document.body.classList.remove('timer-on'); }
function tick() {
  const left = (timer.end - Date.now()) / 1000;
  $('#timer-text').textContent = (left < 0 ? '+' : '') + fmtClock(left);
  $('#timer-fill').style.width = Math.max(0, Math.min(100, (left / timer.total) * 100)) + '%';
  if (left <= 0 && !timer.beeped) { timer.beeped = true; $('#timer').classList.add('over'); beep(); }
  if (left < -120) stopTimer();
}
let audio;
function beep() {
  try { navigator.vibrate?.([300, 120, 300]); } catch {}
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.25, 0.5].forEach((t) => {
      const o = audio.createOscillator(), g = audio.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(audio.destination);
      g.gain.setValueAtTime(0.25, audio.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + t + 0.2);
      o.start(audio.currentTime + t); o.stop(audio.currentTime + t + 0.2);
    });
  } catch {}
}
let wakeLock = null;
async function keepAwake(on) {
  try {
    if (on && 'wakeLock' in navigator && !wakeLock) wakeLock = await navigator.wakeLock.request('screen');
    if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch {}
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') { wakeLock = null; if (state.active) keepAwake(true); render(); }
});

/* ---------------- Bottom sheet ---------------- */
function sheet(html, onSubmit) {
  const dlg = $('#sheet'), f = $('#sheet-body');
  f.innerHTML = `<div class="grab"></div>${html}`;
  f.onsubmit = (ev) => {
    if (ev.submitter?.value === 'ok' && onSubmit && onSubmit(f) === false) ev.preventDefault();
  };
  if (!dlg.open) dlg.showModal();
  f.scrollTop = 0;
}
$('#sheet').addEventListener('click', (ev) => { if (ev.target.id === 'sheet') ev.target.close(); });
const sheetActions = (ok = 'Salvar') => `<div class="sheet-actions"><button class="btn soft" value="cancel" formnovalidate>Cancelar</button><button class="btn" value="ok">${ok}</button></div>`;
const seg = (name, opts, cur) => `<input type="hidden" name="${name}" value="${esc(cur ?? '')}"><div class="seg" data-seg="${name}">${opts.map(([v, l]) => `<button type="button" data-act="seg" data-v="${esc(v)}" class="${String(v) === String(cur) ? 'on' : ''}">${l}</button>`).join('')}</div>`;

/* ---------------- Ações ---------------- */
const A = {};
A.goto = (v) => go(v);
A.seg = (v, el) => {
  const box = el.closest('[data-seg]');
  const inp = box.previousElementSibling;
  const was = inp.value === v;
  $$('button', box).forEach((b) => b.classList.remove('on'));
  if (was && el.closest('[data-toggle]')) { inp.value = ''; return; }
  el.classList.add('on'); inp.value = v;
};

A.workout = (id) => {
  const w = state.plan.workouts.find((x) => x.id === id);
  if (!w) return;
  sheet(`<h2>${esc(w.letter)} · ${esc(w.name)}</h2><p class="lead">${w.exercises.length} exercícios · ~${estMinutes(w)} min</p>
    <div class="group" style="background:var(--surface-2)">${w.exercises.map((e) => `<div class="row plain" style="min-height:52px"><span class="body"><div class="t" style="font-weight:500">${esc(e.name)}</div></span><span class="end num">${e.sets} × ${esc(e.reps)}</span></div>`).join('')}</div>
    <div class="sheet-actions"><button class="btn soft" type="button" data-act="edit-workout" data-v="${w.id}">Editar</button>
    <button class="btn" type="button" data-act="start" data-v="${w.id}" ${state.active ? 'disabled' : ''}>${ic('play')} Começar</button></div>`);
};

A.start = (id) => {
  const w = state.plan.workouts.find((x) => x.id === id);
  if (!w || state.active) return;
  $('#sheet').open && $('#sheet').close();
  state.active = {
    id: uid(), workoutId: w.id, workoutLetter: w.letter, workoutName: w.name, start: Date.now(),
    exercises: w.exercises.map((e) => ({ name: e.name, tipo: e.tipo, reps: e.reps, rest: e.rest, notes: e.notes,
      sets: Array.from({ length: e.sets }, () => ({ kg: '', reps: '', done: false })) })),
  };
  save(); keepAwake(true); go('treino');
};

A['copy-prev'] = (v) => {
  const [ei, si] = v.split('.').map(Number);
  const e = state.active.exercises[ei], pv = lastPerformance(e.name)?.sets[si];
  if (!pv) return;
  Object.assign(e.sets[si], { kg: pv.kg ?? '', reps: pv.reps ?? '' });
  save(); render();
};

A['toggle-set'] = (v) => {
  const [ei, si] = v.split('.').map(Number);
  const e = state.active.exercises[ei], st = e.sets[si];
  st.done = !st.done;
  if (st.done) {
    const pv = lastPerformance(e.name)?.sets[si];
    if (st.kg === '' && pv?.kg) st.kg = pv.kg;
    if (st.reps === '' && e.tipo === 'carga') st.reps = pv?.reps || String(e.reps).split('-')[0].replace(/\D/g, '');
    const isLast = si === e.sets.length - 1 && ei === state.active.exercises.length - 1;
    if (!isLast) startTimer(e.rest);
  }
  save(); render();
};

A['add-set'] = (v) => {
  const e = state.active.exercises[+v], l = e.sets[e.sets.length - 1];
  e.sets.push({ kg: l?.kg || '', reps: '', done: false });
  save(); render();
};

A.finish = () => {
  const s = state.active;
  const done = s.exercises.reduce((n, e) => n + e.sets.filter((x) => x.done).length, 0);
  if (!done && !confirm('Nenhuma série marcada. Concluir mesmo assim?')) return;
  s.end = Date.now();
  s.exercises = s.exercises.filter((e) => e.sets.some((x) => x.done)).map((e) => ({ ...e, sets: e.sets.filter((x) => x.done) }));
  state.sessions.push(s); state.active = null;
  stopTimer(); keepAwake(false); save(); render();
  const vol = s.exercises.reduce((n, e) => n + e.sets.reduce((a, x) => a + (num(x.kg) || 0) * (num(x.reps) || 0), 0), 0);
  sheet(`<h2>Treino concluído</h2><p class="lead">${esc(s.workoutName)}</p>
    <div class="two"><div class="group pad" style="background:var(--surface-2)"><div class="hint">Duração</div><div class="big num" style="font-size:28px;font-weight:700">${Math.round((s.end - s.start) / 60000)} min</div></div>
    <div class="group pad" style="background:var(--surface-2)"><div class="hint">Séries</div><div class="num" style="font-size:28px;font-weight:700">${done}</div></div></div>
    ${vol ? `<p class="hint" style="margin-top:12px">Volume total: <b class="num">${Math.round(vol).toLocaleString('pt-BR')} kg</b></p>` : ''}
    <p class="hint" style="margin-top:6px">Próximo: <b>${esc(nextWorkout()?.name || '')}</b></p>
    <div class="stack-btns"><button class="btn block" value="ok">Fechar</button></div>`);
};

A['cancel-workout'] = () => {
  if (!confirm('Descartar este treino? O que foi preenchido será perdido.')) return;
  state.active = null; stopTimer(); keepAwake(false); save(); render();
};

A.session = (id) => {
  const s = state.sessions.find((x) => x.id === id);
  if (!s) return;
  sheet(`<h2>${esc(s.workoutName)}</h2><p class="lead">${cap(fmtDayLong(todayKey(new Date(s.start))))} · ${Math.round((s.end - s.start) / 60000)} min</p>
    <div class="group" style="background:var(--surface-2)">${s.exercises.map((e) => `<div class="row plain" style="min-height:52px"><span class="body"><div class="t" style="font-weight:500">${esc(e.name)}</div>
      <div class="s num">${e.sets.map((x) => e.tipo === 'carga' ? `${x.kg || 0} kg × ${x.reps || 0}` : `${x.kg || '—'}`).join(' · ')}</div></span></div>`).join('')}</div>
    <div class="sheet-actions"><button class="btn danger" type="button" data-act="del-session" data-v="${s.id}">Apagar</button><button class="btn soft" value="cancel">Fechar</button></div>`);
};
A['del-session'] = (id) => {
  if (!confirm('Apagar este treino do histórico?')) return;
  state.sessions = state.sessions.filter((s) => s.id !== id);
  $('#sheet').close(); save(); render();
};

A['timer-add'] = (v) => {
  timer.end += Number(v) * 1000;
  timer.total = Math.max(timer.total, (timer.end - Date.now()) / 1000);
  if (timer.end > Date.now()) { timer.beeped = false; $('#timer').classList.remove('over'); }
  tick();
};
A['timer-skip'] = () => stopTimer();

A.plan = () => {
  const p = state.profile;
  sheet(`<h2>Ajustar plano</h2><p class="lead">Objetivo: emagrecimento. Outros objetivos chegam com a IA.</p>
    <div class="field"><label>Dias por semana</label>${seg('dias', [2, 3, 4, 5, 6].map((d) => [d, d]), p.dias)}</div>
    <div class="field"><label>Nível</label>${seg('nivel', Object.entries(LEVEL_LABEL), p.nivel)}</div>
    <label class="check-line"><input type="checkbox" name="regen" ${state.plan.source === 'personalizado' ? '' : 'checked'}> Gerar um plano novo com essas opções</label>
    ${state.plan.source === 'personalizado' ? '<p class="hint">Atenção: gerar um plano novo substitui as suas edições.</p>' : ''}
    ${sheetActions()}`, (f) => {
    p.dias = Number(f.dias.value); p.nivel = f.nivel.value;
    if (f.regen.checked) state.plan = generatePlan(p);
    save(); render();
  });
};

function exEditor(e) {
  return `<div class="ed-ex" data-ex="${e.id}">
    <div class="top"><input name="name" value="${esc(e.name)}" placeholder="Nome do exercício">
    <button type="button" class="btn sm soft" style="background:var(--surface)" data-act="ed-del-ex" data-v="${e.id}" aria-label="Remover">✕</button></div>
    <div class="three">
      <div><small>Séries</small><input name="sets" inputmode="numeric" value="${e.sets}"></div>
      <div><small>Reps / tempo</small><input name="reps" value="${esc(e.reps)}"></div>
      <div><small>Descanso (s)</small><input name="rest" inputmode="numeric" value="${e.rest}"></div>
    </div>
    <div class="three" style="grid-template-columns:1fr 2fr">
      <div><small>Tipo</small><select name="tipo">${[['carga', 'Carga'], ['tempo', 'Tempo'], ['cardio', 'Cardio']].map(([v, l]) => `<option value="${v}" ${v === e.tipo ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div><small>Observação</small><input name="notes" value="${esc(e.notes)}" placeholder="ex.: banco no 4"></div>
    </div></div>`;
}
function openEditor(w, isNew) {
  sheet(`<h2>${isNew ? 'Novo treino' : 'Editar treino'}</h2>
    <div class="field"><label>Nome</label><input name="wname" value="${esc(w.name)}" required></div>
    <div id="ed-list">${w.exercises.map(exEditor).join('')}</div>
    <button type="button" class="btn soft block" data-act="ed-add-ex">${ic('plus')} Exercício</button>
    ${isNew ? '' : `<button type="button" class="btn danger block" style="margin-top:10px" data-act="ed-del-workout" data-v="${w.id}">Excluir treino</button>`}
    ${sheetActions()}`, (f) => {
    w.name = f.wname.value.trim() || w.name;
    w.exercises = $$('[data-ex]', f).map((el) => ({
      id: el.dataset.ex,
      name: $('[name=name]', el).value.trim(),
      sets: Math.max(1, parseInt($('[name=sets]', el).value, 10) || 1),
      reps: $('[name=reps]', el).value.trim() || '10',
      rest: Math.max(0, parseInt($('[name=rest]', el).value, 10) || 0),
      tipo: $('[name=tipo]', el).value,
      notes: $('[name=notes]', el).value.trim(),
    })).filter((e) => e.name);
    if (isNew) state.plan.workouts.push(w);
    state.plan.source = 'personalizado';
    save(); render();
  });
}
A['edit-workout'] = (id) => { const w = state.plan.workouts.find((x) => x.id === id); if (w) openEditor(w, false); };
A['add-workout'] = () => openEditor({ id: uid(), letter: String.fromCharCode(65 + state.plan.workouts.length), name: '', exercises: [] }, true);
A['ed-add-ex'] = () => {
  $('#ed-list').insertAdjacentHTML('beforeend', exEditor({ id: uid(), name: '', sets: 3, reps: '12', rest: 60, tipo: 'carga', notes: '' }));
  $('#ed-list').lastElementChild.querySelector('input').focus();
};
A['ed-del-ex'] = (id) => $(`[data-ex="${id}"]`)?.remove();
A['ed-del-workout'] = (id) => {
  if (!confirm('Excluir este treino do plano?')) return;
  state.plan.workouts = state.plan.workouts.filter((w) => w.id !== id);
  state.plan.workouts.forEach((w, k) => { w.letter = String.fromCharCode(65 + k); });
  state.plan.source = 'personalizado';
  $('#sheet').close(); save(); render();
};
A['progress-ex'] = (v) => { state.ui.progressEx = v; save(); render(); };

/* Dieta */
A['save-diet'] = () => {
  const raw = $('#diet-raw').value.trim();
  if (!raw) return alert('Cole o texto do plano primeiro.');
  const groups = parsePlan(raw);
  state.diet = { raw, groups }; save(); render();
  sheet(`<h2>Plano salvo</h2><p class="lead">Encontrei ${groups.length} refeições:</p>
    <div class="group" style="background:var(--surface-2)">${groups.map((g) => `<div class="row plain" style="min-height:48px"><span class="body"><div class="t" style="font-weight:500">${g.time ? `<span class="num" style="color:var(--ink-3);margin-right:8px">${esc(g.time)}</span>` : ''}${esc(g.name)}</div></span><span class="end">${g.options.length > 1 ? `${g.options.length} opções` : `${g.options[0].foods.length} itens`}</span></div>`).join('')}</div>
    <p class="hint" style="margin-top:12px">Se algo ficou errado, toque no lápis e ajuste o texto.</p>
    <div class="stack-btns"><button class="btn block" value="ok">Ok</button></div>`);
};
A['edit-diet'] = () => {
  sheet(`<h2>Editar plano</h2><p class="lead">Cada refeição numa linha com o horário. Alimento e quantidade separados por “-”.</p>
    <textarea name="raw" style="min-height:50vh">${esc(state.diet.raw)}</textarea>${sheetActions()}`, (f) => {
    const raw = f.raw.value.trim(), old = state.diet.groups, groups = parsePlan(raw);
    groups.forEach((g) => { const o = old.find((x) => x.name === g.name && x.time === g.time); if (o) g.id = o.id; });
    state.diet = { raw, groups }; save(); render();
  });
};
function mealSheet(gid, oi) {
  const g = state.diet.groups.find((x) => x.id === gid);
  if (!g) return;
  const log = dayLog(state.ui.dietDay || todayKey()), c = mealCheck(log, g);
  oi = oi ?? (c ? c.opt : 0);
  const o = g.options[oi] || g.options[0];
  const registered = c && c.opt === oi;
  sheet(`<h2>${g.time ? `<span class="num" style="color:var(--ink-3)">${esc(g.time)}</span> · ` : ''}${esc(g.name)}</h2>
    <p class="lead">${g.options.length > 1 ? `${g.options.length} opções — escolha a que você vai comer` : `${o.foods.length} alimentos`}</p>
    ${g.options.length > 1 ? `<div class="seg" style="margin-bottom:14px">${g.options.map((_, i) => `<button type="button" data-act="meal-opt" data-v="${g.id}:${i}" class="${i === oi ? 'on' : ''}">Opção ${i + 1}</button>`).join('')}</div>` : ''}
    ${o.foods.map((f, fi) => `<div class="food">
      <div class="t">${esc(f.name)}</div>${f.qty ? `<div class="s">${esc(f.qty)}</div>` : ''}
      ${f.subs.length ? `<button type="button" class="subs-btn" data-act="subs" data-v="${fi}">${ic('swap')} Substituições (${f.subs.length})</button>
        <div class="subs hidden" data-subs="${fi}">${f.subs.map((x) => `<div class="sub"><div class="t">${esc(x.name)}</div>${x.qty ? `<div class="s">${esc(x.qty)}</div>` : ''}</div>`).join('')}</div>` : ''}
    </div>`).join('') || '<p class="hint">Nenhum alimento nesta opção.</p>'}
    ${o.notes ? `<details class="notes"><summary>Observações da nutricionista</summary><div>${esc(o.notes).replace(/\n/g, '<br>')}</div></details>` : ''}
    <div class="stack-btns">
      <button class="btn block ${registered ? 'soft' : ''}" type="button" data-act="meal-reg" data-v="${g.id}:${oi}">${registered ? `${ic('check')} Registrada · toque para desfazer` : 'Registrar refeição'}</button>
      <button class="text-btn" type="button" data-act="add-extra">Comi outra coisa</button>
    </div>`);
}
A['meal-open'] = (gid) => mealSheet(gid);
A['meal-opt'] = (v) => { const [gid, i] = v.split(':'); mealSheet(gid, +i); };
A.subs = (fi) => $(`[data-subs="${fi}"]`)?.classList.toggle('hidden');
A['meal-reg'] = (v) => {
  const [gid, i] = v.split(':');
  const log = dayLog(state.ui.dietDay || todayKey()), c = log.checked[gid];
  if (c != null && (typeof c !== 'object' || c.opt === +i)) delete log.checked[gid];
  else log.checked[gid] = { opt: +i, at: Date.now() };
  $('#sheet').close(); save(); render();
};
A['meal-quick'] = (gid) => {
  const log = dayLog(state.ui.dietDay || todayKey());
  if (log.checked[gid] != null) delete log.checked[gid]; else log.checked[gid] = { opt: 0, at: Date.now() };
  save(); render();
};
A['diet-day'] = (v) => {
  const d = keyToDate(state.ui.dietDay || todayKey()); d.setDate(d.getDate() + Number(v));
  const k = todayKey(d); state.ui.dietDay = k > todayKey() ? todayKey() : k; render();
};
A['add-extra'] = () => {
  sheet(`<h2>Fora do plano</h2><p class="lead">O que você comeu?</p>
    <div class="field"><input name="text" placeholder="ex.: 1 pastel de queijo e um refri" required autofocus></div>${sheetActions('Adicionar')}`, (f) => {
    const t = f.text.value.trim(); if (!t) return false;
    dayLog(state.ui.dietDay || todayKey()).extras.push({ text: t, time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) });
    save(); render();
  });
};
A['del-extra'] = (i) => { dayLog(state.ui.dietDay || todayKey()).extras.splice(+i, 1); save(); render(); };

/* Pesagem */
A.morning = () => {
  const key = todayKey(), m = state.morning.find((x) => x.date === key) || {};
  sheet(`<h2>Pesagem da manhã</h2><p class="lead">Em jejum, depois do banheiro.</p>
    <div class="field"><input class="big-input" name="peso" inputmode="decimal" value="${m.peso != null ? br(m.peso) : ''}" placeholder="0,0 kg" aria-label="Peso em kg" autofocus></div>
    <div class="field"><label>Horas de sono</label><input name="sono" inputmode="decimal" value="${m.sono != null ? br(m.sono) : ''}" placeholder="ex.: 7"></div>
    <div class="field"><label>Disposição</label><div data-toggle>${seg('disp', [[1, '1'], [2, '2'], [3, '3'], [4, '4'], [5, '5']], m.disposicao ?? '')}</div>
      <p class="hint" style="margin-top:6px">1 = muito cansado · 5 = cheio de energia</p></div>
    ${sheetActions()}`, (f) => {
    const rec = { date: key, peso: num(f.peso.value), sono: num(f.sono.value), disposicao: num(f.disp.value) };
    if (rec.peso == null) { alert('Informe o peso.'); return false; }
    state.morning = state.morning.filter((x) => x.date !== key).concat(rec);
    save(); render();
  });
};

/* Atividades */
A.activity = () => {
  sheet(`<h2>Atividade extra</h2><p class="lead">Até a integração com o relógio, registre aqui.</p>
    <div class="field"><label>Tipo</label>${seg('tipo', [['Caminhada', 'Caminhada'], ['Corrida', 'Corrida'], ['Bicicleta', 'Bike'], ['Outro', 'Outro']], 'Caminhada')}</div>
    <div class="two"><div class="field"><label>Minutos</label><input name="minutos" inputmode="numeric"></div>
      <div class="field"><label>Calorias</label><input name="kcal" inputmode="numeric" placeholder="kcal"></div></div>
    <div class="two"><div class="field"><label>Passos</label><input name="passos" inputmode="numeric"></div>
      <div class="field"><label>Data</label><input name="date" type="date" value="${todayKey()}" max="${todayKey()}"></div></div>
    ${sheetActions('Adicionar')}`, (f) => {
    state.activities.push({ id: uid(), tipo: f.tipo.value || 'Outro', minutos: num(f.minutos.value), kcal: num(f.kcal.value), passos: num(f.passos.value), date: f.date.value || todayKey(), fonte: 'manual' });
    save(); render();
  });
};
A['del-activity'] = (id) => { state.activities = state.activities.filter((a) => a.id !== id); save(); render(); };

/* Ajustes e backup */
A['edit-profile'] = () => {
  const p = state.profile, w = latestWeight();
  sheet(`<h2>Seus dados</h2><p class="lead">Ficam só no seu celular. Ajudam a acompanhar a evolução e, no futuro, a IA.</p>
    <div class="field"><label>Nome</label><input name="nome" value="${esc(p.nome || '')}" autocomplete="name" placeholder="Como quer ser chamado"></div>
    <div class="two"><div class="field"><label>Idade</label><input name="idade" inputmode="numeric" value="${p.idade || ''}" placeholder="anos"></div>
      <div class="field"><label>Altura (cm)</label><input name="altura" inputmode="numeric" value="${p.altura || ''}" placeholder="ex.: 175"></div></div>
    <div class="field"><label>Sexo</label><div data-toggle>${seg('sexo', [['m', 'Masculino'], ['f', 'Feminino']], p.sexo || '')}</div></div>
    <div class="two"><div class="field"><label>Peso atual (kg)</label><input name="peso" inputmode="decimal" value="${w != null ? br(w) : ''}"></div>
      <div class="field"><label>Meta (kg)</label><input name="meta" inputmode="decimal" value="${p.meta ? br(p.meta) : ''}"></div></div>
    <div class="field"><label>Nutricionista</label><input name="nutri" value="${esc(p.nutri || '')}" placeholder="opcional"></div>
    ${sheetActions()}`, (f) => {
    const alt = num(f.altura.value);
    Object.assign(p, {
      nome: f.nome.value.trim(), idade: num(f.idade.value), sexo: f.sexo.value,
      altura: alt && alt < 3 ? Math.round(alt * 100) : alt, meta: num(f.meta.value), nutri: f.nutri.value.trim(),
    });
    const peso = num(f.peso.value);
    if (peso != null && peso !== w) {
      const key = todayKey(), cur = state.morning.find((x) => x.date === key);
      if (cur) cur.peso = peso; else state.morning.push({ date: key, peso, sono: null, disposicao: null });
    }
    save(); render();
  });
};
A.export = () => {
  const blob = new Blob([JSON.stringify({ ...state, active: null }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = `treino-dieta-backup-${todayKey()}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
};
A.import = () => {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'application/json,.json';
  inp.onchange = async () => {
    try {
      const data = JSON.parse(await inp.files[0].text());
      if (!data?.plan || !Array.isArray(data.sessions)) throw new Error('o arquivo não é um backup deste app');
      if (!confirm('Substituir os dados atuais pelo backup?')) return;
      state = migrate(Object.assign(defaultState(), data)); save(); $('#sheet').close(); render();
    } catch (e) { alert('Não consegui importar: ' + e.message); }
  };
  inp.click();
};
A.reset = () => {
  if (!confirm('Apagar TODOS os dados? Isso não pode ser desfeito.')) return;
  if (!confirm('Tem certeza? Faça um backup antes se quiser guardar.')) return;
  state = defaultState(); stopTimer(); save(); $('#sheet').close(); render();
};

/* ---------------- Eventos ---------------- */
document.addEventListener('click', (ev) => {
  const tabBtn = ev.target.closest('[data-tab]');
  if (tabBtn) return go(tabBtn.dataset.tab);
  const el = ev.target.closest('[data-act]');
  if (!el || el.tagName === 'SELECT' || el.disabled) return;
  const fn = A[el.dataset.act];
  if (fn) { ev.preventDefault(); ev.stopPropagation(); fn(el.dataset.v, el); }
});
document.addEventListener('change', (ev) => {
  const el = ev.target;
  if (el.matches('select[data-act]')) A[el.dataset.act]?.(el.value, el);
});
document.addEventListener('input', (ev) => {
  const el = ev.target;
  if (!el.dataset.set || !state.active) return;
  const [ei, si, field] = el.dataset.set.split('.');
  state.active.exercises[+ei].sets[+si][field] = el.value.trim();
  save();
});

if (state.active) keepAwake(true);
render();
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
