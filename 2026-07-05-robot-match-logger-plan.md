# Robot Match Practice Logger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a phone-usable, no-backend match logger that lets the user tap live counters/stopwatches during a 3-minute robot match and generate a text block matching the existing WhatsApp-style template.

**Architecture:** Two files ship together: `app.js` holds all pure logic (state shape, counters, stopwatches, hasil auto-compute, template string generation, draft serialize/deserialize) with zero DOM access, so it can be both `<script src>`'d into the browser and `require()`'d from Node for tests. `index.html` holds markup, CSS, and a classic (non-module) `<script>` that wires DOM events to `app.js` functions and re-renders on every state change.

**Tech Stack:** Vanilla HTML/CSS/JS only. No build tool, no bundler, no npm packages, no CDN scripts. Tests run via plain `node:assert/strict` and `node:test` (both built into Node.js — no test framework installed).

## Global Constraints

- No build step, no server, no framework, no third-party dependency (spec: Architecture).
- Ships as `index.html` + `app.js` opened directly in a mobile browser via `file://` or any static host — classic `<script src>`, never `type="module"` (module scripts fail CORS checks under `file://` in Chrome).
- No network calls, no database, no spreadsheet export, no persisted match history (spec: Out of scope). The one `localStorage` key is crash-recovery for the in-progress match only, cleared on successful Generate.
- Generated output text must match the field names, order, and casing of the spec's template exactly:
  ```
  Hasil Latihan Match _
  Tanggal: Minggu, 4 Juli 2026

  RICHIE: Tim (merah or biru)
  Skor Akhir: Tim Biru (..) - Tim Merah (..)
  Hasil: Menang or Kalah
  Waktu pertandingan: Game 3 menit

  statistik Robot 1 (R1)
  kotak: (banyak kotak yang diambil)
  tongkat: (waktu ambil tongkat dalam detik)
  assembly: (dalam detik)
  retry: (bayak retry)

  Statistik Robot 2 (R2)
  Kotak: (banyak kotak yang diambil)
  Spearhead: (waktu ambil spearhead dalam detik)
  Retry: (banyak retry)

  Catatan: robotnya gimana
  ```
  Note the deliberate case mismatch preserved from the original template: `statistik`/`kotak`/`tongkat`/`assembly`/`retry` are lowercase under R1, `Statistik`/`Kotak`/`Spearhead`/`Retry` are capitalized under R2.
- Counters floor at 0. Stopwatches are timestamp-based (`Date.now()` diff), never a naive per-tick increment, so a backgrounded tab doesn't desync elapsed time.

---

## File Structure

- `app.js` — pure logic, no DOM, no globals except one namespace object. Isomorphic: works as a browser global (`window.RobotLog`) and as a Node module (`module.exports`).
- `index.html` — markup + inline `<style>` + inline classic `<script src="app.js">` + inline classic `<script>` for DOM wiring.
- `tests/app.test.js` — Node test file (`node --test tests/app.test.js`), covers every pure function in `app.js`.

---

### Task 1: State shape + counters (pure logic)

**Files:**
- Create: `app.js`
- Test: `tests/app.test.js`

**Interfaces:**
- Produces: `RobotLog.createInitialState()` → state object with shape:
  ```js
  {
    tanggal: null, tim: null, waktuPertandingan: '3 menit',
    r1: { kotak: 0, retry: 0,
          tongkat: { running: false, startedAt: null, elapsedMs: 0 },
          assembly: { running: false, startedAt: null, elapsedMs: 0 } },
    r2: { kotak: 0, retry: 0,
          spearhead: { running: false, startedAt: null, elapsedMs: 0 } },
    skorBiru: 0, skorMerah: 0, hasilOverride: null, catatan: ''
  }
  ```
- Produces: `RobotLog.incrementCount(value)` → `number`
- Produces: `RobotLog.decrementCount(value)` → `number`, floors at 0

- [ ] **Step 1: Write the failing tests**

Create `tests/app.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const RobotLog = require('../app.js');

test('createInitialState returns the expected shape', () => {
  const state = RobotLog.createInitialState();
  assert.deepEqual(state, {
    tanggal: null, tim: null, waktuPertandingan: '3 menit',
    r1: { kotak: 0, retry: 0,
          tongkat: { running: false, startedAt: null, elapsedMs: 0 },
          assembly: { running: false, startedAt: null, elapsedMs: 0 } },
    r2: { kotak: 0, retry: 0,
          spearhead: { running: false, startedAt: null, elapsedMs: 0 } },
    skorBiru: 0, skorMerah: 0, hasilOverride: null, catatan: ''
  });
});

test('incrementCount adds one', () => {
  assert.equal(RobotLog.incrementCount(0), 1);
  assert.equal(RobotLog.incrementCount(5), 6);
});

test('decrementCount subtracts one but floors at 0', () => {
  assert.equal(RobotLog.decrementCount(5), 4);
  assert.equal(RobotLog.decrementCount(1), 0);
  assert.equal(RobotLog.decrementCount(0), 0);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/app.test.js`
Expected: FAIL — `Cannot find module '../app.js'`

