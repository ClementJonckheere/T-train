/* ---------- Stockage persistant ---------- */
const mem = {};
const hasWS = (() => { try { return !!window.storage?.get; } catch { return false; } })();
function storageWarning() {
  if (document.querySelector('.storage-warning')) return;
  const warning = document.createElement('div');
  warning.className = 'storage-warning';
  warning.setAttribute('role', 'alert');
  warning.textContent = 'Sauvegarde indisponible : tes données ne seront pas conservées après fermeture. Exporte-les depuis Progression.';
  document.querySelector('header').after(warning);
}
const Store = {
  async get(k) {
    if (hasWS) { try { const r = await window.storage.get(k); return r ? JSON.parse(r.value) : null; } catch {} }
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : (mem[k] ?? null); } catch { storageWarning(); return mem[k] ?? null; }
  },
  async set(k, v) {
    mem[k] = v;
    if (hasWS) { try { await window.storage.set(k, JSON.stringify(v)); return; } catch {} }
    try { localStorage.setItem(k, JSON.stringify(v)); } catch { storageWarning(); }
  }
};
const K_STATE = 'fitlog:state', K_SESS = 'fitlog:sessions', K_BW = 'fitlog:bodyweight', K_CUR = 'fitlog:current', K_DAYS = 'fitlog:days', K_DRAFTS = 'fitlog:drafts';
let state = {weights:{}}, sessions = [], bodyweight = [], current = null, trainedDays = {}, drafts = {};
let selKey = PROGRAM[0].key, saving = false;
const $ = s => document.querySelector(s);
const todayISO = (date = new Date()) => isoOf(date.getFullYear(), date.getMonth(), date.getDate());
const fmtDate = iso => new Date(iso + 'T00:00:00').toLocaleDateString('fr-FR', {weekday:'short', day:'numeric', month:'short'});
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const fmtKg = kg => Number(kg).toLocaleString('fr-FR', {maximumFractionDigits:2});
function exById(id) { return [...Object.values(EXERCISES), ...LEGACY_PROGRAM.flatMap(s => s.ex)].find(e => e.id === id); }
function sessByKey(key) { return [...PROGRAM, ...LEGACY_PROGRAM].find(s => s.key === key); }
function isLegacy(s) { return !s.day; }
function getW(ex) {
  const w = state.weights[ex.id] || {};
  return {kg:Object.hasOwn(w, 'kg') ? w.kg : ex.kg, reps:w.reps ?? ex.reps ?? ex.rep[0]};
}
async function setW(id, kg, reps) { state.weights[id] = {kg,reps}; await Store.set(K_STATE, state); }
function unitLabel(ex) { return ex.load === 'pair' ? 'kg / haltère' : ex.load === 'single' ? 'kg · 1 haltère' : ex.load === 'machine' ? 'kg sur accessoire' : 'kg · ancienne saisie'; }
function loadSummary(ex, kg) {
  if (kg == null) return 'Charge à régler avant de valider une série.';
  if (ex.load === 'pair') return `2 × ${fmtKg(kg)} kg = ${fmtKg(kg * 2)} kg au total${ex.sides === 2 ? ' · répétitions par jambe' : ''}`;
  if (ex.load === 'single') return `1 haltère de ${fmtKg(kg)} kg${ex.sides === 2 ? ' · répétitions par bras' : ''}`;
  return `${fmtKg(kg)} kg${ex.load === 'machine' ? ' sur l’accessoire' : ' · unité historique inchangée'}`;
}
function volumeFactor(ex) { return (ex.load === 'pair' ? 2 : 1) * (ex.sides || 1); }
function sessionExercises(s) {
  if (isLegacy(s)) return s.ex;
  const draft = drafts[s.key];
  const mode = draft?.mode ?? state.mode ?? 30;
  const ramp = draft?.ramp ?? state.ramp ?? false;
  const variant = draft?.legVariant ?? state.legVariant ?? 'extension';
  return s.ex.map(ex => ex.id === EXERCISES.extension.id && variant === 'lunge' ? EXERCISES.lunge : ex)
    .filter((ex, i) => mode !== 20 || i < 3 || draft?.done?.[ex.id]?.some(Boolean))
    .map(ex => ({...ex, sets:ramp ? Math.min(2, ex.sets) : ex.sets}));
}
async function persistCurrent() {
  if (current) drafts[current.key] = current;
  await Store.set(K_DRAFTS, drafts);
  await Store.set(K_CUR, current);
}
async function boot() {
  state = await Store.get(K_STATE) || {weights:{}};
  state.weights ||= {};
  sessions = await Store.get(K_SESS) || [];
  bodyweight = await Store.get(K_BW) || [];
  trainedDays = await Store.get(K_DAYS) || {};
  drafts = await Store.get(K_DRAFTS) || {};
  const oldCurrent = await Store.get(K_CUR);
  // Preserve an unfinished old session, even from another date. Never convert old kg values.
  if (oldCurrent && sessByKey(oldCurrent.key) && !drafts[oldCurrent.key]) {
    drafts[oldCurrent.key] = oldCurrent;
    await Store.set(K_DRAFTS, drafts);
  }
  const today = PROGRAM.find(s => s.day === new Date().getDay());
  selKey = oldCurrent && sessByKey(oldCurrent.key) ? oldCurrent.key : today?.key || PROGRAM[0].key;
  current = drafts[selKey] || null;
  $('#dateLabel').textContent = new Date().toLocaleDateString('fr-FR', {weekday:'long', day:'numeric', month:'short'});
  renderChips(); renderWorkout();
  setInterval(updateClock, 1000);
}
function switchSession(key) {
  if (!sessByKey(key)) return;
  selKey = key;
  current = drafts[key] || null;
  Store.set(K_CUR, current);
  renderChips(); renderWorkout();
}
function renderChips() {
  const choices = [...PROGRAM, ...LEGACY_PROGRAM.filter(s => drafts[s.key])];
  $('#chips').innerHTML = '';
  choices.forEach(s => {
    const button = document.createElement('button');
    button.className = 'chip' + (s.key === selKey ? ' on' : '');
    button.setAttribute('aria-pressed', s.key === selKey);
    button.innerHTML = `${s.name}<span class="tag">${isLegacy(s) ? 'À terminer' : s.tag}${drafts[s.key] ? ' · en cours' : ''}</span>`;
    button.onclick = () => switchSession(s.key);
    $('#chips').appendChild(button);
  });
}
function ensureCurrent() {
  if (!current) {
    current = {date:todayISO(), key:selKey, done:{}, startedAt:Date.now(), mode:state.mode || 30, ramp:!!state.ramp, legVariant:state.legVariant || 'extension'};
    drafts[selKey] = current;
    renderChips();
  }
  current.startedAt ||= Date.now();
}
function renderPlan(s) {
  const today = new Date().getDay();
  const mode = current?.mode ?? state.mode ?? 30;
  const ramp = current?.ramp ?? state.ramp ?? false;
  const legacy = isLegacy(s);
  $('#plan').innerHTML = `
    <div class="eyebrow">${legacy ? 'Séance conservée' : 'Prise de masse · 75 → 85 kg'}</div>
    <h2>${legacy ? 'Ancien programme' : s.tag + ' · ' + s.name}</h2>
    <p>${legacy ? 'Tu peux terminer cette ancienne séance. Ses charges et son historique gardent leur unité d’origine.' : s.focus}</p>
    <div class="week">${PROGRAM.map(day => `<button data-day="${day.key}" class="${day.key === selKey ? 'on ' : ''}${day.day === today ? 'today' : ''}" aria-label="${day.tag} : ${day.name}">${day.tag.slice(0,3)}<b>${day.day === 1 || day.day === 4 ? 'Pecs' : day.day === 2 || day.day === 5 ? 'Dos' : 'Jambes'}</b></button>`).join('')}<button disabled class="${today === 0 ? 'today' : ''}">Dim<b>Repos</b></button></div>
    ${today === 0 ? '<p>Aujourd’hui : repos. Prochaine séance prévue lundi. Tu peux consulter tes exercices ci-dessous.</p>' : ''}
    ${!legacy ? `<p>4 min d’échauffement · environ ${mode === 20 ? '20 min, 3 exercices' : '25–30 min, 4 exercices'}. Garde environ 2 répétitions possibles en fin de série.</p>
    <p>Charges affichées <b>par haltère</b> pour les mouvements à deux haltères. Départ interprété : couché 2 × 10 kg, épaules 2 × 5 kg, élévations 2 × 7 kg. Corrige directement si besoin.</p>
    <div class="plan-controls"><button class="small-btn ${mode === 20 ? 'on' : ''}" data-mode="20" ${current ? 'disabled' : ''}>20 min</button><button class="small-btn ${mode === 30 ? 'on' : ''}" data-mode="30" ${current ? 'disabled' : ''}>30 min</button><button class="small-btn ${ramp ? 'on' : ''}" id="rampToggle" aria-pressed="${ramp}" ${current ? 'disabled' : ''}>Reprise · 2 séries ${ramp ? '✓' : ''}</button></div>
    <p>${ramp ? 'Premières 2 semaines : 2 séries par exercice, avec 3 répétitions encore possibles.' : 'En reprise ? Active « 2 séries » pendant les deux premières semaines.'}</p>
    ${s.day === 3 || s.day === 6 ? `<label class="ex-meta">Accessoire jambes<select id="legVariant" ${current ? 'disabled' : ''}><option value="extension">Extension sur l’accessoire du banc</option><option value="lunge">Fentes arrière (sans accessoire)</option></select></label>` : ''}` : ''}
    ${current && current.date !== todayISO() ? `<p>Séance commencée le ${fmtDate(current.date)} : tes séries ont été conservées.</p>` : ''}
    <div class="session-clock" id="sessionClock"><span id="clockLabel">Durée · échauffement et repos inclus</span><b class="tabular" id="elapsed">0:00</b></div>
    <div class="plan-controls"><button class="small-btn" id="startWorkout">${current ? 'Échauffement · 4 min' : 'Commencer · échauffement 4 min'}</button></div>
    <p id="setProgress"></p>`;
  $('#plan').querySelectorAll('[data-day]').forEach(button => button.onclick = () => switchSession(button.dataset.day));
  $('#plan').querySelectorAll('[data-mode]').forEach(button => button.onclick = async () => { state.mode = Number(button.dataset.mode); await Store.set(K_STATE, state); renderWorkout(); });
  if ($('#rampToggle')) $('#rampToggle').onclick = async () => { state.ramp = !state.ramp; await Store.set(K_STATE, state); renderWorkout(); };
  if ($('#legVariant')) {
    $('#legVariant').value = current?.legVariant ?? state.legVariant ?? 'extension';
    $('#legVariant').onchange = async event => { state.legVariant = event.target.value; await Store.set(K_STATE, state); renderWorkout(); };
  }
  $('#startWorkout').onclick = () => { ensureCurrent(); persistCurrent(); renderChips(); renderWorkout(); startTimer(240, 'Échauffement', 'Mobilise les articulations puis fais 1 à 2 séries légères du premier exercice.'); };
}
function latestPerformance(id) {
  for (const session of sessions) { const ex = session.exercises.find(e => e.id === id); if (ex) return {session, ex}; }
  return null;
}
function renderWorkout() {
  const s = sessByKey(selKey);
  renderPlan(s);
  const wrap = $('#exercises'); wrap.innerHTML = '';
  sessionExercises(s).forEach(ex => {
    const w = getW(ex), doneSets = current?.done?.[ex.id] || [];
    const card = document.createElement('div'); card.className = 'ex'; card.dataset.id = ex.id;
    const previous = latestPerformance(ex.id);
    const ready = previous && previous.ex.sets.length >= ex.sets && previous.ex.sets.every(set => set.reps >= ex.rep[1]) && new Set(previous.ex.sets.map(set => set.kg)).size === 1;
    card.innerHTML = `
      <div class="ex-top"><div class="ex-name">${ex.n}</div><div class="ex-target">${ex.sets} × ${ex.rep[0]}–${ex.rep[1]}${ex.sides ? ' / côté' : ''}</div></div>
      <div class="ex-meta">Repos ${ex.rest} s${ex.sides ? ' après les deux côtés' : ''} · environ 2 répétitions en réserve</div>
      ${ex.note ? `<div class="ex-meta">${ex.note}</div>` : ''}
      <div class="steppers">
        <div class="stepper"><div class="lab">Charge</div><div class="ctl"><button data-a="kg-" aria-label="Diminuer la charge : ${ex.n}">−</button><div><input data-v="kg" aria-label="Charge : ${ex.n}" type="number" inputmode="decimal" min="0" max="300" step="0.5" placeholder="—" value="${w.kg ?? ''}"><div class="unit">${unitLabel(ex)}</div></div><button data-a="kg+" aria-label="Augmenter la charge : ${ex.n}">+</button></div></div>
        <div class="stepper"><div class="lab">Reps${ex.sides ? ' / côté' : ''}</div><div class="ctl"><button data-a="r-" aria-label="Diminuer les répétitions : ${ex.n}">−</button><div><input data-v="reps" aria-label="Répétitions : ${ex.n}" type="number" inputmode="numeric" min="1" max="100" step="1" value="${w.reps}"><div class="unit">reps</div></div><button data-a="r+" aria-label="Augmenter les répétitions : ${ex.n}">+</button></div></div>
      </div>
      <div class="load-summary ${w.kg == null ? 'pending' : ''}">${loadSummary(ex, w.kg)}</div>
      <div class="sets"></div>
      ${previous ? `<div class="last-performance">Dernière fois (${fmtDate(previous.session.date)}) : ${previous.ex.sets.map(set => `${fmtKg(set.kg)} kg × ${set.reps}`).join(' · ')}. ${unitLabel(ex)}.</div>` : ''}
      ${ready ? `<div class="progress-hint">Haut de fourchette atteint la dernière fois. Si la technique était propre avec 2 répétitions encore possibles, augmente du plus petit poids disponible.</div>` : ''}
      ${ex.cue ? `<details><summary>Technique et progression</summary><p>${ex.cue}</p><p>Ajoute des répétitions à charge égale jusqu’à ${ex.sets} × ${ex.rep[1]}, puis augmente légèrement la charge. Règle les répétitions réelles avant chaque validation. Pour corriger une série, décoche-la, ajuste puis revalide.</p></details>` : ''}`;
    const kgInput = card.querySelector('[data-v="kg"]'), repsInput = card.querySelector('[data-v="reps"]');
    const read = () => ({kg:kgInput.value === '' ? null : Number(kgInput.value), reps:Number(repsInput.value)});
    const valid = (values, requireWeight = false) => (values.kg === null ? !requireWeight : Number.isFinite(values.kg) && values.kg >= (ex.allowZero ? 0 : 0.01) && values.kg <= 300) && Number.isInteger(values.reps) && values.reps >= 1 && values.reps <= 100;
    const saveInputs = () => {
      const values = read();
      if (!valid(values)) { toast('Vérifie la charge et les répétitions'); return false; }
      setW(ex.id, values.kg, values.reps);
      card.querySelector('.load-summary').textContent = loadSummary(ex, values.kg);
      card.querySelector('.load-summary').classList.toggle('pending', values.kg === null);
      return true;
    };
    kgInput.onchange = saveInputs; repsInput.onchange = saveInputs;
    card.querySelectorAll('[data-a]').forEach(button => button.onclick = () => {
      const values = read();
      const action = button.dataset.a;
      if (action.startsWith('kg')) kgInput.value = Math.max(ex.allowZero ? 0 : 0.5, Math.min(300, Math.round(((values.kg || 0) + (action === 'kg+' ? 0.5 : -0.5)) * 100) / 100));
      else repsInput.value = Math.max(1, Math.min(100, (values.reps || 1) + (action === 'r+' ? 1 : -1)));
      saveInputs();
    });
    for (let i = 0; i < ex.sets; i++) {
      const button = document.createElement('button'); button.className = 'dot';
      const draw = () => {
        const set = current?.done?.[ex.id]?.[i];
        button.classList.toggle('on', !!set);
        button.setAttribute('aria-pressed', !!set);
        button.setAttribute('aria-label', `${ex.n}, série ${i + 1}${set ? ', validée' : ', à faire'}`);
        button.innerHTML = `<span class="n">SÉRIE ${i + 1}</span><span class="mark">${set ? `${fmtKg(set.kg)} kg × ${set.reps} ✓` : 'Valider'}</span>`;
      };
      draw();
      button.onclick = () => {
        const removing = current?.done?.[ex.id]?.[i];
        const values = read();
        if (!removing && !valid(values, true)) { toast('Règle une charge et des répétitions valides'); kgInput.focus(); return; }
        ensureCurrent();
        const sets = current.done[ex.id] ||= [];
        sets[i] = removing ? null : {kg:values.kg, reps:values.reps};
        if (!removing) setW(ex.id, values.kg, values.reps);
        persistCurrent(); draw(); updateLive();
        if (!removing && completedSets() < plannedSets()) startTimer(ex.rest, 'Repos', ex.sides ? 'Les deux côtés comptent pour une série.' : 'Récupère avant la prochaine série.');
      };
      card.querySelector('.sets').appendChild(button);
    }
    wrap.appendChild(card);
  });
  updateLive();
}
function completedSets(draft = current) { return Object.values(draft?.done || {}).reduce((sum, sets) => sum + sets.filter(Boolean).length, 0); }
function plannedSets() { return sessionExercises(sessByKey(selKey)).reduce((sum, ex) => sum + ex.sets, 0); }
function currentVolume() {
  if (!current) return 0;
  let volume = 0;
  for (const [id, sets] of Object.entries(current.done)) for (const set of sets) if (set) volume += set.kg * set.reps * volumeFactor(exById(id) || {});
  return Math.round(volume * 100) / 100;
}
function updateLive() {
  $('#liveVol').textContent = fmtKg(currentVolume());
  $('#finishBtn').disabled = saving || completedSets() === 0;
  $('#setProgress').textContent = `${completedSets()} / ${plannedSets()} séries validées${current ? ' · progression sauvegardée' : ''}`;
  $('#finishBtn').textContent = completedSets() && completedSets() < plannedSets() ? 'Enregistrer la séance partielle' : 'Terminer la séance';
  $('#plan').querySelectorAll('[data-mode], #rampToggle, #legVariant').forEach(control => control.disabled = !!current);
  $('#startWorkout').textContent = current ? 'Échauffement · 4 min' : 'Commencer · échauffement 4 min';
  updateClock();
}
function updateClock() {
  if (!$('#elapsed')) return;
  const elapsed = current?.startedAt ? Math.max(0, Math.floor((Date.now() - current.startedAt) / 1000)) : 0;
  $('#elapsed').textContent = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`;
  const reached = elapsed >= (current?.mode || state.mode || 30) * 60;
  $('#sessionClock').classList.toggle('over', reached);
  $('#clockLabel').textContent = reached ? 'Créneau atteint · tu peux enregistrer ta séance' : 'Durée · échauffement et repos inclus';
}
async function finishSession() {
  if (!current || !completedSets() || saving) return;
  saving = true; updateLive();
  const draft = current, s = sessByKey(draft.key);
  const exercises = Object.entries(draft.done).map(([id, values]) => {
    const ex = exById(id);
    return {id, name:ex?.n || id, load:ex?.load || 'legacy', sides:ex?.sides || 1, sets:values.filter(Boolean)};
  }).filter(ex => ex.sets.length);
  const entry = {id:Date.now(), date:draft.date, key:draft.key, name:s.name, exercises, volume:currentVolume(), durationSeconds:draft.startedAt ? Math.max(0, Math.floor((Date.now() - draft.startedAt) / 1000)) : null, partial:completedSets(draft) < plannedSets(), programVersion:isLegacy(s) ? 'legacy' : 'mass-v1'};
  sessions.unshift(entry);
  await Store.set(K_SESS, sessions);
  trainedDays[entry.date] = true; await Store.set(K_DAYS, trainedDays);
  delete drafts[draft.key];
  if (current === draft) current = null;
  await persistCurrent();
  saving = false; closeTimer();
  if (isLegacy(s)) switchSession(PROGRAM.find(day => day.day === new Date().getDay())?.key || PROGRAM[0].key);
  else { renderChips(); renderWorkout(); }
  toast('Séance enregistrée 💪');
}

/* ---------- Minuteur fondé sur l’heure réelle ---------- */
let tInt = null, tLeft = 0, tTotal = 0, tDeadline = 0, timerEnd = null, timerFocus = null, timerEnded = false;
const RING_LEN = 2 * Math.PI * 112;
$('#ring').setAttribute('stroke-dasharray', RING_LEN.toFixed(1));
function startTimer(seconds, label = 'Repos', hint = '') {
  clearInterval(tInt); clearTimeout(timerEnd);
  timerEnded = false;
  timerFocus = document.activeElement;
  tTotal = seconds; tLeft = seconds; tDeadline = Date.now() + seconds * 1000;
  $('#timerLabel').textContent = label; $('#timerHint').textContent = hint;
  $('#timer').classList.add('show'); $('#tSkip').focus(); drawTimer();
  tInt = setInterval(timerTick, 250);
}
function timerTick() {
  if (timerEnded) return;
  tLeft = Math.max(0, Math.ceil((tDeadline - Date.now()) / 1000));
  drawTimer();
  if (tLeft === 0) { clearInterval(tInt); timerDone(); }
}
function drawTimer() {
  $('#ringNum').textContent = `${Math.floor(tLeft / 60)}:${String(tLeft % 60).padStart(2, '0')}`;
  $('#ring').setAttribute('stroke-dashoffset', (RING_LEN * (1 - Math.min(1, tLeft / tTotal))).toFixed(1));
}
function timerDone() {
  timerEnded = true;
  try { navigator.vibrate?.([300,120,300]); } catch {}
  beep(); timerEnd = setTimeout(closeTimer, 700);
}
function closeTimer() {
  clearInterval(tInt); clearTimeout(timerEnd); $('#timer').classList.remove('show');
  if (timerFocus?.isConnected) timerFocus.focus();
}
let AC = null;
function beep() {
  try {
    AC ||= new (window.AudioContext || window.webkitAudioContext)();
    for (const offset of [0,180,360]) {
      const oscillator = AC.createOscillator(), gain = AC.createGain(), time = AC.currentTime + offset / 1000;
      oscillator.frequency.value = 880; oscillator.connect(gain); gain.connect(AC.destination);
      gain.gain.setValueAtTime(0.0001, time); gain.gain.exponentialRampToValueAtTime(0.4, time + 0.02); gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.14);
      oscillator.start(time); oscillator.stop(time + 0.16);
    }
  } catch {}
}
$('#tSkip').onclick = closeTimer;
function adjustTimer(seconds) { tDeadline = Math.max(Date.now(), tDeadline + seconds * 1000); tTotal = Math.max(tTotal, Math.ceil((tDeadline - Date.now()) / 1000)); timerTick(); }
$('#tPlus').onclick = () => adjustTimer(15);
$('#tMinus').onclick = () => adjustTimer(-15);
document.addEventListener('visibilitychange', () => { if (!document.hidden && $('#timer').classList.contains('show')) timerTick(); updateClock(); });
document.addEventListener('keydown', event => {
  if (!$('#timer').classList.contains('show')) return;
  if (event.key === 'Escape') closeTimer();
  if (event.key === 'Tab') {
    const buttons = [...$('#timer').querySelectorAll('button')];
    const index = buttons.indexOf(document.activeElement);
    event.preventDefault(); buttons[(index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus();
  }
});

/* ---------- VUE PROGRESSION ---------- */
function renderProg(){
  $("#pSessions").textContent=sessions.length;
  const weekAgo=new Date(); weekAgo.setDate(weekAgo.getDate()-6);
  const from=todayISO(weekAgo), through=todayISO();
  let wv=0; sessions.forEach(s=>{if(s.date>=from && s.date<=through)wv+=s.volume;});
  $("#pWeekVol").textContent=Math.round(wv).toLocaleString("fr-FR");

  // liste exercices ayant un historique
  const ids=new Set(); sessions.forEach(s=>s.exercises.forEach(e=>ids.add(e.id)));
  const pick=$("#exPick"); const prev=pick.value; pick.innerHTML="";
  if(ids.size===0){
    pick.innerHTML='<option>Aucune donnée</option>';
    $("#exChart").innerHTML='<div class="empty">Termine une séance pour voir ta progression.</div>';
  }else{
    [...ids].forEach(id=>{const e=exById(id); const o=document.createElement("option");
      const saved=sessions.flatMap(s=>s.exercises).find(x=>x.id===id);
      o.value=id; o.textContent=(e?.n || saved?.name || id)+(e?.load ? '' : ' · ancien programme'); pick.appendChild(o);});
    if([...ids].includes(prev))pick.value=prev;
    drawExChart(pick.value);
  }
  // liste séances
  const list=$("#sessionList");
  if(sessions.length===0){list.innerHTML='<div class="empty">Aucune séance enregistrée.</div>';return;}
  list.innerHTML="";
  sessions.slice(0,20).forEach(s=>{
    const row=document.createElement("div"); row.className="log";
    const det=s.exercises.map(e=>{
      const top=e.sets.reduce((a,b)=>Math.max(a,b.kg),0);
      const meta=exById(e.id) || {};
      return `${escapeHTML(e.name)} · ${e.sets.map(set=>`${fmtKg(set.kg)} kg × ${set.reps}`).join(' / ')} · ${unitLabel(meta)}`;}).join("<br>");
    const duration=s.durationSeconds==null?'':` · ${Math.floor(s.durationSeconds/60)} min`;
    row.innerHTML=`<div><div class="d">${escapeHTML(s.name)}</div><div class="s">${fmtDate(s.date)}${duration}${s.partial?' · partielle':''}</div></div>
      <div class="v">${s.volume.toLocaleString("fr-FR")}<div class="s" style="font-weight:400">kg</div></div>`;
    const dd=document.createElement("div"); dd.className="details"; dd.innerHTML=det;
    const box=document.createElement("div");
    box.appendChild(row); box.appendChild(dd);
    row.onclick=()=>dd.classList.toggle("open");
    list.appendChild(box);
  });
}
$("#exPick") && ($("#exPick").onchange=e=>drawExChart(e.target.value));

function drawExChart(id){
  $("#chartUnit").textContent='Charge de la meilleure série · '+unitLabel(exById(id)||{});
  // meilleure charge par date (croissant)
  const pts=[];
  [...sessions].reverse().forEach(s=>{
    const e=s.exercises.find(x=>x.id===id);
    if(e){const top=e.sets.reduce((a,b)=>Math.max(a,b.kg),0); pts.push({x:s.date,y:top});}
  });
  $("#exChart").innerHTML=lineChart(pts,"#FF5630","kg");
}

/* ---------- VUE POIDS ---------- */
function recentWeights(arr){
  const from=new Date(); from.setDate(from.getDate()-6);
  return arr.filter(entry=>entry.date>=todayISO(from) && entry.date<=todayISO());
}
function renderWeight(){
  const sorted=[...bodyweight].sort((a,b)=>a.date<b.date?-1:1);
  if(sorted.length){
    const last=sorted[sorted.length-1];
    $("#wCur").innerHTML=`${last.kg.toFixed(1)}<span class="u"> kg</span>`;
    const recent=recentWeights(sorted);
    const avg=recent.length?recent.reduce((sum,entry)=>sum+entry.kg,0)/recent.length:null;
    $("#wAvg").innerHTML=`${avg===null?'–':avg.toFixed(1)}<span class="u"> kg</span>`;
    const start=BODY_GOAL.start, goal=BODY_GOAL.target, cur=avg??last.kg;
    const pct=Math.max(0,Math.min(100,(cur-start)/(goal-start)*100));
    $("#wBar").style.width=pct+"%";
    $("#wGoalTxt").innerHTML=cur>=goal?`Objectif atteint · ${cur.toFixed(1)} kg`:`Reste <b>${(goal-cur).toFixed(1)} kg</b> · ${pct.toFixed(0)}% du chemin (${avg===null?'dernière pesée, plus de 7 jours':'moyenne des pesées des 7 derniers jours'})`;
  }else{
    $("#wCur").innerHTML='–<span class="u"> kg</span>';
    $("#wAvg").innerHTML='–<span class="u"> kg</span>';
    $("#wGoalTxt").textContent="Ajoute ta première pesée pour lancer le suivi.";
    $("#wBar").style.width="0%";
  }
  // graphique avec ligne d'objectif
  const pts=sorted.map(e=>({x:e.date,y:e.kg}));
  $("#wChart").innerHTML=lineChart(pts,"#35D0BA","kg",BODY_GOAL.target);
  // historique
  const list=$("#wList");
  if(sorted.length===0){list.innerHTML='<div class="empty">Aucune pesée.</div>';return;}
  list.innerHTML="";
  [...sorted].reverse().forEach(e=>{
    const row=document.createElement("div"); row.className="log";
    row.innerHTML=`<div><div class="d tabular">${e.kg.toFixed(1)} kg</div><div class="s">${fmtDate(e.date)}</div></div>`;
    const del=document.createElement("button"); del.className="del"; del.textContent="Supprimer";
    del.onclick=async()=>{bodyweight=bodyweight.filter(x=>!(x.date===e.date&&x.kg===e.kg)); await Store.set(K_BW,bodyweight); renderWeight();};
    row.appendChild(del); list.appendChild(row);
  });
}
$("#wAdd").onclick=async()=>{
  const v=parseFloat($("#wInput").value);
  if(!Number.isFinite(v)||v<30||v>200){toast("Entre un poids valide"); return;}
  const d=todayISO();
  bodyweight=bodyweight.filter(x=>x.date!==d); // une pesée par jour
  bodyweight.push({date:d,kg:Math.round(v*10)/10});
  await Store.set(K_BW,bodyweight);
  $("#wInput").value=""; renderWeight(); toast("Pesée ajoutée");
};

/* ---------- Graphe linéaire SVG ---------- */
function lineChart(pts,color,unit,goal){
  const W=460,H=170,pad=30;
  if(pts.length===0)return '<div class="empty">Pas encore de données.</div>';
  const ys=pts.map(p=>p.y).concat(goal?[goal]:[]);
  let min=Math.min(...ys), max=Math.max(...ys);
  if(min===max){min-=2;max+=2;} const rng=max-min;
  const x=i=>pad+(pts.length===1?(W-2*pad)/2:i*(W-2*pad)/(pts.length-1));
  const y=v=>H-pad-((v-min)/rng)*(H-2*pad);
  let path="",dots="";
  pts.forEach((p,i)=>{path+=(i?"L":"M")+x(i).toFixed(1)+" "+y(p.y).toFixed(1)+" ";
    dots+=`<circle cx="${x(i).toFixed(1)}" cy="${y(p.y).toFixed(1)}" r="3.5" fill="${color}"/>`;});
  let goalLine="";
  if(goal!==undefined && goal>=min && goal<=max){
    const gy=y(goal).toFixed(1);
    goalLine=`<line x1="${pad}" y1="${gy}" x2="${W-pad}" y2="${gy}" stroke="#FF5630" stroke-width="1.5" stroke-dasharray="4 4"/>
      <text x="${W-pad}" y="${gy-5}" fill="#FF5630" font-size="11" text-anchor="end">objectif ${goal}</text>`;
  }
  const lastLbl=`<text x="${x(pts.length-1).toFixed(1)}" y="${(y(pts[pts.length-1].y)-9).toFixed(1)}" fill="${color}" font-size="12" font-weight="700" text-anchor="middle">${pts[pts.length-1].y}${unit}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block">
    <text x="${pad}" y="14" fill="#8A94A6" font-size="11">${max.toFixed(0)}</text>
    <text x="${pad}" y="${H-pad+14}" fill="#8A94A6" font-size="11">${min.toFixed(0)}</text>
    ${goalLine}
    <path d="${path}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${dots}${lastLbl}</svg>`;
}

