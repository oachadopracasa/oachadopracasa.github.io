'use strict';

/* =========================================================
   Treino & Dieta — versão 1
   Tudo salvo no próprio celular (localStorage).
   ========================================================= */

const STORE_KEY = 'treino-dieta-v1';
const $ = (s, el = document) => el.querySelector(s);
const uid = () => Math.random().toString(36).slice(2, 10);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const todayKey = (d = new Date()) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
};
const fmtDate = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
};
const fmtClock = (sec) => {
  const s = Math.max(0, Math.round(Math.abs(sec)));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};
const num = (v) => {
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

/* ---------------- Biblioteca de treinos (emagrecimento) ---------------- */

const ex = (name, reps, rest = 60, tipo = 'carga', sets) => ({ name, reps, rest, tipo, sets });

const TEMPLATES = {
  emagrecimento: [
    { name: 'A — Corpo todo 1', exercises: [
      ex('Agachamento goblet', '12-15'), ex('Supino reto com halteres', '12'),
      ex('Remada baixa (cabo)', '12'), ex('Elevação pélvica', '15'),
      ex('Desenvolvimento com halteres', '12'), ex('Prancha', '30-45s', 45, 'tempo'),
      ex('Esteira inclinada', '15 min', 0, 'cardio', 1),
    ] },
    { name: 'B — Corpo todo 2', exercises: [
      ex('Leg press 45°', '15'), ex('Puxada frontal', '12'),
      ex('Supino inclinado na máquina', '12'), ex('Stiff com halteres', '12'),
      ex('Elevação lateral', '15', 45), ex('Abdominal infra', '15', 45),
      ex('Bike intervalada (30s forte / 60s leve)', '15 min', 0, 'cardio', 1),
    ] },
    { name: 'C — Corpo todo 3', exercises: [
      ex('Afundo / passada (cada perna)', '12'), ex('Remada curvada com halteres', '12'),
      ex('Crucifixo na máquina (peck deck)', '12'), ex('Mesa / cadeira flexora', '15'),
      ex('Rosca direta + tríceps corda (bi-set)', '12'), ex('Agachamento com salto', '10', 60),
      ex('Elíptico ou escada', '15 min', 0, 'cardio', 1),
    ] },
    { name: 'D — Cardio + core', exercises: [
      ex('Esteira: caminhada rápida / trote', '25 min', 0, 'cardio', 1),
      ex('Prancha lateral (cada lado)', '30s', 30, 'tempo'),
      ex('Abdominal bicicleta', '20', 30), ex('Mountain climber', '30s', 30, 'tempo'),
      ex('Superman (lombar)', '15', 30),
    ] },
    { name: 'E — Inferiores + cardio', exercises: [
      ex('Agachamento no Smith', '12'), ex('Cadeira extensora', '15'),
      ex('Cadeira abdutora', '15', 45), ex('Panturrilha em pé', '15', 45),
      ex('Esteira inclinada', '20 min', 0, 'cardio', 1),
    ] },
  ],
};

const LEVEL = {
  iniciante: { sets: 3, restMul: 1.2 },
  intermediario: { sets: 3, restMul: 1 },
  avancado: { sets: 4, restMul: 0.8 },
};

function generatePlan(profile) {
  const base = TEMPLATES.emagrecimento;
  const lv = LEVEL[profile.nivel] || LEVEL.iniciante;
  const order = { 2: [0, 1], 3: [0, 1, 2], 4: [0, 1, 2, 3], 5: [0, 1, 2, 3, 4], 6: [0, 1, 2, 3, 4, 3] }[profile.dias] || [0, 1, 2];
  return {
    generatedAt: Date.now(),
    source: 'modelo',
    workouts: order.map((i, idx) => {
      const t = base[i];
      return {
        id: uid(),
        name: profile.dias === 6 && idx === 5 ? 'F — Cardio + core' : t.name,
        exercises: t.exercises.map((e) => ({
          id: uid(), name: e.name, reps: e.reps, tipo: e.tipo,
          sets: e.sets ?? lv.sets,
          rest: e.rest ? Math.round((e.rest * lv.restMul) / 5) * 5 : 0,
          notes: '',
        })),
      };
    }),
  };
}

/* ---------------- Estado ---------------- */

const defaultState = () => {
  const profile = { objetivo: 'emagrecimento', dias: 3, nivel: 'iniciante', duracao: 60, nome: '' };
  return {
    version: 1,
    profile,
    plan: generatePlan(profile),
    sessions: [],
    active: null,
    diet: { raw: '', meals: [] },
    dietLog: {},
    morning: [],
    activities: [],
    ui: { tab: 'hoje' },
  };
};

let state;
try {
  state = Object.assign(defaultState(), JSON.parse(localStorage.getItem(STORE_KEY) || 'null') || {});
} catch { state = defaultState(); }

function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
  catch (e) { alert('Não consegui salvar os dados no celular: ' + e.message); }
}

/* ---------------- Utilidades de dados ---------------- */

function nextWorkout() {
  const ws = state.plan.workouts;
  if (!ws.length) return null;
  const last = state.sessions[state.sessions.length - 1];
  if (!last) return ws[0];
  const i = ws.findIndex((w) => w.id === last.workoutId);
  return ws[(i + 1) % ws.length] || ws[0];
}

