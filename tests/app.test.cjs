const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
let browser, server, base;
const root = path.resolve(__dirname, '..');

before(async () => {
  server = http.createServer((request, response) => {
    const name = new URL(request.url, 'http://localhost').pathname.split('/').pop() || 'index.html';
    if (!['index.html','app.js','program.js','sw.js','manifest.json','icon-192.png','icon-512.png','icon-maskable-512.png'].includes(name)) { response.writeHead(404).end(); return; }
    const type = name.endsWith('.js') ? 'application/javascript' : name.endsWith('.json') ? 'application/json' : name.endsWith('.png') ? 'image/png' : 'text/html';
    response.writeHead(200, {'Content-Type':type, 'Cache-Control':'no-cache'});
    fs.createReadStream(path.join(root, name)).pipe(response);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}/`;
  browser = await chromium.launch({headless:true, channel:'chromium', ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? {executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH} : {})});
});
after(async () => { await browser?.close(); await new Promise(resolve => server?.close(resolve)); });

async function open(t, stored = {}, options = {}) {
  const context = await browser.newContext({viewport:{width:390,height:844}, timezoneId:'Europe/Paris', serviceWorkers:'block', ...options});
  t.after(() => context.close());
  const page = await context.newPage();
  await page.clock.install({time:new Date('2026-11-11T12:00:00Z')});
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.addInitScript(data => {
    if (!sessionStorage.getItem('test-seeded')) {
      for (const [key, value] of Object.entries(data)) localStorage.setItem(key, JSON.stringify(value));
      sessionStorage.setItem('test-seeded','1');
    }
  }, stored);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base);
  await page.waitForSelector('.ex');
  t.after(() => assert.deepEqual(errors, [], 'No unhandled browser errors'));
  return page;
}
const card = (page, id) => page.locator(`.ex[data-id="${id}"]`);
async function day(page, key) { await page.locator(`#plan [data-day="${key}"]`).click(); }
async function validate(page, id, index = 0) {
  await card(page,id).locator('.dot').nth(index).click();
  if (await page.locator('#timer').evaluate(element => element.classList.contains('show'))) await page.locator('#tSkip').click();
}
const read = (page, key) => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);

// These exercise user flows and migration rather than merely checking data declarations.
test('Six short sessions, correct daily choice, known weights and unknown weights', async t => {
  const page = await open(t);
  assert.match(await page.locator('#plan h2').innerText(), /Mercredi · Jambes A/);
  assert.equal(await page.locator('#chips .chip').count(), 6);
  for (const [key, sets] of [['mass_push_a',10],['mass_pull_a',9],['mass_legs_a',10],['mass_push_b',10],['mass_pull_b',9],['mass_legs_b',10]]) {
    await day(page,key);
    assert.equal(await page.locator('.ex').count(),4);
    assert.equal(await page.locator('.dot').count(),sets);
  }
  await day(page,'mass_push_a');
  for (const [id, kg] of [['mass_flat','10'],['mass_press','5'],['mass_lateral','7']]) assert.equal(await card(page,id).locator('[data-v="kg"]').inputValue(),kg);
  assert.match(await card(page,'mass_flat').locator('.load-summary').innerText(), /2 × 10 kg = 20 kg/);
  assert.equal(await card(page,'mass_triceps').locator('[data-v="kg"]').inputValue(),'');
  await validate(page,'mass_triceps');
  assert.equal(await page.locator('#finishBtn').isDisabled(),true);
  assert.equal(await read(page,'fitlog:current'),null);
  await day(page,'mass_push_b');
  assert.equal(await card(page,'mass_incline').locator('[data-v="kg"]').inputValue(),'');
});

test('Actual reps per set, fractional kg, paired volume and drafts survive navigation and reload', async t => {
  const page = await open(t);
  await day(page,'mass_push_a');
  await validate(page,'mass_flat',0);
  await card(page,'mass_flat').locator('[data-v="reps"]').fill('11');
  await validate(page,'mass_flat',1);
  await card(page,'mass_flat').locator('[data-a="kg+"]').click();
  await validate(page,'mass_flat',2);
  let draft = await read(page,'fitlog:current');
  assert.deepEqual(draft.done.mass_flat,[{kg:10,reps:12},{kg:10,reps:11},{kg:10.5,reps:11}]);
  assert.equal(await page.locator('#liveVol').innerText(),'691');
  await day(page,'mass_pull_a');
  await card(page,'mass_row').locator('[data-v="kg"]').fill('12.5');
  await validate(page,'mass_row');
  assert.equal(await page.locator('#liveVol').innerText(),'200'); // 12.5 kg × 8 reps × 2 arms
  await day(page,'mass_push_a');
  await page.reload(); await page.waitForSelector('.ex');
  assert.equal(await card(page,'mass_flat').locator('.dot.on').count(),3);
  assert.equal(await card(page,'mass_flat').locator('[data-v="kg"]').inputValue(),'10.5');
  assert.equal(await page.locator('[data-mode="20"]').isDisabled(),true);
  await page.locator('#finishBtn').click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('fitlog:sessions') || '[]').length === 1);
  const [session] = await read(page,'fitlog:sessions');
  assert.equal(session.volume,691); assert.equal(session.partial,true);
  const drafts = await read(page,'fitlog:drafts');
  assert.ok(drafts.mass_pull_a); assert.equal(drafts.mass_push_a,undefined);
  await page.locator('nav [data-tab="prog"]').click();
  await page.locator('#sessionList .log').click();
  assert.match(await page.locator('#sessionList .details').innerText(), /10 kg × 12/);
});

