'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const parserSource = fs.readFileSync(path.join(__dirname, '..', 'src/lib/pilotVoiceCommands.ts'), 'utf8');
const js = ts.transpileModule(parserSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const mod = { exports: {} };
Function('module', 'exports', js)(mod, mod.exports);
const { parsePilotCommand } = mod.exports;

test('timer commands execute deterministic pause, resume, cancel, and start actions', () => {
  assert.deepEqual(parsePilotCommand('Algılandı: sayacı durdur'.replace('Algılandı: ', '')), { type: 'pause_timer' });
  assert.deepEqual(parsePilotCommand('Sayacı durdur!'), { type: 'pause_timer' });
  assert.deepEqual(parsePilotCommand('süreyi durdur'), { type: 'pause_timer' });
  assert.deepEqual(parsePilotCommand('sayacı sürdür'), { type: 'resume_timer' });
  assert.deepEqual(parsePilotCommand('sayacı iptal et'), { type: 'cancel_timer' });
  assert.deepEqual(parsePilotCommand('5 dakika başlat'), { type: 'start_timer', minutes: 5 });
  assert.deepEqual(parsePilotCommand('beş dakika sayaç kur'), { type: 'start_timer', minutes: 5 });
  assert.equal(parsePilotCommand('90 dakika başlat'), null);
});

test('navigation and sound commands are parsed independently', () => {
  assert.deepEqual(parsePilotCommand('sonraki!'), { type: 'next' });
  assert.deepEqual(parsePilotCommand('önceki adım'), { type: 'previous' });
  assert.deepEqual(parsePilotCommand('tekrar oku'), { type: 'read' });
  assert.deepEqual(parsePilotCommand('sesi durdur'), { type: 'stop_audio' });
  assert.deepEqual(parsePilotCommand('devam et'), { type: 'resume_context' });
});

test('recognized recipe prose never triggers an action', () => {
  assert.equal(parsePilotCommand('Tereyağını eritin, ardından sıradaki malzemeyi ekleyin.'), null);
  assert.equal(parsePilotCommand('Tencereye beş dakika daha ısı ver.'), null);
  assert.equal(parsePilotCommand(''), null);
});

test('pilot dispatches parsed commands and modal rendering has no flashing animations', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'src/components/pilot/PilotClient.tsx'), 'utf8');
  assert.match(src, /case "pause_timer":/);
  assert.match(src, /setIsTimerPaused\(true\)/);
  assert.match(src, /case "cancel_timer":/);
  assert.match(src, /setTimerActive\(false\)/);
  assert.match(src, /handleCommandRef\.current\(normalized\)/);
  assert.match(src, /for \(let index = first; index < results\.length; index\+\+\)/);
  assert.doesNotMatch(src, /animate-fade-in/);
  assert.doesNotMatch(src, /type="button" autoFocus aria-label="Ses seçimini kapat"/);
});

test('every Turkish pilot voice variant has an exact deterministic intent', () => {
  const variants = mod.exports.PILOT_COMMAND_GROUPS;
  const all = variants.flatMap(g => g.variants.map(phrase => ({ phrase, type: g.type })));
  assert.ok(all.length >= 160, 'broad Turkish vocabulary');
  const seen = new Set();
  for (const { phrase, type } of all) {
    assert.equal(seen.has(phrase), false, 'duplicate/ambiguous command: ' + phrase);
    seen.add(phrase);
    assert.deepEqual(parsePilotCommand(phrase), { type }, phrase);
    assert.deepEqual(parsePilotCommand(phrase.toLocaleUpperCase('tr-TR') + '!'), { type }, phrase);
  }
});

test('timer-first resume and explicit narration/timer resume are not confused', () => {
  for (const phrase of [
    'sürdür', 'devam', 'devam et', 'devam ettir',
    'kaldığın yerden devam et', 'yeniden devam et', 'kaldığı yerden sürdür',
  ]) assert.deepEqual(parsePilotCommand(phrase), { type: 'resume_context' }, phrase);
  for (const phrase of ['sayacı sürdür', 'sayaç sürdür', 'süreyi sürdür',
    'zamanlayıcıyı devam ettir', 'sayacı kaldığı yerden devam ettir']) {
    assert.deepEqual(parsePilotCommand(phrase), { type: 'resume_timer' }, phrase);
  }
  for (const phrase of ['okumayı sürdür', 'seslendirmeye devam et']) {
    assert.deepEqual(parsePilotCommand(phrase), { type: 'resume_audio' }, phrase);
  }
});

test('1–60 minute timer phrases support numeric and Turkish numbers, bounded', () => {
  for (const [phrase, minutes] of [
    ['5 dakika başlat', 5], ['beş dakikalık sayaç kur', 5],
    ['10 dakika sayaç başlat', 10], ['on beş dakika sayaç kur', 15],
    ['yirmi beş dakika başlat', 25], ['sayacı 30 dakikaya ayarla', 30],
    ['60 dakika zamanlayıcı başlat', 60],
  ]) assert.deepEqual(parsePilotCommand(phrase), { type: 'start_timer', minutes }, phrase);
  for (const phrase of [
    '0 dakika başlat', '61 dakika başlat', '200 dakika başlat',
    'beş dakika boyunca yemek pişir', 'sonraki malzemeyi koy',
  ]) assert.equal(parsePilotCommand(phrase), null, phrase);
});

test('web dispatcher checks running timer for context resume before audio and navigation', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'src/components/pilot/PilotClient.tsx'), 'utf8');
  assert.match(src, /case "resume_context":/);
  assert.match(src, /if \(timerActive\) \{/);
  assert.match(src, /if \(isTimerPaused\) \{/);
  assert.match(src, /setIsTimerPaused\(false\)/);
  assert.match(src, /case "resume_audio":/);
  assert.match(src, /case "resume_timer":/);
});
