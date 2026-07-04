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
