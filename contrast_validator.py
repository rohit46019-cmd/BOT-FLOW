import json
import os

CONFIG_PATH = "ui_contrast_config.json"

def save_contrast_config():
    config = {
        "modal_background": "bg-neutral-950",
        "modal_text": "text-white",
        "keypad_buttons": "bg-white/10 text-white hover:bg-white/20",
        "contrast_level": "high_accessibility",
        "updated_at": "2026-10-27"
    }
    with open(CONFIG_PATH, "w") as f:
        json.dump(config, f, indent=2)
    print("UI contrast configuration saved in Python successfully.")

if __name__ == "__main__":
    save_contrast_config()