- [ ] **Step 3: Write minimal implementation**

Create `app.js`:

```js
(function (root) {
  'use strict';

  function createInitialState() {
    return {
      tanggal: null,
      tim: null,
      waktuPertandingan: '3 menit',
      r1: {
        kotak: 0,
        retry: 0,
        tongkat: { running: false, startedAt: null, elapsedMs: 0 },
        assembly: { running: false, startedAt: null, elapsedMs: 0 }
      },
      r2: {
        kotak: 0,
        retry: 0,
        spearhead: { running: false, startedAt: null, elapsedMs: 0 }
      },
      skorBiru: 0,
      skorMerah: 0,
      hasilOverride: null,
      catatan: ''
    };
  }

  function incrementCount(value) {
    return value + 1;
  }

  function decrementCount(value) {
    return value > 0 ? value - 1 : 0;
  }

  var RobotLog = {
    createInitialState: createInitialState,
    incrementCount: incrementCount,
    decrementCount: decrementCount
  };

  root.RobotLog = RobotLog;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = RobotLog;
  }
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/app.test.js`
Expected: PASS — 3 tests passing

- [ ] **Step 5: Commit**

```bash
git add app.js tests/app.test.js
git commit -m "feat: add state model and counter logic"
```

---

### Task 2: Stopwatch logic (pure logic)

**Files:**
- Modify: `app.js`
- Modify: `tests/app.test.js`

**Interfaces:**
- Consumes: stopwatch shape `{ running: bool, startedAt: number|null, elapsedMs: number }` from Task 1.
- Produces: `RobotLog.startStopwatch(sw, now)` → new stopwatch object
- Produces: `RobotLog.stopStopwatch(sw, now)` → new stopwatch object
- Produces: `RobotLog.resetStopwatch()` → new stopwatch object, all zeroed
- Produces: `RobotLog.setStopwatchSeconds(sw, seconds)` → new stopwatch object, paused, `elapsedMs = round(seconds*1000)`, floors at 0
- Produces: `RobotLog.getElapsedSeconds(sw, now)` → `number`, rounded seconds, accounts for still-running state

- [ ] **Step 1: Write the failing tests**

Append to `tests/app.test.js`:

```js
test('startStopwatch marks running and records start time', () => {
  const sw = { running: false, startedAt: null, elapsedMs: 0 };
  const started = RobotLog.startStopwatch(sw, 1000);
  assert.deepEqual(started, { running: true, startedAt: 1000, elapsedMs: 0 });
});

test('startStopwatch is a no-op if already running', () => {
  const sw = { running: true, startedAt: 500, elapsedMs: 200 };
  const started = RobotLog.startStopwatch(sw, 9999);
  assert.deepEqual(started, sw);
});

test('stopStopwatch folds elapsed time into elapsedMs', () => {
  const sw = { running: true, startedAt: 1000, elapsedMs: 200 };
  const stopped = RobotLog.stopStopwatch(sw, 1500);
  assert.deepEqual(stopped, { running: false, startedAt: null, elapsedMs: 700 });
});

test('stopStopwatch is a no-op if already stopped', () => {
  const sw = { running: false, startedAt: null, elapsedMs: 700 };
  const stopped = RobotLog.stopStopwatch(sw, 9999);
  assert.deepEqual(stopped, sw);
});

test('resetStopwatch zeroes everything', () => {
  assert.deepEqual(RobotLog.resetStopwatch(), { running: false, startedAt: null, elapsedMs: 0 });
});

test('setStopwatchSeconds pauses and overrides elapsed time', () => {
  const sw = { running: true, startedAt: 1000, elapsedMs: 200 };
  const edited = RobotLog.setStopwatchSeconds(sw, 12.4);
  assert.deepEqual(edited, { running: false, startedAt: null, elapsedMs: 12400 });
});

test('setStopwatchSeconds floors negative input at 0', () => {
  const edited = RobotLog.setStopwatchSeconds({ running: false, startedAt: null, elapsedMs: 0 }, -5);
  assert.equal(edited.elapsedMs, 0);
});

test('getElapsedSeconds returns stored value when stopped', () => {
  const sw = { running: false, startedAt: null, elapsedMs: 4300 };
  assert.equal(RobotLog.getElapsedSeconds(sw, 99999), 4);
});

test('getElapsedSeconds adds in-flight time when running', () => {
  const sw = { running: true, startedAt: 1000, elapsedMs: 2000 };
  assert.equal(RobotLog.getElapsedSeconds(sw, 4500), 5);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/app.test.js`
Expected: FAIL — `RobotLog.startStopwatch is not a function` (and similar for the other four)

- [ ] **Step 3: Write minimal implementation**

In `app.js`, add these functions above the `var RobotLog = {` line:

