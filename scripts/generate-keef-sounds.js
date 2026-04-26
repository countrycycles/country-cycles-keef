// scripts/generate-keef-sounds.js
// Generates KEEF UI sounds into web/assets/sounds/
// Requires Node.js + ffmpeg installed locally.
// Run: node scripts/generate-keef-sounds.js
//
// (A Python equivalent that uses the macOS-native `afconvert` instead of
//  ffmpeg lives alongside this file as generate-keef-sounds.py — handy if
//  you don't want to install ffmpeg.)

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

// Output goes into the static web app. Adjust if you move the assets folder.
const outDir = path.join(__dirname, "..", "assets", "sounds");
fs.mkdirSync(outDir, { recursive: true });

const sampleRate = 44100;

function writeWav(filename, samples) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.floor(s * 32767), 44 + i * 2);
  }

  fs.writeFileSync(filename, buffer);
}

function envelope(t, duration, attack = 0.02, release = 0.08) {
  if (t < attack) return t / attack;
  if (t > duration - release) return Math.max(0, (duration - t) / release);
  return 1;
}

function sine(freq, t) { return Math.sin(2 * Math.PI * freq * t); }

function click(t, start, level = 0.08) {
  const d = t - start;
  if (d < 0 || d > 0.025) return 0;
  return level * Math.exp(-d * 80) * Math.sin(2 * Math.PI * 1800 * d);
}

function renderSound(duration, voiceFn) {
  const total = Math.floor(sampleRate * duration);
  const samples = new Float32Array(total);
  for (let i = 0; i < total; i++) {
    const t = i / sampleRate;
    samples[i] = voiceFn(t, duration) * envelope(t, duration);
  }
  return samples;
}

const sounds = [
  { name: "keef_01_hello",    duration: 0.8, voice: (t) => 0.22 * sine(t < 0.38 ? 660 : 880, t) + click(t, 0.02) + click(t, 0.4) },
  { name: "keef_02_question", duration: 0.3, voice: (t) => 0.20 * sine(720 + t * 180, t) + click(t, 0.01, 0.05) },
  { name: "keef_03_success",  duration: 1.0, voice: (t) => { const f = t < 0.28 ? 660 : t < 0.58 ? 880 : 1100; return 0.22 * sine(f, t) + click(t, 0.02) + click(t, 0.32); } },
  { name: "keef_04_loading",  duration: 2.5, voice: (t) => { const p = Math.sin(2 * Math.PI * 2 * t) > 0 ? 1 : 0.4; return 0.12 * p * sine(330, t) + click(t, 0.25) + click(t, 1.25) + click(t, 2.25); } },
  { name: "keef_05_tip",      duration: 0.5, voice: (t) => 0.22 * sine(1200, t) + 0.10 * sine(1600, t) + click(t, 0.02, 0.05) },
  { name: "keef_06_unsure",   duration: 0.6, voice: (t) => 0.20 * sine(620 - t * 220, t) + click(t, 0.05, 0.04) },
  { name: "keef_07_scan",     duration: 1.0, voice: (t) => { const f = t < 0.25 ? 700 : t < 0.5 ? 850 : t < 0.75 ? 1000 : 850; return 0.18 * sine(f, t) + click(t, 0.08) + click(t, 0.36) + click(t, 0.64); } },
  { name: "keef_08_stop",     duration: 1.2, voice: (t) => { const active = (t < 0.35 || (t > 0.55 && t < 0.9)) ? 1 : 0; return active * 0.24 * sine(300, t) + click(t, 0.02, 0.1) + click(t, 0.56, 0.1); } },
];

for (const sound of sounds) {
  const wavPath = path.join(outDir, `${sound.name}.wav`);
  const mp4Path = path.join(outDir, `${sound.name}.mp4`);
  const samples = renderSound(sound.duration, sound.voice);
  writeWav(wavPath, samples);
  execFileSync("ffmpeg", ["-y", "-i", wavPath, "-c:a", "aac", "-b:a", "128k", mp4Path], { stdio: "inherit" });
  fs.unlinkSync(wavPath);
  console.log(`Created ${mp4Path}`);
}

console.log("KEEF sound pack generated.");