test('20-minute adaptation and bodyweight lunges can be saved at zero external volume', async t => {
  const page = await open(t);
  await page.locator('[data-mode="20"]').click();
  await page.locator('#rampToggle').click();
  await page.locator('#legVariant').selectOption('lunge');
  assert.equal(await page.locator('.ex').count(),3);
  assert.equal(await page.locator('.dot').count(),6);
  await card(page,'mass_lunge').locator('[data-v="kg"]').fill('0');
  await validate(page,'mass_lunge');
  assert.equal(await page.locator('#liveVol').innerText(),'0');
  assert.equal(await page.locator('#finishBtn').isEnabled(),true);
  assert.equal(await page.locator('#legVariant').isDisabled(),true);
  await page.locator('#finishBtn').click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('fitlog:sessions') || '[]').length === 1);
  assert.equal((await read(page,'fitlog:sessions'))[0].volume,0);
});

test('Old history, weights, weigh-ins and unfinished sessions are preserved without converting kg', async t => {
  const oldSession = {id:1,date:'2026-08-01',key:'pushA',name:'Push A',exercises:[{id:'dc_hlt_f',name:'Développé couché haltères',sets:[{kg:20,reps:12}]}],volume:240};
  const oldCurrent = {date:'2026-11-10',key:'pushA',done:{dc_hlt_f:[{kg:20,reps:12}]}};
  const weights = {date:'2026-08-01',kg:75};
  const page = await open(t, {'fitlog:state':{weights:{dc_hlt_f:{kg:20,reps:12}}},'fitlog:sessions':[oldSession],'fitlog:bodyweight':[weights],'fitlog:current':oldCurrent,'fitlog:days':{'2026-08-01':true}});
  assert.match(await page.locator('#plan h2').innerText(), /Ancien programme/);
  assert.equal(await card(page,'dc_hlt_f').locator('.dot.on').count(),1);
  assert.equal(await card(page,'dc_hlt_f').locator('[data-v="kg"]').inputValue(),'20');
  await day(page,'mass_push_a');
  assert.equal(await card(page,'mass_flat').locator('[data-v="kg"]').inputValue(),'10');
  await page.locator('#chips .chip').filter({hasText:'À terminer'}).click();
  await page.locator('#finishBtn').click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('fitlog:sessions') || '[]').length === 2);
  const history = await read(page,'fitlog:sessions');
  assert.deepEqual(history[1],oldSession); assert.equal(history[0].volume,240);
  assert.deepEqual(await read(page,'fitlog:bodyweight'),[weights]);
  assert.equal((await read(page,'fitlog:state')).weights.dc_hlt_f.kg,20);
});