```js
  function startStopwatch(sw, now) {
    if (sw.running) return sw;
    return { running: true, startedAt: now, elapsedMs: sw.elapsedMs };
  }

  function stopStopwatch(sw, now) {
    if (!sw.running) return sw;
    return { running: false, startedAt: null, elapsedMs: sw.elapsedMs + (now - sw.startedAt) };
  }

  function resetStopwatch() {
    return { running: false, startedAt: null, elapsedMs: 0 };
  }

  function setStopwatchSeconds(sw, seconds) {
    var ms = Math.max(0, Math.round(seconds * 1000));
    return { running: false, startedAt: null, elapsedMs: ms };
  }

  function getElapsedSeconds(sw, now) {
    var ms = sw.running ? sw.elapsedMs + (now - sw.startedAt) : sw.elapsedMs;
    return Math.round(ms / 1000);
  }
```

Then update the `RobotLog` object literal to add the five new entries:

```js
  var RobotLog = {
    createInitialState: createInitialState,
    incrementCount: incrementCount,
    decrementCount: decrementCount,
    startStopwatch: startStopwatch,
    stopStopwatch: stopStopwatch,
    resetStopwatch: resetStopwatch,
    setStopwatchSeconds: setStopwatchSeconds,
    getElapsedSeconds: getElapsedSeconds
  };
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/app.test.js`
Expected: PASS — 12 tests passing

- [ ] **Step 5: Commit**

```bash
git add app.js tests/app.test.js
git commit -m "feat: add stopwatch logic"
```

---

### Task 3: Hasil auto-compute (pure logic)

**Files:**
- Modify: `app.js`
- Modify: `tests/app.test.js`

**Interfaces:**
- Produces: `RobotLog.computeHasil(tim, skorBiru, skorMerah)` → `'menang' | 'kalah' | null` (`null` on tie)
- Produces: `RobotLog.resolveHasil(tim, skorBiru, skorMerah, override)` → `override` if truthy, else `computeHasil(...)`

- [ ] **Step 1: Write the failing tests**

Append to `tests/app.test.js`:

```js
test('computeHasil: tim biru wins when skorBiru is higher', () => {
  assert.equal(RobotLog.computeHasil('biru', 10, 5), 'menang');
});

test('computeHasil: tim biru loses when skorMerah is higher', () => {
  assert.equal(RobotLog.computeHasil('biru', 5, 10), 'kalah');
});

test('computeHasil: tim merah wins when skorMerah is higher', () => {
  assert.equal(RobotLog.computeHasil('merah', 5, 10), 'menang');
});

test('computeHasil: tim merah loses when skorBiru is higher', () => {
  assert.equal(RobotLog.computeHasil('merah', 10, 5), 'kalah');
});

test('computeHasil: tie returns null, no silent default', () => {
  assert.equal(RobotLog.computeHasil('biru', 7, 7), null);
});

test('resolveHasil: override wins over computed result', () => {
  assert.equal(RobotLog.resolveHasil('biru', 10, 5, 'kalah'), 'kalah');
});

test('resolveHasil: falls back to computeHasil when no override', () => {
  assert.equal(RobotLog.resolveHasil('biru', 10, 5, null), 'menang');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/app.test.js`
Expected: FAIL — `RobotLog.computeHasil is not a function`

- [ ] **Step 3: Write minimal implementation**

In `app.js`, add above the `var RobotLog = {` line:

```js
  function computeHasil(tim, skorBiru, skorMerah) {
    if (skorBiru === skorMerah) return null;
    if (tim === 'biru') return skorBiru > skorMerah ? 'menang' : 'kalah';
    if (tim === 'merah') return skorMerah > skorBiru ? 'menang' : 'kalah';
    return null;
  }

  function resolveHasil(tim, skorBiru, skorMerah, override) {
    if (override) return override;
    return computeHasil(tim, skorBiru, skorMerah);
  }
```

Add to the `RobotLog` object literal:

```js
    computeHasil: computeHasil,
    resolveHasil: resolveHasil
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/app.test.js`
Expected: PASS — 19 tests passing

- [ ] **Step 5: Commit**

```bash
git add app.js tests/app.test.js
git commit -m "feat: add hasil auto-compute logic"
```

---

### Task 4: Template text generator (pure logic)

**Files:**
- Modify: `app.js`
- Modify: `tests/app.test.js`

**Interfaces:**
- Consumes: state shape from Task 1, `resolveHasil` from Task 3, `getElapsedSeconds` from Task 2.
- Produces: `RobotLog.formatTanggalIndonesia(isoDateStr)` → `string`, e.g. `'2026-07-04'` → `'Sabtu, 4 Juli 2026'`
- Produces: `RobotLog.formatTemplate(state, now)` → `string`, the full generated text block

- [ ] **Step 1: Write the failing tests**

Append to `tests/app.test.js`:

