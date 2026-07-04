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

  root.RobotLog = RobotLog;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = RobotLog;
  }
})(typeof window !== 'undefined' ? window : globalThis);
