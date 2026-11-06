#!/usr/bin/env python3
"""
Fast Keyword Scanner & Rule Enforcement Engine (fast_scanner.py)
----------------------------------------------------------------
Provides high-speed, unicode-compliant keyword matching.
Standard library only to ensure compatibility.
"""

import sys
import json
import re
import time
from typing import List, Dict, Any, Optional

class FastKeywordMatcher:
    def __init__(self, rules: List[Dict[str, Any]]):
        self.rules = []
        for r in rules:
            if not r.get("enabled", True):
                continue
            
            trigger_words = []
            if r.get("keyword"):
                trigger_words.append(str(r["keyword"]).strip())
            for w in r.get("keywords", []):
                w_str = str(w).strip()
                if w_str and w_str not in trigger_words:
                    trigger_words.append(w_str)
            
            if not trigger_words:
                continue

            match_mode = r.get("match_mode", "exact")
            compiled_patterns = []

            for word in trigger_words:
                escaped = re.escape(word.lower())
                if match_mode == "partial":
                    pattern = re.compile(escaped, re.IGNORECASE)
                else:
                    pattern = re.compile(rf'(?:^|[^\w\d]){escaped}(?:$|[^\w\d])', re.IGNORECASE | re.UNICODE)
                
                compiled_patterns.append({
                    "word": word,
                    "regex": pattern
                })

            self.rules.append({
                "rule_id": str(r.get("_id") or r.get("id") or ""),
                "rule": r,
                "trigger_words": trigger_words,
                "match_mode": match_mode,
                "compiled_patterns": compiled_patterns,
                "target_groups": [str(g).strip().replace("-100", "") for g in (r.get("target_groups") or []) if str(g).strip()],
                "max_replies": int(r.get("max_replies", 2)),
                "cooldown_minutes": float(r.get("cooldown_minutes", 0)),
                "approval_mode": bool(r.get("approval_mode", False)),
                "reply": r.get("reply", ""),
                "photo": r.get("photo", ""),
                "message_links": r.get("message_links", []) or ([r.get("message_link")] if r.get("message_link") else [])
            })

    def match_message(
        self,
        text: str,
        chat_id: str,
        topic_id: Optional[int] = None,
        reply_counts: Optional[Dict[str, int]] = None,
        cooldown_timestamps: Optional[Dict[str, float]] = None
    ) -> List[Dict[str, Any]]:
        if not text:
            return []

        lower_text = text.lower().strip()
        normalized_chat_id = str(chat_id).replace("-100", "").strip()
        matches = []
        now = time.time()

        for rule_meta in self.rules:
            if rule_meta["target_groups"]:
                if normalized_chat_id not in rule_meta["target_groups"]:
                    continue

            rule_id = rule_meta["rule_id"]
            if topic_id is not None and reply_counts:
                count_key = f"{topic_id}_{rule_id}"
                current_count = reply_counts.get(count_key, 0)
                if rule_meta["max_replies"] > 0 and current_count >= rule_meta["max_replies"]:
                    continue

            if topic_id is not None and cooldown_timestamps and rule_meta["cooldown_minutes"] > 0:
                cooldown_key = f"{topic_id}_{rule_id}"
                last_reply_at = cooldown_timestamps.get(cooldown_key, 0)
                if last_reply_at > 0:
                    elapsed_minutes = (now - last_reply_at) / 60.0
                    if elapsed_minutes < rule_meta["cooldown_minutes"]:
                        continue

            matched_trigger = None
            match_index = -1
            for p_info in rule_meta["compiled_patterns"]:
                m = p_info["regex"].search(lower_text)
                if m:
                    matched_trigger = p_info["word"]
                    match_index = m.start()
                    break

            if matched_trigger is not None:
                matches.append({
                    "rule_id": rule_id,
                    "matched_keyword": matched_trigger,
                    "match_mode": rule_meta["match_mode"],
                    "match_index": match_index,
                    "approval_mode": rule_meta["approval_mode"],
                    "reply": rule_meta["reply"],
                    "photo": bool(rule_meta["photo"]),
                    "message_links": rule_meta["message_links"],
                    "max_replies": rule_meta["max_replies"],
                    "cooldown_minutes": rule_meta["cooldown_minutes"]
                })

        matches.sort(key=lambda x: x["match_index"])
        return matches

def process_batch_messages(payload: Dict[str, Any]) -> Dict[str, Any]:
    rules_data = payload.get("rules", [])
    messages = payload.get("messages", [])
    reply_counts = payload.get("reply_counts", {})
    cooldown_timestamps = payload.get("cooldown_timestamps", {})

    matcher = FastKeywordMatcher(rules_data)
    results = []

    for msg in messages:
        text = msg.get("text", "")
        chat_id = str(msg.get("chat_id", ""))
        topic_id = msg.get("topic_id")
        topic_name = msg.get("topic_name", f"Topic #{topic_id}")
        msg_id = msg.get("id")
        date_val = msg.get("date")

        matched_rules = matcher.match_message(
            text=text,
            chat_id=chat_id,
            topic_id=topic_id,
            reply_counts=reply_counts,
            cooldown_timestamps=cooldown_timestamps
        )

        for match in matched_rules:
            results.append({
                "message_id": msg_id,
                "chat_id": chat_id,
                "topic_id": topic_id,
                "topic_name": topic_name,
                "text": text,
                "date": date_val,
                "matched_keyword": match["matched_keyword"],
                "rule_id": match["rule_id"],
                "approval_mode": match["approval_mode"],
                "reply": match["reply"],
                "has_photo": match["photo"],
                "message_links": match["message_links"]
            })

    return {
        "success": True,
        "count": len(results),
        "results": results
    }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No action specified."}))
        sys.exit(1)

    action = sys.argv[1]

    if action == "match_batch":
        input_data = sys.stdin.read()
        try:
            payload = json.loads(input_data)
            res = process_batch_messages(payload)
            print(json.dumps(res))
        except Exception as e:
            print(json.dumps({"error": str(e), "success": False}))
            sys.exit(1)
    else:
        print(json.dumps({"error": f"Unknown action: {action}"}))
        sys.exit(1)

if __name__ == "__main__":
    main()