```js
test('formatTanggalIndonesia formats an ISO date in Indonesian', () => {
  assert.equal(RobotLog.formatTanggalIndonesia('2026-07-04'), 'Sabtu, 4 Juli 2026');
  assert.equal(RobotLog.formatTanggalIndonesia('2026-01-01'), 'Kamis, 1 Januari 2026');
});

test('formatTemplate produces the exact template with real values substituted', () => {
  const state = {
    tanggal: '2026-07-04',
    tim: 'biru',
    waktuPertandingan: '3 menit',
    r1: {
      kotak: 7,
      retry: 2,
      tongkat: { running: false, startedAt: null, elapsedMs: 12400 },
      assembly: { running: false, startedAt: null, elapsedMs: 45000 }
    },
    r2: {
      kotak: 5,
      retry: 1,
      spearhead: { running: false, startedAt: null, elapsedMs: 8000 }
    },
    skorBiru: 20,
    skorMerah: 15,
    hasilOverride: null,
    catatan: 'Robot lancar, cuma retry di kotak terakhir'
  };

  const expected = [
    'Hasil Latihan Match _',
    'Tanggal: Sabtu, 4 Juli 2026',
    '',
    'RICHIE: Tim Biru',
    'Skor Akhir: Tim Biru (20) - Tim Merah (15)',
    'Hasil: Menang',
    'Waktu pertandingan: Game 3 menit',
    '',
    'statistik Robot 1 (R1)',
    'kotak: 7',
    'tongkat: 12',
    'assembly: 45',
    'retry: 2',
    '',
    'Statistik Robot 2 (R2)',
    'Kotak: 5',
    'Spearhead: 8',
    'Retry: 1',
    '',
    'Catatan: Robot lancar, cuma retry di kotak terakhir'
  ].join('\n');

  assert.equal(RobotLog.formatTemplate(state, 0), expected);
});

test('formatTemplate shows a placeholder Hasil when scores tie and no override', () => {
  const state = {
    tanggal: '2026-07-04', tim: 'biru', waktuPertandingan: '3 menit',
    r1: { kotak: 0, retry: 0, tongkat: { running: false, startedAt: null, elapsedMs: 0 }, assembly: { running: false, startedAt: null, elapsedMs: 0 } },
    r2: { kotak: 0, retry: 0, spearhead: { running: false, startedAt: null, elapsedMs: 0 } },
    skorBiru: 10, skorMerah: 10, hasilOverride: null, catatan: ''
  };
  const text = RobotLog.formatTemplate(state, 0);
  assert.match(text, /Hasil: \(belum ditentukan\)/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/app.test.js`
Expected: FAIL — `RobotLog.formatTanggalIndonesia is not a function`

- [ ] **Step 3: Write minimal implementation**

In `app.js`, add above the `var RobotLog = {` line:

```js
  var HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  var BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli',
    'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  function formatTanggalIndonesia(isoDateStr) {
    var parts = isoDateStr.split('-');
    var y = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10) - 1;
    var d = parseInt(parts[2], 10);
    var date = new Date(y, m, d);
    return HARI[date.getDay()] + ', ' + d + ' ' + BULAN[m] + ' ' + y;
  }

  function capitalize(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  function formatTemplate(state, now) {
    var tanggalStr = formatTanggalIndonesia(state.tanggal);
    var hasil = resolveHasil(state.tim, state.skorBiru, state.skorMerah, state.hasilOverride);
    var hasilStr = hasil === 'menang' ? 'Menang' : (hasil === 'kalah' ? 'Kalah' : '(belum ditentukan)');
    var tongkatSec = getElapsedSeconds(state.r1.tongkat, now);
    var assemblySec = getElapsedSeconds(state.r1.assembly, now);
    var spearheadSec = getElapsedSeconds(state.r2.spearhead, now);

    return [
      'Hasil Latihan Match _',
      'Tanggal: ' + tanggalStr,
      '',
      'RICHIE: Tim ' + capitalize(state.tim),
      'Skor Akhir: Tim Biru (' + state.skorBiru + ') - Tim Merah (' + state.skorMerah + ')',
      'Hasil: ' + hasilStr,
      'Waktu pertandingan: Game ' + state.waktuPertandingan,
      '',
      'statistik Robot 1 (R1)',
      'kotak: ' + state.r1.kotak,
      'tongkat: ' + tongkatSec,
      'assembly: ' + assemblySec,
      'retry: ' + state.r1.retry,
      '',
      'Statistik Robot 2 (R2)',
      'Kotak: ' + state.r2.kotak,
      'Spearhead: ' + spearheadSec,
      'Retry: ' + state.r2.retry,
      '',
      'Catatan: ' + (state.catatan || '')
    ].join('\n');
  }
```

Add to the `RobotLog` object literal:

```js
    formatTanggalIndonesia: formatTanggalIndonesia,
    formatTemplate: formatTemplate
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/app.test.js`
Expected: PASS — 22 tests passing

- [ ] **Step 5: Commit**

```bash
git add app.js tests/app.test.js
git commit -m "feat: add template text generator"
```

---

### Task 5: Draft serialize/deserialize (pure logic)

**Files:**
- Modify: `app.js`
- Modify: `tests/app.test.js`

**Interfaces:**
- Produces: `RobotLog.serializeDraft(state)` → `string` (JSON)
- Produces: `RobotLog.deserializeDraft(json)` → parsed state object, or `null` if `json` is falsy or invalid JSON

- [ ] **Step 1: Write the failing tests**

Append to `tests/app.test.js`:

