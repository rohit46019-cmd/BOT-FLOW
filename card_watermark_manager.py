import json
import os

CONFIG_PATH = "card_watermark_config.json"

def save_watermark_config():
    config = {
        "design": "modern_glassmorphism_watermark",
        "opacity": 0.08,
        "position": "bottom-right",
        "cards": [
            {"id": "keywords", "icon": "Key", "theme": "violet"},
            {"id": "topics", "icon": "LayoutDashboard", "theme": "cyan"},
            {"id": "photos", "icon": "Image", "theme": "fuchsia"},
            {"id": "catchup", "icon": "RotateCcw", "theme": "amber"},
            {"id": "radar", "icon": "Search", "theme": "blue"},
            {"id": "engine", "icon": "Bot", "theme": "emerald"}
        ],
        "updated_at": "2026-10-27"
    }
    with open(CONFIG_PATH, "w") as f:
        json.dump(config, f, indent=2)
    print("Card watermark configuration saved successfully in Python.")

if __name__ == "__main__":
    save_watermark_config()