function lastPerformance(exName) {
  for (let i = state.sessions.length - 1; i >= 0; i--) {
    const e = state.sessions[i].exercises.find((x) => x.name === exName);
    if (e && e.sets.some((s) => s.done)) return e;
  }
  return null;
}

function weekSessions() {
  const now = new Date();
  const monday = new Date(now); monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  return state.sessions.filter((s) => s.end && new Date(s.start) >= monday).length;
}

function dayLog(key = todayKey()) {
  if (!state.dietLog[key]) state.dietLog[key] = { checked: {}, extras: [] };
  return state.dietLog[key];
}

/* Transforma o texto do plano da nutricionista em refeições. */
function parseDiet(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const headerRe = /^(caf[eé]|desjejum|almo[cç]o|jantar|janta|lanche|ceia|colaç[aã]o|pr[eé][- ]?treino|p[oó]s[- ]?treino|refei[cç][aã]o|\d+ª?\s*refei)/i;
  const timeRe = /\b(\d{1,2})[:h](\d{2})?\b/;
  const meals = [];
  let cur = null;
  for (const raw of lines) {
    const line = raw.replace(/^[-•*▪◦·]\s*/, '');
    const isHeader = headerRe.test(line) || (/:$/.test(line) && line.length < 50) || (/^[A-ZÀ-Ú0-9 ()h:–-]{4,}$/.test(line) && line.length < 40);
    if (isHeader) {
      const t = line.match(timeRe);
      cur = {
        id: uid(),
        name: line.replace(/:$/, '').replace(/\(?\s*\d{1,2}[:h]\d{0,2}\s*\)?/, '').replace(/[-–]\s*$/, '').trim() || line,
        time: t ? `${t[1].padStart(2, '0')}:${t[2] || '00'}` : '',
        items: [],
      };
      meals.push(cur);
    } else {
      if (!cur) { cur = { id: uid(), name: 'Refeição', time: '', items: [] }; meals.push(cur); }
      cur.items.push(line);
    }
  }
  return meals;
}

/* ---------------- Gráfico simples ---------------- */

function lineChart(points, unit = '') {
  if (points.length < 2) return '<p class="muted small">Registre pelo menos 2 dias para ver o gráfico.</p>';
  const W = 320, H = 160, P = { l: 34, r: 10, t: 12, b: 22 };
  const ys = points.map((p) => p.y);
  let min = Math.min(...ys), max = Math.max(...ys);
  if (min === max) { min -= 1; max += 1; }
  const pad = (max - min) * 0.15; min -= pad; max += pad;
  const x = (i) => P.l + (i * (W - P.l - P.r)) / (points.length - 1);
  const y = (v) => P.t + ((max - v) * (H - P.t - P.b)) / (max - min);
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.y).toFixed(1)}`).join(' ');
  const dots = points.length <= 30 ? points.map((p, i) => `<circle class="dot" cx="${x(i)}" cy="${y(p.y)}" r="3"/>`).join('') : '';
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Gráfico">
    <line class="axis" x1="${P.l}" x2="${W - P.r}" y1="${H - P.b}" y2="${H - P.b}"/>
    <text x="2" y="${y(max - pad) + 4}">${(max - pad).toFixed(1)}</text>
    <text x="2" y="${y(min + pad) + 4}">${(min + pad).toFixed(1)}</text>
    <text x="${P.l}" y="${H - 6}">${esc(points[0].label)}</text>
    <text x="${W - P.r}" y="${H - 6}" text-anchor="end">${esc(points[points.length - 1].label)}</text>
    <path class="line" d="${d}"/>${dots}
  </svg>${unit ? `<div class="muted small">Unidade: ${esc(unit)}</div>` : ''}`;
}

/* ---------------- Telas ---------------- */

const views = {};

views.hoje = () => {
  const key = todayKey();
  const nw = nextWorkout();
  const log = dayLog(key);
  const meals = state.diet.meals;
  const done = meals.filter((m) => log.checked[m.id]).length;
  const m = state.morning.find((x) => x.date === key);
  const acts = state.activities.filter((a) => a.date === key);
  return `
    ${state.active ? `
      <div class="card accent">
        <div class="row between"><div><h3>Treino em andamento</h3><div class="muted small">${esc(state.active.workoutName)}</div></div>
        <button class="btn" data-act="goto" data-v="treino">Continuar</button></div>
      </div>` : ''}

    <div class="card">
      <div class="row between"><h3>⚖️ Registro da manhã</h3>${m ? '<span class="pill ok">feito</span>' : ''}</div>
      ${m ? `<p class="muted">Peso: <b>${m.peso ?? '—'} kg</b> · Sono: ${m.sono ?? '—'}h · Disposição: ${m.disposicao ?? '—'}/5</p>`
          : `<p class="muted small">Pese-se em jejum, depois do banheiro.</p><button class="btn block" data-act="goto" data-v="manha">Registrar agora</button>`}
    </div>

    <div class="card">
      <div class="row between"><h3>🏋️ Próximo treino</h3><span class="pill">${weekSessions()} nesta semana</span></div>
      ${nw ? `<p><b>${esc(nw.name)}</b><br><span class="muted small">${nw.exercises.length} exercícios</span></p>
        ${state.active ? '' : `<button class="btn block" data-act="start" data-v="${nw.id}">Começar treino</button>`}`
        : '<p class="muted">Monte seu plano na aba Treino.</p>'}
    </div>

    <div class="card">
      <div class="row between"><h3>🥗 Alimentação</h3>${meals.length ? `<span class="pill ${done === meals.length ? 'ok' : ''}">${done}/${meals.length} refeições</span>` : ''}</div>
      ${meals.length ? `<p class="muted small">${log.extras.length ? `${log.extras.length} item(ns) fora do plano hoje.` : 'Nada fora do plano hoje 👏'}</p>
        <button class="btn ghost block" data-act="goto" data-v="dieta">Ver refeições</button>`
        : `<p class="muted small">Cole o plano da sua nutricionista para começar.</p><button class="btn ghost block" data-act="goto" data-v="dieta">Adicionar plano</button>`}
    </div>

    <div class="card">
      <div class="row between"><h3>⌚ Atividades de hoje</h3><button class="link" data-act="add-activity">+ adicionar</button></div>
      ${acts.length ? `<ul class="list">${acts.map(activityLi).join('')}</ul>` : '<p class="muted small">Nenhuma atividade extra registrada. Caminhada, bike, futebol… registre aqui.</p>'}
    </div>`;
};

