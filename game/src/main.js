// Midnight Gallery — game controller: state machine, loop, HUD, dialogs and
// the test hook Playwright uses. The game runs in phases: title, playing,
// paused, caught, roomclear and won.

import { LEVELS, FLOOR_W, FLOOR_H } from './levels.js';
import { makeGuard, updateGuard, guardSeesThief, thiefInShadow, lureGuard } from './guards.js';
import { makeCamera, updateCamera, cameraSeesThief, freezeCameras } from './cameras.js';
import { makeLoot, updateLoot, thiefNearLoot, takeLoot, thiefAtExit, rateRun } from './loot.js';
import { freshTools, useTool, pruneTools, TOOL_DEFS } from './tools.js';
import { makeAlarm, updateAlarm, resetAlarm } from './alarm.js';
import { render } from './render.js';
import { makeInput, bindInput, keyDirection } from './input.js';
import { moveCircle, pointInAnyRect, distance } from './geometry.js';
import { sfxPickup, sfxAlarmTick, sfxSpotted, sfxCaught, sfxWin, sfxTool, toggleMute, isMuted } from './audio.js';

const canvas = document.getElementById('floor');
const ctx = canvas.getContext('2d');
const alarmFill = document.getElementById('alarm-fill');
const alarmLabel = document.getElementById('alarm-label');
const scoreEl = document.getElementById('score');
const lootEl = document.getElementById('loot-count');
const roomEl = document.getElementById('room-name');
const timerEl = document.getElementById('timer');
const toolsEl = document.getElementById('tools');
const announceEl = document.getElementById('announce');
const titleDialog = document.getElementById('title-dialog');
const caughtDialog = document.getElementById('caught-dialog');
const winDialog = document.getElementById('win-dialog');
const pauseOverlay = document.getElementById('pause-overlay');

const state = {
  phase: 'title',
  levelIndex: 0,
  level: LEVELS[0],
  thief: { x: 60, y: 540, facing: -Math.PI / 2, radius: 12 },
  guards: [],
  cameras: [],
  loot: null,
  tools: freshTools(),
  smokeClouds: [],
  noisePings: [],
  hackUntil: 0,
  alarm: makeAlarm(),
  holdAlarm: false, // demo scenes can hold the meter still for a photo
  score: 0,
  lootTaken: 0,
  alarmsRaised: 0,
  roomsCleared: 0,
  elapsed: 0,
  totalTime: 0,
  now: 0,
  lastTick: 0,
  input: makeInput(),
};

function solids() {
  return [...state.level.walls, ...state.level.cover];
}

function loadLevel(index) {
  const level = LEVELS[index];
  state.levelIndex = index;
  state.level = level;
  state.thief.x = level.start.x;
  state.thief.y = level.start.y;
  state.thief.facing = -Math.PI / 2;
  state.guards = level.guards.map(makeGuard);
  state.cameras = level.cameras.map(makeCamera);
  state.loot = makeLoot(level.loot);
  state.tools = freshTools();
  state.smokeClouds = [];
  state.noisePings = [];
  state.hackUntil = 0;
  state.holdAlarm = false;
  resetAlarm(state.alarm);
  state.elapsed = 0;
  roomEl.textContent = level.name;
  buildToolButtons();
  announce(`${level.name}. ${level.intro}`);
}

function buildToolButtons() {
  toolsEl.innerHTML = '';
  for (const def of TOOL_DEFS) {
    const tool = state.tools[def.id];
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tool';
    button.dataset.tool = def.id;
    button.innerHTML = `<strong>${def.key} · ${def.name}</strong><span>${def.hint}</span><em>${tool.left} left · −${def.cost} pts</em>`;
    button.addEventListener('click', () => fireTool(def.id));
    toolsEl.appendChild(button);
  }
}

function refreshTools() {
  for (const button of toolsEl.querySelectorAll('.tool')) {
    const tool = state.tools[button.dataset.tool];
    button.querySelector('em').textContent = `${tool.left} left · −${tool.cost} pts`;
    button.disabled = tool.left <= 0 || state.phase !== 'playing';
  }
}

function announce(message) {
  announceEl.textContent = message;
}