test('85 kg goal uses actual seven-calendar-day average, not the last seven weigh-ins', async t => {
  const bodyweight = [{date:'2026-10-01',kg:90},{date:'2026-11-04',kg:90},{date:'2026-11-05',kg:75},{date:'2026-11-11',kg:77}];
  const page = await open(t, {'fitlog:bodyweight':bodyweight});
  await page.locator('nav [data-tab="weight"]').click();
  assert.match(await page.locator('#v-weight').innerText(), /Objectif 85 kg/);
  assert.match(await page.locator('#wAvg').innerText(), /76.0/);
  assert.match(await page.locator('#wGoalTxt').innerText(), /9.0 kg/);
  assert.equal(await page.locator('#wBar').evaluate(element => element.style.width),'10%');
  await page.locator('#wInput').fill('86'); await page.locator('#wAdd').click();
  assert.match(await page.locator('#wGoalTxt').innerText(), /Objectif atteint|4.5 kg/);
});

test('Local dates and Sunday recovery follow the device calendar', async t => {
  const page = await open(t);
  await page.clock.setSystemTime(new Date('2026-11-11T23:30:00Z'));
  await page.reload(); await page.waitForSelector('.ex');
  assert.match(await page.locator('#plan h2').innerText(), /Jeudi/);
  await day(page,'mass_push_a'); await validate(page,'mass_flat');
  assert.equal((await read(page,'fitlog:current')).date,'2026-11-12');
  // A fresh context has no unfinished workout to resume on Sunday.
  const sunday = await open(t);
  await sunday.clock.setSystemTime(new Date('2026-11-15T12:00:00Z'));
  await sunday.reload(); await sunday.waitForSelector('.ex');
  assert.match(await sunday.locator('#plan').innerText(), /Aujourd’hui : repos/);
});

test('Rest and session clocks catch up after time passes in the background', async t => {
  const page = await open(t);
  await day(page,'mass_push_a');
  await card(page,'mass_flat').locator('.dot').first().click();
  assert.equal(await page.locator('#ringNum').innerText(),'1:30');
  await page.clock.fastForward(120000);
  await page.clock.runFor(1000);
  assert.equal(await page.locator('#timer').evaluate(element=>element.classList.contains('show')),false);
  assert.match(await page.locator('#elapsed').innerText(), /2:0[01]/);
  await page.clock.fastForward(29*60000);
  assert.match(await page.locator('#clockLabel').innerText(), /Créneau atteint/);
});

test('Every workout opens its matching five-minute bodyweight warm-up, including repeated launches', async t => {
  const page = await open(t);
  for (const [key, names] of [
    ['mass_push_a',['Marche active sur place','Cercles de bras','Pompes contre un mur','Développé épaules sans poids']],
    ['mass_push_b',['Marche active sur place','Cercles de bras','Pompes contre un mur','Développé épaules sans poids']],
    ['mass_pull_a',['Marche active sur place','Roulements d’épaules','Rowing sans poids','Oiseau sans poids']],
    ['mass_pull_b',['Marche active sur place','Roulements d’épaules','Rowing sans poids','Oiseau sans poids']],
    ['mass_legs_a',['Marche active sur place','Squats sans charge','Bascule des hanches','Montées sur la pointe des pieds']],
    ['mass_legs_b',['Marche active sur place','Squats sans charge','Bascule des hanches','Montées sur la pointe des pieds']]
  ]) {
    await day(page,key);
    await page.locator('#startWorkout').click();
    assert.equal(await page.locator('#ringNum').innerText(),'5:00');
    assert.deepEqual(await page.locator('#warmupSteps li > span:first-child').allTextContents(),names.map((name,index)=>`${index+1}. ${name}`));
    assert.equal(await page.locator('#warmupStepTitle').innerText(),names[0]);
    assert.match(await page.locator('#timerHint').innerText(),/sans haltères/);
    assert.equal(await page.locator('#tPlus').isVisible(),false);
    await page.locator('#tSkip').click();
  }
  await page.locator('#startWorkout').click();
  assert.equal(await page.locator('#ringNum').innerText(),'5:00');
  assert.equal(await page.locator('#warmupStepTitle').innerText(),'Marche active sur place');
});

