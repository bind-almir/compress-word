from flask import Flask, jsonify, request
import subprocess

app = Flask(__name__)

@app.route('/run', methods=['GET'])
def run_custom_program():
    try:
        result = subprocess.run(["./custom"], capture_output=True, text=True, check=True)
        return jsonify({"status": "success", "output": result.stdout.strip()}), 200
    except subprocess.CalledProcessError as e:
        return jsonify({"status": "error", "output": e.stderr.strip()}), 500

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({"status": "running"}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3333)
