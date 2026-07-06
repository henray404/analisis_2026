const test = require('node:test');
const assert = require('node:assert/strict');
const RobotLog = require('../app.js');

test('createInitialState returns the expected shape', () => {
  const state = RobotLog.createInitialState();
  assert.deepEqual(state, {
    tanggal: null, matchNomor: '', tim: null, waktuPertandingan: '3 menit',
    matchTimer: { running: false, startedAt: null, elapsedMs: 0 },
    r1: { kotak: 0, retry: 0, tongkat: 0, assembly: 0 },
    r2: { kotak: 0, retry: 0, spearhead: 0 },
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

test('sanitizeManualSeconds keeps decimal precision, does not round', () => {
  assert.equal(RobotLog.sanitizeManualSeconds(12.4), 12.4);
  assert.equal(RobotLog.sanitizeManualSeconds(12.6), 12.6);
});

test('sanitizeManualSeconds floors negative input at 0', () => {
  assert.equal(RobotLog.sanitizeManualSeconds(-5), 0);
});

test('sanitizeManualSeconds returns null for non-numeric input', () => {
  assert.equal(RobotLog.sanitizeManualSeconds(NaN), null);
});

test('getElapsedSeconds returns stored value when stopped', () => {
  const sw = { running: false, startedAt: null, elapsedMs: 4300 };
  assert.equal(RobotLog.getElapsedSeconds(sw, 99999), 4);
});

test('getElapsedSeconds adds in-flight time when running', () => {
  const sw = { running: true, startedAt: 1000, elapsedMs: 2000 };
  assert.equal(RobotLog.getElapsedSeconds(sw, 4500), 5);
});

test('getElapsedSecondsPrecise returns unrounded fractional seconds when running', () => {
  const sw = { running: true, startedAt: 1000, elapsedMs: 2000 };
  assert.equal(RobotLog.getElapsedSecondsPrecise(sw, 4500), 5.5);
});

test('getElapsedSecondsPrecise returns unrounded fractional seconds when stopped', () => {
  const sw = { running: false, startedAt: null, elapsedMs: 4300 };
  assert.equal(RobotLog.getElapsedSecondsPrecise(sw, 99999), 4.3);
});

test('formatMatchTime formats seconds as mm.ss.cs, zero-padded', () => {
  assert.equal(RobotLog.formatMatchTime(0), '00.00.00');
  assert.equal(RobotLog.formatMatchTime(5.5), '00.05.50');
  assert.equal(RobotLog.formatMatchTime(65.25), '01.05.25');
});

test('formatMatchTime truncates (does not round) the centisecond part', () => {
  assert.equal(RobotLog.formatMatchTime(8.006), '00.08.00');
  assert.equal(RobotLog.formatMatchTime(12.437), '00.12.43');
});

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

test('computeHasil: tie returns null for merah team too', () => {
  assert.equal(RobotLog.computeHasil('merah', 7, 7), null);
});

test('resolveHasil: override = 0 (falsy) falls through to computeHasil', () => {
  assert.equal(RobotLog.resolveHasil('biru', 10, 5, 0), 'menang');
});

test('resolveHasil: override = "" (falsy) falls through to computeHasil', () => {
  assert.equal(RobotLog.resolveHasil('biru', 10, 5, ''), 'menang');
});

test('resolveHasil: override = undefined (falsy) falls through to computeHasil', () => {
  assert.equal(RobotLog.resolveHasil('biru', 10, 5, undefined), 'menang');
});

test('formatTanggalIndonesia formats an ISO date in Indonesian', () => {
  assert.equal(RobotLog.formatTanggalIndonesia('2026-07-04'), 'Sabtu, 4 Juli 2026');
  assert.equal(RobotLog.formatTanggalIndonesia('2026-01-01'), 'Kamis, 1 Januari 2026');
});

test('formatTemplate produces the exact template with real values substituted', () => {
  const state = {
    tanggal: '2026-07-04',
    matchNomor: '5',
    tim: 'biru',
    waktuPertandingan: '3 menit',
    r1: { kotak: 7, retry: 2, tongkat: 12.437, assembly: 45.1 },
    r2: { kotak: 5, retry: 1, spearhead: 8.006 },
    skorBiru: 20,
    skorMerah: 15,
    hasilOverride: null,
    catatan: 'Robot lancar, cuma retry di kotak terakhir'
  };

  const expected = [
    'Hasil Latihan Match 5',
    'Tanggal: Sabtu, 4 Juli 2026',
    '',
    'RICHIE: Tim Biru',
    'Skor Akhir: Tim Biru (20) - Tim Merah (15)',
    'Hasil: Menang',
    'Waktu pertandingan: Game 3 menit',
    '',
    'statistik Robot 1 (R1)',
    'kotak: 7',
    'tongkat: 00.12.43',
    'assembly: 00.45.10',
    'retry: 2',
    '',
    'Statistik Robot 2 (R2)',
    'Kotak: 5',
    'Spearhead: 00.08.00',
    'Retry: 1',
    '',
    'Catatan: Robot lancar, cuma retry di kotak terakhir'
  ].join('\n');

  assert.equal(RobotLog.formatTemplate(state), expected);
});

test('formatTemplate shows a placeholder Hasil when scores tie and no override', () => {
  const state = {
    tanggal: '2026-07-04', tim: 'biru', waktuPertandingan: '3 menit',
    r1: { kotak: 0, retry: 0, tongkat: 0, assembly: 0 },
    r2: { kotak: 0, retry: 0, spearhead: 0 },
    skorBiru: 10, skorMerah: 10, hasilOverride: null, catatan: ''
  };
  const text = RobotLog.formatTemplate(state);
  assert.match(text, /Hasil: \(belum ditentukan\)/);
});

test('formatTemplate shows Menang KFM when hasilOverride is kfm', () => {
  const state = {
    tanggal: '2026-07-04', tim: 'biru', waktuPertandingan: '3 menit',
    r1: { kotak: 0, retry: 0, tongkat: 0, assembly: 0 },
    r2: { kotak: 0, retry: 0, spearhead: 0 },
    skorBiru: 10, skorMerah: 10, hasilOverride: 'kfm', catatan: ''
  };
  const text = RobotLog.formatTemplate(state);
  assert.match(text, /Hasil: Menang KFM/);
});

test('formatTemplate falls back to underscore placeholder when matchNomor is not set', () => {
  const state = {
    tanggal: '2026-07-04', tim: 'biru', waktuPertandingan: '3 menit',
    r1: { kotak: 0, retry: 0, tongkat: 0, assembly: 0 },
    r2: { kotak: 0, retry: 0, spearhead: 0 },
    skorBiru: 0, skorMerah: 0, hasilOverride: null, catatan: ''
  };
  const text = RobotLog.formatTemplate(state);
  assert.match(text, /^Hasil Latihan Match _$/m);
});

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

test('formatTemplate does not throw when state.tim is null (no Tim selected yet)', () => {
  const state = {
    tanggal: '2026-07-04', tim: null, waktuPertandingan: '3 menit',
    r1: { kotak: 0, retry: 0, tongkat: 0, assembly: 0 },
    r2: { kotak: 0, retry: 0, spearhead: 0 },
    skorBiru: 0, skorMerah: 0, hasilOverride: null, catatan: ''
  };
  assert.doesNotThrow(() => RobotLog.formatTemplate(state));
  const text = RobotLog.formatTemplate(state);
  assert.match(text, /^RICHIE: Tim $/m);
});
