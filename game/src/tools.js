// Tools at a cost: every tool spends points and has limited uses per room.
//  1 — Smoke bomb: a cloud that hides the thief from every cone for 6 seconds.
//  2 — Noise-maker: drops at the thief's feet and lures the nearest guard.
//  3 — Hack: freezes every camera for 8 seconds.

import { distance } from './geometry.js';

export const TOOL_DEFS = [
  { key: '1', id: 'smoke', name: 'Smoke bomb', uses: 2, cost: 50, hint: 'blocks every cone for 6s' },
  { key: '2', id: 'noise', name: 'Noise-maker', uses: 3, cost: 25, hint: 'lures the nearest guard' },
  { key: '3', id: 'hack', name: 'Hack', uses: 2, cost: 75, hint: 'freezes cameras for 8s' },
];

export function freshTools() {
  const tools = {};
  for (const def of TOOL_DEFS) {
    tools[def.id] = { ...def, left: def.uses };
  }
  return tools;
}

export function useTool(id, state) {
  const tool = state.tools[id];
  if (!tool || tool.left <= 0) return false;
  if (state.score < tool.cost) return false;
  tool.left -= 1;
  state.score -= tool.cost;
  if (id === 'smoke') {
    state.smokeClouds.push({ x: state.thief.x, y: state.thief.y, radius: 95, until: state.now + 6 });
  }
  if (id === 'noise') {
    state.noisePings.push({ x: state.thief.x, y: state.thief.y, until: state.now + 4 });
    let nearest = null;
    let nearestDist = 380;
    for (const guard of state.guards) {
      const d = distance(guard.x, guard.y, state.thief.x, state.thief.y);
      if (d < nearestDist) {
        nearest = guard;
        nearestDist = d;
      }
    }
    if (nearest) {
      // The lure is handled by the caller through this returned guard.
      return { lured: nearest };
    }
  }
  if (id === 'hack') {
    state.hackUntil = state.now + 8;
  }
  return { ok: true };
}

export function pruneTools(state) {
  state.smokeClouds = state.smokeClouds.filter((c) => state.now < c.until);
  state.noisePings = state.noisePings.filter((p) => state.now < p.until);
}
