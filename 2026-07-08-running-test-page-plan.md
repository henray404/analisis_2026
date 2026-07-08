# Running Test Page + UI Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a colorful, better-spaced UI to the existing Match page, plus a new "Running Test" page (reachable via a navbar) that logs individual practice runs against the competition's chat-report template, with cumulative KFM/total-permainan stats and its own Reset All.

**Architecture:** Single static `index.html` + `app.js`, no build step, no framework (matches existing project). `app.js` gains a parallel `RunningTest` state shape and pure helper functions (sequence builder, ratio counters, `m : s` time formatter, template formatter, log-run reducer) alongside the existing Match-page functions. `index.html` gains a sticky navbar toggling between two view containers (`#view-match`, `#view-running-test`), a second `localStorage` draft key for Running Test, and a large mirrored form for the Running Test template fields.

**Tech Stack:** Vanilla JS (ES5-style, matches existing `app.js`), plain CSS in `<style>`, `node:test` + `node:assert/strict` for unit tests (existing `tests/app.test.js`), no npm dependencies.

## Global Constraints

- No build step, no framework, no new dependencies — plain HTML/CSS/JS only (established by `2026-07-05-robot-match-logger-design.md`).
- All pure logic goes in `app.js` and is unit-tested; DOM wiring in `index.html`'s inline `<script>` is not unit-tested (no DOM test harness in this repo) — verified manually instead, same as the existing Match page code.
- Tap targets stay ≥44px min-height/min-width (existing `button` CSS rule, unchanged).
- Match page keeps its "one-shot, no cross-match history" behavior (`2026-07-05` spec) — only Running Test accumulates history.
- Reset All is destructive → always behind `confirm()`, scoped to the page it's on (Match's Reset All never touches Running Test state and vice versa — approved design decision).
- Time-of-day fields on Running Test (`waktu ambil staf`, `waktu assembly`, etc.) reuse the Match page's "shared stopwatch + Catat-to-stamp" interaction pattern (one shared Run Timer per Running Test run, each field's Catat button stamps the Run Timer's current elapsed value) — this mirrors the Match page's `.robot-card`/`.stat-row` structure exactly, per the approved spec's "mirror Match page structure" instruction.

---

## Task 1: `app.js` — sequence-builder pure functions

**Files:**
- Modify: `app.js` (add functions before the `RobotLog` export object; add exports)
- Test: `tests/app.test.js` (append tests)

**Interfaces:**
- Produces: `appendSequenceSlot(seq: string[], slot: string) -> string[]`, `undoSequenceSlot(seq: string[]) -> string[]`, `clearSequence() -> string[]`, `formatSequence(seq: string[]) -> string`

- [ ] **Step 1: Write the failing tests**

Append to `tests/app.test.js`:

```js
test('appendSequenceSlot appends a slot to the end', () => {
  assert.deepEqual(RobotLog.appendSequenceSlot([], 'tengah'), ['tengah']);
  assert.deepEqual(RobotLog.appendSequenceSlot(['tengah'], 'kanan'), ['tengah', 'kanan']);
});

test('undoSequenceSlot removes the last slot', () => {
  assert.deepEqual(RobotLog.undoSequenceSlot(['tengah', 'kanan']), ['tengah']);
  assert.deepEqual(RobotLog.undoSequenceSlot([]), []);
});

test('clearSequence returns an empty array', () => {
  assert.deepEqual(RobotLog.clearSequence(), []);
});

test('formatSequence joins slots with comma-space', () => {
  assert.equal(RobotLog.formatSequence(['tengah', 'kanan', 'kiri']), 'tengah, kanan, kiri');
  assert.equal(RobotLog.formatSequence([]), '');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/app.test.js`
Expected: FAIL — `RobotLog.appendSequenceSlot is not a function` (and similarly for the other three).

- [ ] **Step 3: Implement**

In `app.js`, add these functions above the `var RobotLog = {` line:

```js
  function appendSequenceSlot(seq, slot) {
    return seq.concat([slot]);
  }

  function undoSequenceSlot(seq) {
    return seq.slice(0, -1);
  }

  function clearSequence() {
    return [];
  }

  function formatSequence(seq) {
    return seq.join(', ');
  }
```

Add to the `RobotLog` export object:

```js
    appendSequenceSlot: appendSequenceSlot,
    undoSequenceSlot: undoSequenceSlot,
    clearSequence: clearSequence,
    formatSequence: formatSequence,
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/app.test.js`
Expected: PASS, all 4 new tests plus existing 37.

- [ ] **Step 5: Commit**

```bash
git add app.js tests/app.test.js
git commit -m "feat: add sequence-builder helpers for running-test rak ordering"
```

---

## Task 2: `app.js` — ratio (success/fail) pure functions

**Files:**
- Modify: `app.js`
- Test: `tests/app.test.js`

**Interfaces:**
- Consumes: none
- Produces: `recordSuccess(ratio: {terambil:number,total:number}) -> {terambil,total}`, `recordFail(ratio) -> {terambil,total}`, `formatRatio(ratio) -> string`

- [ ] **Step 1: Write the failing tests**

```js
test('recordSuccess increments both terambil and total', () => {
  assert.deepEqual(RobotLog.recordSuccess({ terambil: 2, total: 3 }), { terambil: 3, total: 4 });
});

test('recordFail increments only total', () => {
  assert.deepEqual(RobotLog.recordFail({ terambil: 2, total: 3 }), { terambil: 2, total: 4 });
});

test('formatRatio formats as "terambil / total"', () => {
  assert.equal(RobotLog.formatRatio({ terambil: 2, total: 5 }), '2 / 5');
  assert.equal(RobotLog.formatRatio({ terambil: 0, total: 0 }), '0 / 0');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/app.test.js`
Expected: FAIL — `RobotLog.recordSuccess is not a function`.

- [ ] **Step 3: Implement**

```js
  function recordSuccess(ratio) {
    return { terambil: ratio.terambil + 1, total: ratio.total + 1 };
  }

  function recordFail(ratio) {
    return { terambil: ratio.terambil, total: ratio.total + 1 };
  }

  function formatRatio(ratio) {
    return ratio.terambil + ' / ' + ratio.total;
  }
```

Add to exports: `recordSuccess: recordSuccess, recordFail: recordFail, formatRatio: formatRatio,`

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/app.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app.js tests/app.test.js
git commit -m "feat: add ratio counter helpers for running-test success/fail stats"
```

---

## Task 3: `app.js` — `formatMenitDetik`

**Files:**
- Modify: `app.js`
- Test: `tests/app.test.js`

**Interfaces:**
- Produces: `formatMenitDetik(totalSeconds: number) -> string` (formats as `"m : s"`, matching the template's `[menit] : [detik]` fields — distinct from the existing `formatMatchTime`, which produces `mm.ss.cs`)

- [ ] **Step 1: Write the failing tests**

```js
test('formatMenitDetik formats seconds as "m : s"', () => {
  assert.equal(RobotLog.formatMenitDetik(0), '0 : 0');
  assert.equal(RobotLog.formatMenitDetik(65), '1 : 5');
  assert.equal(RobotLog.formatMenitDetik(125), '2 : 5');
});