/* ---------- VUE CALENDRIER ---------- */
let calY, calM;
function isoOf(y,m,d){return y+"-"+String(m+1).padStart(2,"0")+"-"+String(d).padStart(2,"0");}
function renderCal(){
  const now=new Date();
  if(calY===undefined){calY=now.getFullYear(); calM=now.getMonth();}
  const first=new Date(calY,calM,1);
  const dow=(first.getDay()+6)%7;                 // lundi = 0
  const nDays=new Date(calY,calM+1,0).getDate();
  $("#calTitle").textContent=first.toLocaleDateString("fr-FR",{month:"long",year:"numeric"});
  $("#calDow").innerHTML=["L","M","M","J","V","S","D"].map(n=>`<div class="cal-dow">${n}</div>`).join("");
  const todayIso=todayISO();
  let cells="";
  for(let i=0;i<dow;i++)cells+='<div class="cal-cell empty"></div>';
  for(let d=1;d<=nDays;d++){
    const iso=isoOf(calY,calM,d);
    const on=!!trainedDays[iso], isToday=iso===todayIso, future=iso>todayIso;
    cells+=`<div class="cal-cell${on?" on":""}${isToday?" today":""}${future?" future":""}" data-iso="${iso}">${d}</div>`;
  }
  $("#calGrid").innerHTML=cells;
  $("#calGrid").querySelectorAll("[data-iso]").forEach(c=>c.onclick=()=>toggleDay(c.dataset.iso));
  // stats
  const all=Object.keys(trainedDays).filter(k=>trainedDays[k]).sort();
  const pref=calY+"-"+String(calM+1).padStart(2,"0");
  $("#cMonth").textContent=all.filter(k=>k.startsWith(pref)).length;
  if(all.length){
    const firstD=new Date(all[0]+"T00:00:00");
    const daysSince=Math.max(1,Math.round((new Date(todayIso+"T00:00:00")-firstD)/864e5)+1);
    const weeks=Math.max(1,daysSince/7);
    $("#cFreq").textContent=(all.length/weeks).toFixed(1);
    const last=new Date(all[all.length-1]+"T00:00:00");
    const ago=Math.round((new Date(todayIso+"T00:00:00")-last)/864e5);
    const agoTxt=ago<=0?"aujourd'hui":(ago===1?"hier":"il y a "+ago+" jours");
    $("#calSince").textContent=all.length+" séance"+(all.length>1?"s":"")+" au total · depuis "+daysSince+" jours · dernière : "+agoTxt;
  }else{
    $("#cFreq").textContent="–";
    $("#calSince").textContent="Aucune séance cochée pour l'instant.";
  }
}
function toggleDay(iso){
  if(iso>todayISO())return;                        // pas de jour futur
  if(trainedDays[iso])delete trainedDays[iso]; else trainedDays[iso]=true;
  Store.set(K_DAYS,trainedDays); renderCal();
}
$("#calPrev").onclick=()=>{calM--; if(calM<0){calM=11;calY--;} renderCal();};
$("#calNext").onclick=()=>{calM++; if(calM>11){calM=0;calY++;} renderCal();};

