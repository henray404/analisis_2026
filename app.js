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
        assembly: 0
      },
      r2: {
        kotak: 0,
        retry: 0,
        spearhead: 0
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
    deserializeDraft: deserializeDraft
  };

  root.RobotLog = RobotLog;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = RobotLog;
  }
})(typeof window !== 'undefined' ? window : globalThis);
