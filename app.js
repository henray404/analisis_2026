(function (root) {
  'use strict';

  function createInitialState() {
    return {
      tanggal: null,
      matchNomor: '',
      tim: null,
      waktuPertandingan: '3 menit',
      matchTimer: { running: false, startedAt: null, elapsedMs: 0 },
      r1: {
        kotak: 0,
        retry: 0,
        tongkat: 0,
        assembly: 0,
        masukArena: 0
      },
      r2: {
        kotak: 0,
        retry: 0,
        spearhead: 0,
        masukArena: 0
      },
      berkeliaranMF: 0,
      poin: { arena1: 0, arena2: 0, arena3: 0 },
      matchSlots: {
        staff: 0, head: 0, assembly: 0,
        masukmf: 0, masukmfr2: 0,
        arena: 0, arenar2: 0
      },
      pks: createPksLog(),
      skorBiru: 0,
      skorMerah: 0,
      hasilOverride: null,
      catatan: ''
    };
  }

  // --- Match slot / PKS logging (format mengikuti template spreadsheet) ---
  function createPksLog() {
    return [[], [], [], [], [], [], [], [], []]; // grid 3x3
  }

  function appendPksEntry(pks, index, entry) {
    return pks.map(function (cell, i) {
      return i === index ? cell.concat([entry]) : cell;
    });
  }

  function formatPksCell(entries) {
    return entries.map(function (e) { return e.ts + '\n' + e.type; }).join('\n');
  }

  // Waktu buat sheet: "m:ss.cc" (contoh 1:23.45)
  function formatSheetTime(totalSeconds) {
    var t = totalSeconds > 0 ? totalSeconds : 0;
    var whole = Math.floor(t);
    var cc = Math.floor((t - whole) * 100);
    return Math.floor(whole / 60) + ':' + pad2(whole % 60) + '.' + pad2(cc);
  }

  // Geser semua nomor baris dalam range A1. 'A28:C29' + 32 -> 'A60:C61'
  function shiftRange(range, delta) {
    return range.replace(/([A-Za-z]+)(\d+)/g, function (_m, col, row) {
      return col + (parseInt(row, 10) + delta);
    });
  }

  function incrementCount(value) {
    return value + 1;
  }

  function decrementCount(value) {
    return value > 0 ? value - 1 : 0;
  }

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

  function sanitizeManualSeconds(seconds) {
    if (isNaN(seconds)) return null;
    return Math.max(0, seconds);
  }

  function getElapsedSeconds(sw, now) {
    var ms = sw.running ? sw.elapsedMs + (now - sw.startedAt) : sw.elapsedMs;
    return Math.floor(ms / 1000);
  }

  function getElapsedSecondsPrecise(sw, now) {
    var ms = sw.running ? sw.elapsedMs + (now - sw.startedAt) : sw.elapsedMs;
    return ms / 1000;
  }

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function formatMatchTime(totalSeconds) {
    var totalWholeSeconds = Math.floor(totalSeconds);
    var cs = Math.floor(totalSeconds * 100) % 100;
    var m = Math.floor(totalWholeSeconds / 60);
    var s = totalWholeSeconds % 60;
    return pad2(m) + '.' + pad2(s) + '.' + pad2(cs);
  }

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
    return word ? word.charAt(0).toUpperCase() + word.slice(1) : '';
  }

  function formatTemplate(state) {
    var tanggalStr = formatTanggalIndonesia(state.tanggal);
    var hasil = resolveHasil(state.tim, state.skorBiru, state.skorMerah, state.hasilOverride);
    var hasilStr = hasil === 'menang' ? 'Menang' :
      (hasil === 'kalah' ? 'Kalah' :
      (hasil === 'kfm' ? 'Menang KFM' : '(belum ditentukan)'));
    var tongkatSec = formatMatchTime(state.r1.tongkat);
    var assemblySec = formatMatchTime(state.r1.assembly);
    var spearheadSec = formatMatchTime(state.r2.spearhead);

    return [
      'Hasil Latihan Match ' + (state.matchNomor || '_'),
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

  function appendSequenceSlot(seq, slot) {
    return seq.concat([slot]);
  }

  function undoSequenceSlot(seq) {
    return seq.slice(0, -1);
  }

  function clearSequence() {
    return [];
  }

  function createKfsGrid() {
    return [['', '', ''], ['', '', ''], ['', '', ''], ['', '', '']];
  }

  function setGridCell(grid, row, col, value) {
    return grid.map(function (r, ri) {
      if (ri !== row) return r;
      return r.map(function (c, ci) { return ci === col ? value : c; });
    });
  }

  function formatGrid(grid) {
    return grid.map(function (row) { return row.map(function (c) { return c || '-'; }).join(', '); }).join(' | ');
  }

  function formatSequence(seq) {
    return seq.join(', ');
  }

  function recordSuccess(ratio) {
    return { terambil: ratio.terambil + 1, total: ratio.total + 1 };
  }

  function recordFail(ratio) {
    return { terambil: ratio.terambil, total: ratio.total + 1 };
  }

  function formatRatio(ratio) {
    return ratio.terambil + ' / ' + ratio.total;
  }

  function formatMenitDetik(totalSeconds) {
    var total = Math.floor(totalSeconds);
    var m = Math.floor(total / 60);
    var s = total % 60;
    return m + ' : ' + s;
  }

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
      kfm: { terambil: 0, total: 0 },
      kfsSeringGrid: createKfsGrid(),
      kfsKelemahanGrid: createKfsGrid(),
      runTimer: { running: false, startedAt: null, elapsedMs: 0 },
      run: createRunningTestRun()
    };
  }

  function formatRunningTestEntry(rt) {
    var run = rt.run;
    var dominanStr = rt.dominan === 'merah' ? 'Merah' : (rt.dominan === 'biru' ? 'Biru' : '-');
    return [
      (rt.universitas || '_') + ', ' + (rt.namaTim || '_'),
      'Persentase KFM: ' + formatRatio(rt.kfm),
      'Dominan di lapangan: ' + dominanStr,
      'letakan kfs (yang sering dipakai): ' + formatGrid(rt.kfsSeringGrid),
      'kelemahan posisi kfs: ' + formatGrid(rt.kfsKelemahanGrid),
      '',
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

  var RobotLog = {
    createInitialState: createInitialState,
    incrementCount: incrementCount,
    decrementCount: decrementCount,
    startStopwatch: startStopwatch,
    stopStopwatch: stopStopwatch,
    resetStopwatch: resetStopwatch,
    sanitizeManualSeconds: sanitizeManualSeconds,
    getElapsedSeconds: getElapsedSeconds,
    getElapsedSecondsPrecise: getElapsedSecondsPrecise,
    formatMatchTime: formatMatchTime,
    computeHasil: computeHasil,
    resolveHasil: resolveHasil,
    formatTanggalIndonesia: formatTanggalIndonesia,
    formatTemplate: formatTemplate,
    serializeDraft: serializeDraft,
    deserializeDraft: deserializeDraft,
    appendSequenceSlot: appendSequenceSlot,
    undoSequenceSlot: undoSequenceSlot,
    clearSequence: clearSequence,
    createPksLog: createPksLog,
    appendPksEntry: appendPksEntry,
    formatPksCell: formatPksCell,
    formatSheetTime: formatSheetTime,
    shiftRange: shiftRange,
    createKfsGrid: createKfsGrid,
    setGridCell: setGridCell,
    formatGrid: formatGrid,
    formatSequence: formatSequence,
    recordSuccess: recordSuccess,
    recordFail: recordFail,
    formatRatio: formatRatio,
    formatMenitDetik: formatMenitDetik,
    createRunningTestRun: createRunningTestRun,
    createRunningTestState: createRunningTestState,
    formatRunningTestEntry: formatRunningTestEntry
  };

  root.RobotLog = RobotLog;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = RobotLog;
  }
})(typeof window !== 'undefined' ? window : globalThis);
