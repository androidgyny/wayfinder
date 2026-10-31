"""Original Wayfinder launch cue, CC0. Run from the repository root."""
import math
import random
import struct
import wave
from pathlib import Path

rate = 44100
rng = random.Random(232)
samples = []
for i in range(int(rate * .15)):
    t = i / rate
    value = 0.0
    for onset, gain, pitch in [(0, .48, 680), (.032, .72, 420)]:
        age = t - onset
        if age >= 0:
            attack = min(1, age / .0015)
            body = math.sin(2 * math.pi * pitch * age) * math.exp(-age / .016)
            click = rng.uniform(-1, 1) * math.exp(-age / .004)
            value += gain * attack * (.65 * body + .35 * click)
    value *= min(1, (.15 - t) / .01)
    samples.append(value)
peak = max(map(abs, samples))
dest = Path('app/src/main/assets/sounds/launch.wav')
with wave.open(str(dest), 'wb') as out:
    out.setparams((1, 2, rate, 0, 'NONE', 'not compressed'))
    out.writeframes(b''.join(struct.pack('<h', round(x / peak * 24000)) for x in samples))
print(f'{dest}: {len(samples)/rate:.3f}s, mono PCM, peak 24000/32767')
