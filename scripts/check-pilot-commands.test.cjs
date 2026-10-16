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
  assert.deepEqual(parsePilotCommand('devam et'), { type: 'resume_audio' });
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