function activityLi(a) {
  return `<li class="row between"><div><b>${esc(a.tipo)}</b><div class="muted small">${a.minutos ? a.minutos + ' min' : ''}${a.kcal ? ' · ' + a.kcal + ' kcal' : ''}${a.passos ? ' · ' + a.passos + ' passos' : ''} · ${esc(a.fonte)}</div></div>
    <button class="link" data-act="del-activity" data-v="${a.id}">remover</button></li>`;
}

views.treino = () => {
  if (state.active) return activeView();
  const ws = state.plan.workouts;
  const nw = nextWorkout();
  return `
    <div class="card">
      <div class="row between"><h2>Meu plano</h2><button class="link" data-act="profile">⚙️ Ajustar</button></div>
      <p class="muted small">Objetivo: <b>${esc(state.profile.objetivo)}</b> · ${state.profile.dias}x por semana · nível ${esc(state.profile.nivel)}
      ${state.plan.source === 'personalizado' ? ' · <span class="pill">editado por você</span>' : ''}</p>
    </div>
    ${ws.map((w) => `
      <div class="card ${nw && w.id === nw.id ? 'accent' : ''}">
        <div class="row between"><h3>${esc(w.name)}</h3>${nw && w.id === nw.id ? '<span class="pill ok">próximo</span>' : ''}</div>
        <ul class="list small" style="margin:8px 0">
          ${w.exercises.map((e) => `<li class="row between"><span>${esc(e.name)}</span><span class="muted">${e.sets}× ${esc(e.reps)}${e.rest ? ` · ${e.rest}s` : ''}</span></li>`).join('')}
        </ul>
        <div class="row"><button class="btn" data-act="start" data-v="${w.id}">Começar</button>
        <button class="btn ghost" data-act="edit-workout" data-v="${w.id}">Editar</button></div>
      </div>`).join('')}
    <button class="btn ghost block" data-act="add-workout">+ Novo treino personalizado</button>
    <div class="card" style="margin-top:12px">
      <h3>Histórico</h3>
      ${historyHtml()}
    </div>
    <div class="card">
      <h3>Evolução de carga</h3>
      ${progressHtml()}
    </div>`;
};

function historyHtml() {
  const list = state.sessions.slice(-15).reverse();
  if (!list.length) return '<p class="muted small">Seus treinos concluídos aparecem aqui.</p>';
  return `<ul class="list">${list.map((s) => {
    const sets = s.exercises.reduce((n, e) => n + e.sets.filter((x) => x.done).length, 0);
    const vol = s.exercises.reduce((n, e) => n + e.sets.filter((x) => x.done).reduce((a, x) => a + (num(x.kg) || 0) * (num(x.reps) || 0), 0), 0);
    const min = s.end ? Math.round((s.end - s.start) / 60000) : 0;
    return `<li class="row between"><div><b>${esc(s.workoutName)}</b><div class="muted small">${fmtDate(todayKey(new Date(s.start)))} · ${min} min · ${sets} séries${vol ? ` · ${Math.round(vol)} kg de volume` : ''}</div></div>
      <button class="link" data-act="del-session" data-v="${s.id}">apagar</button></li>`;
  }).join('')}</ul>`;
}

