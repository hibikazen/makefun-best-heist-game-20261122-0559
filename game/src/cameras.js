// Security cameras: wall-mounted, sweeping a cone back and forth.
// A hacked camera freezes in place and its cone goes dark.

import { angleDiff, angleTo, distance, hasLineOfSight, pointInAnyRect } from './geometry.js';

export function makeCamera(def) {
  return {
    x: def.x,
    y: def.y,
    base: def.base,
    sweep: def.sweep,
    speed: def.speed,
    range: def.range,
    halfAngle: def.halfAngle,
    phase: Math.random() * Math.PI * 2,
    facing: def.base,
    frozenUntil: 0,
  };
}

export function updateCamera(camera, dt, now) {
  if (now < camera.frozenUntil) return; // hacked: holds still, cone dark
  camera.phase += dt * camera.speed;
  camera.facing = camera.base + Math.sin(camera.phase) * camera.sweep;
}

export function cameraSeesThief(camera, thief, level, smokeClouds, now) {
  if (now < camera.frozenUntil) return false;
  const dist = distance(camera.x, camera.y, thief.x, thief.y);
  if (dist > camera.range) return false;
  if (angleDiff(angleTo(camera.x, camera.y, thief.x, thief.y), camera.facing) > camera.halfAngle) return false;
  if (pointInAnyRect(thief.x, thief.y, level.vents)) return false;
  for (const cloud of smokeClouds) {
    if (distance(thief.x, thief.y, cloud.x, cloud.y) < cloud.radius) return false;
  }
  const blockers = [...level.walls, ...level.cover];
  return hasLineOfSight(camera.x, camera.y, thief.x, thief.y, blockers);
}

export function freezeCameras(cameras, seconds, now) {
  for (const camera of cameras) {
    camera.frozenUntil = now + seconds;
  }
}
