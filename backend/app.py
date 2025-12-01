from flask import Flask, request, jsonify
from flask_cors import CORS
import os, time, traceback
from ml.predictor import Predictor

app = Flask(__name__)
CORS(app)

# Correct names: model_path= , vectorizer_path=
predictor = Predictor(
    model_path="ml/hate_speech_model.pkl",
    vectorizer_path="ml/vectorizer.pkl"
)

@app.route('/')
def home():
    return {'status': 'HateShield backend running'}

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        data = request.get_json(force=True)
        text = data.get('text', '')
        start = time.time()
        result = predictor.analyze_text(text)
        result['processing_time_ms'] = int((time.time() - start) * 1000)
        return jsonify(result)
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)