/* ---------- Navigation ---------- */
const views={workout:"v-workout",cal:"v-cal",prog:"v-prog",weight:"v-weight"};
const titles={workout:["Séance du jour","Séance"],cal:["Assiduité","Calendrier"],prog:["Suivi","Progression"],weight:["Corps","Poids"]};
document.querySelectorAll("nav button").forEach(b=>{
  b.onclick=()=>{
    const t=b.dataset.tab;
    document.querySelectorAll("nav button").forEach(x=>x.classList.remove("on"));
    b.classList.add("on");
    Object.values(views).forEach(v=>$("#"+v).classList.remove("on"));
    $("#"+views[t]).classList.add("on");
    $("#eyebrow").textContent=titles[t][0]; $("#pageTitle").textContent=titles[t][1];
    if(t==="cal")renderCal();
    if(t==="prog")renderProg();
    if(t==="weight")renderWeight();
  };
});
$("#finishBtn").onclick=finishSession;
$("#exportData").onclick=async()=>{
  const data={version:1,exportedAt:new Date().toISOString(),state,sessions,bodyweight,trainedDays,drafts};
  const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
  const link=document.createElement('a'); link.href=url; link.download=`seance-sauvegarde-${todayISO()}.json`;
  document.body.appendChild(link); link.click(); link.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000);
};

function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"),1800);}

if('serviceWorker' in navigator){
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
}
boot();
