import json
import os
import sys
import io
import time
from datetime import datetime
from openai import OpenAI
from dotenv import load_dotenv

def _slog(msg, level="INFO", indent=0):
    """Pretty-print a timestamped log line to terminal for summary generator."""
    ts = datetime.now().strftime("%H:%M:%S")
    prefix = "  " * indent
    icons = {"INFO": "📌", "STEP": "▶️", "OK": "✅", "WARN": "⚠️", "ERR": "❌",
             "DATA": "📊", "AI": "🤖", "FILE": "📁", "DONE": "🎉"}
    icon = icons.get(level, "📌")
    print(f"[{ts}] {icon} {prefix}{msg}", flush=True)

# Fix encoding for Windows console
# sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 🔑 API Key setup
client = None

def get_openai_client():
    global client
    if client is not None:
        return client
    
    # Try loading from .env
    _slog("Loading OpenAI API key from .env...", "AI")
    load_dotenv()
    api_key = os.getenv("OPENAI_API_KEY")
    
    if not api_key:
        # Check if we are in a results directory and try to find .env in parent
        parent_env = os.path.join("..", "..", ".env")
        if os.path.exists(parent_env):
            _slog("Trying parent directory .env...", "AI")
            load_dotenv(parent_env)
            api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        _slog("OPENAI_API_KEY not found in environment!", "WARN")
        return None
    
    try:
        _slog(f"Initializing OpenAI client (key: ...{api_key[-4:]})", "AI")
        client = OpenAI(api_key=api_key)
        _slog("OpenAI client initialized successfully", "OK")
        return client
    except Exception as e:
        _slog(f"Error initializing OpenAI client: {e}", "ERR")
        return None

# Initialize early if possible, but don't fail import
get_openai_client()

# Load Verified Events JSON
def load_events(json_file):
    _slog(f"Loading events from: {json_file}", "FILE")
    if not os.path.exists(json_file):
        _slog(f"File not found: {json_file}", "ERR")
        return []
    with open(json_file, "r") as f:
        events = json.load(f)
    _slog(f"Loaded {len(events)} events from JSON", "OK")
    return events

# Prepare prompt for LLM
def build_prompt(events, params=None):
    _slog("Building LLM prompt from events...", "AI")
    if params is None:
        params = {'style': 'Professional'}
    
    style_choice = params.get('style', 'Professional')
    _slog(f"Style chosen: {style_choice}", "DATA")
    
    # Style descriptions
    style_guide = {
        "Neutral": "Objective, concise, and purely factual. Avoid flowery language or excessive excitement.",
        "Professional": "Elite broadcast journalism. Blends Harsha Bhogle's storytelling with Peter Drury's poetic flair. Balanced and insightful.",
        "Commentary": "High-octane, aggressive, and incredibly vivid. Like a radio commentator shouting through a loudspeaker. Full of metaphors and energy."
    }
    
    active_style = style_guide.get(style_choice, style_guide["Professional"])

    import re
    # Pre-process events into readable lines for GPT
    event_lines = []
    total_runs = 0
    total_wickets = 0
    total_fours = 0
    total_sixes = 0
    last_score = "0/0"
    last_over = "0.0"
    team_max_scores = {}

    def parse_score(s):
        m = re.match(r"(\d+)[\-/](\d+)\s*\(([^)]+)\)", str(s))
        if m:
            return f"{m.group(1)}/{m.group(2)}", m.group(3).strip()
        m2 = re.match(r"(\d+)[\-/](\d+)", str(s))
        if m2:
            return f"{m2.group(1)}/{m2.group(2)}", ""
        return str(s), ""

    for e in events:
        etype = e.get("event_type", "UNKNOWN")
        runs = int(e.get("runs_added", 0) or 0)
        prev = e.get("previous", "")
        curr = e.get("current", "")

        prev_score, prev_over = parse_score(prev)
        curr_score, curr_over = parse_score(curr)

        last_over = curr_over
        if curr_score:
            last_score = curr_score

        team_info = e.get("team", "")
        team_prefix = f"[{team_info}] " if team_info else ""
        
        # Track max scores per team for winner inference
        if team_info and curr_score:
            try:
                score_val = int(curr_score.split("/")[0] if "/" in curr_score else curr_score.split("-")[0])
                if team_info not in team_max_scores or score_val > team_max_scores[team_info]:
                    team_max_scores[team_info] = score_val
            except: pass

        if etype == "MATCH_RESULT":
            res_str = e.get("match_result", "Match Finished")
            event_lines.append(f"🏆 FINAL RESULT — {res_str}")
        elif etype == "FOUR":
            total_fours += 1
            total_runs += runs
            event_lines.append(f"{team_prefix}BOUNDARY (4) — Score: {prev_score} → {curr_score} (+{runs} runs)")
        elif etype == "SIX":
            total_sixes += 1
            total_runs += runs
            event_lines.append(f"{team_prefix}SIX (6) — Score: {prev_score} → {curr_score} (+{runs} runs)")
        elif etype == "WICKET":
            total_wickets += 1
            event_lines.append(f"{team_prefix}WICKET — Score: {prev_score} → {curr_score} (Over {curr_over})")

    events_text = "\n".join(event_lines)
    _slog(f"Prompt stats: Runs={total_runs}, Wickets={total_wickets}, 4s={total_fours}, 6s={total_sixes}", "DATA")
    _slog(f"Last score: {last_score} (Over {last_over})", "DATA")

    prompt = (
        f"STYLE GUIDE: {active_style}\n\n"

        f"VERIFIED MATCH STATISTICS (extracted by AI from live scoreboard OCR):\n"
        f"- Total Runs: {total_runs}\n"
        f"- Wickets: {total_wickets}\n"
        f"- Boundaries (4s): {total_fours}\n"
        f"- Sixes: {total_sixes}\n"
        f"- Final Score: {last_score} (Over {last_over})\n"
        f"- Total Key Events Detected: {len(events)}\n"
    )

    # Infer winner if possible
    derived_result = ""
    if len(team_max_scores) >= 2:
        teams = list(team_max_scores.keys())
        t1, t2 = teams[0], teams[1]
        s1, s2 = team_max_scores[t1], team_max_scores[t2]
        if s1 > s2: derived_result = f"BASED ON SCORES: {t1} ({s1}) beat {t2} ({s2})"
        elif s2 > s1: derived_result = f"BASED ON SCORES: {t2} ({s2}) beat {t1} ({s1})"
    
    if derived_result:
        prompt += f"- Probable Outcome: {derived_result}\n\n"
    else:
        prompt += "\n"

    prompt += (
        f"CHRONOLOGICAL EVENT LOG (verified by AI):\n{events_text}\n\n"

         "WRITE A COMPREHENSIVE MATCH REPORT of 200-250 words. Follow these rules STRICTLY:\n"
        "1. **Structure**: If the event log contains multiple teams (e.g., [PAK] then [ENG]), structure the report to cover both innings. Mention the transition between the two.\n"
        "2. **Opening**: Start with a compelling and atmospheric opening sentence. Set the scene and mention the teams involved if identified.\n"
        "3. **Narrative**: Follow the exact chronological order of the EVENT LOG. Maintain momentum and tension.\n"
        "   - Use rich descriptions for boundaries and wickets.\n"
        "   - Mention the total score to track progress (e.g., 'at 25/0' or 'reaching 42/1').\n"
        "   - **OVERS**: ONLY mention the 'overs' when a wicket falls (e.g., 'the breakthrough came at 4.2 overs'). DO NOT mention overs for boundaries or any other events.\n"
        "4. **Perspective**: Act as an elite commentator (Professional style). Balance the praise for both sides.\n"
        "5. **Closing**: End with a powerful summary of the match result or the current state if it seems unfinished.\n"
        "6. **Format**: Use 1-2 flowing paragraphs. Do not use bullet points or headings. Ensure the text is clean and starts directly with the narrative.\n\n"
        "YOUR BROADCAST REPORT:"
    )
    return prompt


