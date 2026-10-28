import json
import os

CONFIG_PATH = "rule_card_design.json"

def save_rule_design_config():
    design_config = {
        "style": "professional_glassmorphism",
        "border_radius": "1rem",
        "shadow": "shadow-sm hover:shadow-xl",
        "accent_bar": "gradient",
        "badges": "rounded-full uppercase font-bold",
        "updated_at": "2026-10-27"
    }
    with open(CONFIG_PATH, "w") as f:
        json.dump(design_config, f, indent=2)
    print("Rule card professional design configuration saved in Python.")

if __name__ == "__main__":
    save_rule_design_config()
