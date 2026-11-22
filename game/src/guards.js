// Guards: patrol loops, facing, and the vision cone that can spot the thief.
// A guard walks its waypoints, pauses at each, and turns to face where it
// walks. A noise-maker can pull a guard off its route for a few seconds.

import { angleDiff, angleTo, distance, hasLineOfSight, moveCircle, pointInAnyRect } from './geometry.js';

export function makeGuard(def) {
  return {
    name: def.name,
    path: def.path,
    speed: def.speed,
    pause: def.pause,
    range: def.range,
    halfAngle: def.halfAngle,
    x: def.path[0][0],
    y: def.path[0][1],
    waypoint: 1,
    waiting: 0,
    facing: 0,
    lured: null, // {x, y, until} while the guard investigates a noise
    radius: 13,
  };
}

export function updateGuard(guard, dt, solids, now) {
  // Lured guards walk to the noise and look around, then go back to patrol.
  if (guard.lured) {
    if (now > guard.lured.until) {
      guard.lured = null;
    } else {
      walkToward(guard, guard.lured.x, guard.lured.y, dt, solids);
      return;
    }
  }
  if (guard.waiting > 0) {
    guard.waiting -= dt;
    if (guard.waiting <= 0) {
      guard.waypoint = (guard.waypoint + 1) % guard.path.length;
    }
    return;
  }
  const target = guard.path[guard.waypoint];
  const arrived = walkToward(guard, target[0], target[1], dt, solids);
  if (arrived) guard.waiting = guard.pause;
}

function walkToward(guard, tx, ty, dt, solids) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 3) return true;
  const step = Math.min(dist, guard.speed * dt);
  guard.facing = Math.atan2(dy, dx);
  const moved = moveCircle(guard.x, guard.y, (dx / dist) * step, (dy / dist) * step, guard.radius, solids);
  guard.x = moved.x;
  guard.y = moved.y;
  return false;
}

// Can this guard see the thief right now? Walls and cover block sight;
// a thief crouched in a vent is invisible; smoke hides them too.
export function guardSeesThief(guard, thief, level, smokeClouds) {
  const dist = distance(guard.x, guard.y, thief.x, thief.y);
  if (dist > guard.range) return false;
  if (angleDiff(angleTo(guard.x, guard.y, thief.x, thief.y), guard.facing) > guard.halfAngle) return false;
  if (pointInAnyRect(thief.x, thief.y, level.vents)) return false;
  for (const cloud of smokeClouds) {
    if (distance(thief.x, thief.y, cloud.x, cloud.y) < cloud.radius) return false;
  }
  const blockers = [...level.walls, ...level.cover];
  return hasLineOfSight(guard.x, guard.y, thief.x, thief.y, blockers);
}

// Is the thief inside a shadow lane (cones see half as far there)?
export function thiefInShadow(thief, level) {
  return pointInAnyRect(thief.x, thief.y, level.shadows);
}

export function lureGuard(guard, x, y, seconds, now) {
  guard.lured = { x, y, until: now + seconds };
  guard.waiting = 0;
}
