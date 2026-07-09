import os
import json
import shutil
from summary_generator import generate_summary

def run_test():
    print("=== STARTING GEMINI SUMMARY GENERATOR TEST ===")
    
    # 1. Setup temporary test directory and fake events list
    test_dir = os.path.join(os.path.dirname(__file__), "test_temp")
    os.makedirs(test_dir, exist_ok=True)
    json_path = os.path.join(test_dir, "verified_events.json")
    
    dummy_events = [
        {
            "event_type": "FOUR",
            "runs_added": 4,
            "previous": "12-0 (2.1)",
            "current": "16-0 (2.2)",
            "team": "IND"
        },
        {
            "event_type": "WICKET",
            "runs_added": 0,
            "previous": "35-1 (5.3)",
            "current": "35-2 (5.4)",
            "team": "IND"
        },
        {
            "event_type": "SIX",
            "runs_added": 6,
            "previous": "52-2 (7.4)",
            "current": "58-2 (7.5)",
            "team": "IND"
        },
        {
            "event_type": "MATCH_RESULT",
            "match_result": "IND won by 8 wickets"
        }
    ]
    
    with open(json_path, "w") as f:
        json.dump(dummy_events, f, indent=4)
        
    print(f"Created offline verified events at {json_path}")
    
    # 2. Inject Gemini API Key from environment (.env)
    from dotenv import load_dotenv
    load_dotenv()
    # It will automatically be in os.environ, no need to hardcode it here
    
    # 3. Trigger summary generation
    print("Executing generate_summary using Gemini API...")
    res = generate_summary(json_path)
    
    # 4. Assert and print results
    print("\n=== TEST OUTCOME ===")
    print(f"Result dictionary: {res}")
    
    summary_txt_path = os.path.join(test_dir, "Final_summary.txt")
    if os.path.exists(summary_txt_path):
        print(f"\nSUCCESS: Summary file created at {summary_txt_path}")
        with open(summary_txt_path, "r", encoding="utf-8") as f:
            print(f"Content:\n{f.read()}")
    else:
        print("\nFAILURE: Final_summary.txt was NOT created.")
        
    # Clean up test temp files
    try:
        shutil.rmtree(test_dir)
        print("Cleaned up temporary test directory.")
    except Exception as e:
        print(f"Error during cleanup: {e}")

if __name__ == "__main__":
    run_test()