```js
test('serializeDraft/deserializeDraft round-trip a state object', () => {
  const state = RobotLog.createInitialState();
  state.r1.kotak = 3;
  const json = RobotLog.serializeDraft(state);
  assert.equal(typeof json, 'string');
  assert.deepEqual(RobotLog.deserializeDraft(json), state);
});

test('deserializeDraft returns null for empty input', () => {
  assert.equal(RobotLog.deserializeDraft(null), null);
  assert.equal(RobotLog.deserializeDraft(''), null);
});

test('deserializeDraft returns null for invalid JSON', () => {
  assert.equal(RobotLog.deserializeDraft('{not json'), null);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/app.test.js`
Expected: FAIL — `RobotLog.serializeDraft is not a function`

- [ ] **Step 3: Write minimal implementation**

In `app.js`, add above the `var RobotLog = {` line:

```js
  function serializeDraft(state) {
    return JSON.stringify(state);
  }

  function deserializeDraft(json) {
    if (!json) return null;
    try {
      return JSON.parse(json);
    } catch (e) {
      return null;
    }
  }
```

Add to the `RobotLog` object literal:

```js
    serializeDraft: serializeDraft,
    deserializeDraft: deserializeDraft
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/app.test.js`
Expected: PASS — 25 tests passing

- [ ] **Step 5: Commit**

```bash
git add app.js tests/app.test.js
git commit -m "feat: add draft serialize/deserialize"
```

---

### Task 6: HTML skeleton, CSS, match info bar

**Files:**
- Create: `index.html`

**Interfaces:**
- Consumes: `RobotLog.createInitialState()` from Task 1.
- Produces: a `state` variable in `index.html`'s inline script, and a `render()` function that later tasks extend. Match info bar fields write directly into `state.tanggal`, `state.tim`, `state.waktuPertandingan`.

- [ ] **Step 1: Create `index.html` with skeleton, CSS, and the match info bar**

```html
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<title>Robot Match Logger</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: system-ui, sans-serif;
    margin: 0;
    padding: 12px;
    background: #111;
    color: #eee;
  }
  h2 { font-size: 16px; margin: 16px 0 8px; }
  .bar {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    margin-bottom: 8px;
  }
  input[type="date"], input[type="text"], input[type="number"] {
    font-size: 16px;
    padding: 8px;
    border-radius: 6px;
    border: 1px solid #555;
    background: #222;
    color: #eee;
  }
  button {
    font-size: 16px;
    padding: 10px 14px;
    border-radius: 8px;
    border: 1px solid #555;
    background: #333;
    color: #eee;
    min-height: 44px;
    min-width: 44px;
  }
  button[aria-pressed="true"] { background: #4a7; color: #002; font-weight: bold; }
  .columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .robot-card {
    border: 1px solid #444;
    border-radius: 8px;
    padding: 8px;
  }
  .stat-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    margin-bottom: 8px;
  }
  .stat-row .label { font-size: 13px; flex: 1; }
  .count-value, .time-value {
    font-size: 20px;
    font-weight: bold;
    min-width: 2.5em;
    text-align: center;
  }
  textarea {
    width: 100%;
    font-size: 14px;
    padding: 8px;
    border-radius: 6px;
    border: 1px solid #555;
    background: #222;
    color: #eee;
  }
  #draft-banner {
    display: none;
    background: #654;
    padding: 8px;
    border-radius: 6px;
    margin-bottom: 8px;
  }
</style>
</head>
<body>

  <div id="draft-banner">Draft match sebelumnya dipulihkan.</div>

  <h2>Info Match</h2>
  <div class="bar">
    <input type="date" id="tanggal">
    <button id="tim-biru" aria-pressed="false">Tim Biru</button>
    <button id="tim-merah" aria-pressed="false">Tim Merah</button>
    <input type="text" id="waktu" value="3 menit">
  </div>

  <script src="app.js"></script>
  <script>
    var state = RobotLog.createInitialState();

    function todayIso() {
      var d = new Date();
      var y = d.getFullYear();
      var m = String(d.getMonth() + 1).padStart(2, '0');
      var day = String(d.getDate()).padStart(2, '0');
      return y + '-' + m + '-' + day;
    }

    function render() {
      document.getElementById('tanggal').value = state.tanggal || '';
      document.getElementById('waktu').value = state.waktuPertandingan;
      document.getElementById('tim-biru').setAttribute('aria-pressed', state.tim === 'biru');
      document.getElementById('tim-merah').setAttribute('aria-pressed', state.tim === 'merah');
    }

    document.getElementById('tanggal').addEventListener('change', function (e) {
      state.tanggal = e.target.value;
    });
    document.getElementById('waktu').addEventListener('input', function (e) {
      state.waktuPertandingan = e.target.value;
    });
    document.getElementById('tim-biru').addEventListener('click', function () {
      state.tim = 'biru';
      render();
    });
    document.getElementById('tim-merah').addEventListener('click', function () {
      state.tim = 'merah';
      render();
    });

    state.tanggal = todayIso();
    render();
  </script>
</body>
</html>
```

- [ ] **Step 2: Manually verify in a browser**

