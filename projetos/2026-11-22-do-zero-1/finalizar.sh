#!/bin/zsh
set -e
cd "/Users/brunoduarte/Github/edicao-edvid/videos/brutos/do zero 1 22112026"
E=edit
(cd $E/remotion && npx remotion render Reels out/render.mp4 --concurrency=6 > out/render2.log 2>&1)
ffmpeg -v error -y -i $E/cut.mp4 -i $E/sfx/sfx.wav -filter_complex "[0:a]aresample=48000[v];[1:a]aresample=48000[s];[v][s]amix=inputs=2:duration=first:normalize=0[a]" -map "[a]" $E/mix_raw.wav
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 $E/remotion/out/render.mp4)
J=$(ffmpeg -i $E/mix_raw.wav -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
II=$(echo "$J"|python3 -c "import json,sys;d=json.load(sys.stdin);print(f\"measured_I={d['input_i']}:measured_TP={d['input_tp']}:measured_LRA={d['input_lra']}:measured_thresh={d['input_thresh']}:offset={d['target_offset']}\")")
ffmpeg -v error -y -i $E/remotion/out/render.mp4 -i $E/mix_raw.wav -map 0:v -map 1:a -c:v copy -af "loudnorm=I=-14:TP=-1.5:LRA=11:${II}:linear=true,aresample=48000" -c:a aac -b:a 192k -t $D -movflags +faststart "do zero 1 22112026_final.mp4"
ffmpeg -v error -y -i "do zero 1 22112026_final.mp4" -vf scale=720:-2 -c:v libx264 -preset medium -crf 27 -c:a aac -b:a 128k -movflags +faststart "do zero 1 22112026_final_previa720.mp4"
ffmpeg -i "do zero 1 22112026_final.mp4" -af loudnorm=print_format=summary -f null - 2>&1 | grep -E "Input Integrated|Input True Peak"
echo FINAL_OK
