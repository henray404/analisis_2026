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

test('formatMenitDetik formats seconds as "m : s"', () => {
  assert.equal(RobotLog.formatMenitDetik(0), '0 : 0');
  assert.equal(RobotLog.formatMenitDetik(65), '1 : 5');
  assert.equal(RobotLog.formatMenitDetik(125), '2 : 5');
});

test('formatMenitDetik truncates fractional seconds', () => {
  assert.equal(RobotLog.formatMenitDetik(65.9), '1 : 5');
});

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