function progressHtml() {
  const names = [...new Set(state.sessions.flatMap((s) => s.exercises.filter((e) => e.tipo === 'carga' && e.sets.some((x) => x.done && num(x.kg))).map((e) => e.name)))];
  if (!names.length) return '<p class="muted small">Depois de alguns treinos, você vê aqui a evolução da carga de cada exercício.</p>';
  const sel = state.ui.progressEx && names.includes(state.ui.progressEx) ? state.ui.progressEx : names[0];
  const pts = state.sessions.map((s) => {
    const e = s.exercises.find((x) => x.name === sel);
    if (!e) return null;
    const kgs = e.sets.filter((x) => x.done).map((x) => num(x.kg)).filter((v) => v != null);
    return kgs.length ? { y: Math.max(...kgs), label: fmtDate(todayKey(new Date(s.start))) } : null;
  }).filter(Boolean);
  return `<div class="field"><select data-act="progress-ex">${names.map((n) => `<option ${n === sel ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div>
    ${lineChart(pts, 'kg (maior carga do dia)')}`;
}

function activeView() {
  const s = state.active;
  const elapsed = Math.round((Date.now() - s.start) / 60000);
  const total = s.exercises.reduce((n, e) => n + e.sets.length, 0);
  const done = s.exercises.reduce((n, e) => n + e.sets.filter((x) => x.done).length, 0);
  return `
    <div class="card accent">
      <div class="row between"><div><h2 style="margin:0">${esc(s.workoutName)}</h2>
      <div class="muted small">${elapsed} min · ${done}/${total} séries</div></div>
      <button class="btn" data-act="finish">Finalizar</button></div>
    </div>
    ${s.exercises.map((e, ei) => {
      const prev = lastPerformance(e.name);
      const isCarga = e.tipo === 'carga';
      const c1 = isCarga ? 'kg' : (e.tipo === 'cardio' ? 'min' : 'seg');
      const c2 = isCarga ? 'reps' : (e.tipo === 'cardio' ? 'kcal / km' : 'obs');
      return `<div class="card ex">
        <div class="ex-head"><div><h3>${esc(e.name)}</h3>
          <div class="muted small">Meta: ${e.sets.length}× ${esc(e.reps)}${e.rest ? ` · descanso ${e.rest}s` : ''}</div>
          ${prev ? `<div class="muted small">Última vez: ${prev.sets.filter((x) => x.done).map((x) => isCarga ? `${x.kg || 0}kg×${x.reps || 0}` : `${x.kg || ''}${c1}`).join(', ')}</div>` : ''}
          ${e.notes ? `<div class="muted small">📝 ${esc(e.notes)}</div>` : ''}
        </div>
        <button class="link small" data-act="add-set" data-v="${ei}">+ série</button></div>
        <div class="sets">
          <div></div><div class="hdr">${c1}</div><div class="hdr">${c2}</div><div></div>
          ${e.sets.map((st, si) => {
            const pv = prev?.sets[si];
            return `<div class="n">${si + 1}</div>
              <input inputmode="decimal" data-set="${ei}.${si}.kg" value="${esc(st.kg)}" placeholder="${esc(pv?.kg ?? '')}" aria-label="${c1} série ${si + 1}">
              <input inputmode="${isCarga ? 'numeric' : 'text'}" data-set="${ei}.${si}.reps" value="${esc(st.reps)}" placeholder="${esc(pv?.reps ?? (isCarga ? String(e.reps).split('-')[0] : ''))}" aria-label="${c2} série ${si + 1}">
              <button class="check ${st.done ? 'done' : ''}" data-act="toggle-set" data-v="${ei}.${si}" aria-label="Concluir série ${si + 1}">✓</button>`;
          }).join('')}
        </div>
      </div>`;
    }).join('')}
    <button class="btn danger block" data-act="cancel-workout">Descartar treino</button>`;
}

views.dieta = () => {
  const key = state.ui.dietDay || todayKey();
  const log = dayLog(key);
  const meals = state.diet.meals;
  if (!meals.length) {
    return `<div class="card">
      <h2>Plano alimentar</h2>
      <p class="muted small">Cole aqui o texto do plano da sua nutricionista. Separe por refeição (ex.: “Café da manhã – 07:00”, “Almoço”, “Lanche da tarde”…). Depois você pode ajustar.</p>
      <textarea id="diet-raw" placeholder="Café da manhã (07:00)&#10;- 2 ovos mexidos&#10;- 1 fatia de pão integral&#10;- café sem açúcar&#10;&#10;Almoço (12:00)&#10;- 100g de arroz&#10;- 120g de frango&#10;- salada à vontade">${esc(state.diet.raw)}</textarea>
      <button class="btn block" style="margin-top:10px" data-act="save-diet">Salvar plano</button>
    </div>`;
  }
  return `
    <div class="card">
      <div class="row between">
        <button class="btn small ghost" data-act="diet-day" data-v="-1">‹</button>
        <b>${key === todayKey() ? 'Hoje' : fmtDate(key)}</b>
        <button class="btn small ghost" data-act="diet-day" data-v="1" ${key >= todayKey() ? 'disabled' : ''}>›</button>
      </div>
    </div>
    ${meals.map((m) => `
      <div class="card">
        <label class="meal-item" style="color:inherit;margin:0">
          <input type="checkbox" data-act="meal-check" data-v="${m.id}" ${log.checked[m.id] ? 'checked' : ''}>
          <div><h3>${esc(m.name)} ${m.time ? `<span class="muted small">· ${esc(m.time)}</span>` : ''}</h3>
          <ul class="meal-items">${m.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul></div>
        </label>
      </div>`).join('')}
    <div class="card">
      <div class="row between"><h3>Fora do plano</h3><button class="link" data-act="add-extra">+ adicionar</button></div>
      ${log.extras.length ? `<ul class="list">${log.extras.map((x, i) => `<li class="row between"><span>${esc(x.text)} <span class="muted small">${esc(x.time)}</span></span><button class="link" data-act="del-extra" data-v="${i}">remover</button></li>`).join('')}</ul>`
        : '<p class="muted small">Comeu algo diferente? Registre sem culpa — ajuda a IA (e a nutri) a entender sua rotina.</p>'}
    </div>
    <button class="btn ghost block" data-act="edit-diet">Editar plano alimentar</button>`;
};

views.manha = () => {
  const key = todayKey();
  const m = state.morning.find((x) => x.date === key) || {};
  const pts = state.morning.filter((x) => x.peso).sort((a, b) => a.date.localeCompare(b.date)).slice(-60).map((x) => ({ y: x.peso, label: fmtDate(x.date) }));
  const first = pts[0]?.y, last = pts[pts.length - 1]?.y;
  return `
    <div class="card">
      <h2>Registro da manhã</h2>
      <div class="grid2">
        <div class="field"><label>Peso (kg)</label><input id="m-peso" inputmode="decimal" value="${m.peso ?? ''}" placeholder="ex.: 82,4"></div>
        <div class="field"><label>Horas de sono</label><input id="m-sono" inputmode="decimal" value="${m.sono ?? ''}" placeholder="ex.: 7"></div>
      </div>
      <div class="field"><label>Disposição (1 a 5)</label>
        <select id="m-disp">${['', 1, 2, 3, 4, 5].map((v) => `<option value="${v}" ${String(m.disposicao ?? '') === String(v) ? 'selected' : ''}>${v === '' ? '—' : v + ['', ' 😫', ' 😕', ' 😐', ' 🙂', ' 💪'][v]}</option>`).join('')}</select></div>
      <div class="field"><label>Observação</label><input id="m-nota" value="${esc(m.nota ?? '')}" placeholder="opcional"></div>
      <button class="btn block" data-act="save-morning">${m.date ? 'Atualizar' : 'Salvar'}</button>
    </div>
    <div class="card">
      <div class="row between"><h3>Peso</h3>${pts.length > 1 ? `<span class="pill ${last < first ? 'ok' : ''}">${(last - first > 0 ? '+' : '') + (last - first).toFixed(1)} kg</span>` : ''}</div>
      ${lineChart(pts, 'kg')}
    </div>
    <div class="card">
      <h3>Últimos registros</h3>
      ${state.morning.length ? `<ul class="list small">${state.morning.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10).map((x) => `<li class="row between"><span>${fmtDate(x.date)}</span><span class="muted">${x.peso ?? '—'} kg · ${x.sono ?? '—'}h · ${x.disposicao ?? '—'}/5</span></li>`).join('')}</ul>` : '<p class="muted small">Nenhum registro ainda.</p>'}
    </div>`;
};

views.mais = () => `
  <div class="card">
    <div class="row between"><h3>⌚ Atividades extras</h3><button class="link" data-act="add-activity">+ adicionar</button></div>
    <p class="muted small">Por enquanto o registro é manual. Na próxima versão, as atividades do Amazfit entram automaticamente (via Health Connect ou Strava).</p>
    ${state.activities.length ? `<ul class="list">${state.activities.slice(-10).reverse().map((a) => activityLi({ ...a, fonte: fmtDate(a.date) + ' · ' + a.fonte })).join('')}</ul>` : ''}
  </div>
  <div class="card">
    <h3>🤖 Assistente IA</h3>
    <p class="muted small">Em breve: a IA vai olhar seus treinos, refeições, peso e atividades, e sugerir ajustes no treino (sem mexer no plano da sua nutricionista).</p>
  </div>
  <div class="card">
    <h3>💾 Backup dos dados</h3>
    <p class="muted small">Os dados ficam só neste celular. Faça um backup de vez em quando.</p>
    <div class="row wrap">
      <button class="btn ghost" data-act="export">Exportar</button>
      <button class="btn ghost" data-act="import">Importar</button>
    </div>
  </div>
  <div class="card">
    <h3>Perfil</h3>
    <button class="btn ghost block" data-act="profile">Ajustar objetivo e frequência</button>
  </div>
  <button class="btn danger block" data-act="reset">Apagar todos os dados</button>
  <p class="muted small" style="text-align:center;margin-top:16px">Treino &amp; Dieta · v1</p>`;

/* ---------------- Render ---------------- */

const TITLES = { hoje: 'Hoje', treino: 'Treino', dieta: 'Alimentação', manha: 'Manhã', mais: 'Mais' };

function render() {
  const tab = state.ui.tab;
  $('#title').textContent = state.active && tab === 'treino' ? 'Treinando' : TITLES[tab];
  $('#topdate').textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' });
  $('#view').innerHTML = views[tab]();
  document.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
}

function go(tab) { state.ui.tab = tab; save(); render(); window.scrollTo(0, 0); }

/* ---------------- Timer de descanso ---------------- */

const timer = { end: 0, total: 0, beeped: false, iv: null };

function startTimer(sec) {
  if (!sec) return;
  timer.total = sec; timer.end = Date.now() + sec * 1000; timer.beeped = false;
  $('#timer').classList.remove('hidden', 'over'); document.body.classList.add('timer-on');
  clearInterval(timer.iv); timer.iv = setInterval(tickTimer, 250); tickTimer();
}
function stopTimer() {
  clearInterval(timer.iv); timer.end = 0;
  $('#timer').classList.add('hidden'); document.body.classList.remove('timer-on');
}
function tickTimer() {
  const left = (timer.end - Date.now()) / 1000;
  $('#timer-text').textContent = (left < 0 ? '+' : '') + fmtClock(left);
  $('#timer-fill').style.width = Math.max(0, Math.min(100, (left / timer.total) * 100)) + '%';
  if (left <= 0 && !timer.beeped) {
    timer.beeped = true; $('#timer').classList.add('over'); beep();
  }
  if (left < -120) stopTimer();
}
let audioCtx;
function beep() {
  try { navigator.vibrate?.([300, 120, 300]); } catch {}
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.25, 0.5].forEach((t) => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(audioCtx.destination);
      g.gain.setValueAtTime(0.25, audioCtx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + t + 0.2);
      o.start(audioCtx.currentTime + t); o.stop(audioCtx.currentTime + t + 0.2);
    });
  } catch {}
}

/* Mantém a tela ligada durante o treino */
let wakeLock = null;
async function keepAwake(on) {
  try {
    if (on && 'wakeLock' in navigator && !wakeLock) wakeLock = await navigator.wakeLock.request('screen');
    if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch {}
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') { wakeLock = null; if (state.active) keepAwake(true); if (state.ui.tab === 'hoje' || state.ui.tab === 'manha') render(); }
});

/* ---------------- Modal ---------------- */

function modal(html, onSubmit) {
  const dlg = $('#modal');
  $('#modal-body').innerHTML = html;
  dlg.returnValue = '';
  dlg.showModal();
  const f = $('#modal-body');
  f.onsubmit = (ev) => {
    const btn = ev.submitter;
    if (btn && btn.value === 'ok' && onSubmit) {
      const r = onSubmit(f);
      if (r === false) { ev.preventDefault(); return; }
    }
  };
}
const actions = (ok = 'Salvar') => `<div class="modal-actions"><button class="btn ghost" value="cancel" formnovalidate>Cancelar</button><button class="btn" value="ok">${ok}</button></div>`;

/* ---------------- Ações ---------------- */

const A = {};

A.goto = (v) => go(v);

A.start = (id) => {
  const w = state.plan.workouts.find((x) => x.id === id);
  if (!w) return;
  state.active = {
    id: uid(), workoutId: w.id, workoutName: w.name, start: Date.now(),
    exercises: w.exercises.map((e) => ({
      name: e.name, tipo: e.tipo, reps: e.reps, rest: e.rest, notes: e.notes,
      sets: Array.from({ length: e.sets }, () => ({ kg: '', reps: '', done: false })),
    })),
  };
  save(); keepAwake(true); go('treino');
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
  const e = state.active.exercises[Number(v)];
  const l = e.sets[e.sets.length - 1];
  e.sets.push({ kg: l?.kg || '', reps: '', done: false });
  save(); render();
};

A.finish = () => {
  const s = state.active;
  const done = s.exercises.reduce((n, e) => n + e.sets.filter((x) => x.done).length, 0);
  if (!done && !confirm('Nenhuma série marcada. Finalizar mesmo assim?')) return;
  s.end = Date.now();
  s.exercises = s.exercises.filter((e) => e.sets.some((x) => x.done)).map((e) => ({ ...e, sets: e.sets.filter((x) => x.done) }));
  state.sessions.push(s); state.active = null;
  stopTimer(); keepAwake(false); save();
  const min = Math.round((s.end - s.start) / 60000);
  modal(`<h2>Treino concluído! 🎉</h2><p>${esc(s.workoutName)} · ${min} min · ${done} séries.</p><p class="muted small">Próximo: <b>${esc(nextWorkout()?.name || '')}</b></p><div class="modal-actions"><button class="btn" value="ok">Show!</button></div>`);
  render();
};

A['cancel-workout'] = () => {
  if (!confirm('Descartar este treino? O que foi preenchido será perdido.')) return;
  state.active = null; stopTimer(); keepAwake(false); save(); render();
};

A['del-session'] = (id) => {
  if (!confirm('Apagar este treino do histórico?')) return;
  state.sessions = state.sessions.filter((s) => s.id !== id); save(); render();
};

A['timer-add'] = (v) => { timer.end += Number(v) * 1000; timer.total = Math.max(timer.total, (timer.end - Date.now()) / 1000); if (timer.end > Date.now()) { timer.beeped = false; $('#timer').classList.remove('over'); } tickTimer(); };
A['timer-skip'] = () => stopTimer();

A.profile = () => {
  const p = state.profile;
  modal(`<h2>Seu perfil de treino</h2>
    <div class="field"><label>Objetivo</label><select name="objetivo"><option value="emagrecimento">Emagrecimento</option></select>
      <div class="muted small" style="margin-top:4px">Outros objetivos chegam com a IA.</div></div>
    <div class="grid2">
      <div class="field"><label>Dias por semana</label><select name="dias">${[2, 3, 4, 5, 6].map((d) => `<option ${d === p.dias ? 'selected' : ''}>${d}</option>`).join('')}</select></div>
      <div class="field"><label>Nível</label><select name="nivel">${[['iniciante', 'Iniciante'], ['intermediario', 'Intermediário'], ['avancado', 'Avançado']].map(([v, l]) => `<option value="${v}" ${v === p.nivel ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
    </div>
    <label class="row" style="color:inherit"><input type="checkbox" name="regen" style="width:auto" ${state.plan.source === 'personalizado' ? '' : 'checked'}> Gerar um plano novo com essas configurações</label>
    <p class="muted small">${state.plan.source === 'personalizado' ? '⚠️ Você editou seu plano. Gerar um novo substitui as edições.' : ''}</p>
    ${actions()}`, (f) => {
    p.objetivo = f.objetivo.value; p.dias = Number(f.dias.value); p.nivel = f.nivel.value;
    if (f.regen.checked) state.plan = generatePlan(p);
    save(); render();
  });
};

function exerciseEditor(e) {
  return `<div class="card" style="padding:10px;background:var(--card2)" data-ex="${e.id}">
    <div class="row"><input name="name" value="${esc(e.name)}" placeholder="Nome do exercício" required>
    <button type="button" class="btn small danger" data-act="ed-del-ex" data-v="${e.id}">✕</button></div>
    <div class="edit-ex">
      <div><label>Séries</label><input name="sets" inputmode="numeric" value="${e.sets}"></div>
      <div><label>Reps / tempo</label><input name="reps" value="${esc(e.reps)}"></div>
      <div><label>Descanso (s)</label><input name="rest" inputmode="numeric" value="${e.rest}"></div>
    </div>
    <div class="edit-ex" style="grid-template-columns:1fr 2fr">
      <div><label>Tipo</label><select name="tipo">${[['carga', 'Carga'], ['tempo', 'Tempo'], ['cardio', 'Cardio']].map(([v, l]) => `<option value="${v}" ${v === e.tipo ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div><label>Observação</label><input name="notes" value="${esc(e.notes)}" placeholder="ex.: banco no 4"></div>
    </div>
  </div>`;
}

function openWorkoutEditor(w, isNew) {
  modal(`<h2>${isNew ? 'Novo treino' : 'Editar treino'}</h2>
    <div class="field"><label>Nome</label><input name="wname" value="${esc(w.name)}" required></div>
    <div id="ed-list">${w.exercises.map(exerciseEditor).join('')}</div>
    <button type="button" class="btn ghost block" data-act="ed-add-ex">+ Exercício</button>
    ${isNew ? '' : `<button type="button" class="btn danger block" style="margin-top:8px" data-act="ed-del-workout" data-v="${w.id}">Excluir este treino</button>`}
    ${actions()}`, (f) => {
    w.name = f.wname.value.trim() || w.name;
    w.exercises = [...f.querySelectorAll('[data-ex]')].map((el) => ({
      id: el.dataset.ex,
      name: el.querySelector('[name=name]').value.trim(),
      sets: Math.max(1, parseInt(el.querySelector('[name=sets]').value, 10) || 1),
      reps: el.querySelector('[name=reps]').value.trim() || '10',
      rest: Math.max(0, parseInt(el.querySelector('[name=rest]').value, 10) || 0),
      tipo: el.querySelector('[name=tipo]').value,
      notes: el.querySelector('[name=notes]').value.trim(),
    })).filter((e) => e.name);
    if (isNew) state.plan.workouts.push(w);
    state.plan.source = 'personalizado';
    save(); render();
  });
}

A['edit-workout'] = (id) => {
  const w = state.plan.workouts.find((x) => x.id === id);
  if (w) openWorkoutEditor(w, false);
};
A['add-workout'] = () => openWorkoutEditor({ id: uid(), name: `Treino ${String.fromCharCode(65 + state.plan.workouts.length)}`, exercises: [] }, true);
A['ed-add-ex'] = () => {
  $('#ed-list').insertAdjacentHTML('beforeend', exerciseEditor({ id: uid(), name: '', sets: 3, reps: '12', rest: 60, tipo: 'carga', notes: '' }));
  $('#ed-list').lastElementChild.querySelector('input').focus({ preventScroll: false });
};
A['ed-del-ex'] = (id) => $(`[data-ex="${id}"]`)?.remove();
A['ed-del-workout'] = (id) => {
  if (!confirm('Excluir este treino do plano?')) return;
  state.plan.workouts = state.plan.workouts.filter((w) => w.id !== id);
  state.plan.source = 'personalizado';
  $('#modal').close(); save(); render();
};

A['progress-ex'] = (v) => { state.ui.progressEx = v; save(); render(); };

/* Dieta */
A['save-diet'] = () => {
  const raw = $('#diet-raw').value.trim();
  if (!raw) return alert('Cole o texto do plano primeiro.');
  const meals = parseDiet(raw);
  state.diet = { raw, meals };
  save(); render();
  modal(`<h2>Plano salvo ✅</h2><p>Encontrei <b>${meals.length}</b> refeição(ões): ${meals.map((m) => esc(m.name)).join(', ')}.</p>
    <p class="muted small">Se alguma ficou errada, toque em “Editar plano alimentar” e ajuste o texto: cada refeição deve começar numa linha própria (ex.: “Lanche da tarde – 16h”).</p>
    <div class="modal-actions"><button class="btn" value="ok">Ok</button></div>`);
};
A['edit-diet'] = () => {
  modal(`<h2>Editar plano alimentar</h2>
    <p class="muted small">Cada refeição numa linha própria, seguida dos alimentos.</p>
    <textarea name="raw" style="min-height:300px">${esc(state.diet.raw)}</textarea>
    ${actions()}`, (f) => {
    const raw = f.raw.value.trim();
    const old = state.diet.meals;
    const meals = parseDiet(raw);
    meals.forEach((m) => { const o = old.find((x) => x.name === m.name); if (o) m.id = o.id; });
    state.diet = { raw, meals };
    save(); render();
  });
};
A['meal-check'] = (id, el) => {
  const log = dayLog(state.ui.dietDay || todayKey());
  if (el.checked) log.checked[id] = Date.now(); else delete log.checked[id];
  save();
};
A['diet-day'] = (v) => {
  const cur = state.ui.dietDay || todayKey();
  const [y, m, d] = cur.split('-').map(Number);
  const nd = todayKey(new Date(y, m - 1, d + Number(v)));
  state.ui.dietDay = nd > todayKey() ? todayKey() : nd;
  render();
};
A['add-extra'] = () => {
  modal(`<h2>Comi fora do plano</h2>
    <div class="field"><label>O que foi?</label><input name="text" placeholder="ex.: 1 pastel de queijo e um refri" required autofocus></div>
    ${actions('Adicionar')}`, (f) => {
    const t = f.text.value.trim(); if (!t) return false;
    dayLog(state.ui.dietDay || todayKey()).extras.push({ text: t, time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) });
    save(); render();
  });
};
A['del-extra'] = (i) => { dayLog(state.ui.dietDay || todayKey()).extras.splice(Number(i), 1); save(); render(); };

/* Manhã */
A['save-morning'] = () => {
  const key = todayKey();
  const rec = {
    date: key, peso: num($('#m-peso').value), sono: num($('#m-sono').value),
    disposicao: num($('#m-disp').value), nota: $('#m-nota').value.trim(),
  };
  if (rec.peso == null && rec.sono == null && rec.disposicao == null) return alert('Preencha pelo menos o peso.');
  state.morning = state.morning.filter((x) => x.date !== key).concat(rec);
  save(); render();
};

/* Atividades */
A['add-activity'] = () => {
  modal(`<h2>Atividade extra</h2>
    <div class="field"><label>Tipo</label><input name="tipo" list="act-list" placeholder="Caminhada" required>
      <datalist id="act-list"><option>Caminhada</option><option>Corrida</option><option>Bicicleta</option><option>Futebol</option><option>Natação</option><option>Escada</option></datalist></div>
    <div class="grid2">
      <div class="field"><label>Minutos</label><input name="minutos" inputmode="numeric"></div>
      <div class="field"><label>Calorias (kcal)</label><input name="kcal" inputmode="numeric" placeholder="do relógio"></div>
    </div>
    <div class="grid2">
      <div class="field"><label>Passos</label><input name="passos" inputmode="numeric"></div>
      <div class="field"><label>Data</label><input name="date" type="date" value="${todayKey()}" max="${todayKey()}"></div>
    </div>
    ${actions('Adicionar')}`, (f) => {
    const tipo = f.tipo.value.trim(); if (!tipo) return false;
    state.activities.push({ id: uid(), tipo, minutos: num(f.minutos.value), kcal: num(f.kcal.value), passos: num(f.passos.value), date: f.date.value || todayKey(), fonte: 'manual' });
    save(); render();
  });
};
A['del-activity'] = (id) => { state.activities = state.activities.filter((a) => a.id !== id); save(); render(); };

/* Backup */
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
      if (!data || !data.plan || !Array.isArray(data.sessions)) throw new Error('arquivo não parece um backup deste app');
      if (!confirm('Substituir os dados atuais pelo backup?')) return;
      state = Object.assign(defaultState(), data); save(); render();
    } catch (e) { alert('Não consegui importar: ' + e.message); }
  };
  inp.click();
};
A.reset = () => {
  if (!confirm('Apagar TODOS os dados deste app? Isso não pode ser desfeito.')) return;
  if (!confirm('Tem certeza mesmo? Faça um backup antes se quiser guardar.')) return;
  state = defaultState(); stopTimer(); save(); render();
};

/* ---------------- Eventos ---------------- */

document.addEventListener('click', (ev) => {
  const tabBtn = ev.target.closest('[data-tab]');
  if (tabBtn) return go(tabBtn.dataset.tab);
  const el = ev.target.closest('[data-act]');
  if (!el || el.tagName === 'SELECT' || el.type === 'checkbox') return;
  const fn = A[el.dataset.act];
  if (fn) { ev.preventDefault(); fn(el.dataset.v, el); }
});

document.addEventListener('change', (ev) => {
  const el = ev.target;
  if (el.matches('select[data-act], input[type=checkbox][data-act]')) {
    const fn = A[el.dataset.act];
    if (fn) fn(el.type === 'checkbox' ? el.dataset.v : el.value, el);
  }
});

/* Salva carga/reps enquanto digita, sem redesenhar a tela */
document.addEventListener('input', (ev) => {
  const el = ev.target;
  if (!el.dataset.set || !state.active) return;
  const [ei, si, field] = el.dataset.set.split('.');
  state.active.exercises[+ei].sets[+si][field] = el.value.trim();
  save();
});

/* ---------------- Início ---------------- */

if (state.active) keepAwake(true);
render();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
