import json
import os

SPLASH_CONFIG_PATH = "splash_screen_meta.json"

def save_splash_config():
    config = {
        "title": "BOTFLOW",
        "subtitle": "Smart Bots, Seamless Flow.",
        "tagline": "Let Bots Do the Work",
        "theme": "cyberpunk_purple_neon",
        "features": ["Automation", "Workflow", "Fast", "AI Powered", "Secure", "Smart"],
        "version": "1.0.0",
        "updated_at": "2026-10-27"
    }
    with open(SPLASH_CONFIG_PATH, "w") as f:
        json.dump(config, f, indent=2)
    print("Splash screen metadata configuration saved in Python successfully.")

if __name__ == "__main__":
    save_splash_config()
