#!/usr/bin/env python3
"""Fase 1: prévia da tela dividida (1080x1920) a partir do cut.mp4 + tela.mp4.
Uso: python3 split_preview.py <pasta do bruto>   (lê edit/edl.json, escreve edit/split.mp4)"""
import json, subprocess, sys, os
B = sys.argv[1]; E = os.path.join(B, "edit")
edl = json.load(open(os.path.join(E, "edl.json"))); T = edl["jcut_timeline"]
def vs(i): return T[i]["video_start_in_output"]
def ve(i): return T[i]["video_start_in_output"] + T[i]["video_duration"]
D = ve(len(T) - 1)
# passos: (primeiro range, último range, tela início, tela fim, crop y)
STEPS = [(1, 2, 13, 22, 120), (3, 5, 44, 54, 120), (6, 8, 64, 86, 120),
         (9, 14, 94, 108, 120), (15, 16, 146, 158, 120), (17, 17, 200, 201.6, 120),
         (18, 18, 186.4, 190, 120)]
S0, S1 = vs(STEPS[0][0]), ve(STEPS[-1][1])
# borrão dos dados pessoais no resumo de e-mails (tempo da tela): Atenção + Comercial + última linha
BLUR = "between(t,76,149.5)"
f = []
f.append(f"color=c=0x0B0B0B:s=1080x1920:r=30:d={D:.3f},drawgrid=w=72:h=72:t=1:c=white@0.04[bg]")
f.append("[0:v]scale=1080:960,chromakey=0x6CC042:0.10:0.03,despill=type=green:mix=0.5:expand=0,split[ca][cb]")
f.append("[ca]scale=1512:1344[full]")
f.append(f"[1:v]split[t0][tb];[tb]crop=390:600:325:240,boxblur=18:2[bl];[t0][bl]overlay=325:240:enable='{BLUR}'[tblur0]")
f.append(f"[tblur0]split={len(STEPS)}" + "".join(f"[ts{i}]" for i in range(len(STEPS))))
segs = []
for i, (a, b, ta, tb, cy) in enumerate(STEPS):
    out0 = vs(a); out1 = ve(b) if i == len(STEPS) - 1 else vs(STEPS[i + 1][0])
    d = out1 - out0; k = d / (tb - ta)
    f.append(f"[ts{i}]trim={ta}:{tb},setpts=(PTS-STARTPTS)*{k:.5f},fps=30,crop=1080:720:0:{cy},trim=duration={d:.4f}[s{i}]")
    segs.append(f"[s{i}]")
f.append("".join(segs) + f"concat=n={len(segs)}:v=1:a=0,setpts=PTS+{S0:.4f}/TB[tela]")
split = f"between(t,{S0:.3f},{S1:.3f})"
f.append(f"[bg][full]overlay=-216:576:enable='not({split})'[v1]")
f.append(f"[v1][cb]overlay=0:960:enable='{split}'[v2]")
f.append(f"[v2][tela]overlay=0:224:eof_action=pass:enable='{split}'[v3]")
f.append(f"[v3]drawbox=x=0:y=942:w=1080:h=3:c=0xE8A33D:t=fill:enable='{split}'[v]")
cmd = ["ffmpeg", "-v", "error", "-y", "-i", os.path.join(E, "cut.mp4"), "-i", os.path.join(B, "tela.mp4"),
       "-filter_complex", ";".join(f), "-map", "[v]", "-map", "0:a", "-c:v", "libx264", "-preset", "medium",
       "-crf", "22", "-pix_fmt", "yuv420p", "-c:a", "copy", "-t", f"{D:.3f}", "-movflags", "+faststart",
       os.path.join(E, "split.mp4")]
subprocess.run(cmd, check=True); print("ok", round(D, 2), "split", round(S0, 2), round(S1, 2))
