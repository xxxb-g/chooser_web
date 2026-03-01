#!/usr/bin/python3
from flask import Flask, render_template, jsonify, request

# Reuse config loader and scoring logic from existing `main.py` (no changes to main.py)
from main import load_config, calculate_scores

app = Flask(__name__, static_folder="static", template_folder="templates")


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/config")
def config_endpoint():
    config = load_config()
    return jsonify(config)


@app.route("/score", methods=["POST"])
def score_endpoint():
    payload = request.get_json() or {}
    if not isinstance(payload, dict):
        return jsonify({"error": "invalid payload"}), 400

    config = load_config()
    try:
        answers = {k: float(v) for k, v in payload.items()}
    except Exception:
        return jsonify({"error": "answers must be numeric"}), 400

    scores = calculate_scores(config, answers)
    sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return jsonify([{"name": n, "score": s} for n, s in sorted_scores])


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=True)
