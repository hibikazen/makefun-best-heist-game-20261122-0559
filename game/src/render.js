// Canvas rendering: a "blueprint night" look where safe cover, danger and
// loot are obvious at a glance. Safe floor is deep navy with a faint grid,
// shadow lanes are darker indigo, vents are hatched grates, guard cones are
// amber, camera cones are red, loot glows gold and the exit glows green.

import { FLOOR_H, FLOOR_W } from './levels.js';

const NAVY = '#0d1330';
const FLOOR = '#141b3d';
const GRID = 'rgba(120, 140, 220, 0.10)';
const WALL = '#2c3a6e';
const WALL_EDGE = '#5a6fc0';
const SHADOW_FILL = '#080d24';
const VENT_FILL = '#1d2748';
const AMBER = 'rgba(245, 176, 65, 0.30)';
const AMBER_EDGE = 'rgba(245, 176, 65, 0.75)';
const RED = 'rgba(235, 70, 70, 0.28)';
const RED_EDGE = 'rgba(235, 70, 70, 0.7)';

function drawCone(ctx, x, y, facing, range, halfAngle, fill, edge) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, facing - halfAngle, facing + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawWalls(ctx, walls) {
  for (const w of walls) {
    ctx.fillStyle = WALL;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = WALL_EDGE;
    if (w.h <= 18) ctx.fillRect(w.x, w.y, w.w, 3);
    else ctx.fillRect(w.x, w.y, 3, w.h);
  }
}