# Generate summary using LLM
def generate_summary(json_file, params=None):
    _slog("=== SUMMARY GENERATION STARTED ===", "STEP")
    if params is None:
        params = {'format': 'MP4', 'depth': 'Standard', 'style': 'Professional'}
    
    events = load_events(json_file)
    if not events:
        _slog("No events found in JSON!", "ERR")
        return
    
    prompt = build_prompt(events, params=params)
    _slog(f"Prompt length: {len(prompt)} characters", "DATA")

    try:
        current_client = get_openai_client()
        if not current_client:
            _slog("OpenAI client not initialized. Check OPENAI_API_KEY.", "ERR")
            return {"success": False, "error": "OpenAI client not initialized"}

        _slog(f"Sending request to OpenAI (gpt-4o-mini) with {len(events)} events...", "AI")
        _slog("Waiting for API response...", "AI")
        api_start = time.time()
        response = current_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a cricket journalist."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=800,
            temperature=0.8
        )

        api_time = time.time() - api_start
        summary = response.choices[0].message.content.strip()
        _slog(f"API responded in {api_time:.1f}s", "OK")
        _slog(f"Tokens used: {response.usage.total_tokens} (prompt: {response.usage.prompt_tokens}, completion: {response.usage.completion_tokens})", "DATA")
        _slog(f"Summary length: {len(summary)} characters", "DATA")
        print("\n--- Match Summary Generated ---\n")
        print(summary)
        
        # Save to file in the same directory as json_file
        output_dir = os.path.dirname(json_file)
        output_path = os.path.join(output_dir, "Final_summary.txt")
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(summary)
        
        _slog(f"Summary saved to: {output_path}", "OK")
        _slog("=== SUMMARY GENERATION COMPLETE ===", "DONE")
        return {
            "success": True,
            "summary_text": summary,
            "model": "gpt-4o-mini",
            "tokens_used": response.usage.total_tokens,
            "output_file": output_path
        }
    except Exception as e:
        _slog(f"Error generating summary: {e}", "ERR")
        return {
            "success": False,
            "error": str(e)
        }

# Main
if __name__ == "__main__":
    json_file = "event_analysis/verified_events.json"
    generate_summary(json_file)
