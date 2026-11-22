// Geometry helpers: circles, rectangles and line-of-sight for the heist floor.
// Everything here is pure math so the other modules can stay small and testable.

export function clamp(value, low, high) {
  return value < low ? low : value > high ? high : value;
}

export function distance(ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  return Math.sqrt(dx * dx + dy * dy);
}

export function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

// Smallest absolute difference between two angles, in radians.
export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

// Does segment p1-p2 cross segment p3-p4?
export function segmentsCross(p1, p2, p3, p4) {
  const d1 = (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
  const d2 = (p2.x - p1.x) * (p4.y - p1.y) - (p2.y - p1.y) * (p4.x - p1.x);
  const d3 = (p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x);
  const d4 = (p4.x - p3.x) * (p2.y - p3.y) - (p4.y - p3.y) * (p2.x - p3.x);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

// Does the segment from (ax, ay) to (bx, by) touch the rectangle r?
export function segmentHitsRect(ax, ay, bx, by, r) {
  if (ax >= r.x && ax <= r.x + r.w && ay >= r.y && ay <= r.y + r.h) return true;
  if (bx >= r.x && bx <= r.x + r.w && by >= r.y && by <= r.y + r.h) return true;
  const a = { x: ax, y: ay };
  const b = { x: bx, y: by };
  const corners = [
    [{ x: r.x, y: r.y }, { x: r.x + r.w, y: r.y }],
    [{ x: r.x + r.w, y: r.y }, { x: r.x + r.w, y: r.y + r.h }],
    [{ x: r.x + r.w, y: r.y + r.h }, { x: r.x, y: r.y + r.h }],
    [{ x: r.x, y: r.y + r.h }, { x: r.x, y: r.y }],
  ];
  for (const [c1, c2] of corners) {
    if (segmentsCross(a, b, c1, c2)) return true;
  }
  return false;
}

// True when nothing solid stands between the two points.
export function hasLineOfSight(ax, ay, bx, by, blockers) {
  for (const r of blockers) {
    if (segmentHitsRect(ax, ay, bx, by, r)) return false;
  }
  return true;
}

// Is the point inside the rectangle (with an optional margin)?
export function pointInRect(x, y, r, margin = 0) {
  return x >= r.x - margin && x <= r.x + r.w + margin && y >= r.y - margin && y <= r.y + r.h + margin;
}

// Is the point inside any rectangle in the list?
export function pointInAnyRect(x, y, rects) {
  for (const r of rects) {
    if (pointInRect(x, y, r)) return true;
  }
  return false;
}

// Push a circle of radius r out of the rectangle it overlaps. Returns the
// corrected position as {x, y}. Used for the thief and the guards.
export function resolveCircleRect(x, y, radius, r) {
  const nearX = clamp(x, r.x, r.x + r.w);
  const nearY = clamp(y, r.y, r.y + r.h);
  const dx = x - nearX;
  const dy = y - nearY;
  const distSq = dx * dx + dy * dy;
  if (distSq >= radius * radius) return { x, y };
  if (distSq === 0) {
    // Centre is inside the rectangle: push out along the shortest side.
    const left = x - r.x;
    const right = r.x + r.w - x;
    const top = y - r.y;
    const bottom = r.y + r.h - y;
    const min = Math.min(left, right, top, bottom);
    if (min === left) return { x: r.x - radius, y };
    if (min === right) return { x: r.x + r.w + radius, y };
    if (min === top) return { x, y: r.y - radius };
    return { x, y: r.y + r.h + radius };
  }
  const dist = Math.sqrt(distSq);
  const push = (radius - dist) / dist;
  return { x: x + dx * push, y: y + dy * push };
}

// Move a circle by (dx, dy) one axis at a time so it slides along walls.
export function moveCircle(x, y, dx, dy, radius, solids) {
  let nx = x + dx;
  for (const r of solids) {
    const fixed = resolveCircleRect(nx, y, radius, r);
    nx = fixed.x;
  }
  let ny = y + dy;
  for (const r of solids) {
    const fixed = resolveCircleRect(nx, ny, radius, r);
    ny = fixed.y;
  }
  return { x: nx, y: ny };
}
