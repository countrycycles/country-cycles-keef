#!/usr/bin/env python3
"""
generate-keef-sounds.py

Same KEEF sound pack as scripts/generate-keef-sounds.js, but synthesised in
Python (stdlib only) and converted to AAC-in-MP4 with macOS' built-in
afconvert. Use this when ffmpeg / Node aren't installed.

Run: python3 scripts/generate-keef-sounds.py
"""

from __future__ import annotations

import math
import os
import struct
import subprocess
import sys
import wave

SAMPLE_RATE = 44100
HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.normpath(os.path.join(HERE, "..", "assets", "sounds"))
os.makedirs(OUT_DIR, exist_ok=True)


def write_wav(path: str, samples: list[float]) -> None:
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SAMPLE_RATE)
        frames = bytearray()
        for s in samples:
            v = max(-1.0, min(1.0, s))
            frames += struct.pack("<h", int(v * 32767))
        w.writeframes(bytes(frames))


def envelope(t: float, duration: float, attack: float = 0.02, release: float = 0.08) -> float:
    if t < attack:
        return t / attack
    if t > duration - release:
        return max(0.0, (duration - t) / release)
    return 1.0


def sine(freq: float, t: float) -> float:
    return math.sin(2 * math.pi * freq * t)


def click(t: float, start: float, level: float = 0.08) -> float:
    d = t - start
    if d < 0 or d > 0.025:
        return 0.0
    return level * math.exp(-d * 80) * math.sin(2 * math.pi * 1800 * d)


def render(duration: float, voice) -> list[float]:
    total = int(SAMPLE_RATE * duration)
    out = [0.0] * total
    for i in range(total):
        t = i / SAMPLE_RATE
        out[i] = voice(t, duration) * envelope(t, duration)
    return out


# Voice functions — match scripts/generate-keef-sounds.js exactly.

def v_hello(t, d):
    return 0.22 * sine(660 if t < 0.38 else 880, t) + click(t, 0.02) + click(t, 0.4)

def v_question(t, d):
    return 0.20 * sine(720 + t * 180, t) + click(t, 0.01, 0.05)

def v_success(t, d):
    f = 660 if t < 0.28 else 880 if t < 0.58 else 1100
    return 0.22 * sine(f, t) + click(t, 0.02) + click(t, 0.32)

def v_loading(t, d):
    pulse = 1.0 if math.sin(2 * math.pi * 2 * t) > 0 else 0.4
    return 0.12 * pulse * sine(330, t) + click(t, 0.25) + click(t, 1.25) + click(t, 2.25)

def v_tip(t, d):
    return 0.22 * sine(1200, t) + 0.10 * sine(1600, t) + click(t, 0.02, 0.05)

def v_unsure(t, d):
    return 0.20 * sine(620 - t * 220, t) + click(t, 0.05, 0.04)

def v_scan(t, d):
    f = 700 if t < 0.25 else 850 if t < 0.5 else 1000 if t < 0.75 else 850
    return 0.18 * sine(f, t) + click(t, 0.08) + click(t, 0.36) + click(t, 0.64)

def v_stop(t, d):
    active = 1 if (t < 0.35 or (0.55 < t < 0.9)) else 0
    return active * 0.24 * sine(300, t) + click(t, 0.02, 0.1) + click(t, 0.56, 0.1)


SOUNDS = [
    ("keef_01_hello",    0.8, v_hello),
    ("keef_02_question", 0.3, v_question),
    ("keef_03_success",  1.0, v_success),
    ("keef_04_loading",  2.5, v_loading),
    ("keef_05_tip",      0.5, v_tip),
    ("keef_06_unsure",   0.6, v_unsure),
    ("keef_07_scan",     1.0, v_scan),
    ("keef_08_stop",     1.2, v_stop),
]


def main() -> int:
    for name, duration, voice in SOUNDS:
        wav_path = os.path.join(OUT_DIR, f"{name}.wav")
        mp4_path = os.path.join(OUT_DIR, f"{name}.mp4")
        samples = render(duration, voice)
        write_wav(wav_path, samples)
        # macOS-native AAC encoder. Outputs MPEG-4 container with AAC audio.
        subprocess.run(
            ["afconvert", "-f", "mp4f", "-d", "aac", "-q", "127", "-b", "128000",
             wav_path, mp4_path],
            check=True,
        )
        os.remove(wav_path)
        size = os.path.getsize(mp4_path)
        print(f"Created {mp4_path} ({size} bytes)")
    print("KEEF sound pack generated.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
