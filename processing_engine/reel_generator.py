import os
import sys
import json
import logging
import subprocess
import shutil
from pathlib import Path
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

# Standard social media aspect ratio dimensions (Width x Height)
ASPECT_RATIOS = {
    "9:16": {"width": 1080, "height": 1920, "label": "TikTok / Reels / Shorts (9:16)"},
    "1:1": {"width": 1080, "height": 1080, "label": "Instagram / Square (1:1)"},
    "4:5": {"width": 1080, "height": 1350, "label": "Instagram Portrait (4:5)"},
    "16:9": {"width": 1920, "height": 1080, "label": "Landscape (16:9)"},
}

DEFAULT_PUNCHLINES = {
    "SIX": [
        "⚡ WHAT A MONSTER SIX!",
        "🚀 OUT OF THE STADIUM!",
        "💥 MAXIMUM IMPACT!",
        "🔥 UNBELIEVABLE HIT!",
        "👑 PURE CLASS SIX!",
    ],
    "FOUR": [
        "🎯 SURGICAL PRECISION!",
        "⚡ PIERCES THE GAP!",
        "🚀 RACING TO THE FENCE!",
        "🔥 WHAT A TIMING!",
    ],
    "WICKET": [
        "💥 TIMBER! CLEAN BOWLED!",
        "🔥 ABSOLUTE RIPPER!",
        "⚡ WHAT A DELIVERY!",
        "🛑 BIG WICKET FALLS!",
        "🧤 INCREDIBLE DISMISSAL!",
    ],
    "DEFAULT": [
        "🔥 VIRAL CRICKET MOMENT",
        "⚡ UNBELIEVABLE ACTION",
        "🏏 CRICKET MASTERCLASS",
    ]
}