test('Warm-up advances automatically, catches up in the background and resets on reopening', async t => {
  const page = await open(t);
  await day(page,'mass_push_a');
  await page.locator('#startWorkout').click();
  await page.clock.fastForward(120000); await page.clock.runFor(300);
  assert.equal(await page.locator('#warmupStepTitle').innerText(),'Cercles de bras');
  assert.match(await page.locator('#warmupStepCue').innerText(),/Change de sens après 30 secondes/);
  assert.equal(await page.locator('#warmupSteps [aria-current="step"]').count(),1);
  await page.clock.fastForward(60000); await page.clock.runFor(300);
  assert.equal(await page.locator('#warmupStepTitle').innerText(),'Pompes contre un mur');
  assert.match(await page.locator('#warmupStepCue').innerText(),/8 à 12 répétitions/);
  await page.clock.fastForward(60000); await page.clock.runFor(300);
  assert.equal(await page.locator('#warmupStepTitle').innerText(),'Développé épaules sans poids');
  await page.locator('#tSkip').click();
  await page.locator('#startWorkout').click();
  assert.equal(await page.locator('#ringNum').innerText(),'5:00');
  assert.match(await page.locator('#warmupCount').innerText(),/Mouvement 1 \/ 4/);
  await page.clock.fastForward(300000); await page.clock.runFor(1000);
  assert.equal(await page.locator('#timer').evaluate(element=>element.classList.contains('show')),false);
  assert.equal((await read(page,'fitlog:sessions'))?.length || 0,0);
  // Starting a work set restores the usual rest timer and its controls.
  await card(page,'mass_flat').locator('.dot').first().click();
  assert.equal(await page.locator('#timerLabel').textContent(),'Repos');
  assert.equal(await page.locator('#warmupGuide').isVisible(),false);
  assert.equal(await page.locator('#tPlus').isVisible(),true);
  assert.equal(await page.locator('#tSkip').innerText(),'Passer');
  assert.equal(await page.locator('#ringNum').innerText(),'1:30');
});

test('Warm-up remains readable and can be closed on a small screen with keyboard navigation', async t => {
  const page = await open(t, {}, {viewport:{width:320,height:568}});
  await page.locator('#startWorkout').click();
  assert.ok(await page.locator('#timer').evaluate(element=>element.scrollWidth<=element.clientWidth));
  await page.keyboard.press('Tab');
  assert.equal(await page.locator('#tSkip').evaluate(element=>element===document.activeElement),true);
  await page.locator('#tSkip').click();
  assert.equal(await page.locator('#timer').evaluate(element=>element.classList.contains('show')),false);
});

test('Progression hint follows a complete top-of-range workout; historical units stay explicit', async t => {
  const session = {id:1,date:'2026-11-10',key:'mass_push_a',name:'Pectoraux A',exercises:[{id:'mass_flat',name:'Développé couché haltères',load:'pair',sets:Array.from({length:4},()=>({kg:10,reps:12}))}],volume:960};
  const page = await open(t, {'fitlog:sessions':[session]});
  await day(page,'mass_push_a');
  assert.match(await card(page,'mass_flat').locator('.progress-hint').innerText(), /technique.*2 répétitions/);
  await page.locator('nav [data-tab="prog"]').click();
  assert.match(await page.locator('#chartUnit').innerText(), /kg \/ haltère/);
});

test('Narrow mobile layout and all navigation views render without horizontal overflow', async t => {
  const page = await open(t, {}, {viewport:{width:320,height:740}});
  await day(page,'mass_push_a');
  for (const tab of ['workout','cal','prog','weight']) {
    await page.locator(`nav [data-tab="${tab}"]`).click();
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth), `No overflow on ${tab}`);
  }
});

test('PWA caches new script files and opens offline', async t => {
  const page = await open(t, {}, {serviceWorkers:'allow'});
  await page.evaluate(()=>navigator.serviceWorker.ready);
  await page.reload(); await page.waitForSelector('.ex');
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await page.context().setOffline(true);
  await page.reload(); await page.waitForSelector('.ex');
  assert.equal(await page.locator('#chips .chip').count(),6);
  assert.match(await page.locator('#plan h2').innerText(), /Jambes A/);
  await page.locator('#startWorkout').click();
  assert.equal(await page.locator('#warmupStepTitle').innerText(),'Marche active sur place');
  assert.match(await page.locator('#warmupSteps').innerText(), /Squats sans charge/);
});