test('formatMenitDetik truncates fractional seconds', () => {
  assert.equal(RobotLog.formatMenitDetik(65.9), '1 : 5');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/app.test.js`
Expected: FAIL — `RobotLog.formatMenitDetik is not a function`.

- [ ] **Step 3: Implement**

```js
  function formatMenitDetik(totalSeconds) {
    var total = Math.floor(totalSeconds);
    var m = Math.floor(total / 60);
    var s = total % 60;
    return m + ' : ' + s;
  }
```

Add to exports: `formatMenitDetik: formatMenitDetik,`

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/app.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app.js tests/app.test.js
git commit -m "feat: add formatMenitDetik time formatter for running-test fields"
```

---

## Task 4: `app.js` — `createRunningTestRun` / `createRunningTestState`

**Files:**
- Modify: `app.js`
- Test: `tests/app.test.js`

**Interfaces:**
- Produces: `createRunningTestRun() -> RunObject`, `createRunningTestState() -> RunningTestState`
- `RunObject` shape (single test run's live-tracked fields):
  ```
  {
    r1: {
      staf: {terambil:0,total:0}, waktuStaf:0, waktuAssembly:0,
      storageSpear:0, storageKfs:0, waktuMasukArena:0, kesusahanIndex:'',
      waktuForestArena:0, urutanRak:[], waktuTaruhRak:0, waktuRetryZona3:0,
      tusukRow:'', deltaAngkatR2:0
    },
    r2: {
      spearhead: {terambil:0,total:0}, seringIndexSpearhead:'', waktuSpearhead:0,
      storageKfs:0, waktuForest:0, deltaForest:0, seringErrorIndex:'',
      waktuMasukArena:0, urutanRak:[], waktuTaruhRak:0
    }
  }
  ```
- `RunningTestState` shape: `{universitas:'', namaTim:'', dominan:null, totalPermainan:0, kfmCount:0, runTimer:{running:false,startedAt:null,elapsedMs:0}, run:RunObject, log:[]}`

- [ ] **Step 1: Write the failing test**

```js
test('createRunningTestState returns the expected shape', () => {
  const state = RobotLog.createRunningTestState();
  assert.deepEqual(state, {
    universitas: '', namaTim: '', dominan: null,
    totalPermainan: 0, kfmCount: 0,
    runTimer: { running: false, startedAt: null, elapsedMs: 0 },
    run: {
      r1: {
        staf: { terambil: 0, total: 0 }, waktuStaf: 0, waktuAssembly: 0,
        storageSpear: 0, storageKfs: 0, waktuMasukArena: 0, kesusahanIndex: '',
        waktuForestArena: 0, urutanRak: [], waktuTaruhRak: 0, waktuRetryZona3: 0,
        tusukRow: '', deltaAngkatR2: 0
      },
      r2: {
        spearhead: { terambil: 0, total: 0 }, seringIndexSpearhead: '', waktuSpearhead: 0,
        storageKfs: 0, waktuForest: 0, deltaForest: 0, seringErrorIndex: '',
        waktuMasukArena: 0, urutanRak: [], waktuTaruhRak: 0
      }
    },
    log: []
  });
});

test('createRunningTestRun returns a fresh run object matching state.run', () => {
  assert.deepEqual(RobotLog.createRunningTestRun(), RobotLog.createRunningTestState().run);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/app.test.js`
Expected: FAIL — `RobotLog.createRunningTestState is not a function`.

- [ ] **Step 3: Implement**

```js
  function createRunningTestRun() {
    return {
      r1: {
        staf: { terambil: 0, total: 0 },
        waktuStaf: 0,
        waktuAssembly: 0,
        storageSpear: 0,
        storageKfs: 0,
        waktuMasukArena: 0,
        kesusahanIndex: '',
        waktuForestArena: 0,
        urutanRak: [],
        waktuTaruhRak: 0,
        waktuRetryZona3: 0,
        tusukRow: '',
        deltaAngkatR2: 0
      },
      r2: {
        spearhead: { terambil: 0, total: 0 },
        seringIndexSpearhead: '',
        waktuSpearhead: 0,
        storageKfs: 0,
        waktuForest: 0,
        deltaForest: 0,
        seringErrorIndex: '',
        waktuMasukArena: 0,
        urutanRak: [],
        waktuTaruhRak: 0
      }
    };
  }

  function createRunningTestState() {
    return {
      universitas: '',
      namaTim: '',
      dominan: null,
      totalPermainan: 0,
      kfmCount: 0,
      runTimer: { running: false, startedAt: null, elapsedMs: 0 },
      run: createRunningTestRun(),
      log: []
    };
  }
```

Add to exports: `createRunningTestRun: createRunningTestRun, createRunningTestState: createRunningTestState,`

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/app.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app.js tests/app.test.js
git commit -m "feat: add running-test state shape factories"
```

---

## Task 5: `app.js` — `formatRunningTestEntry` (template formatter)

**Files:**
- Modify: `app.js`
- Test: `tests/app.test.js`

**Interfaces:**
- Consumes: `RunningTestState` (Task 4), `formatRatio` (Task 2), `formatSequence` (Task 1), `formatMenitDetik` (Task 3)
- Produces: `formatRunningTestEntry(rt: RunningTestState) -> string` — exact template text for one logged run, using `rt.totalPermainan`/`rt.kfmCount` as they stand at call time (caller is responsible for bumping them first — see Task 6).

- [ ] **Step 1: Write the failing tests**

```js
test('formatRunningTestEntry produces the exact template with real values substituted', () => {
  const rt = RobotLog.createRunningTestState();
  rt.universitas = 'ITS';
  rt.namaTim = 'Garuda';
  rt.dominan = 'biru';
  rt.totalPermainan = 4;
  rt.kfmCount = 1;
  rt.run.r1.staf = { terambil: 3, total: 5 };
  rt.run.r1.waktuStaf = 65;
  rt.run.r1.waktuAssembly = 40;
  rt.run.r1.storageSpear = 2;
  rt.run.r1.storageKfs = 3;
  rt.run.r1.waktuMasukArena = 20;
  rt.run.r1.kesusahanIndex = '3 dan 4';
  rt.run.r1.waktuForestArena = 15;
  rt.run.r1.urutanRak = ['tengah', 'kanan', 'kiri'];
  rt.run.r1.waktuTaruhRak = 10;
  rt.run.r1.waktuRetryZona3 = 8;
  rt.run.r1.tusukRow = 'row 1 dan 2';
  rt.run.r1.deltaAngkatR2 = 5;
  rt.run.r2.spearhead = { terambil: 2, total: 3 };
  rt.run.r2.seringIndexSpearhead = 'index 2';
  rt.run.r2.waktuSpearhead = 12;
  rt.run.r2.storageKfs = 1;
  rt.run.r2.waktuForest = 18;
  rt.run.r2.deltaForest = 3;
  rt.run.r2.seringErrorIndex = 'index 5';
  rt.run.r2.waktuMasukArena = 22;
  rt.run.r2.urutanRak = ['tengah', 'kanan', 'kiri', 'atas'];
  rt.run.r2.waktuTaruhRak = 9;

  const expected = [
    'ITS, Garuda',
    'Persentase KFM: 1 / 4',
    'Dominan di lapangan: Biru',
    'R1:',
    'keberhasilan ambil staf: 3 / 5',
    'waktu ambil staf: 1 : 5',
    'waktu assembly: 0 : 40',
    '',
    'storage spear: 2 spear',
    'storage kfs: 3 kotak',
    'waktu masuk arena: 0 : 20',
    'kesusahan ambil kfs di index: 3 dan 4',
    '',
    'waktu perjalanan forest-arena: 0 : 15',
    'urutan taruh kfs di rak: tengah, kanan, kiri',
    'waktu taruh kfs di rak: 0 : 10',
    'waktu perjalanan retry zona 3 ke rak: 0 : 8',
    'bisa tusuk row apa saja: row 1 dan 2',
    'delta waktu angkat R2: 5',
    '',
    'R2:',
    'keberhasilan ambil spearhead: 2 / 3',
    'sering ambil spearhead di index: index 2',
    'waktu ambil spearhead: 0 : 12',
    '',
    'storage KFS: 1 kotak',
    'waktu melewati forest: 0 : 18',
    'delta waktu melewati forest: 3',
    'sering error di index: index 5',
    '',
    'waktu masuk ke arena: 0 : 22',
    'urutan taruh kfs: tengah, kanan, kiri, atas',
    'waktu taruh kfs di rak: 0 : 9'
  ].join('\n');

  assert.equal(RobotLog.formatRunningTestEntry(rt), expected);
});

test('formatRunningTestEntry uses "-" for unset dominan and "_" for unset team names', () => {
  const rt = RobotLog.createRunningTestState();
  const text = RobotLog.formatRunningTestEntry(rt);
  assert.match(text, /^_, _$/m);
  assert.match(text, /^Dominan di lapangan: -$/m);
});

test('formatRunningTestEntry does not throw on a fully default state', () => {
  const rt = RobotLog.createRunningTestState();
  assert.doesNotThrow(() => RobotLog.formatRunningTestEntry(rt));
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/app.test.js`
Expected: FAIL — `RobotLog.formatRunningTestEntry is not a function`.

- [ ] **Step 3: Implement**

```js
  function formatRunningTestEntry(rt) {
    var run = rt.run;
    var dominanStr = rt.dominan === 'merah' ? 'Merah' : (rt.dominan === 'biru' ? 'Biru' : '-');
    return [
      (rt.universitas || '_') + ', ' + (rt.namaTim || '_'),
      'Persentase KFM: ' + rt.kfmCount + ' / ' + rt.totalPermainan,
      'Dominan di lapangan: ' + dominanStr,
      'R1:',
      'keberhasilan ambil staf: ' + formatRatio(run.r1.staf),
      'waktu ambil staf: ' + formatMenitDetik(run.r1.waktuStaf),
      'waktu assembly: ' + formatMenitDetik(run.r1.waktuAssembly),
      '',
      'storage spear: ' + run.r1.storageSpear + ' spear',
      'storage kfs: ' + run.r1.storageKfs + ' kotak',
      'waktu masuk arena: ' + formatMenitDetik(run.r1.waktuMasukArena),
      'kesusahan ambil kfs di index: ' + run.r1.kesusahanIndex,
      '',
      'waktu perjalanan forest-arena: ' + formatMenitDetik(run.r1.waktuForestArena),
      'urutan taruh kfs di rak: ' + formatSequence(run.r1.urutanRak),
      'waktu taruh kfs di rak: ' + formatMenitDetik(run.r1.waktuTaruhRak),
      'waktu perjalanan retry zona 3 ke rak: ' + formatMenitDetik(run.r1.waktuRetryZona3),
      'bisa tusuk row apa saja: ' + run.r1.tusukRow,
      'delta waktu angkat R2: ' + run.r1.deltaAngkatR2,
      '',
      'R2:',
      'keberhasilan ambil spearhead: ' + formatRatio(run.r2.spearhead),
      'sering ambil spearhead di index: ' + run.r2.seringIndexSpearhead,
      'waktu ambil spearhead: ' + formatMenitDetik(run.r2.waktuSpearhead),
      '',
      'storage KFS: ' + run.r2.storageKfs + ' kotak',
      'waktu melewati forest: ' + formatMenitDetik(run.r2.waktuForest),
      'delta waktu melewati forest: ' + run.r2.deltaForest,
      'sering error di index: ' + run.r2.seringErrorIndex,
      '',
      'waktu masuk ke arena: ' + formatMenitDetik(run.r2.waktuMasukArena),
      'urutan taruh kfs: ' + formatSequence(run.r2.urutanRak),
      'waktu taruh kfs di rak: ' + formatMenitDetik(run.r2.waktuTaruhRak)
    ].join('\n');
  }
```

Add to exports: `formatRunningTestEntry: formatRunningTestEntry,`

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/app.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app.js tests/app.test.js
git commit -m "feat: add running-test chat template formatter"
```

---

## Task 6: `app.js` — `logRun` reducer

**Files:**
- Modify: `app.js`
- Test: `tests/app.test.js`

**Interfaces:**
- Consumes: `createRunningTestRun` (Task 4), `formatRunningTestEntry` (Task 5)
- Produces: `logRun(rt: RunningTestState, isKfm: boolean) -> RunningTestState` — returns a **new** state object: `totalPermainan` +1, `kfmCount` +1 if `isKfm`, `log` gets the formatted entry appended (using the *updated* totals), `run` reset to a fresh `createRunningTestRun()`. `universitas`, `namaTim`, `dominan`, `runTimer` pass through unchanged.

- [ ] **Step 1: Write the failing tests**

```js
test('logRun bumps totalPermainan, appends a log entry, and resets run fields', () => {
  const rt = RobotLog.createRunningTestState();
  rt.universitas = 'ITS';
  rt.namaTim = 'Garuda';
  rt.dominan = 'biru';
  rt.run.r1.storageSpear = 3;

  const next = RobotLog.logRun(rt, false);

  assert.equal(next.totalPermainan, 1);
  assert.equal(next.kfmCount, 0);
  assert.equal(next.log.length, 1);
  assert.match(next.log[0], /^ITS, Garuda$/m);
  assert.match(next.log[0], /^Persentase KFM: 0 \/ 1$/m);
  assert.deepEqual(next.run, RobotLog.createRunningTestRun());
});

test('logRun with isKfm=true bumps kfmCount too', () => {
  const rt = RobotLog.createRunningTestState();
  const next = RobotLog.logRun(rt, true);
  assert.equal(next.totalPermainan, 1);
  assert.equal(next.kfmCount, 1);
});

test('logRun preserves universitas/namaTim/dominan across runs, does not mutate input', () => {
  const rt = RobotLog.createRunningTestState();
  rt.universitas = 'ITS';
  rt.namaTim = 'Garuda';
  rt.dominan = 'merah';

  const next = RobotLog.logRun(rt, false);

  assert.equal(next.universitas, 'ITS');
  assert.equal(next.namaTim, 'Garuda');
  assert.equal(next.dominan, 'merah');
  assert.equal(rt.totalPermainan, 0, 'input state must not be mutated');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/app.test.js`
Expected: FAIL — `RobotLog.logRun is not a function`.

- [ ] **Step 3: Implement**

```js
  function logRun(rt, isKfm) {
    var totalPermainan = rt.totalPermainan + 1;
    var kfmCount = rt.kfmCount + (isKfm ? 1 : 0);
    var snapshot = Object.assign({}, rt, { totalPermainan: totalPermainan, kfmCount: kfmCount });
    var entry = formatRunningTestEntry(snapshot);
    return Object.assign({}, rt, {
      totalPermainan: totalPermainan,
      kfmCount: kfmCount,
      log: rt.log.concat([entry]),
      run: createRunningTestRun()
    });
  }
```

Add to exports: `logRun: logRun,`

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/app.test.js`
Expected: PASS — all tests (37 existing + 15 new = 52) pass.

- [ ] **Step 5: Commit**

```bash
git add app.js tests/app.test.js
git commit -m "feat: add logRun reducer for running-test cumulative stats"
```

---

## Task 7: `index.html` — navbar shell + visual overhaul + Match page retrofit

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: `RobotLog.createInitialState` (existing)
- Produces: DOM structure `#navbar` with `#nav-match` / `#nav-running-test` buttons, `#view-match` wrapping all existing Match markup, `#view-running-test` (empty placeholder, filled in Task 8-10), a JS `showView(view)` function, and a `#match-reset-all` button wired to reset the Match page.

- [ ] **Step 1: Update the `<style>` block**

In `index.html`, replace the existing `<style>` block's `body` rule and append new rules. Change:

```css
  body {
    font-family: system-ui, sans-serif;
    margin: 0;
    padding: 12px;
    background: #111;
    color: #eee;
  }
```

to:

```css
  body {
    font-family: system-ui, sans-serif;
    margin: 0;
    padding: 12px;
    background: #10141c;
    color: #eee;
  }
```

Change the `.bar` rule's `gap` from `8px` to `12px`:

```css
  .bar {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    margin-bottom: 8px;
  }
```

Change the `button` rule's `padding` from `10px 14px` to `12px 16px`:

```css
  button {
    font-size: 16px;
    padding: 12px 16px;
    border-radius: 8px;
    border: 1px solid #555;
    background: #333;
    color: #eee;
    min-height: 44px;
    min-width: 44px;
  }
```

Change `.robot-card` padding from `8px` to `12px`:

```css
  .robot-card {
    border: 2px solid #444;
    border-radius: 8px;
    padding: 12px;
  }
```

Change `.stat-row` `margin-bottom` from `8px` to `16px`:

```css
  .stat-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    margin-bottom: 16px;
  }
```

Append these new rules at the end of the `<style>` block, before `</style>`:

```css
  h2 {
    border-top: 1px solid #2c3648;
    padding-top: 12px;
    margin: 20px 0 10px;
  }
  h2:first-of-type {
    border-top: none;
    padding-top: 0;
    margin-top: 0;
  }
  .navbar {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    position: sticky;
    top: 0;
    background: #10141c;
    padding: 8px 0;
    z-index: 10;
  }
  .nav-tab {
    flex: 1;
  }
  .nav-tab[aria-pressed="true"] {
    background: #1f9d8a;
    color: #06231f;
    font-weight: bold;
    border-color: #1f9d8a;
  }
  button:hover {
    filter: brightness(1.15);
  }
  button:focus-visible, input:focus-visible, textarea:focus-visible {
    outline: 2px solid #1f9d8a;
    outline-offset: 2px;
  }
  button.plus {
    background: #1c3a26;
    border-color: #22c55e;
    color: #a4f5c4;
  }
  button.minus {
    background: #3a2a1c;
    border-color: #f59e0b;
    color: #ffcf7c;
  }
  .robot-card.r1 {
    border-color: #14b8a6;
  }
  .robot-card.r2 {
    border-color: #a855f7;
  }
  #tim-biru[aria-pressed="true"], #rt-dominan-biru[aria-pressed="true"] {
    background: #3b82f6;
    color: #06122b;
    border-color: #3b82f6;
  }
  #tim-merah[aria-pressed="true"], #rt-dominan-merah[aria-pressed="true"] {
    background: #ef4444;
    color: #2b0606;
    border-color: #ef4444;
  }
  #hasil-kfm, #rt-logrun-kfm {
    background: #b8860b;
    color: #241900;
    border-color: #d4a017;
    font-weight: bold;
  }
  #match-reset-all, #rt-reset-all {
    background: #4a1c1c;
    border-color: #ef4444;
    color: #ffb4b4;
  }
  .seq-value {
    font-size: 14px;
    min-width: 6em;
    text-align: center;
    background: #1c2433;
    border-radius: 6px;
    padding: 4px 8px;
  }
```

- [ ] **Step 2: Add the navbar and wrap the Match page markup**

Right after `<body>` and before the existing `<div id="draft-banner">`, insert:

```html
  <nav class="navbar">
    <button id="nav-match" class="nav-tab" aria-pressed="true">Match</button>
    <button id="nav-running-test" class="nav-tab" aria-pressed="false">Running Test</button>
  </nav>

  <div id="view-match">
```

Immediately before the closing `</body>` (i.e. right after the existing `<script src="app.js"></script>` line's surrounding inline `<script>` block ends, but the `<div id="view-match">` must close right after the existing `<textarea id="output">` and before the `<script src="app.js">` tag — HTML divs must wrap markup only, not `<script>` tags), close the div right after the existing:

```html
  <textarea id="output" rows="20" readonly></textarea>
```

by inserting `</div>` immediately after that line, so it reads:

```html
  <textarea id="output" rows="20" readonly></textarea>
  </div>
```

- [ ] **Step 3: Add a Reset All button to the Match page's Output bar**

Find the existing Output bar:

```html
  <div class="bar">
    <button id="generate-btn">Generate</button>
    <button id="copy-btn">Copy</button>
    <button id="share-btn" style="display:none;">Share</button>
  </div>
```

Change it to:

```html
  <div class="bar">
    <button id="generate-btn">Generate</button>
    <button id="copy-btn">Copy</button>
    <button id="share-btn" style="display:none;">Share</button>
    <button id="match-reset-all">Reset All</button>
  </div>
```

- [ ] **Step 4: Add `class="plus"`/`class="minus"`/`class="r1"`/`class="r2"` to existing Match markup**

In the R1 `.robot-card`, change `<div class="robot-card">` (the first one, containing `<strong>Robot 1 (R1)</strong>`) to `<div class="robot-card r1">`. In the R2 one, change to `<div class="robot-card r2">`.

For every counter `+1`/`-1` button pair in the Match view (`r1-kotak`, `r1-retry`, `r2-kotak`, `r2-retry`), add the class. For example, change:

```html
        <button id="r1-kotak-minus">-1</button>
        <span class="count-value" id="r1-kotak-value">0</span>
        <button id="r1-kotak-plus">+1</button>
```

to:

```html
        <button class="minus" id="r1-kotak-minus">-1</button>
        <span class="count-value" id="r1-kotak-value">0</span>
        <button class="plus" id="r1-kotak-plus">+1</button>
```

Apply the same `class="minus"` / `class="plus"` addition to `r1-retry-minus`/`r1-retry-plus`, `r2-kotak-minus`/`r2-kotak-plus`, `r2-retry-minus`/`r2-retry-plus`.

- [ ] **Step 5: Add the `#view-running-test` placeholder**

Right after the closing `</div>` from Step 2 (the one that closes `#view-match`), insert an empty placeholder that Task 8 will fill in:

```html

  <div id="view-running-test" style="display:none;">
  </div>
```

- [ ] **Step 6: Add navbar JS and Match Reset All JS**

In the inline `<script>` block, right after the `var state = RobotLog.createInitialState();` line, add:

```js
    function showView(view) {
      document.getElementById('view-match').style.display = view === 'match' ? '' : 'none';
      document.getElementById('view-running-test').style.display = view === 'running-test' ? '' : 'none';
      document.getElementById('nav-match').setAttribute('aria-pressed', view === 'match');
      document.getElementById('nav-running-test').setAttribute('aria-pressed', view === 'running-test');
    }
    document.getElementById('nav-match').addEventListener('click', function () { showView('match'); });
    document.getElementById('nav-running-test').addEventListener('click', function () { showView('running-test'); });
```

Right after the existing `document.getElementById('catatan').addEventListener(...)` block (just before the `if (navigator.share) {` line), add:

```js
    document.getElementById('match-reset-all').addEventListener('click', function () {
      if (!confirm('Reset semua data Match? Form akan dikosongkan dan tidak bisa dibatalkan.')) return;
      state = RobotLog.createInitialState();
      state.tanggal = todayIso();
      populateInputs();
      render();
    });
```

At the very end of the script, right after the existing `render(); tickLoop();` lines, add:

```js
    showView('match');
```

- [ ] **Step 7: Manual verification**

Open `index.html` directly in a browser (double-click the file, or serve it):
- Navbar shows two tabs; "Match" starts active (teal fill), clicking "Running Test" shows an empty page and un-fills "Match".
- Match page still works exactly as before (counters, stopwatches, generate/copy).
- Buttons have visibly more breathing room (12px+ gaps) vs. the old cramped layout.
- Background is dark navy, not flat black; R1 card has a teal border, R2 card has a purple border; `+1` buttons are green-tinted, `-1` buttons are amber-tinted; Tim Biru/Merah buttons turn blue/red when pressed; KFM button is gold.
- Clicking "Reset All" on the Match page shows a confirm dialog; confirming clears all fields back to defaults (today's date, empty team, zeroed counters).

- [ ] **Step 8: Commit**

```bash
git add index.html
git commit -m "feat: add navbar shell and colorful spacing overhaul to Match page"
```

---

## Task 8: `index.html` — Running Test header, run timer, output, Reset All

**Files:**
- Modify: `index.html` (fills in the `#view-running-test` placeholder from Task 7 Step 5)

**Interfaces:**
- Consumes: `RobotLog.createRunningTestState`, `RobotLog.serializeDraft`, `RobotLog.deserializeDraft`, `RobotLog.startStopwatch`, `RobotLog.stopStopwatch`, `RobotLog.resetStopwatch`, `RobotLog.getElapsedSecondsPrecise`, `RobotLog.formatMatchTime` (all existing), `RobotLog.logRun` (Task 6)
- Produces: `rtState` (module-level JS variable), `renderRt()`, `populateRtInputs()`, `saveRtDraft()` — these are consumed by Tasks 9 and 10's field wiring.

- [ ] **Step 1: Replace the `#view-running-test` placeholder markup**

Replace:

```html

  <div id="view-running-test" style="display:none;">
  </div>
```

with:

```html

  <div id="view-running-test" style="display:none;">

    <div id="rt-draft-banner" style="display:none; background:#654; padding:8px; border-radius:6px; margin-bottom:8px;">Draft running test sebelumnya dipulihkan.</div>

    <h2>Info Tim</h2>
    <div class="bar">
      <input type="text" id="rt-universitas" placeholder="Nama Universitas">
      <input type="text" id="rt-namatim" placeholder="Nama Tim">
      <button id="rt-dominan-biru" aria-pressed="false">Dominan Biru</button>
      <button id="rt-dominan-merah" aria-pressed="false">Dominan Merah</button>
    </div>
    <div class="bar">
      <span class="label">Persentase KFM</span>
      <span class="count-value" id="rt-kfm-value">0 / 0</span>
    </div>

    <h2>Run Timer</h2>
    <div class="bar">
      <span class="label">Waktu run (menit.detik.centidetik)</span>
      <span class="time-value" id="rt-run-timer-value">00.00.00</span>
      <button id="rt-run-timer-toggle">Start</button>
      <button id="rt-run-timer-reset">Reset</button>
    </div>

    <div class="columns" id="rt-columns">
    </div>

    <h2>Log Run</h2>
    <div class="bar">
      <button id="rt-logrun-normal">Log Run</button>
      <button id="rt-logrun-kfm">Log Run (KFM)</button>
      <button id="rt-reset-all">Reset All</button>
    </div>

    <h2>Output</h2>
    <div class="bar">
      <button id="rt-generate-btn">Generate</button>
      <button id="rt-copy-btn">Copy</button>
      <button id="rt-share-btn" style="display:none;">Share</button>
    </div>
    <textarea id="rt-output" rows="20" readonly></textarea>
  </div>
```

(`#rt-columns` is an empty grid container — Tasks 9 and 10 insert the R1 and R2 `.robot-card`s into it.)

- [ ] **Step 2: Add Running Test JS — state, render, populate, save**

In the inline `<script>` block, right after the `showView('match');` line added in Task 7 Step 6, add:

```js
    var rtState = RobotLog.createRunningTestState();
    var RT_DRAFT_KEY = 'robot-running-test-draft';

    function saveRtDraft() {
      localStorage.setItem(RT_DRAFT_KEY, RobotLog.serializeDraft(rtState));
    }

    function populateRtInputs() {
      document.getElementById('rt-universitas').value = rtState.universitas || '';
      document.getElementById('rt-namatim').value = rtState.namaTim || '';
    }

    function renderRt() {
      document.getElementById('rt-dominan-biru').setAttribute('aria-pressed', rtState.dominan === 'biru');
      document.getElementById('rt-dominan-merah').setAttribute('aria-pressed', rtState.dominan === 'merah');
      document.getElementById('rt-kfm-value').textContent = rtState.kfmCount + ' / ' + rtState.totalPermainan;
      document.getElementById('rt-run-timer-toggle').textContent = rtState.runTimer.running ? 'Stop' : 'Start';
      saveRtDraft();
    }

    document.getElementById('rt-universitas').addEventListener('input', function (e) {
      rtState.universitas = e.target.value;
      saveRtDraft();
    });
    document.getElementById('rt-namatim').addEventListener('input', function (e) {
      rtState.namaTim = e.target.value;
      saveRtDraft();
    });
    document.getElementById('rt-dominan-biru').addEventListener('click', function () {
      rtState.dominan = 'biru';
      renderRt();
    });
    document.getElementById('rt-dominan-merah').addEventListener('click', function () {
      rtState.dominan = 'merah';
      renderRt();
    });

    document.getElementById('rt-run-timer-toggle').addEventListener('click', function () {
      var sw = rtState.runTimer;
      rtState.runTimer = sw.running
        ? RobotLog.stopStopwatch(sw, Date.now())
        : RobotLog.startStopwatch(sw, Date.now());
      renderRt();
    });
    document.getElementById('rt-run-timer-reset').addEventListener('click', function () {
      rtState.runTimer = RobotLog.resetStopwatch();
      renderRt();
    });

    document.getElementById('rt-reset-all').addEventListener('click', function () {
      if (!confirm('Reset semua data Running Test (termasuk history KFM/total permainan)? Tindakan ini tidak bisa dibatalkan.')) return;
      rtState = RobotLog.createRunningTestState();
      populateRtInputs();
      renderRt();
    });

    document.getElementById('rt-generate-btn').addEventListener('click', function () {
      document.getElementById('rt-output').value = rtState.log.join('\n\n');
    });
    document.getElementById('rt-copy-btn').addEventListener('click', function () {
      var output = document.getElementById('rt-output');
      var text = output.value;
      if (!text) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(function () {
          output.select();
          document.execCommand('copy');
        });
      } else {
        output.select();
        document.execCommand('copy');
      }
    });
    document.getElementById('rt-share-btn').addEventListener('click', function () {
      var text = document.getElementById('rt-output').value;
      if (!text) return;
      navigator.share({ text: text }).catch(function () {});
    });
    if (navigator.share) {
      document.getElementById('rt-share-btn').style.display = '';
    }
```

- [ ] **Step 3: Wire the Run Timer into `tickLoop` and add draft restore**

Find the existing `tickLoop` function:

```js
    function tickLoop() {
      document.getElementById('match-timer-value').textContent = RobotLog.formatMatchTime(RobotLog.getElapsedSecondsPrecise(state.matchTimer, Date.now()));
      requestAnimationFrame(tickLoop);
    }
```

Replace it with:

```js
    function tickLoop() {
      document.getElementById('match-timer-value').textContent = RobotLog.formatMatchTime(RobotLog.getElapsedSecondsPrecise(state.matchTimer, Date.now()));
      document.getElementById('rt-run-timer-value').textContent = RobotLog.formatMatchTime(RobotLog.getElapsedSecondsPrecise(rtState.runTimer, Date.now()));
      requestAnimationFrame(tickLoop);
    }
```

At the very end of the script (after the existing `render(); tickLoop();`), add:

```js
    var rtRestored = RobotLog.deserializeDraft(localStorage.getItem(RT_DRAFT_KEY));
    if (rtRestored) {
      rtState = rtRestored;
      document.getElementById('rt-draft-banner').style.display = 'block';
    }
    populateRtInputs();
    renderRt();
```

- [ ] **Step 4: Manual verification**

Open `index.html` in a browser, switch to "Running Test" tab:
- Nama Universitas / Nama Tim inputs retain typed text after tab-switching away and back (state persists in `rtState`, not re-rendered from DOM).
- Dominan Biru/Merah buttons toggle blue/red highlight.
- Run Timer starts/stops/resets, ticking display updates live, independent of the Match Timer.
- "Log Run" / "Log Run (KFM)" / "Reset All" buttons are present (their behavior is wired in Task 9-11; clicking them now is fine, they just won't change field values since no R1/R2 markup exists yet).
- Reload the page after typing something in Nama Tim — draft banner appears and the value is restored.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: add running-test header, run timer, output, and reset-all shell"
```

---

## Task 9: `index.html` — Running Test R1 fields (markup + wiring)

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: `rtState`, `renderRt`, `populateRtInputs`, `saveRtDraft` (Task 8); `RobotLog.incrementCount`, `RobotLog.decrementCount`, `RobotLog.sanitizeManualSeconds`, `RobotLog.getElapsedSecondsPrecise` (existing); `RobotLog.recordSuccess`, `RobotLog.recordFail`, `RobotLog.formatRatio` (Task 2); `RobotLog.appendSequenceSlot`, `RobotLog.undoSequenceSlot`, `RobotLog.clearSequence`, `RobotLog.formatSequence` (Task 1); `RobotLog.formatMenitDetik` (Task 3)
- Produces: generic wiring helpers `wireRtCounter`, `wireRtMark`, `wireRtRatio`, `wireRtSequence`, `wireRtText`, `wireRtNumber` (reused by Task 10 for R2)

- [ ] **Step 1: Insert the R1 `.robot-card` into `#rt-columns`**

Replace:

```html
    <div class="columns" id="rt-columns">
    </div>
```

with:

```html
    <div class="columns" id="rt-columns">
      <div class="robot-card r1">
        <strong>Robot 1 (R1)</strong>

        <div class="stat-row">
          <span class="label">Keberhasilan ambil staf</span>
          <span class="count-value" id="rt-r1-staf-value">0 / 0</span>
          <button class="plus" id="rt-r1-staf-berhasil">Berhasil</button>
          <button class="minus" id="rt-r1-staf-gagal">Gagal</button>
        </div>

        <div class="stat-row">
          <span class="label">Waktu ambil staf</span>
          <span class="time-value" id="rt-r1-waktustaf-value">0 : 0</span>
          <button id="rt-r1-waktustaf-catat">Catat</button>
        </div>
        <div class="stat-row">
          <input type="number" id="rt-r1-waktustaf-manual" placeholder="edit manual (detik)">
        </div>

        <div class="stat-row">
          <span class="label">Waktu assembly</span>
          <span class="time-value" id="rt-r1-assembly-value">0 : 0</span>
          <button id="rt-r1-assembly-catat">Catat</button>
        </div>
        <div class="stat-row">
          <input type="number" id="rt-r1-assembly-manual" placeholder="edit manual (detik)">
        </div>

        <div class="stat-row">
          <span class="label">Storage spear</span>
          <button class="minus" id="rt-r1-storagespear-minus">-1</button>
          <span class="count-value" id="rt-r1-storagespear-value">0</span>
          <button class="plus" id="rt-r1-storagespear-plus">+1</button>
        </div>

        <div class="stat-row">
          <span class="label">Storage kfs</span>
          <button class="minus" id="rt-r1-storagekfs-minus">-1</button>
          <span class="count-value" id="rt-r1-storagekfs-value">0</span>
          <button class="plus" id="rt-r1-storagekfs-plus">+1</button>
        </div>

        <div class="stat-row">
          <span class="label">Waktu masuk arena</span>
          <span class="time-value" id="rt-r1-masukarena-value">0 : 0</span>
          <button id="rt-r1-masukarena-catat">Catat</button>
        </div>
        <div class="stat-row">
          <input type="number" id="rt-r1-masukarena-manual" placeholder="edit manual (detik)">
        </div>

        <div class="stat-row">
          <input type="text" id="rt-r1-kesusahan" placeholder="Kesusahan ambil kfs di index">
        </div>

        <div class="stat-row">
          <span class="label">Waktu perjalanan forest-arena</span>
          <span class="time-value" id="rt-r1-forestarena-value">0 : 0</span>
          <button id="rt-r1-forestarena-catat">Catat</button>
        </div>
        <div class="stat-row">
          <input type="number" id="rt-r1-forestarena-manual" placeholder="edit manual (detik)">
        </div>

        <div class="stat-row">
          <span class="label">Urutan taruh kfs di rak</span>
          <span class="seq-value" id="rt-r1-urutan-value">-</span>
        </div>
        <div class="stat-row">
          <button id="rt-r1-urutan-tengah">Tengah</button>
          <button id="rt-r1-urutan-kanan">Kanan</button>
          <button id="rt-r1-urutan-kiri">Kiri</button>
          <button id="rt-r1-urutan-undo">Undo</button>
          <button id="rt-r1-urutan-clear">Clear</button>
        </div>

        <div class="stat-row">
          <span class="label">Waktu taruh kfs di rak</span>
          <span class="time-value" id="rt-r1-taruhrak-value">0 : 0</span>
          <button id="rt-r1-taruhrak-catat">Catat</button>
        </div>
        <div class="stat-row">
          <input type="number" id="rt-r1-taruhrak-manual" placeholder="edit manual (detik)">
        </div>

        <div class="stat-row">
          <span class="label">Waktu perjalanan retry zona 3 ke rak</span>
          <span class="time-value" id="rt-r1-retryzona3-value">0 : 0</span>
          <button id="rt-r1-retryzona3-catat">Catat</button>
        </div>
        <div class="stat-row">
          <input type="number" id="rt-r1-retryzona3-manual" placeholder="edit manual (detik)">
        </div>

        <div class="stat-row">
          <input type="text" id="rt-r1-tusukrow" placeholder="Bisa tusuk row apa saja">
        </div>

        <div class="stat-row">
          <span class="label">Delta waktu angkat R2 (detik)</span>
          <input type="number" id="rt-r1-deltaangkat" value="0">
        </div>
      </div>
    </div>
```

- [ ] **Step 2: Add generic wiring helpers and R1 wiring calls**

In the inline `<script>` block, right after the `document.getElementById('rt-run-timer-reset').addEventListener(...)` block from Task 8, add:

```js
    function wireRtCounter(prefix, robotKey, field) {
      document.getElementById(prefix + '-plus').addEventListener('click', function () {
        rtState.run[robotKey][field] = RobotLog.incrementCount(rtState.run[robotKey][field]);
        renderRt();
      });
      document.getElementById(prefix + '-minus').addEventListener('click', function () {
        rtState.run[robotKey][field] = RobotLog.decrementCount(rtState.run[robotKey][field]);
        renderRt();
      });
    }

    function wireRtMark(prefix, robotKey, field) {
      document.getElementById(prefix + '-catat').addEventListener('click', function () {
        rtState.run[robotKey][field] = RobotLog.getElapsedSecondsPrecise(rtState.runTimer, Date.now());
        renderRt();
      });
      document.getElementById(prefix + '-manual').addEventListener('change', function (e) {
        var seconds = RobotLog.sanitizeManualSeconds(parseFloat(e.target.value));
        if (seconds === null) return;
        rtState.run[robotKey][field] = seconds;
        e.target.value = '';
        renderRt();
      });
    }

    function wireRtRatio(prefix, robotKey, field) {
      document.getElementById(prefix + '-berhasil').addEventListener('click', function () {
        rtState.run[robotKey][field] = RobotLog.recordSuccess(rtState.run[robotKey][field]);
        renderRt();
      });
      document.getElementById(prefix + '-gagal').addEventListener('click', function () {
        rtState.run[robotKey][field] = RobotLog.recordFail(rtState.run[robotKey][field]);
        renderRt();
      });
    }

    function wireRtSequence(prefix, robotKey, field, slots) {
      slots.forEach(function (slot) {
        document.getElementById(prefix + '-' + slot).addEventListener('click', function () {
          rtState.run[robotKey][field] = RobotLog.appendSequenceSlot(rtState.run[robotKey][field], slot);
          renderRt();
        });
      });
      document.getElementById(prefix + '-undo').addEventListener('click', function () {
        rtState.run[robotKey][field] = RobotLog.undoSequenceSlot(rtState.run[robotKey][field]);
        renderRt();
      });
      document.getElementById(prefix + '-clear').addEventListener('click', function () {
        rtState.run[robotKey][field] = RobotLog.clearSequence();
        renderRt();
      });
    }

    function wireRtText(id, robotKey, field) {
      document.getElementById(id).addEventListener('input', function (e) {
        rtState.run[robotKey][field] = e.target.value;
        saveRtDraft();
      });
    }

    function wireRtNumber(id, robotKey, field) {
      document.getElementById(id).addEventListener('input', function (e) {
        rtState.run[robotKey][field] = parseFloat(e.target.value) || 0;
        saveRtDraft();
      });
    }

    wireRtRatio('rt-r1-staf', 'r1', 'staf');
    wireRtMark('rt-r1-waktustaf', 'r1', 'waktuStaf');
    wireRtMark('rt-r1-assembly', 'r1', 'waktuAssembly');
    wireRtCounter('rt-r1-storagespear', 'r1', 'storageSpear');
    wireRtCounter('rt-r1-storagekfs', 'r1', 'storageKfs');
    wireRtMark('rt-r1-masukarena', 'r1', 'waktuMasukArena');
    wireRtText('rt-r1-kesusahan', 'r1', 'kesusahanIndex');
    wireRtMark('rt-r1-forestarena', 'r1', 'waktuForestArena');
    wireRtSequence('rt-r1-urutan', 'r1', 'urutanRak', ['tengah', 'kanan', 'kiri']);
    wireRtMark('rt-r1-taruhrak', 'r1', 'waktuTaruhRak');
    wireRtMark('rt-r1-retryzona3', 'r1', 'waktuRetryZona3');
    wireRtText('rt-r1-tusukrow', 'r1', 'tusukRow');
    wireRtNumber('rt-r1-deltaangkat', 'r1', 'deltaAngkatR2');
```

- [ ] **Step 3: Extend `renderRt` and `populateRtInputs` for R1 fields**

In `renderRt`, right before the closing `saveRtDraft();` line, add:

```js
      var r1 = rtState.run.r1;
      document.getElementById('rt-r1-staf-value').textContent = RobotLog.formatRatio(r1.staf);
      document.getElementById('rt-r1-waktustaf-value').textContent = RobotLog.formatMenitDetik(r1.waktuStaf);
      document.getElementById('rt-r1-assembly-value').textContent = RobotLog.formatMenitDetik(r1.waktuAssembly);
      document.getElementById('rt-r1-storagespear-value').textContent = r1.storageSpear;
      document.getElementById('rt-r1-storagekfs-value').textContent = r1.storageKfs;
      document.getElementById('rt-r1-masukarena-value').textContent = RobotLog.formatMenitDetik(r1.waktuMasukArena);
      document.getElementById('rt-r1-forestarena-value').textContent = RobotLog.formatMenitDetik(r1.waktuForestArena);
      document.getElementById('rt-r1-urutan-value').textContent = RobotLog.formatSequence(r1.urutanRak) || '-';
      document.getElementById('rt-r1-taruhrak-value').textContent = RobotLog.formatMenitDetik(r1.waktuTaruhRak);
      document.getElementById('rt-r1-retryzona3-value').textContent = RobotLog.formatMenitDetik(r1.waktuRetryZona3);
```

In `populateRtInputs`, right before its closing `}`, add:

```js
      document.getElementById('rt-r1-kesusahan').value = rtState.run.r1.kesusahanIndex;
      document.getElementById('rt-r1-tusukrow').value = rtState.run.r1.tusukRow;
      document.getElementById('rt-r1-deltaangkat').value = rtState.run.r1.deltaAngkatR2;
```

- [ ] **Step 4: Wire R1 into Log Run's post-log refresh**

Find the `rt-logrun-normal` / `rt-logrun-kfm` listeners added in Task 8 Step 2 — they don't exist yet as of Task 8 (Task 8 only adds Reset All/Generate/Copy/Share). Add them now, right after the `rt-reset-all` listener block:

```js
    document.getElementById('rt-logrun-normal').addEventListener('click', function () {
      rtState = RobotLog.logRun(rtState, false);
      populateRtInputs();
      renderRt();
    });
    document.getElementById('rt-logrun-kfm').addEventListener('click', function () {
      rtState = RobotLog.logRun(rtState, true);
      populateRtInputs();
      renderRt();
    });
```

- [ ] **Step 5: Manual verification**

Open `index.html`, switch to Running Test:
- R1 card renders with teal border, all fields visible, spacing matches R1 card on Match page.
- "Berhasil"/"Gagal" on Keberhasilan ambil staf update the `X / Y` display correctly (Berhasil bumps both, Gagal bumps only total).
- Run Timer running, tapping any "Catat" button stamps the current run-timer elapsed time into that field's display.
- Manual override number field overrides a time field and clears itself after.
- Storage spear/kfs counters increment/decrement, floor at 0.
- Urutan taruh kfs di rak: tapping Tengah → Kanan → Kiri shows "tengah, kanan, kiri"; Undo removes the last; Clear empties it back to "-".
- Kesusahan/tusukrow text fields retain typed text.
- Delta waktu angkat R2 accepts a number.
- Tap "Log Run" — R1 fields all reset to defaults (0, empty, `-`), Nama Universitas/Nama Tim stay filled in.

- [ ] **Step 6: Run the full test suite (regression check)**

Run: `node --test tests/app.test.js`
Expected: PASS — all existing tests still green (no `app.js` changes in this task, this just confirms nothing broke).

- [ ] **Step 7: Commit**

```bash
git add index.html
git commit -m "feat: wire running-test R1 fields (staf, assembly, storage, rak sequence)"
```

---

## Task 10: `index.html` — Running Test R2 fields (markup + wiring)

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: `wireRtCounter`, `wireRtMark`, `wireRtRatio`, `wireRtSequence`, `wireRtText`, `wireRtNumber` (Task 9), `rtState`, `renderRt`, `populateRtInputs` (Task 8)

- [ ] **Step 1: Insert the R2 `.robot-card` into `#rt-columns`**

Right after the R1 card's closing `</div>` (the one closing `<div class="robot-card r1">`), and still inside `<div class="columns" id="rt-columns">`, insert:

```html
      <div class="robot-card r2">
        <strong>Robot 2 (R2)</strong>

        <div class="stat-row">
          <span class="label">Keberhasilan ambil spearhead</span>
          <span class="count-value" id="rt-r2-spearhead-value">0 / 0</span>
          <button class="plus" id="rt-r2-spearhead-berhasil">Berhasil</button>
          <button class="minus" id="rt-r2-spearhead-gagal">Gagal</button>
        </div>

        <div class="stat-row">
          <input type="text" id="rt-r2-seringindex" placeholder="Sering ambil spearhead di index">
        </div>

        <div class="stat-row">
          <span class="label">Waktu ambil spearhead</span>
          <span class="time-value" id="rt-r2-waktuspearhead-value">0 : 0</span>
          <button id="rt-r2-waktuspearhead-catat">Catat</button>
        </div>
        <div class="stat-row">
          <input type="number" id="rt-r2-waktuspearhead-manual" placeholder="edit manual (detik)">
        </div>

        <div class="stat-row">
          <span class="label">Storage KFS</span>
          <button class="minus" id="rt-r2-storagekfs-minus">-1</button>
          <span class="count-value" id="rt-r2-storagekfs-value">0</span>
          <button class="plus" id="rt-r2-storagekfs-plus">+1</button>
        </div>

        <div class="stat-row">
          <span class="label">Waktu melewati forest</span>
          <span class="time-value" id="rt-r2-forest-value">0 : 0</span>
          <button id="rt-r2-forest-catat">Catat</button>
        </div>
        <div class="stat-row">
          <input type="number" id="rt-r2-forest-manual" placeholder="edit manual (detik)">
        </div>

        <div class="stat-row">
          <span class="label">Delta waktu melewati forest (detik)</span>
          <input type="number" id="rt-r2-deltaforest" value="0">
        </div>

        <div class="stat-row">
          <input type="text" id="rt-r2-seringerror" placeholder="Sering error di index">
        </div>

        <div class="stat-row">
          <span class="label">Waktu masuk ke arena</span>
          <span class="time-value" id="rt-r2-masukarena-value">0 : 0</span>
          <button id="rt-r2-masukarena-catat">Catat</button>
        </div>
        <div class="stat-row">
          <input type="number" id="rt-r2-masukarena-manual" placeholder="edit manual (detik)">
        </div>

        <div class="stat-row">
          <span class="label">Urutan taruh kfs</span>
          <span class="seq-value" id="rt-r2-urutan-value">-</span>
        </div>
        <div class="stat-row">
          <button id="rt-r2-urutan-tengah">Tengah</button>
          <button id="rt-r2-urutan-kanan">Kanan</button>
          <button id="rt-r2-urutan-kiri">Kiri</button>
          <button id="rt-r2-urutan-atas">Atas</button>
          <button id="rt-r2-urutan-undo">Undo</button>
          <button id="rt-r2-urutan-clear">Clear</button>
        </div>

        <div class="stat-row">
          <span class="label">Waktu taruh kfs di rak</span>
          <span class="time-value" id="rt-r2-taruhrak-value">0 : 0</span>
          <button id="rt-r2-taruhrak-catat">Catat</button>
        </div>
        <div class="stat-row">
          <input type="number" id="rt-r2-taruhrak-manual" placeholder="edit manual (detik)">
        </div>
      </div>
```

- [ ] **Step 2: Add R2 wiring calls**

Right after the R1 wiring calls added in Task 9 Step 2 (after `wireRtNumber('rt-r1-deltaangkat', 'r1', 'deltaAngkatR2');`), add:

```js
    wireRtRatio('rt-r2-spearhead', 'r2', 'spearhead');
    wireRtText('rt-r2-seringindex', 'r2', 'seringIndexSpearhead');
    wireRtMark('rt-r2-waktuspearhead', 'r2', 'waktuSpearhead');
    wireRtCounter('rt-r2-storagekfs', 'r2', 'storageKfs');
    wireRtMark('rt-r2-forest', 'r2', 'waktuForest');
    wireRtNumber('rt-r2-deltaforest', 'r2', 'deltaForest');
    wireRtText('rt-r2-seringerror', 'r2', 'seringErrorIndex');
    wireRtMark('rt-r2-masukarena', 'r2', 'waktuMasukArena');
    wireRtSequence('rt-r2-urutan', 'r2', 'urutanRak', ['tengah', 'kanan', 'kiri', 'atas']);
    wireRtMark('rt-r2-taruhrak', 'r2', 'waktuTaruhRak');
```

- [ ] **Step 3: Extend `renderRt` and `populateRtInputs` for R2 fields**

In `renderRt`, right after the R1 block added in Task 9 Step 3 (after the `rt-r1-retryzona3-value` line) and before `saveRtDraft();`, add:

```js
      var r2 = rtState.run.r2;
      document.getElementById('rt-r2-spearhead-value').textContent = RobotLog.formatRatio(r2.spearhead);
      document.getElementById('rt-r2-waktuspearhead-value').textContent = RobotLog.formatMenitDetik(r2.waktuSpearhead);
      document.getElementById('rt-r2-storagekfs-value').textContent = r2.storageKfs;
      document.getElementById('rt-r2-forest-value').textContent = RobotLog.formatMenitDetik(r2.waktuForest);
      document.getElementById('rt-r2-masukarena-value').textContent = RobotLog.formatMenitDetik(r2.waktuMasukArena);
      document.getElementById('rt-r2-urutan-value').textContent = RobotLog.formatSequence(r2.urutanRak) || '-';
      document.getElementById('rt-r2-taruhrak-value').textContent = RobotLog.formatMenitDetik(r2.waktuTaruhRak);
```

In `populateRtInputs`, right after the R1 block added in Task 9 Step 3, before its closing `}`, add:

```js
      document.getElementById('rt-r2-seringindex').value = rtState.run.r2.seringIndexSpearhead;
      document.getElementById('rt-r2-deltaforest').value = rtState.run.r2.deltaForest;
      document.getElementById('rt-r2-seringerror').value = rtState.run.r2.seringErrorIndex;
```

- [ ] **Step 4: Manual verification**

Same checklist as Task 9 Step 5, applied to R2 fields (purple-bordered card): ratio Berhasil/Gagal, Catat stamping, manual override, storage counter, urutan sequence (now with 4 slots including Atas), text fields, and confirm "Log Run" resets R2 fields too.

- [ ] **Step 5: Run the full test suite (regression check)**

Run: `node --test tests/app.test.js`
Expected: PASS — no `app.js` changes in this task.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: wire running-test R2 fields (spearhead, forest, rak sequence)"
```

---

## Task 11: End-to-end verification and final commit

**Files:** none (verification only)

- [ ] **Step 1: Run the full automated test suite**

Run: `node --test tests/app.test.js`
Expected: PASS — all tests (37 original + 15 from Tasks 1-6 = 52) green, 0 failures.

- [ ] **Step 2: Full manual walkthrough — Match page**

Open `index.html` in a browser:
- Fill Match info, run both R1/R2 live tracking, generate/copy output — matches pre-existing behavior exactly (regression check against `2026-07-05-robot-match-logger-design.md`'s manual checklist).
- Match's Reset All clears the form (confirm dialog fires first).

- [ ] **Step 3: Full manual walkthrough — Running Test page, two logged runs**

- Fill Nama Universitas / Nama Tim, set Dominan.
- Complete one full run's worth of R1 + R2 fields (ratios, times via Catat, storage counters, sequences, text fields, deltas).
- Tap "Log Run (KFM)" — confirm `rt-kfm-value` shows `1 / 1`, all per-run fields reset, team info stays.
- Fill a second, different run's fields; tap "Log Run" (not KFM) — confirm `rt-kfm-value` shows `1 / 2`.
- Tap "Generate" — output textarea shows both logged run blocks separated by a blank line, each with the correct template field names/order/casing and the cumulative KFM/total at time of logging.
- Tap "Copy" — clipboard receives the same text (paste somewhere to confirm).
- Tap "Reset All" on Running Test — confirm dialog fires; confirming wipes team info, timer, and the output textarea's underlying log (tapping Generate again produces empty output).
- Reload the page mid-run (before Log Run) — confirm the in-progress draft restores via the `rt-draft-banner`.

- [ ] **Step 4: Cross-page isolation check**

- Log a Running Test run, then go fill and Reset All on the Match page — confirm Running Test's cumulative stats (`rt-kfm-value`, logged output) are untouched.
- Conversely, fill Match fields, then Reset All on Running Test — confirm Match fields are untouched.

- [ ] **Step 5: Final commit (only if any fixups were needed during verification)**

If Steps 2-4 required any code fixes, stage and commit them:

```bash
git add index.html app.js tests/app.test.js
git commit -m "fix: address issues found during running-test end-to-end verification"
```

If no fixes were needed, no commit is required for this task.