function drawCover(ctx, cover) {
  for (const c of cover) {
    if (c.kind === 'case') {
      ctx.fillStyle = '#123f4d';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = 'rgba(64, 224, 208, 0.35)';
      ctx.fillRect(c.x + 4, c.y + 4, c.w - 8, c.h - 8);
      ctx.strokeStyle = '#40e0d0';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(c.x, c.y, c.w, c.h);
    } else if (c.kind === 'pillar') {
      ctx.fillStyle = '#31427d';
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2, c.w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = WALL_EDGE;
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      ctx.fillStyle = '#4a3b22';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.strokeStyle = '#a8873f';
      ctx.lineWidth = 2;
      ctx.strokeRect(c.x, c.y, c.w, c.h);
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(c.x + c.w, c.y + c.h);
      ctx.moveTo(c.x + c.w, c.y);
      ctx.lineTo(c.x, c.y + c.h);
      ctx.strokeStyle = 'rgba(168, 135, 63, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
}

function drawLoot(ctx, loot, now) {
  if (loot.taken) return;
  const pulse = 0.6 + 0.4 * Math.sin(now * 3 + loot.bob);
  const glow = ctx.createRadialGradient(loot.x, loot.y, 4, loot.x, loot.y, 46);
  glow.addColorStop(0, `rgba(255, 215, 0, ${0.55 * pulse})`);
  glow.addColorStop(1, 'rgba(255, 215, 0, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(loot.x, loot.y, 46, 0, Math.PI * 2);
  ctx.fill();
  // Pedestal.
  ctx.fillStyle = '#3a466f';
  ctx.fillRect(loot.x - 16, loot.y + 8, 32, 12);
  // The prize itself: a faceted gem.
  ctx.beginPath();
  ctx.moveTo(loot.x, loot.y - 14);
  ctx.lineTo(loot.x + 11, loot.y);
  ctx.lineTo(loot.x, loot.y + 12);
  ctx.lineTo(loot.x - 11, loot.y);
  ctx.closePath();
  ctx.fillStyle = '#ffd700';
  ctx.fill();
  ctx.strokeStyle = '#fff3a0';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#ffe98a';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(loot.name.toUpperCase(), loot.x, loot.y + 36);
}

function drawThief(ctx, thief) {
  // Hooded figure: dark cloak triangle with a purple hood and a facing tick.
  ctx.save();
  ctx.translate(thief.x, thief.y);
  ctx.rotate(thief.facing);
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(-10, -11);
  ctx.lineTo(-6, 0);
  ctx.lineTo(-10, 11);
  ctx.closePath();
  ctx.fillStyle = '#5b21b6';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.fillStyle = '#8b5cf6';
  ctx.fill();
  ctx.strokeStyle = '#e9d5ff';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(4, 0, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = '#f5f3ff';
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#e9d5ff';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('YOU', thief.x, thief.y - 20);
}

function drawGuard(ctx, guard) {
  drawCone(ctx, guard.x, guard.y, guard.facing, guard.range, guard.halfAngle, AMBER, AMBER_EDGE);
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, guard.radius, 0, Math.PI * 2);
  ctx.fillStyle = '#b45309';
  ctx.fill();
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Visor wedge showing where the guard looks.
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.arc(guard.x, guard.y, guard.radius - 3, guard.facing - 0.5, guard.facing + 0.5);
  ctx.closePath();
  ctx.fillStyle = '#fde68a';
  ctx.fill();
  ctx.fillStyle = '#fcd34d';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(guard.name.toUpperCase(), guard.x, guard.y - guard.radius - 8);
}

function drawCamera(ctx, camera, now) {
  const frozen = now < camera.frozenUntil;
  drawCone(
    ctx, camera.x, camera.y, camera.facing, camera.range, camera.halfAngle,
    frozen ? 'rgba(120, 120, 120, 0.10)' : RED,
    frozen ? 'rgba(160, 160, 160, 0.5)' : RED_EDGE,
  );
  ctx.fillStyle = frozen ? '#4b5563' : '#7f1d1d';
  ctx.fillRect(camera.x - 9, camera.y - 9, 18, 18);
  ctx.strokeStyle = frozen ? '#9ca3af' : '#ef4444';
  ctx.lineWidth = 2;
  ctx.strokeRect(camera.x - 9, camera.y - 9, 18, 18);
  ctx.beginPath();
  ctx.arc(camera.x, camera.y, 4, 0, Math.PI * 2);
  ctx.fillStyle = frozen ? '#9ca3af' : '#f87171';
  ctx.fill();
  if (frozen) {
    ctx.fillStyle = '#e5e7eb';
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HACKED', camera.x, camera.y - 16);
  }
}

export function render(ctx, state) {
  const { level, thief, guards, cameras, loot, smokeClouds, noisePings, alarm, now } = state;
  ctx.clearRect(0, 0, FLOOR_W, FLOOR_H);
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, 0, FLOOR_W, FLOOR_H);
  ctx.fillStyle = FLOOR;
  ctx.fillRect(16, 16, FLOOR_W - 32, FLOOR_H - 32);

  // Faint blueprint grid.
  ctx.strokeStyle = GRID;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 16; x <= FLOOR_W - 16; x += 40) {
    ctx.moveTo(x, 16);
    ctx.lineTo(x, FLOOR_H - 16);
  }
  for (let y = 16; y <= FLOOR_H - 16; y += 40) {
    ctx.moveTo(16, y);
    ctx.lineTo(FLOOR_W - 16, y);
  }
  ctx.stroke();

  // Shadow lanes.
  for (const s of level.shadows) {
    ctx.fillStyle = SHADOW_FILL;
    ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.fillStyle = 'rgba(148, 163, 255, 0.35)';
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('SHADOW', s.x + 6, s.y + 14);
  }

  // Vents: hatched grate corridors.
  for (const v of level.vents) {
    ctx.fillStyle = VENT_FILL;
    ctx.fillRect(v.x, v.y, v.w, v.h);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const step = 14;
    if (v.w > v.h) {
      for (let x = v.x + 4; x < v.x + v.w; x += step) {
        ctx.moveTo(x, v.y + 3);
        ctx.lineTo(x, v.y + v.h - 3);
      }
    } else {
      for (let y = v.y + 4; y < v.y + v.h; y += step) {
        ctx.moveTo(v.x + 3, y);
        ctx.lineTo(v.x + v.w - 3, y);
      }
    }
    ctx.stroke();
    ctx.fillStyle = 'rgba(203, 213, 225, 0.8)';
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('VENT', v.x + 6, v.y + v.h / 2 + 3);
  }

  // Exit door.
  const exit = level.exit;
  const exitGlow = 0.5 + 0.3 * Math.sin(now * 2.5);
  ctx.fillStyle = `rgba(34, 197, 94, ${exitGlow})`;
  ctx.fillRect(exit.x - 4, exit.y - 4, exit.w + 8, exit.h + 8);
  ctx.fillStyle = '#14532d';
  ctx.fillRect(exit.x, exit.y, exit.w, exit.h);
  ctx.strokeStyle = '#4ade80';
  ctx.lineWidth = 2;
  ctx.strokeRect(exit.x, exit.y, exit.w, exit.h);
  ctx.fillStyle = '#bbf7d0';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', exit.x + exit.w / 2, exit.y + exit.h / 2 + 4);

  drawLoot(ctx, loot, now);
  drawCover(ctx, level.cover);
  drawWalls(ctx, level.walls);

  for (const ping of noisePings) {
    const age = 1 - (ping.until - now) / 4;
    ctx.beginPath();
    ctx.arc(ping.x, ping.y, 8 + age * 46, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(251, 191, 36, ${0.9 * (1 - age)})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  for (const camera of cameras) drawCamera(ctx, camera, now);
  for (const guard of guards) drawGuard(ctx, guard);

  for (const cloud of smokeClouds) {
    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(203, 213, 225, 0.55)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  drawThief(ctx, thief);

  // Red vignette while the alarm is hot; flashing frame during the warning.
  if (alarm.value > 55) {
    const strength = alarm.state === 'warning' ? 0.5 + 0.3 * Math.sin(now * 14) : (alarm.value - 55) / 100;
    const grad = ctx.createRadialGradient(
      FLOOR_W / 2, FLOOR_H / 2, FLOOR_H * 0.35,
      FLOOR_W / 2, FLOOR_H / 2, FLOOR_H * 0.75,
    );
    grad.addColorStop(0, 'rgba(220, 38, 38, 0)');
    grad.addColorStop(1, `rgba(220, 38, 38, ${Math.max(0, strength)})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, FLOOR_W, FLOOR_H);
  }
  if (alarm.state === 'warning') {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 44px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 8;
    ctx.strokeText('SPOTTED!', FLOOR_W / 2, 120);
    ctx.fillText('SPOTTED!', FLOOR_W / 2, 120);
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillStyle = '#fecaca';
    ctx.fillText('Break line of sight — now!', FLOOR_W / 2, 152);
  }
}
