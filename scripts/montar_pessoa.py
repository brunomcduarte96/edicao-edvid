#!/usr/bin/env python3
"""Monta o Bruno recortado (chroma key) no 9:16 com transparência, seguindo o rosto.

Uso (a partir da pasta edit/ do vídeo, depois do face_track.py):
  python3 <repo>/scripts/montar_pessoa.py cut.mp4 verify/track_src.json remotion/public/pessoa_v.mov

Receita aprovada em 22/11/2026 (vídeo "vagas ia 22112026"):
  chromakey 0x6CC042 · tolerância 0,10 · suavização 0,03 → despill verde pela metade
  → crop 982×1080 seguindo o rosto (média de ±0,5 s, chaves a cada 0,5 s)
  → escala 972×1069 → pad 1080×1920 em x=54, y=681 (topo da cabeça em ~790)
  → ProRes 4444 com alfa.
Ajuste COR/TOL/SUAVE se o verde da gravação mudar (meça os 4 cantos).
"""
import json, subprocess, sys, pathlib

COR, TOL, SUAVE = "0x6CC042", 0.10, 0.03
CROP_W, OUT_W, OUT_H, PAD_X, PAD_Y = 982, 972, 1069, 54, 681

cut, track, out = sys.argv[1:4]
d = json.load(open(track))
xs = [p[0] * d["width"] for p in d["points"]]
max_x = d["width"] - CROP_W
# O avaliador do ffmpeg não aceita if() aninhado demais (~100 níveis): em vídeos
# acima de ~45 s o passo entre chaves cresce para ficar em até 90 chaves.
STEP = max(15, -(-len(xs) // 90))
keys = []
for f in range(0, len(xs), STEP):
    w = xs[max(0, f - 15): f + 16]
    keys.append((f, round(min(max(sum(w) / len(w) - CROP_W / 2, 0), max_x), 1)))
if keys[-1][0] != len(xs) - 1:
    keys.append((len(xs) - 1, keys[-1][1]))
expr = str(keys[-1][1])
for (f0, x0), (f1, x1) in reversed(list(zip(keys, keys[1:]))):
    expr = f"if(lt(n,{f1}),{x0}+({x1}-{x0})*(n-{f0})/{f1-f0},{expr})"
filt = (f"[0:v]chromakey={COR}:{TOL}:{SUAVE},despill=type=green:mix=0.5:expand=0,format=yuva444p,"
        f"crop={CROP_W}:1080:x='{expr}':y=0,scale={OUT_W}:{OUT_H}:flags=lanczos,"
        f"pad=1080:1920:{PAD_X}:{PAD_Y}:color=black@0,format=yuva444p10le[v]")
fp = pathlib.Path(out).with_suffix(".filter.txt")
fp.write_text(filt)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", cut, "-/filter_complex", str(fp), "-map", "[v]", "-an",
                "-c:v", "prores_ks", "-profile:v", "4444", "-alpha_bits", "16", "-vendor", "apl0", out], check=True)
fp.unlink()
print("ok:", out)
