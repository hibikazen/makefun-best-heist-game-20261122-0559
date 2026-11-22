[![make.fun](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/c/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/hibikazen/makefun-best-heist-game-20261122-0559/rank.svg)](https://make.fun/c/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/hibikazen/makefun-best-heist-game-20261122-0559/reward.svg)](https://make.fun/c/best-heist-game-20261122-0559)

# Midnight Gallery

A top-down heist game that runs offline in a desktop browser. You are the
thief in the Midnight Gallery: lift the Jade Falcon, then the Vault Core,
dodge the guards' amber vision cones and the cameras' red sweeps, and slip
out the green exit before the alarm meter tops out.

Two rooms, several routes each: open floor, dark shadow lanes where cones see
half as far, and grate vents that hide you completely but slow you down.
Tools cost points and have limited uses — a smoke bomb that blocks every cone,
a noise-maker that lures the nearest guard, and a hack that freezes the
cameras. Getting spotted fills the alarm; break line of sight and it drains.
At 100% you get one short warning to vanish, or you are caught.

Play it on [make.fun](https://make.fun) or open `game/index.html` from any
static server — no build step, no network, no assets: every sprite is drawn
in code.

## Controls

- **Move:** WASD or arrow keys, or click the floor to walk there
- **Tools:** 1 smoke bomb, 2 noise-maker, 3 hack
- **P** pause, **R** restart room, **M** mute

## Files

- `game/src/main.js` — game loop, state machine, HUD and dialogs
- `game/src/levels.js` — the two rooms: walls, cover, shadows, vents, patrols
- `game/src/guards.js` — guard patrols and vision cones
- `game/src/cameras.js` — sweeping security cameras
- `game/src/loot.js` — loot, the exit and the run rating
- `game/src/tools.js` — smoke, noise-maker and hack
- `game/src/alarm.js` — the alarm meter and the fair caught moment
- `game/src/render.js` — the blueprint-night canvas drawing
- `game/src/input.js` — keyboard and mouse input
- `game/src/audio.js` — Web Audio sound effects, no files
- `game/src/geometry.js` — line of sight and collision math

MIT licensed. Built for the [make.fun](https://make.fun) best heist game bounty.
