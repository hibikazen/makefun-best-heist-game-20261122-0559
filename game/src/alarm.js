// The alarm meter: it fills while any cone holds the thief and drains when
// the thief breaks line of sight. Hitting the top is not an instant fail:
// the thief gets a short SPOTTED warning to break away. Only if a cone still
// holds them when the warning runs out are they caught.

export function makeAlarm() {
  return {
    value: 0, // 0..100
    state: 'calm', // calm | rising | warning | caught
    warningUntil: 0,
    raised: 0, // how many times the meter topped out this run
  };
}

const FILL_RATE = 46; // per second while seen
const FILL_RATE_SHADOW = 23; // per second while seen inside a shadow lane
const DRAIN_RATE = 30; // per second while hidden
const WARNING_SECONDS = 1.6;

export function updateAlarm(alarm, seen, inShadow, dt, now) {
  if (alarm.state === 'caught') return;
  if (alarm.state === 'warning') {
    if (!seen) {
      // Broke away in time: the warning ends and the meter drops hard.
      alarm.state = 'calm';
      alarm.value = 55;
      return;
    }
    if (now >= alarm.warningUntil) {
      alarm.state = 'caught';
      alarm.value = 100;
    }
    return;
  }
  if (seen) {
    alarm.value += (inShadow ? FILL_RATE_SHADOW : FILL_RATE) * dt;
    alarm.state = 'rising';
    if (alarm.value >= 100) {
      alarm.value = 100;
      alarm.state = 'warning';
      alarm.warningUntil = now + WARNING_SECONDS;
      alarm.raised += 1;
    }
  } else {
    alarm.value = Math.max(0, alarm.value - DRAIN_RATE * dt);
    if (alarm.value === 0) alarm.state = 'calm';
    else if (alarm.state === 'rising') alarm.state = 'calm';
  }
}

export function resetAlarm(alarm) {
  alarm.value = 0;
  alarm.state = 'calm';
  alarm.warningUntil = 0;
  alarm.raised = 0;
}
