"""Finaliza a Fase 2 no Windows: voz do cut.mp4 + stem de efeitos, loudnorm em 2 passadas (-14 LUFS / -1,5 dBTP),
imagem do Remotion convertida para faixa limitada bt709, atraso de 1 quadro (33 ms) na voz."""
import json, subprocess, sys, pathlib, re
edit = pathlib.Path(sys.argv[1])
vdir = edit.parent
final = vdir / f"{vdir.name}_final.mp4"
render = edit / "remotion" / "out" / "render.mp4"
mix = edit / "mix_raw.wav"
def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
vd = float(run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=duration", "-of", "default=nw=1:nk=1", str(render)]).stdout.strip())
r = run(["ffmpeg", "-v", "error", "-y", "-i", str(edit / "cut.mp4"), "-i", str(edit / "sfx" / "sfx.wav"), "-filter_complex",
         "[0:a]aresample=48000[v];[1:a]aresample=48000[s];[v][s]amix=inputs=2:duration=first:normalize=0,adelay=33:all=1[a]",
         "-map", "[a]", str(mix)])
assert r.returncode == 0, r.stderr
r = run(["ffmpeg", "-hide_banner", "-i", str(mix), "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"])
j = json.loads(re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", r.stderr, re.S).group(0))
ln = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}"
      f":measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true,aresample=48000")
r = run(["ffmpeg", "-v", "error", "-y", "-i", str(render), "-i", str(mix), "-filter_complex",
         "[0:v]scale=in_range=full:out_range=limited,format=yuv420p,setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv[vid];[1:a]" + ln + "[out]",
         "-map", "[vid]", "-map", "[out]", "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p",
         "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
         "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-t", f"{vd:.3f}", "-movflags", "+faststart", str(final)])
assert r.returncode == 0, r.stderr
r = run(["ffmpeg", "-hide_banner", "-i", str(final), "-af", "loudnorm=print_format=summary", "-f", "null", "-"])
for line in r.stderr.splitlines():
    if "Input Integrated" in line or "Input True Peak" in line:
        print(line.strip())
prev = vdir / f"{vdir.name}_final_previa720.mp4"
run(["ffmpeg", "-v", "error", "-y", "-i", str(final), "-vf", "scale=720:-2", "-c:v", "libx264", "-preset", "medium", "-crf", "27",
     "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", str(prev)])
print("final:", final, round(vd, 2), "s")
