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
        abusive = ['stupid','idiot','dumb','suck','trash','moron','ugly','worthless','garbage','shut up','loser','pathetic']
        threat = ['kill yourself','drop dead','i will kill','i\'ll kill','go die','i hope you die','die','i will hurt you','burn in hell','go to hell']
        
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
        """Enhanced emotion estimation with better accuracy"""
        t = (text or '').lower()
        
        # Initialize all emotions
        anger = 0
        joy = 0
        sadness = 0
        fear = 0
        disgust = 0
        
        # Anger indicators
        anger_words = ['hate', 'kill', 'idiot', 'stupid', 'moron', 'shut up', 'damn', 
                       'angry', 'mad', 'furious', 'rage', 'pissed', 'annoying', 'irritating']
        for word in anger_words:
            if word in t:
                anger += 15
        
        # Check for ALL CAPS (indicates shouting/anger)
        caps_ratio = sum(1 for c in text if c.isupper()) / max(len(text), 1)
        if caps_ratio > 0.3:
            anger += 20
        
        # Multiple exclamation marks indicate strong emotion
        if '!!' in text or '!!!' in text:
            anger += 10
        
        # Joy indicators
        joy_words = ['love', 'happy', 'great', 'wonderful', 'amazing', 'fantastic', 
                     'excellent', 'beautiful', 'perfect', 'awesome', 'good', 'nice',
                     'thank', 'appreciate', 'grateful', 'congrat', 'proud']
        for word in joy_words:
            if word in t:
                joy += 12
        
        # Positive emojis boost joy
        if any(e in text for e in ['😊', '😀', '🙂', '❤️', '💖', '🎉', '👍']):
            joy += 15
        
        # Sadness indicators
        sadness_words = ['sad', 'depressed', 'upset', 'unhappy', 'miserable', 'hurt',
                        'pain', 'suffer', 'cry', 'tear', 'sorrow', 'lonely', 'loss']
        for word in sadness_words:
            if word in t:
                sadness += 15
        
        # Fear indicators
        fear_words = ['scared', 'afraid', 'worried', 'anxious', 'terrified', 'panic',
                     'nervous', 'frightened', 'threat', 'danger', 'risk']
        for word in fear_words:
            if word in t:
                fear += 15
        
        # Disgust indicators
        disgust_words = ['gross', 'disgust', 'sick', 'vomit', 'nasty', 'filthy', 
                        'repulsive', 'revolting', 'horrible', 'awful']
        for word in disgust_words:
            if word in t:
                disgust += 15
        
        # Classification-based adjustments
        if classification == 'toxic' or classification == 'hate_speech':
            anger = min(100, anger + 30)
            disgust = min(100, disgust + 25)
            joy = max(0, joy - 20)
        elif classification == 'offensive':
            anger = min(100, anger + 20)
            disgust = min(100, disgust + 15)
            joy = max(0, joy - 10)
        elif classification == 'safe':
            # Boost joy for safe content
            joy = min(100, joy + 25)
            # Safe content has low negative emotions
            anger = max(0, anger - 10)
            disgust = max(0, disgust - 10)
        
        # Negative content reduces joy
        if classification in ['toxic', 'hate_speech', 'offensive']:
            joy = max(0, joy - 30)
        
        # Normalize and clamp values
        anger = min(100, max(0, anger))
        joy = min(100, max(0, joy))
        sadness = min(100, max(0, sadness))
        fear = min(100, max(0, fear))
        disgust = min(100, max(0, disgust))
        
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
        
        # More comprehensive rewriting
        r = text or ''
        
        # Replace offensive words
        offensive_replacements = {
            r'\b(stupid|idiot|dumb|moron)\b': 'mistaken',
            r'\b(trash|garbage|worthless)\b': 'inadequate',
            r'\b(suck|awful|terrible)\b': 'unsatisfactory',
            r'\b(shut up|be quiet)\b': 'please stop',
            r'\b(ugly|hideous)\b': 'unattractive',
            r'\b(loser|failure)\b': 'person',
            r'\b(pathetic)\b': 'unfortunate'
        }
        
        for pattern, replacement in offensive_replacements.items():
            r = re.sub(pattern, replacement, r, flags=re.IGNORECASE)
        
        # Replace hate speech
        r = re.sub(r'\b(hate|racist|nazi)\b', 
                   'discriminatory language', r, flags=re.IGNORECASE)
        
        # Replace threats
        threat_patterns = [
            r'\b(kill yourself|drop dead|go die)\b',
            r'\b(i will kill|i\'ll kill)\b',
            r'\b(i hope you die|die)\b',
            r'\b(burn in hell|go to hell)\b'
        ]
        for pattern in threat_patterns:
            r = re.sub(pattern, 'threatening language removed', r, flags=re.IGNORECASE)
        
        # Add respectful prefix
        if classification in ['toxic', 'hate_speech']:
            r = 'I respectfully express my disagreement: ' + r.strip().rstrip('.')
        else:
            r = 'I would like to express this more constructively: ' + r.strip().rstrip('.')
        
        if not r.endswith('.'):
            r += '.'
        
        return r