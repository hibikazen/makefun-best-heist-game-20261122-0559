// Room definitions for the Midnight Gallery heist.
// Each room is plain data: walls and cover block sight and movement, shadow
// lanes hide the thief, vents hide the thief completely but slow them down,
// guards walk patrol loops and cameras sweep. Coordinates are canvas pixels
// on a 960 by 600 floor.

export const FLOOR_W = 960;
export const FLOOR_H = 600;

function borderWalls() {
  return [
    { x: 0, y: 0, w: 960, h: 16 },
    { x: 0, y: 584, w: 960, h: 16 },
    { x: 0, y: 0, w: 16, h: 600 },
    { x: 944, y: 0, w: 16, h: 600 },
  ];
}

export const LEVELS = [
  {
    name: 'Room 1 — The Gallery',
    intro: 'Lift the Jade Falcon and slip out the skylight door. Stay out of the cones.',
    start: { x: 60, y: 540 },
    walls: [
      ...borderWalls(),
      { x: 380, y: 16, w: 18, h: 140 },
      { x: 380, y: 300, w: 18, h: 284 },
      { x: 640, y: 120, w: 18, h: 180 },
    ],
    // Display cases and crates: solid cover that blocks sight.
    cover: [
      { x: 200, y: 120, w: 70, h: 40, kind: 'case' },
      { x: 200, y: 420, w: 70, h: 40, kind: 'case' },
      { x: 520, y: 180, w: 60, h: 36, kind: 'case' },
      { x: 740, y: 470, w: 80, h: 40, kind: 'crate' },
    ],
    // Dark floor lanes where cones see only half as far.
    shadows: [
      { x: 28, y: 60, w: 84, h: 480 },
      { x: 480, y: 516, w: 320, h: 52 },
    ],
    // Grate corridors: fully hidden from cones, but slow to crawl through.
    vents: [
      { x: 140, y: 544, w: 320, h: 26 },
      { x: 60, y: 140, w: 26, h: 240 },
    ],
    guards: [
      {
        name: 'Marco',
        path: [[120, 240], [340, 240], [340, 480], [120, 480]],
        speed: 62,
        pause: 1.1,
        range: 175,
        halfAngle: 0.62,
      },
      {
        name: 'Petra',
        path: [[700, 140], [880, 140], [880, 440], [700, 440]],
        speed: 70,
        pause: 0.9,
        range: 180,
        halfAngle: 0.6,
      },
    ],
    cameras: [
      { x: 480, y: 16, base: Math.PI / 2, sweep: 0.7, speed: 0.55, range: 235, halfAngle: 0.5 },
    ],
    loot: { x: 830, y: 300, name: 'Jade Falcon', value: 500 },
    exit: { x: 896, y: 28, w: 48, h: 48, label: 'Skylight door' },
  },
  {
    name: 'Room 2 — The Vault Floor',
    intro: 'The Vault Core sits past three guards and two cameras. Take it and vanish.',
    start: { x: 890, y: 540 },
    walls: [
      ...borderWalls(),
      { x: 300, y: 16, w: 18, h: 150 },
      { x: 300, y: 330, w: 18, h: 254 },
      { x: 640, y: 180, w: 18, h: 220 },
      { x: 430, y: 300, w: 190, h: 18 },
    ],
    cover: [
      { x: 480, y: 140, w: 44, h: 44, kind: 'pillar' },
      { x: 480, y: 440, w: 44, h: 44, kind: 'pillar' },
      { x: 760, y: 120, w: 70, h: 44, kind: 'crate' },
      { x: 180, y: 470, w: 70, h: 44, kind: 'crate' },
    ],
    shadows: [
      { x: 330, y: 28, w: 300, h: 60 },
      { x: 860, y: 120, w: 70, h: 360 },
    ],
    vents: [
      { x: 330, y: 544, w: 300, h: 26 },
      { x: 60, y: 60, w: 26, h: 180 },
    ],
    guards: [
      {
        name: 'Marco',
        path: [[120, 200], [260, 200], [260, 420], [120, 420]],
        speed: 66,
        pause: 1.0,
        range: 180,
        halfAngle: 0.62,
      },
      {
        name: 'Ilsa',
        path: [[360, 120], [600, 120], [600, 240], [360, 240]],
        speed: 74,
        pause: 0.8,
        range: 185,
        halfAngle: 0.6,
      },
      {
        name: 'Petra',
        path: [[700, 360], [880, 360], [880, 520], [700, 520]],
        speed: 78,
        pause: 0.8,
        range: 185,
        halfAngle: 0.6,
      },
    ],
    cameras: [
      { x: 480, y: 16, base: Math.PI / 2, sweep: 0.75, speed: 0.6, range: 240, halfAngle: 0.5 },
      { x: 944, y: 300, base: Math.PI, sweep: 0.55, speed: 0.7, range: 230, halfAngle: 0.48 },
    ],
    loot: { x: 480, y: 380, name: 'Vault Core', value: 500 },
    exit: { x: 28, y: 28, w: 48, h: 48, label: 'Service door' },
  },
];
