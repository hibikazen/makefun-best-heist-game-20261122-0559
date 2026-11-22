// Keyboard and mouse input. WASD or arrows move the thief; 1/2/3 fire tools;
// P pauses, R restarts the room, M mutes. The canvas itself is focusable so
// keyboard play works without clicking first, and every action also has a
// button in the HUD for mouse and touch players.

export function makeInput() {
  return {
    keys: new Set(),
    pressed: new Set(), // keys pressed since the last frame was consumed
    moveTarget: null, // {x, y} from a mouse click on the floor
  };
}

const MOVE_KEYS = {
  ArrowUp: [0, -1],
  KeyW: [0, -1],
  ArrowDown: [0, 1],
  KeyS: [0, 1],
  ArrowLeft: [-1, 0],
  KeyA: [-1, 0],
  ArrowRight: [1, 0],
  KeyD: [1, 0],
};

export function bindInput(input, canvas, onAction) {
  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    input.keys.add(event.code);
    input.pressed.add(event.code);
    if (MOVE_KEYS[event.code] || event.code === 'Space') {
      event.preventDefault();
    }
    if (event.code === 'Digit1' || event.code === 'Digit2' || event.code === 'Digit3') {
      onAction('tool', event.code.slice(-1));
    }
    if (event.code === 'KeyP') onAction('pause');
    if (event.code === 'KeyR') onAction('restart');
    if (event.code === 'KeyM') onAction('mute');
    if (event.code === 'Enter' || event.code === 'Space') onAction('confirm');
  });
  window.addEventListener('keyup', (event) => {
    input.keys.delete(event.code);
  });
  window.addEventListener('blur', () => {
    input.keys.clear();
  });
  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    input.moveTarget = {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
    canvas.focus();
  });
}

// Direction from the keys held down, normalised. Null when idle.
export function keyDirection(input) {
  let dx = 0;
  let dy = 0;
  for (const code of input.keys) {
    const dir = MOVE_KEYS[code];
    if (dir) {
      dx += dir[0];
      dy += dir[1];
    }
  }
  if (dx === 0 && dy === 0) return null;
  const len = Math.sqrt(dx * dx + dy * dy);
  return { x: dx / len, y: dy / len };
}

export function consumePressed(input, code) {
  if (input.pressed.has(code)) {
    input.pressed.delete(code);
    return true;
  }
  return false;
}

export function clearPressed(input) {
  input.pressed.clear();
}
