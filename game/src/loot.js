// Loot, the exit, and the score. One loot target per room: grab it, then
// reach the exit to bank it. Tools cost points, so a loud run pays for itself
// in a worse rating.

export function makeLoot(def) {
  return {
    x: def.x,
    y: def.y,
    name: def.name,
    value: def.value,
    taken: false,
    bob: 0,
  };
}

export function updateLoot(loot, dt) {
  loot.bob += dt;
}

export function thiefNearLoot(thief, loot) {
  if (loot.taken) return false;
  const dx = thief.x - loot.x;
  const dy = thief.y - loot.y;
  return dx * dx + dy * dy < 34 * 34;
}

export function takeLoot(loot, score) {
  loot.taken = true;
  return score + loot.value;
}

export function thiefAtExit(thief, exit) {
  return (
    thief.x >= exit.x - 6 &&
    thief.x <= exit.x + exit.w + 6 &&
    thief.y >= exit.y - 6 &&
    thief.y <= exit.y + exit.h + 6
  );
}

// Rating for the win screen: Ghost means no alarm was ever raised.
export function rateRun(alarmsRaised, lootTaken, roomsCleared) {
  if (alarmsRaised === 0 && lootTaken === roomsCleared) return 'GHOST';
  if (alarmsRaised <= 1) return 'SHADOW';
  return 'LOUD';
}
