import os, joblib, re
from typing import Dict

class Predictor:
    """
    Load model + vectorizer if present; otherwise use rule-based fallback.
    analyze_text(text) -> dict with keys:
      original_text, classification, confidence, emotions, rewritten_text
    """

    def __init__(self, model_path='ml/hate_speech_model.pkl', vectorizer_path='ml/vectorizer.pkl'):
        self.model = None
        self.vectorizer = None
        self.model_path = model_path
        self.vectorizer_path = vectorizer_path
        try:
            if os.path.exists(self.model_path) and os.path.exists(self.vectorizer_path):
                self.model = joblib.load(self.model_path)
                self.vectorizer = joblib.load(self.vectorizer_path)
                print('✓ Loaded ML model and vectorizer.')
            else:
                print('⚠ ML model or vectorizer not found; using rule-based fallback.')
                print(f'  Looking for: {self.model_path} and {self.vectorizer_path}')
        except Exception as e:
            print('⚠ Failed loading model/vectorizer:', e)
            self.model = None
            self.vectorizer = None

    def analyze_text(self, text: str) -> Dict:
        text = text or ''
        # if ML model available, use it
        if self.model and self.vectorizer:
            try:
                cleaned = self._clean_text(text)
                X = self.vectorizer.transform([cleaned])
                pred = self.model.predict(X)[0]
                try:
                    prob = max(self.model.predict_proba(X)[0]) * 100
                except Exception:
                    prob = 80.0
                
                # Map 0/1 to classification names
                classification = 'safe' if pred == 0 else 'offensive'
                confidence = int(min(100, max(10, round(prob))))
                emotions = self._estimate_emotions(text, classification)
                rewritten = self._generate_rewrite(text, classification)
                return {
                    'original_text': text, 
                    'classification': classification, 
                    'confidence': confidence, 
                    'emotions': emotions, 
                    'rewritten_text': rewritten
                }
            except Exception as e:
                print('⚠ Model prediction failed, falling back to rules:', e)
        
        # fallback
        return self._rule_based(text)

    def _rule_based(self, text):
        t = (text or "").lower()
        hate_keywords = ['hate','nazi','racist','racism','exterminate','kill all','kill them','go back to']
        abusive = ['stupid','idiot','dumb','suck','trash','moron','ugly','worthless','garbage','shut up']
        threat = ['i will kill','i\'ll kill','go die','i hope you die','die','i will hurt you','burn']
        
        score = 0
        for k in hate_keywords:
            if k in t:
                score += 45
        for k in abusive:
            if k in t:
                score += 20
        for k in threat:
            if k in t:
                score += 70
        
        if any(k in t for k in threat):
            classification = 'toxic'
        elif any(k in t for k in hate_keywords):
            classification = 'hate_speech'
        elif any(k in t for k in abusive):
            classification = 'offensive'
        else:
            classification = 'safe'
        
        confidence = min(100, max(25, score + 25))
        emotions = self._estimate_emotions(text, classification)
        rewritten = self._generate_rewrite(text, classification)
        
        return {
            'original_text': text, 
            'classification': classification, 
            'confidence': confidence, 
            'emotions': emotions, 
            'rewritten_text': rewritten
        }

    def _clean_text(self, text):
        text = re.sub(r'http\S+', '', text)
        text = re.sub(r'[^a-zA-Z ]', ' ', text)
        text = re.sub(r'\s+', ' ', text)
        return text.strip().lower()

    def _estimate_emotions(self, text, classification):
        # heuristic emotion estimation
        t = (text or '').lower()
        anger = 0
        joy = 0
        sadness = 0
        fear = 0
        disgust = 0
        
        # simple keywords
        anger += 30 if any(w in t for w in ['hate','kill','idiot','stupid','moron','shut up']) else 0
        disgust += 20 if any(w in t for w in ['gross','disgust','sick']) else 0
        sadness += 15 if any(w in t for w in ['sad','depressed','upset']) else 0
        fear += 10 if any(w in t for w in ['scared','afraid','worried']) else 0
        joy += 60 if classification == 'safe' and not any(ch.isupper() for ch in t) else 0
        
        # normalize and clamp
        anger = min(100, anger)
        fear = min(100, fear)
        sadness = min(100, sadness)
        disgust = min(100, disgust)
        joy = min(100, joy)
        
        return {
            'anger': anger, 
            'fear': fear, 
            'sadness': sadness, 
            'disgust': disgust, 
            'joy': joy
        }

    def _generate_rewrite(self, text, classification):
        if classification == 'safe':
            return text or ''
        
        r = re.sub(r'\b(stupid|idiot|dumb|moron|trash|suck|worthless|garbage)\b', 
                   'inappropriate language', text or '', flags=re.IGNORECASE)
        r = re.sub(r'\b(hate|nazi|racist)\b', 
                   'discriminatory language', r, flags=re.IGNORECASE)
        r = re.sub(r'\b(i will kill|i\'ll kill|go die|i hope you die)\b', 
                   'threatening language', r, flags=re.IGNORECASE)
        
        r = 'I disagree with this statement and would like to discuss it respectfully. ' + r.strip().rstrip('.')
        if not r.endswith('.'):
            r += '.'
        return r