class ReelGenerator:
    """
    AI-Powered Social Media Reel & TikTok Generator
    Transforms horizontal cricket clips into high-engagement vertical videos (9:16).
    """

    def __init__(self, media_root: str):
        self.media_root = Path(media_root)
        self.reels_dir = self.media_root / "cricket_sessions" / "reels"
        self.reels_dir.mkdir(parents=True, exist_ok=True)

    def _get_ffmpeg_cmd(self) -> str:
        """Returns ffmpeg command name/path."""
        return "ffmpeg"

    def _escape_drawtext(self, text: str) -> str:
        """Escapes text for FFmpeg drawtext filter."""
        if not text:
            return ""
        return text.replace(":", "\\:").replace("'", "\\'").replace("%", "\\%").replace(",", "\\,").replace('"', '\\"')

    def _build_filter_complex(
        self,
        aspect_ratio: str = "9:16",
        layout: str = "smart_crop",
        caption_text: Optional[str] = None,
        event_badge: Optional[str] = None,
        score_text: Optional[str] = None,
        caption_style: str = "kinetic_bold",
        editing_style: str = "hyper_viral",
    ) -> str:
        """
        Builds FFmpeg filter complex for layout + editing style + captions.
        editing_style: hyper_viral | cinematic | raw_action
        """
        target_w = ASPECT_RATIOS.get(aspect_ratio, ASPECT_RATIOS["9:16"])["width"]
        target_h = ASPECT_RATIOS.get(aspect_ratio, ASPECT_RATIOS["9:16"])["height"]

        # --- Editing style color grade appended after layout ---
        if editing_style == "cinematic":
            # Moody: slight desaturation, increased contrast
            style_filter = ",eq=brightness=-0.06:contrast=1.12:saturation=0.72"
        elif editing_style == "hyper_viral":
            # Punchy: high contrast, boosted saturation
            style_filter = ",eq=contrast=1.18:saturation=1.35"
        else:  # raw_action — unfiltered, natural vibe
            style_filter = ",eq=contrast=1.05:saturation=1.0"

        filter_parts = []

        if layout == "smart_crop":
            # 1. SMART ACTION FOCUS: Tight 1.25x Pitch Action Zoom Crop (Close-up focus on batsman, bowler & pitch action)
            filter_parts.append(
                f"[0:v]scale=-1:2400,crop={target_w}:{target_h}:(iw-{target_w})/2:(ih-{target_h})/2,setsar=1,format=yuv420p{style_filter}[vfinal]"
            )

        elif layout == "split_stack":
            # 2. DUAL CAMERA PIP: Full-Screen 9:16 Video + Top-Right Picture-in-Picture (PiP) Replay Inset (Single main video, no half-and-half split!)
            filter_parts.append(
                f"[0:v]split=2[main_raw][pip_raw];"
                f"[main_raw]scale={target_w}:{target_h}:force_original_aspect_ratio=increase,crop={target_w}:{target_h},setsar=1[main];"
                f"[pip_raw]scale=320:180,drawbox=x=0:y=0:w=iw:h=ih:color=0x00FF87@0.8:t=3[pip];"
                f"[main][pip]overlay=W-w-36:72,setsar=1,format=yuv420p{style_filter}[vfinal]"
            )

        else:  # ambient_blur
            # 3. AMBIENT CANVAS: Crisp centered 16:9 video over dark ambient backdrop
            filter_parts.append(
                f"[0:v]split=2[bg_raw][fg_raw];"
                f"[bg_raw]scale=270:480,boxblur=6:2,scale={target_w}:{target_h},eq=brightness=-0.25:saturation=1.1[bg];"
                f"[fg_raw]scale={target_w}:-1:force_original_aspect_ratio=decrease[fg];"
                f"[bg][fg]overlay=0:({target_h}-h)/2,setsar=1,format=yuv420p{style_filter}[vfinal]"
            )

        return ";".join(filter_parts)

    def generate_single_event_reel(
        self,
        source_video_path: str,
        session_id: str,
        event: Dict[str, Any],
        aspect_ratio: str = "9:16",
        layout: str = "smart_crop",
        caption_style: str = "kinetic_bold",
        editing_style: str = "hyper_viral",
        custom_caption: Optional[str] = None,
        hype_audio: bool = True,
    ) -> Dict[str, Any]:
        """
        Extracts an event clip and transforms it into a vertical 9:16 viral reel.
        """
        event_id = event.get("event_id", "event")
        event_type = str(event.get("event_type", "MOMENT")).upper()
        timestamp = float(event.get("timestamp", 0))

        # Reel output path (includes editing_style and layout for accurate cache lookup)
        reel_filename = f"reel_{session_id}_{event_id}_{aspect_ratio.replace(':', 'x')}_{layout}_{editing_style}.mp4"
        reel_path = self.reels_dir / reel_filename

        # Return cached if already rendered
        if reel_path.exists() and reel_path.stat().st_size > 10000:
            return {
                "success": True,
                "reel_filename": reel_filename,
                "reel_path": str(reel_path),
                "duration": 20,
                "aspect_ratio": aspect_ratio,
                "layout": layout,
                "editing_style": editing_style,
                "event_type": event_type,
            }

        # Calculate clip start and duration (15-20s for high viral retention)
        clip_start = max(0, timestamp - 12)
        clip_duration = 20

        # Determine captions and badges
        event_badge = f"⚡ {event_type}"
        if event_type == "SIX":
            event_badge = "🏆 MAXIMUM SIX (+6)"
        elif event_type == "FOUR":
            event_badge = "🎯 BOUNDARY FOUR (+4)"
        elif event_type == "WICKET":
            event_badge = "💥 WICKET! DISMISSED!"

        if custom_caption and custom_caption.strip():
            main_caption = custom_caption.strip()
        else:
            punchlines = DEFAULT_PUNCHLINES.get(event_type, DEFAULT_PUNCHLINES["DEFAULT"])
            import random
            main_caption = random.choice(punchlines)

        score_text = event.get("current") or event.get("previous") or ""

        # Build FFmpeg filter complex
        filter_complex = self._build_filter_complex(
            aspect_ratio=aspect_ratio,
            layout=layout,
            caption_text=main_caption,
            event_badge=event_badge,
            score_text=score_text,
            caption_style=caption_style,
            editing_style=editing_style,
        )

        ffmpeg_bin = self._get_ffmpeg_cmd()
        cmd = [
            ffmpeg_bin,
            "-y",
            "-ss", str(clip_start),
            "-t", str(clip_duration),
            "-i", str(source_video_path),
            "-filter_complex", filter_complex,
            "-map", "[vfinal]",
            "-map", "0:a?",
            "-c:v", "libx264",
            "-preset", "veryfast",
            "-crf", "22",
            "-c:a", "aac",
            "-b:a", "192k",
            "-movflags", "+faststart",
            str(reel_path)
        ]

        logger.info(f"Rendering Reel: {' '.join(cmd)}")
        try:
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=120)
            if res.returncode != 0:
                logger.warning(f"Complex filter warning: {res.stderr[:200]}. Trying basic crop.")
                # Fallback to simple crop if complex filter fails
                target_w = ASPECT_RATIOS.get(aspect_ratio, ASPECT_RATIOS["9:16"])["width"]
                target_h = ASPECT_RATIOS.get(aspect_ratio, ASPECT_RATIOS["9:16"])["height"]
                fallback_filter = f"scale={target_w}:{target_h}:force_original_aspect_ratio=increase,crop={target_w}:{target_h}"
                fallback_cmd = [
                    ffmpeg_bin, "-y",
                    "-ss", str(clip_start), "-t", str(clip_duration),
                    "-i", str(source_video_path),
                    "-vf", fallback_filter,
                    "-c:v", "libx264", "-preset", "ultrafast",
                    "-c:a", "aac",
                    "-movflags", "+faststart",
                    str(reel_path)
                ]
                subprocess.run(fallback_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True, timeout=90)

            return {
                "success": True,
                "reel_filename": reel_filename,
                "reel_path": str(reel_path),
                "duration": clip_duration,
                "aspect_ratio": aspect_ratio,
                "layout": layout,
                "editing_style": editing_style,
                "event_type": event_type,
                "caption": main_caption,
            }

        except Exception as e:
            logger.error(f"Failed to generate reel: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def generate_montage_reel(
        self,
        source_video_path: str,
        session_id: str,
        events: List[Dict[str, Any]],
        aspect_ratio: str = "9:16",
        layout: str = "split_stack",
        caption_style: str = "kinetic_bold",
        editing_style: str = "hyper_viral",
        selected_event_ids: Optional[List[Any]] = None
    ) -> Dict[str, Any]:
        """
        Generates a quick-paced montage reel of top moments (or specifically selected events).
        Returns dict with success status and filename.
        """
        if selected_event_ids and isinstance(selected_event_ids, list):
            selection_hash = "_".join(str(x) for x in selected_event_ids)[:30]
            reel_filename = f"montage_{session_id}_{selection_hash}_{aspect_ratio.replace(':', 'x')}_{layout}_{editing_style}.mp4"
        else:
            reel_filename = f"montage_{session_id}_{aspect_ratio.replace(':', 'x')}_{layout}_{editing_style}.mp4"
            
        reel_path = self.reels_dir / reel_filename

        if reel_path.exists() and reel_path.stat().st_size > 10000:
            return {
                "success": True,
                "reel_filename": reel_filename,
                "reel_path": str(reel_path),
                "aspect_ratio": aspect_ratio,
                "layout": layout,
                "editing_style": editing_style,
                "is_montage": True,
            }

        sorted_events = []
        if selected_event_ids and isinstance(selected_event_ids, list):
            # Map events by event_id string and also by list index
            events_by_id = {}
            for idx, ev in enumerate(events):
                eid = str(ev.get("event_id", idx))
                events_by_id[eid] = ev
                events_by_id[str(idx)] = ev

            for sid in selected_event_ids:
                ev = events_by_id.get(str(sid))
                if ev and ev not in sorted_events:
                    sorted_events.append(ev)
                    
        # Fallback if no valid selection or top_montage requested
        if not sorted_events:
            sorted_events = sorted(
                events,
                key=lambda ev: 3 if str(ev.get("event_type")).upper() == "WICKET" else (2 if str(ev.get("event_type")).upper() == "SIX" else 1),
                reverse=True
            )[:3]

        if not sorted_events:
            return self.generate_single_event_reel(
                source_video_path,
                session_id,
                {"event_id": "top_moment", "event_type": "MOMENT", "timestamp": 15},
                aspect_ratio=aspect_ratio,
                layout=layout,
                editing_style=editing_style,
            )

        temp_clips = []
        try:
            target_w = ASPECT_RATIOS.get(aspect_ratio, ASPECT_RATIOS["9:16"])["width"]
            target_h = ASPECT_RATIOS.get(aspect_ratio, ASPECT_RATIOS["9:16"])["height"]

            for idx, ev in enumerate(sorted_events):
                temp_clip = self.reels_dir / f"temp_part_{session_id}_{idx}.mp4"
                # Clean any stale temp file
                if temp_clip.exists():
                    temp_clip.unlink()

                ts = float(ev.get("timestamp", 0))
                c_start = max(0, ts - 8)
                c_dur = 11

                ev_type = str(ev.get("event_type", "HIGHLIGHT")).upper()
                badge = f"🔥 MOMENT #{idx+1} • {ev_type}"

                # Build filter complex with actual layout + editing style
                fc = self._build_filter_complex(
                    aspect_ratio=aspect_ratio,
                    layout=layout,
                    caption_text=f"⚡ ACTION CLIP #{idx+1}",
                    event_badge=badge,
                    score_text=ev.get("current", ""),
                    caption_style=caption_style,
                    editing_style=editing_style,
                )

                # --- Strategy A: Re-use pre-saved individual event clip (apply layout via filter_complex) ---
                clip_path_rel = ev.get("clip_path", "")
                saved_clip = None
                if clip_path_rel:
                    candidate = self.media_root / clip_path_rel
                    if candidate.exists() and candidate.stat().st_size > 1000:
                        saved_clip = candidate

                if saved_clip:
                    convert_cmd = [
                        self._get_ffmpeg_cmd(), "-y",
                        "-threads", "0",
                        "-i", str(saved_clip),
                        "-filter_complex", fc,
                        "-map", "[vfinal]", "-map", "0:a?",
                        "-c:v", "libx264", "-preset", "ultrafast",
                        "-c:a", "aac", "-b:a", "128k",
                        str(temp_clip)
                    ]
                    r = subprocess.run(convert_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=120)
                    if r.returncode == 0 and temp_clip.exists() and temp_clip.stat().st_size > 1000:
                        logger.info(f"[montage] temp_clip {idx} ({layout}/{caption_style}) from saved clip")
                        temp_clips.append(str(temp_clip))
                        continue
                    else:
                        logger.warning(f"[montage] filter_complex on saved clip failed (rc={r.returncode}), fallback to simple crop")
                        # Fallback: simple crop without captions
                        fb = [
                            self._get_ffmpeg_cmd(), "-y",
                            "-threads", "0",
                            "-i", str(saved_clip),
                            "-vf", f"scale=-1:{target_h},crop={target_w}:{target_h},setsar=1,format=yuv420p",
                            "-c:v", "libx264", "-preset", "ultrafast",
                            "-map", "0:v", "-map", "0:a?",
                            "-c:a", "aac", "-b:a", "128k",
                            str(temp_clip)
                        ]
                        r_fb = subprocess.run(fb, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=90)
                        if r_fb.returncode == 0 and temp_clip.exists() and temp_clip.stat().st_size > 1000:
                            temp_clips.append(str(temp_clip))
                            continue

                # --- Strategy B: Cut from source video (apply layout via filter_complex) ---
                cut_cmd = [
                    self._get_ffmpeg_cmd(), "-y",
                    "-threads", "0",
                    "-ss", str(c_start), "-t", str(c_dur),
                    "-i", str(source_video_path),
                    "-filter_complex", fc,
                    "-map", "[vfinal]", "-map", "0:a?",
                    "-c:v", "libx264", "-preset", "ultrafast",
                    "-c:a", "aac", "-b:a", "128k",
                    str(temp_clip)
                ]
                r2 = subprocess.run(cut_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=120)
                if r2.returncode == 0 and temp_clip.exists() and temp_clip.stat().st_size > 1000:
                    logger.info(f"[montage] temp_clip {idx} built from source at t={c_start}")
                    temp_clips.append(str(temp_clip))
                else:
                    logger.error(f"[montage] FAILED to build temp_clip {idx}: {r2.stderr[-300:]}")
                    raise Exception(f"Could not build temp clip {idx} for event {ev.get('event_id')}")

            if not temp_clips:
                raise Exception("No temp clips were generated successfully")

            # --- Concat all temp clips ---
            concat_list = self.reels_dir / f"concat_{session_id}.txt"
            with open(concat_list, "w", encoding="utf-8") as f:
                for p in temp_clips:
                    safe_p = Path(p).as_posix()
                    f.write(f"file '{safe_p}'\n")

            concat_cmd = [
                self._get_ffmpeg_cmd(), "-y",
                "-threads", "0",
                "-f", "concat", "-safe", "0",
                "-i", str(concat_list),
                "-c", "copy",
                "-movflags", "+faststart",
                str(reel_path)
            ]
            res = subprocess.run(concat_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=120)
            if res.returncode != 0:
                # Final fallback: re-encode with filter_complex concat (auto audio probe)
                logger.warning(f"[montage] concat demuxer failed (rc={res.returncode}), using filter_complex...")
                # Probe audio in first clip
                probe = subprocess.run(
                    [self._get_ffmpeg_cmd(), "-i", temp_clips[0]],
                    stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=10
                )
                has_audio = "Audio:" in probe.stderr
                fi = []
                fs = []
                for i, p in enumerate(temp_clips):
                    fi.extend(["-i", p])
                    fs.append(f"[{i}:v][{i}:a]" if has_audio else f"[{i}:v]")
                if has_audio:
                    fstr = "".join(fs) + f"concat=n={len(temp_clips)}:v=1:a=1[vout][aout]"
                    fb_cmd = [
                        self._get_ffmpeg_cmd(), "-y",
                        *fi,
                        "-filter_complex", fstr,
                        "-map", "[vout]", "-map", "[aout]",
                        "-c:v", "libx264", "-preset", "ultrafast",
                        "-c:a", "aac",
                        "-movflags", "+faststart",
                        str(reel_path)
                    ]
                else:
                    fstr = "".join(fs) + f"concat=n={len(temp_clips)}:v=1:a=0[vout]"
                    fb_cmd = [
                        self._get_ffmpeg_cmd(), "-y",
                        *fi,
                        "-filter_complex", fstr,
                        "-map", "[vout]",
                        "-c:v", "libx264", "-preset", "ultrafast",
                        "-an",
                        "-movflags", "+faststart",
                        str(reel_path)
                    ]
                subprocess.run(fb_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True, timeout=90)

            for p in temp_clips:
                try:
                    os.remove(p)
                except Exception:
                    pass
            try:
                os.remove(concat_list)
            except Exception:
                pass

            return {
                "success": True,
                "reel_filename": reel_filename,
                "reel_path": str(reel_path),
                "aspect_ratio": aspect_ratio,
                "is_montage": True,
                "moments_count": len(sorted_events)
            }

        except Exception as e:
            logger.error(f"Montage generation error: {e}")
            if reel_path.exists():
                try:
                    os.remove(reel_path)
                except Exception:
                    pass
            return {
                "success": False,
                "error": str(e)
            }
