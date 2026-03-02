#!/usr/bin/python3
import json

def load_config(path="config.json"):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def ask_questions(config):
    answers = {}
    for q in config["questions"]:
        while True:
            try:
                val = float(input(f"{q['text']} ({config['meta']['scale_min']}-{config['meta']['scale_max']}): "))
                if config["meta"]["scale_min"] <= val <= config["meta"]["scale_max"]:
                    answers[q["id"]] = val
                    break
            except ValueError:
                pass
            print("Bitte eine gültige Zahl eingeben.")
    return answers

def calculate_scores(config, answers):
    scores = {}
    
    for option in config["options"]:
        # Berechne Ähnlichkeit als gewichteter Durchschnitt der Übereinstimmung
        total_similarity = 0
        total_weight = 0
        
        for q in config["questions"]:
            qid = q["id"]
            user_val = answers[qid]
            option_val = option["values"][qid]
            weight = q.get("weight", 1)
            
            # Berechne wie ähnlich diese Werte sind (Differenz normalisiert)
            scale_range = config["meta"]["scale_max"] - config["meta"]["scale_min"]
            similarity = 1 - (abs(user_val - option_val) / scale_range)
            total_similarity += similarity * weight
            total_weight += weight
        
        # Gewichteter Durchschnitt zu Prozent (0-100%)
        percentage = (total_similarity / total_weight) * 100
        scores[option["name"]] = percentage
    
    return scores

def main():
    config = load_config()
    print(config["meta"]["title"])
    print(config["meta"]["description"])
    print(config["meta"]["introduction"])
    print()

    answers = ask_questions(config)
    scores = calculate_scores(config, answers)

    print("\n=== Leaderboard ===")
    sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    for rank, (name, score) in enumerate(sorted_scores, 1):
        print(f"{rank}. {name}: {score:.1f}%")

if __name__ == "__main__":
    main()
