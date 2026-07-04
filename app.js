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
    return Math.floor(ms / 1000);
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

  var RobotLog = {
    createInitialState: createInitialState,
    incrementCount: incrementCount,
    decrementCount: decrementCount,
    startStopwatch: startStopwatch,
    stopStopwatch: stopStopwatch,
    resetStopwatch: resetStopwatch,
    setStopwatchSeconds: setStopwatchSeconds,
    getElapsedSeconds: getElapsedSeconds,
    computeHasil: computeHasil,
    resolveHasil: resolveHasil,
    formatTanggalIndonesia: formatTanggalIndonesia,
    formatTemplate: formatTemplate
  };

  root.RobotLog = RobotLog;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = RobotLog;
  }
})(typeof window !== 'undefined' ? window : globalThis);