Open `index.html` directly in Chrome (double-click the file, or `start index.html` on Windows).
Expected:
- Page loads with no console errors (check via DevTools).
- Tanggal field shows today's date by default.
- Tapping "Tim Biru" highlights it (green background) and un-highlights "Tim Merah", and vice versa.
- Waktu field is editable and defaults to "3 menit".

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add HTML skeleton, CSS, and match info bar"
```

---

### Task 7: Live tracking UI — counters and stopwatches

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: `state.r1`/`state.r2` from Task 1, `RobotLog.incrementCount`/`decrementCount` from Task 1, `RobotLog.startStopwatch`/`stopStopwatch`/`resetStopwatch`/`setStopwatchSeconds`/`getElapsedSeconds` from Task 2.
- Produces: extends `render()` to also paint the live tracking columns; adds a `requestAnimationFrame` tick loop (`tickLoop()`) that later tasks reuse for the output/copy screen if needed.

- [ ] **Step 1: Add the live tracking markup**

Insert this block right after the `<div class="bar">...</div>` from Task 6, before the `<script src="app.js">` line:

```html
  <h2>Live Tracking</h2>
  <div class="columns">
    <div class="robot-card">
      <strong>Robot 1 (R1)</strong>

      <div class="stat-row">
        <span class="label">Kotak</span>
        <button id="r1-kotak-minus">-1</button>
        <span class="count-value" id="r1-kotak-value">0</span>
        <button id="r1-kotak-plus">+1</button>
      </div>

      <div class="stat-row">
        <span class="label">Tongkat (detik)</span>
        <span class="time-value" id="r1-tongkat-value">0</span>
        <button id="r1-tongkat-toggle">Start</button>
        <button id="r1-tongkat-reset">Reset</button>
      </div>
      <div class="stat-row">
        <input type="number" id="r1-tongkat-manual" placeholder="edit manual (detik)">
      </div>

      <div class="stat-row">
        <span class="label">Assembly (detik)</span>
        <span class="time-value" id="r1-assembly-value">0</span>
        <button id="r1-assembly-toggle">Start</button>
        <button id="r1-assembly-reset">Reset</button>
      </div>
      <div class="stat-row">
        <input type="number" id="r1-assembly-manual" placeholder="edit manual (detik)">
      </div>

      <div class="stat-row">
        <span class="label">Retry</span>
        <button id="r1-retry-minus">-1</button>
        <span class="count-value" id="r1-retry-value">0</span>
        <button id="r1-retry-plus">+1</button>
      </div>
    </div>

    <div class="robot-card">
      <strong>Robot 2 (R2)</strong>

      <div class="stat-row">
        <span class="label">Kotak</span>
        <button id="r2-kotak-minus">-1</button>
        <span class="count-value" id="r2-kotak-value">0</span>
        <button id="r2-kotak-plus">+1</button>
      </div>

      <div class="stat-row">
        <span class="label">Spearhead (detik)</span>
        <span class="time-value" id="r2-spearhead-value">0</span>
        <button id="r2-spearhead-toggle">Start</button>
        <button id="r2-spearhead-reset">Reset</button>
      </div>
      <div class="stat-row">
        <input type="number" id="r2-spearhead-manual" placeholder="edit manual (detik)">
      </div>

      <div class="stat-row">
        <span class="label">Retry</span>
        <button id="r2-retry-minus">-1</button>
        <span class="count-value" id="r2-retry-value">0</span>
        <button id="r2-retry-plus">+1</button>
      </div>
    </div>
  </div>
```

- [ ] **Step 2: Wire the counters and stopwatches**

In the inline `<script>` block from Task 6, add this helper and wiring code right before the final `state.tanggal = todayIso(); render();` lines, and extend `render()`:

```js
    function wireCounter(prefix, robotKey, field) {
      document.getElementById(prefix + '-plus').addEventListener('click', function () {
        state[robotKey][field] = RobotLog.incrementCount(state[robotKey][field]);
        render();
      });
      document.getElementById(prefix + '-minus').addEventListener('click', function () {
        state[robotKey][field] = RobotLog.decrementCount(state[robotKey][field]);
        render();
      });
    }

    function wireStopwatch(prefix, robotKey, field) {
      document.getElementById(prefix + '-toggle').addEventListener('click', function () {
        var sw = state[robotKey][field];
        state[robotKey][field] = sw.running
          ? RobotLog.stopStopwatch(sw, Date.now())
          : RobotLog.startStopwatch(sw, Date.now());
        render();
      });
      document.getElementById(prefix + '-reset').addEventListener('click', function () {
        state[robotKey][field] = RobotLog.resetStopwatch();
        render();
      });
      document.getElementById(prefix + '-manual').addEventListener('change', function (e) {
        var seconds = parseFloat(e.target.value);
        if (isNaN(seconds)) return;
        state[robotKey][field] = RobotLog.setStopwatchSeconds(state[robotKey][field], seconds);
        e.target.value = '';
        render();
      });
    }

    wireCounter('r1-kotak', 'r1', 'kotak');
    wireCounter('r1-retry', 'r1', 'retry');
    wireCounter('r2-kotak', 'r2', 'kotak');
    wireCounter('r2-retry', 'r2', 'retry');
    wireStopwatch('r1-tongkat', 'r1', 'tongkat');
    wireStopwatch('r1-assembly', 'r1', 'assembly');
    wireStopwatch('r2-spearhead', 'r2', 'spearhead');

    function tickLoop() {
      var now = Date.now();
      document.getElementById('r1-tongkat-value').textContent = RobotLog.getElapsedSeconds(state.r1.tongkat, now);
      document.getElementById('r1-assembly-value').textContent = RobotLog.getElapsedSeconds(state.r1.assembly, now);
      document.getElementById('r2-spearhead-value').textContent = RobotLog.getElapsedSeconds(state.r2.spearhead, now);
      requestAnimationFrame(tickLoop);
    }