function updateHud() {
  const value = Math.round(state.alarm.value);
  alarmFill.style.width = `${value}%`;
  alarmFill.setAttribute('aria-valuenow', String(value));
  alarmLabel.textContent =
    state.alarm.state === 'warning' ? 'SPOTTED — break away!' :
    state.alarm.state === 'rising' ? `Alarm ${value}% — seen!` :
    value > 0 ? `Alarm ${value}%` : 'Alarm 0% — hidden';
  alarmFill.classList.toggle('hot', value > 55);
  scoreEl.textContent = String(state.score);
  lootEl.textContent = `${state.lootTaken} / ${LEVELS.length}`;
  const total = Math.floor(state.totalTime + state.elapsed);
  timerEl.textContent = `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function fireTool(id) {
  if (state.phase !== 'playing') return;
  const result = useTool(id, state);
  if (!result) {
    announce('That tool is spent or you cannot afford it.');
    return;
  }
  sfxTool();
  if (result.lured) {
    lureGuard(result.lured, state.thief.x, state.thief.y, 4, state.now);
    announce(`Noise-maker dropped — ${result.lured.name} is coming to look.`);
  } else if (id === 'hack') {
    freezeCameras(state.cameras, 8, state.now);
    announce('Cameras hacked — frozen for 8 seconds.');
  } else if (id === 'smoke') {
    announce('Smoke out — cones cannot see through it.');
  }
  refreshTools();
  updateHud();
}

function startGame() {
  state.score = 0;
  state.lootTaken = 0;
  state.alarmsRaised = 0;
  state.roomsCleared = 0;
  state.totalTime = 0;
  loadLevel(0);
  state.phase = 'playing';
  titleDialog.close();
  canvas.focus();
}

function retryRoom() {
  state.alarmsRaised += state.alarm.raised;
  state.score = Math.max(0, state.score - 100);
  loadLevel(state.levelIndex);
  state.phase = 'playing';
  caughtDialog.close();
  canvas.focus();
}

function showWin() {
  state.phase = 'won';
  const rating = rateRun(state.alarmsRaised, state.lootTaken, LEVELS.length);
  document.getElementById('win-rating').textContent = rating;
  document.getElementById('win-score').textContent = String(state.score);
  document.getElementById('win-loot').textContent = `${state.lootTaken} / ${LEVELS.length}`;
  document.getElementById('win-alarms').textContent = String(state.alarmsRaised);
  const total = Math.floor(state.totalTime);
  document.getElementById('win-time').textContent =
    `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  document.getElementById('win-blurb').textContent =
    rating === 'GHOST' ? 'Not a single alarm. The gallery never knew you were there.' :
    rating === 'SHADOW' ? 'One close call, but the loot is yours and the night is quiet.' :
    'Loud, messy — and rich. The getaway still paid off.';
  sfxWin();
  winDialog.showModal();
}

function roomCleared() {
  const bonus = state.elapsed < 90 ? 200 : 100;
  state.score += bonus;
  state.roomsCleared += 1;
  state.totalTime += state.elapsed;
  state.alarmsRaised += state.alarm.raised;
  announce(`${state.level.name} cleared — getaway bonus +${bonus}.`);
  if (state.levelIndex + 1 >= LEVELS.length) {
    updateHud();
    showWin();
    return;
  }
  loadLevel(state.levelIndex + 1);
  state.phase = 'playing';
}

function onCaught() {
  state.phase = 'caught';
  state.totalTime += state.elapsed;
  sfxCaught();
  announce('Caught! The guards have you. Retry the room.');
  caughtDialog.showModal();
}

function update(dt) {
  state.now += dt;
  state.elapsed += dt;
  const level = state.level;
  const thief = state.thief;

  // Movement: keys first, then a mouse click target.
  const dir = keyDirection(state.input);
  let speed = 175;
  if (pointInAnyRect(thief.x, thief.y, level.vents)) speed = 95;
  if (dir) {
    state.input.moveTarget = null;
    thief.facing = Math.atan2(dir.y, dir.x);
    const moved = moveCircle(thief.x, thief.y, dir.x * speed * dt, dir.y * speed * dt, thief.radius, solids());
    thief.x = moved.x;
    thief.y = moved.y;
  } else if (state.input.moveTarget) {
    const target = state.input.moveTarget;
    const dist = distance(thief.x, thief.y, target.x, target.y);
    if (dist < 6) {
      state.input.moveTarget = null;
    } else {
      const dx = (target.x - thief.x) / dist;
      const dy = (target.y - thief.y) / dist;
      thief.facing = Math.atan2(dy, dx);
      const moved = moveCircle(thief.x, thief.y, dx * speed * dt, dy * speed * dt, thief.radius, solids());
      thief.x = moved.x;
      thief.y = moved.y;
    }
  }

  for (const guard of state.guards) updateGuard(guard, dt, solids(), state.now);
  for (const camera of state.cameras) updateCamera(camera, dt, state.now);
  updateLoot(state.loot, dt);
  pruneTools(state);

  const inShadow = thiefInShadow(thief, level);
  const seen =
    state.guards.some((g) => guardSeesThief(g, thief, level, state.smokeClouds)) ||
    state.cameras.some((c) => cameraSeesThief(c, thief, level, state.smokeClouds, state.now));
  const before = state.alarm.state;
  if (!state.holdAlarm) {
    updateAlarm(state.alarm, seen, inShadow, dt, state.now);
  }
  if (state.alarm.state === 'rising' && state.now - state.lastTick > 0.28) {
    state.lastTick = state.now;
    sfxAlarmTick();
  }
  if (before !== 'warning' && state.alarm.state === 'warning') {
    sfxSpotted();
    announce('Spotted! Break line of sight now!');
  }
  if (state.alarm.state === 'caught') {
    onCaught();
    return;
  }

  if (thiefNearLoot(thief, state.loot)) {
    state.score = takeLoot(state.loot, state.score);
    state.lootTaken += 1;
    sfxPickup();
    announce(`${state.loot.name} secured — now reach the exit.`);
  }
  if (state.loot.taken && thiefAtExit(thief, level.exit)) {
    roomCleared();
  }
  refreshTools();
  updateHud();
}

