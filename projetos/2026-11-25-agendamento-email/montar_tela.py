#!/usr/bin/env python3
"""Fase 2: trilha da tela (1080x960, 30 fps) já no tempo do cut.mp4, com o resumo de e-mails borrado,
e o recorte do rosto em WebM VP9 com alfa. Uso: python3 montar_tela.py <pasta do bruto>"""
import json, subprocess, sys, os
B = sys.argv[1]; E = os.path.join(B, "edit"); P = os.path.join(E, "remotion", "public")
T = json.load(open(os.path.join(E, "edl.json")))["jcut_timeline"]
vs = lambda i: T[i]["video_start_in_output"]
D = vs(19) + T[19]["video_duration"]
# (início no corte, fim no corte, tela início, tela fim)
SEG = [(vs(1), vs(3), 13, 22), (vs(3), vs(6), 44, 54), (vs(6), vs(9), 64, 86), (vs(9), vs(11), 96, 98),
       (vs(15), vs(17), 146, 158), (vs(17), vs(18), 200, 201.43), (vs(18), vs(19), 186.4, 189.8)]
f = ["[0:v]split[t0][tb];[tb]crop=390:600:325:240,boxblur=18:2[bl];[t0][bl]overlay=325:240:enable='between(t,76,149.5)'[tbl]",
     f"[tbl]split={len(SEG)}" + "".join(f"[x{i}]" for i in range(len(SEG)))]
parts, cur = [], 0.0
for i, (a, b, ta, tb) in enumerate(SEG):
    if a - cur > 0.001:
        f.append(f"color=c=black:s=1080x960:r=30:d={a-cur:.4f}[g{i}]"); parts.append(f"[g{i}]")
    k = (b - a) / (tb - ta)
    f.append(f"[x{i}]trim={ta}:{tb},setpts=(PTS-STARTPTS)*{k:.5f},fps=30,trim=duration={b-a:.4f},setpts=PTS-STARTPTS[s{i}]")
    parts.append(f"[s{i}]"); cur = b
f.append(f"color=c=black:s=1080x960:r=30:d={D-cur:.4f}[gz]"); parts.append("[gz]")
f.append("".join(parts) + f"concat=n={len(parts)}:v=1:a=0,format=yuv420p[v]")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(B, "tela.mp4"), "-filter_complex", ";".join(f),
                "-map", "[v]", "-c:v", "libx264", "-crf", "16", "-preset", "medium", "-g", "15", "-t", f"{D:.3f}",
                os.path.join(P, "tela_track.mp4")], check=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(E, "cut.mp4"), "-vf",
                "scale=1080:960,chromakey=0x6CC042:0.10:0.03,despill=type=green:mix=0.5:expand=0,format=yuva420p",
                "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "30", "-deadline", "good",
                "-cpu-used", "4", "-row-mt", "1", "-auto-alt-ref", "0", "-an", os.path.join(P, "pessoa.webm")], check=True)
print("ok", round(D, 3), [(round(a, 3), round(b, 3)) for a, b, _, _ in SEG])