```

Extend `render()` (the one defined in Task 6) by adding these lines inside its body:

```js
      document.getElementById('r1-kotak-value').textContent = state.r1.kotak;
      document.getElementById('r1-retry-value').textContent = state.r1.retry;
      document.getElementById('r2-kotak-value').textContent = state.r2.kotak;
      document.getElementById('r2-retry-value').textContent = state.r2.retry;
      document.getElementById('r1-tongkat-toggle').textContent = state.r1.tongkat.running ? 'Stop' : 'Start';
      document.getElementById('r1-assembly-toggle').textContent = state.r1.assembly.running ? 'Stop' : 'Start';
      document.getElementById('r2-spearhead-toggle').textContent = state.r2.spearhead.running ? 'Stop' : 'Start';
```

Finally, change the last line of the script from `render();` to:

```js
    render();
    tickLoop();
```

- [ ] **Step 3: Manually verify in a browser**

Reload `index.html`.
Expected:
- Kotak/Retry `+1`/`-1` buttons update the number immediately on both columns; `-1` never goes below 0.
- Tapping "Start" on Tongkat flips its label to "Stop" and the seconds counter climbs live, once per second (visually).
- Tapping "Stop" freezes the displayed seconds.
- Tongkat and Assembly stopwatches can run at the same time without interfering with each other.
- Typing a number into a manual-edit field and blurring/tabbing away sets that stopwatch's displayed value and stops it if it was running.
- Tapping "Reset" sets a stopwatch back to 0 and label back to "Start".

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: wire live tracking counters and stopwatches"
```

---

### Task 8: Post-match section — scores, hasil, catatan

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: `state.skorBiru`/`skorMerah`/`hasilOverride`/`catatan` from Task 1, `RobotLog.resolveHasil` from Task 3.
- Produces: extends `render()` to paint the hasil auto-compute result.

- [ ] **Step 1: Add the post-match markup**

Insert this block right after the `<div class="columns">...</div>` from Task 7, before the `<script src="app.js">` line:

```html
  <h2>Post-Match</h2>
  <div class="bar">
    <label>Skor Biru <input type="number" id="skor-biru" value="0" min="0"></label>
    <label>Skor Merah <input type="number" id="skor-merah" value="0" min="0"></label>
  </div>
  <div class="bar">
    <span>Hasil: <strong id="hasil-value">-</strong></span>
    <button id="hasil-menang">Paksa Menang</button>
    <button id="hasil-kalah">Paksa Kalah</button>
    <button id="hasil-clear">Clear Override</button>
  </div>
  <div class="bar">
    <textarea id="catatan" rows="3" placeholder="Catatan: robotnya gimana"></textarea>
  </div>
```

- [ ] **Step 2: Wire the post-match fields**

In the inline `<script>` block, add this wiring code after the Task 7 wiring calls (still before `render(); tickLoop();`):

```js
    document.getElementById('skor-biru').addEventListener('input', function (e) {
      state.skorBiru = parseInt(e.target.value, 10) || 0;
      render();
    });
    document.getElementById('skor-merah').addEventListener('input', function (e) {
      state.skorMerah = parseInt(e.target.value, 10) || 0;
      render();
    });
    document.getElementById('hasil-menang').addEventListener('click', function () {
      state.hasilOverride = 'menang';
      render();
    });
    document.getElementById('hasil-kalah').addEventListener('click', function () {
      state.hasilOverride = 'kalah';
      render();
    });
    document.getElementById('hasil-clear').addEventListener('click', function () {
      state.hasilOverride = null;
      render();
    });
    document.getElementById('catatan').addEventListener('input', function (e) {
      state.catatan = e.target.value;
    });
```

Extend `render()` with:

```js
      var hasil = RobotLog.resolveHasil(state.tim, state.skorBiru, state.skorMerah, state.hasilOverride);
      document.getElementById('hasil-value').textContent =
        hasil === 'menang' ? 'Menang' : (hasil === 'kalah' ? 'Kalah' : '(belum ditentukan)');
```

- [ ] **Step 3: Manually verify in a browser**

