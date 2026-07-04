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