let lastFrame = 0;
function frame(timestamp) {
  const dt = Math.min(0.05, (timestamp - lastFrame) / 1000 || 0);
  lastFrame = timestamp;
  if (state.phase === 'playing') update(dt);
  render(ctx, state);
  requestAnimationFrame(frame);
}

function handleAction(kind, value) {
  if (kind === 'tool') {
    fireTool(value === '1' ? 'smoke' : value === '2' ? 'noise' : 'hack');
  } else if (kind === 'pause') {
    if (state.phase === 'playing') {
      state.phase = 'paused';
      pauseOverlay.hidden = false;
    } else if (state.phase === 'paused') {
      state.phase = 'playing';
      pauseOverlay.hidden = true;
      canvas.focus();
    }
  } else if (kind === 'restart') {
    if (state.phase === 'playing' || state.phase === 'paused') {
      pauseOverlay.hidden = true;
      retryRoom();
    }
  } else if (kind === 'mute') {
    const muted = toggleMute();
    document.getElementById('mute-btn').textContent = muted ? 'Unmute (M)' : 'Mute (M)';
  } else if (kind === 'confirm') {
    if (state.phase === 'title') startGame();
    else if (state.phase === 'caught') retryRoom();
    else if (state.phase === 'won') {
      winDialog.close();
      startGame();
    }
  }
}

bindInput(state.input, canvas, handleAction);
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('retry-btn').addEventListener('click', retryRoom);
document.getElementById('again-btn').addEventListener('click', () => {
  winDialog.close();
  startGame();
});
document.getElementById('resume-btn').addEventListener('click', () => handleAction('pause'));
document.getElementById('mute-btn').addEventListener('click', () => handleAction('mute'));
document.getElementById('how-btn').addEventListener('click', () => {
  document.getElementById('howto').hidden = !document.getElementById('howto').hidden;
});

loadLevel(0);
state.phase = 'title';
updateHud();
titleDialog.showModal();
requestAnimationFrame(frame);

// Demo scenes for screenshots: real renders of the game, staged through the
// game's own state (thief position, alarm value, guard facing).
function applyScene(name) {
  if (name === 'cover') {
    loadLevel(0);
    state.thief.x = 600;
    state.thief.y = 380;
    state.thief.facing = -Math.PI / 2;
    state.guards[0].x = 430;
    state.guards[0].y = 330;
    state.guards[0].facing = 0.5;
    state.guards[0].waiting = 5; // hold the staged pose for the shot
    state.guards[1].x = 760;
    state.guards[1].y = 220;
    state.guards[1].facing = Math.PI * 0.75;
    state.guards[1].waiting = 5;
    state.cameras[0].facing = Math.PI / 2 + 0.4;
    state.alarm.value = 30;
    state.alarm.state = 'calm';
    state.holdAlarm = true; // keep the meter at 30% for the cover shot
    state.phase = 'playing';
    titleDialog.close();
  } else if (name === 'alarm') {
    loadLevel(0);
    state.thief.x = 760;
    state.thief.y = 300;
    state.thief.facing = Math.PI;
    state.guards[1].x = 760;
    state.guards[1].y = 210;
    state.guards[1].facing = Math.PI / 2;
    state.guards[1].waiting = 30; // hold the stare: the thief stays seen
    state.alarm.value = 30;
    state.alarm.state = 'rising';
    state.phase = 'playing';
    titleDialog.close();
  } else if (name === 'win') {
    loadLevel(0);
    state.score = 1250;
    state.lootTaken = 2;
    state.alarmsRaised = 0;
    state.totalTime = 74;
    titleDialog.close();
    showWin();
  }
}

const scene = new URLSearchParams(window.location.search).get('scene');
if (scene) applyScene(scene);

// Test hook for automated play-testing.
window.__heist = {
  state: () => ({
    phase: state.phase,
    room: state.levelIndex,
    roomName: state.level.name,
    alarm: Math.round(state.alarm.value),
    alarmState: state.alarm.state,
    score: state.score,
    lootTaken: state.lootTaken,
    lootAt: { x: state.loot.x, y: state.loot.y, taken: state.loot.taken },
    thief: { x: Math.round(state.thief.x), y: Math.round(state.thief.y) },
    guards: state.guards.map((g) => ({ x: Math.round(g.x), y: Math.round(g.y) })),
    cameras: state.cameras.map((c) => ({ x: c.x, y: c.y, frozen: state.now < c.frozenUntil })),
    tools: Object.fromEntries(Object.entries(state.tools).map(([k, t]) => [k, t.left])),
    smokeClouds: state.smokeClouds.length,
  }),
  start: startGame,
  teleport: (x, y) => {
    state.thief.x = x;
    state.thief.y = y;
    state.input.moveTarget = null;
  },
  setAlarm: (v) => {
    state.alarm.value = v;
  },
  fireTool,
};
