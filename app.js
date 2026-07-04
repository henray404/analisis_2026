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