Reload `index.html`.
Expected:
- Setting Skor Biru/Merah with a Tim selected auto-updates "Hasil" to Menang/Kalah correctly for that tim.
- Setting both scores equal shows "Hasil: (belum ditentukan)".
- "Paksa Menang"/"Paksa Kalah" override the displayed Hasil regardless of scores; "Clear Override" returns to auto-compute.
- Typing in Catatan is retained (check by typing, then re-triggering a render via any other control — text stays).

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: wire post-match scores, hasil override, and catatan"
```

---

### Task 9: Generate, Copy, Share

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: `RobotLog.formatTemplate(state, now)` from Task 4.
- Produces: `#output` textarea populated on demand; no new state fields.

- [ ] **Step 1: Add the output markup**

Insert this block right after the Post-Match `<div class="bar">` containing `#catatan` (from Task 8), before the `<script src="app.js">` line:

```html
  <h2>Output</h2>
  <div class="bar">
    <button id="generate-btn">Generate</button>
    <button id="copy-btn">Copy</button>
    <button id="share-btn" style="display:none;">Share</button>
  </div>
  <textarea id="output" rows="20" readonly></textarea>
```

- [ ] **Step 2: Wire Generate, Copy, Share**

In the inline `<script>` block, add after the Task 8 wiring calls (still before `render(); tickLoop();`):

```js
    if (navigator.share) {
      document.getElementById('share-btn').style.display = '';
    }

    document.getElementById('generate-btn').addEventListener('click', function () {
      var text = RobotLog.formatTemplate(state, Date.now());
      document.getElementById('output').value = text;
    });

    document.getElementById('copy-btn').addEventListener('click', function () {
      var output = document.getElementById('output');
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

    document.getElementById('share-btn').addEventListener('click', function () {
      var text = document.getElementById('output').value;
      if (!text) return;
      navigator.share({ text: text }).catch(function () {});
    });
```

- [ ] **Step 3: Manually verify in a browser**

Reload `index.html`. Fill in a few fields, tap counters, run a stopwatch briefly.
Expected:
- Tapping "Generate" fills the `#output` textarea with text matching the template's field names/order/casing, with real values substituted.
- Tapping "Copy" then pasting elsewhere (e.g. the address bar) reproduces the exact same text.
- On a browser/device with Web Share support, "Share" opens the native share sheet; on desktop Chrome without support, the button stays hidden.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: wire generate, copy, and share output"
```

---

### Task 10: localStorage draft autosave and restore

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: `RobotLog.serializeDraft`/`deserializeDraft` from Task 5.
- Produces: draft persisted under `localStorage` key `'robot-match-draft'`, restored on load, cleared after a successful Generate.

- [ ] **Step 1: Wire autosave, restore, and clear-on-generate**

In the inline `<script>` block, replace the line `state.tanggal = todayIso();` (from Task 6) with:

```js
    var DRAFT_KEY = 'robot-match-draft';
    var restored = RobotLog.deserializeDraft(localStorage.getItem(DRAFT_KEY));
    if (restored) {
      state = restored;
      document.getElementById('draft-banner').style.display = 'block';
    } else {
      state.tanggal = todayIso();
    }

    function saveDraft() {
      localStorage.setItem(DRAFT_KEY, RobotLog.serializeDraft(state));
    }
```

Then, at the very end of `render()`'s body (last line before its closing `}`), add:

```js
      saveDraft();
```

Finally, in the `generate-btn` click handler from Task 9, add a line after `document.getElementById('output').value = text;`:

```js
      localStorage.removeItem(DRAFT_KEY);
      document.getElementById('draft-banner').style.display = 'none';
```

- [ ] **Step 2: Manually verify in a browser**

- Fill in match info, tap a few counters, start a stopwatch. Reload the page (F5).
  Expected: the "Draft match sebelumnya dipulihkan" banner appears, and all previously entered values (counters, tim, tanggal, waktu) are restored exactly as left.
- Tap "Generate".
  Expected: the banner disappears (if visible) and reloading the page afterward starts a fresh, empty match (no draft restored) — confirm via DevTools > Application > Local Storage that the `robot-match-draft` key is gone.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add localStorage draft autosave and restore"
```

---

## Self-Review Notes

- **Spec coverage:** match info bar (Task 6), live tracking counters+stopwatches for both robots (Task 7), post-match scores/hasil/catatan (Task 8), generate/copy/share (Task 9), crash-recovery draft (Task 10), all pure logic backing every one of those UI tasks has dedicated tests (Tasks 1-5). Every section of the spec's "Components / screen layout" and "Error handling / edge cases" maps to a task above.
- **Placeholder scan:** no TBD/TODO; every step has runnable code.
- **Type/name consistency:** verified `RobotLog.*` function names and state field names (`r1.tongkat`, `r2.spearhead`, `hasilOverride`, etc.) are identical across Tasks 1-10 — the DOM-wiring tasks (6-10) call exactly the function names defined in Tasks 1-5.
- **Deviation from spec called out:** spec's Architecture section says "single self-contained static file"; this plan ships `app.js` alongside `index.html` so the risky logic (stopwatch math, hasil tie-break, exact template formatting) gets real automated tests instead of only manual QA. Still zero build step, zero server, zero framework, zero third-party dependency — just two authored files instead of one. Flagging here per spec review process; revert to single-file by inlining `app.js`'s contents into `index.html` if this split is unwanted.
