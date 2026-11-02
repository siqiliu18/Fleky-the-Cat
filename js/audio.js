// Tiny synthesized sounds. No audio files, so the page stays simple
// and works offline after the first load. iPad Safari only allows
// sound after a tap, so unlock() runs from the button handlers.

let ctx = null;
let master = null;
let noise = null;
let muted = false;

function context() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.28;
  master.connect(ctx.destination);
  return ctx;
}

export function unlock() {
  const audio = context();
  if (audio && audio.state === "suspended") {
    audio.resume();
  }
}

export function isMuted() {
  return muted;
}

export function setMuted(next) {
  muted = next;
  if (master) master.gain.value = next ? 0 : 0.28;
}

function envGain(peak, dur) {
  const audio = context();
  const gain = audio.createGain();
  const now = audio.currentTime;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(peak, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  gain.connect(master);
  return { audio, gain, now };
}

function tone(freq, dur, type, peak, slideTo) {
  if (muted || !context()) return;
  const { audio, gain, now } = envGain(peak, dur);
  const osc = audio.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), now + dur);
  osc.connect(gain);
  osc.start(now);
  osc.stop(now + dur + 0.02);
}

function noiseWhoosh() {
  if (muted || !context()) return;
  const audio = context();
  if (!noise) {
    const length = Math.floor(audio.sampleRate * 0.25);
    noise = audio.createBuffer(1, length, audio.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  }
  const src = audio.createBufferSource();
  src.buffer = noise;
  const filter = audio.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(400, audio.currentTime);
  filter.frequency.exponentialRampToValueAtTime(1400, audio.currentTime + 0.18);
  filter.Q.value = 0.7;
  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.0001, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.12, audio.currentTime + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.22);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  src.start();
  src.stop(audio.currentTime + 0.24);
}

function chime(notes, type, peak, step) {
  notes.forEach((freq, i) => {
    const wait = i * step;
    window.setTimeout(() => tone(freq, 0.22, type, peak, null), wait * 1000);
  });
}

// Names match the three tricks plus the yarn pickup.
export function play(name) {
  if (muted || !context()) return;
  if (name === "pounce") {
    noiseWhoosh();
    tone(520, 0.12, "sine", 0.08, 340);
  } else if (name === "yarn") {
    chime([523, 659, 784, 1046], "triangle", 0.14, 0.07);
    tone(640, 0.26, "sine", 0.12, 420);
  } else if (name === "jump") {
    noiseWhoosh();
    tone(380, 0.28, "sine", 0.1, 760);
  } else if (name === "hoop") {
    chime([784, 988, 1175, 1568], "triangle", 0.13, 0.06);
  } else if (name === "land") {
    tone(240, 0.12, "sine", 0.1, 140);
  } else if (name === "roll") {
    tone(520, 0.14, "sine", 0.12, 280);
    window.setTimeout(() => tone(420, 0.16, "sine", 0.1, 560), 140);
    window.setTimeout(() => tone(360, 0.18, "triangle", 0.08, 220), 300);
  } else if (name === "meow") {
    const wobble = 560 + Math.random() * 80;
    tone(wobble, 0.28, "sine", 0.16, 380);
  }
}
