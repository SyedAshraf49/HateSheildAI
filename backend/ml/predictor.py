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
        hate_keywords = ['hate','nazi','racist','racism','exterminate','kill all','kill them','go back to','bigot','discriminat']
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
        
        # ANGER detection - much more comprehensive
        anger_words = {
            'strong': ['hate', 'furious', 'enraged', 'livid', 'seething', 'outraged', 'infuriated'],
            'medium': ['angry', 'mad', 'pissed', 'annoyed', 'irritated', 'frustrated', 'rage'],
            'mild': ['annoying', 'irritating', 'bothered', 'upset']
        }
        
        for word in anger_words['strong']:
            if word in t:
                anger += 30
        for word in anger_words['medium']:
            if word in t:
                anger += 20
        for word in anger_words['mild']:
            if word in t:
                anger += 10
        
        # Aggressive/hostile words
        aggressive = ['kill', 'destroy', 'attack', 'fight', 'punch', 'hit', 'smash', 'break']
        for word in aggressive:
            if word in t:
                anger += 25
        
        # Insults increase anger
        insults = ['idiot', 'stupid', 'moron', 'fool', 'dumb', 'pathetic', 'worthless', 'loser']
        for word in insults:
            if word in t:
                anger += 15
        
        # Profanity and caps
        profanity = ['damn', 'hell', 'crap', 'shut up']
        for word in profanity:
            if word in t:
                anger += 10
        
        # Check for ALL CAPS (shouting)
        if text:
            caps_ratio = sum(1 for c in text if c.isupper()) / max(len(text), 1)
            if caps_ratio > 0.4:
                anger += 25
            elif caps_ratio > 0.2:
                anger += 15
        
        # Multiple exclamation marks
        exclaim_count = text.count('!')
        if exclaim_count >= 3:
            anger += 20
        elif exclaim_count == 2:
            anger += 10
        
        # JOY detection - more comprehensive
        joy_words = {
            'strong': ['love', 'amazing', 'fantastic', 'wonderful', 'excellent', 'perfect', 'brilliant', 'ecstatic', 'thrilled'],
            'medium': ['happy', 'great', 'good', 'nice', 'pleased', 'glad', 'excited', 'delighted'],
            'mild': ['ok', 'fine', 'alright', 'decent']
        }
        
        for word in joy_words['strong']:
            if word in t:
                joy += 25
        for word in joy_words['medium']:
            if word in t:
                joy += 15
        for word in joy_words['mild']:
            if word in t:
                joy += 8
        
        # Gratitude and appreciation
        gratitude = ['thank', 'appreciate', 'grateful', 'blessing', 'blessed']
        for word in gratitude:
            if word in t:
                joy += 20
        
        # Achievement and success
        success = ['congrat', 'proud', 'success', 'achieve', 'accomplish', 'win', 'victory']
        for word in success:
            if word in t:
                joy += 18
        
        # Positive emojis
        if any(e in text for e in ['😊', '😀', '🙂', '😃', '😄', '❤️', '💖', '🎉', '👍', '✨']):
            joy += 20
        
        # SADNESS detection - more nuanced
        sadness_words = {
            'strong': ['depressed', 'miserable', 'devastated', 'heartbroken', 'grief'],
            'medium': ['sad', 'unhappy', 'upset', 'disappointed', 'hurt', 'pain'],
            'mild': ['unfortunate', 'regret', 'miss']
        }
        
        for word in sadness_words['strong']:
            if word in t:
                sadness += 30
        for word in sadness_words['medium']:
            if word in t:
                sadness += 20
        for word in sadness_words['mild']:
            if word in t:
                sadness += 10
        
        # Loss and loneliness
        loss = ['loss', 'lost', 'lonely', 'alone', 'empty', 'cry', 'tear', 'sorrow']
        for word in loss:
            if word in t:
                sadness += 22
        
        # Sad emojis
        if any(e in text for e in ['😢', '😭', '☹️', '😔', '💔']):
            sadness += 25
        
        # FEAR detection - more detailed
        fear_words = {
            'strong': ['terrified', 'horrified', 'panic', 'petrified', 'nightmare'],
            'medium': ['scared', 'afraid', 'frightened', 'anxious', 'worried', 'nervous'],
            'mild': ['concerned', 'uneasy', 'uncertain']
        }
        
        for word in fear_words['strong']:
            if word in t:
                fear += 30
        for word in fear_words['medium']:
            if word in t:
                fear += 20
        for word in fear_words['mild']:
            if word in t:
                fear += 10
        
        # Threat and danger
        threat = ['threat', 'danger', 'risk', 'warning', 'alert', 'emergency']
        for word in threat:
            if word in t:
                fear += 25
        
        # DISGUST detection - more comprehensive
        disgust_words = {
            'strong': ['disgusting', 'revolting', 'repulsive', 'vomit', 'puke', 'vile'],
            'medium': ['gross', 'nasty', 'sick', 'horrible', 'awful', 'terrible'],
            'mild': ['unpleasant', 'bad', 'yuck']
        }
        
        for word in disgust_words['strong']:
            if word in t:
                disgust += 30
        for word in disgust_words['medium']:
            if word in t:
                disgust += 20
        for word in disgust_words['mild']:
            if word in t:
                disgust += 10
        
        # Disgust emojis
        if any(e in text for e in ['🤢', '🤮', '😷', '🤧']):
            disgust += 25
        
        # Classification-based adjustments - FINE-TUNED
        if classification == 'toxic' or classification == 'hate_speech':
            anger = min(100, anger + 35)
            disgust = min(100, disgust + 30)
            joy = max(0, joy - 40)
            fear = min(100, fear + 15)
        elif classification == 'offensive':
            anger = min(100, anger + 25)
            disgust = min(100, disgust + 20)
            joy = max(0, joy - 25)
        elif classification == 'safe':
            # For safe content, check if it's positive or neutral
            if joy > 30 or any(word in t for word in ['love', 'thank', 'great', 'happy', 'wonderful']):
                joy = min(100, joy + 20)
                anger = max(0, anger - 15)
                disgust = max(0, disgust - 15)
                fear = max(0, fear - 10)
                sadness = max(0, sadness - 10)
            else:
                # Neutral safe content
                joy = min(100, joy + 10)
        
        # Ensure minimum baseline for detected emotions
        if anger > 5:
            anger = max(15, anger)
        if joy > 5:
            joy = max(15, joy)
        if sadness > 5:
            sadness = max(15, sadness)
        if fear > 5:
            fear = max(15, fear)
        if disgust > 5:
            disgust = max(15, disgust)
        
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
            r'\b(stupid|idiot|dumb|moron|fool)\b': 'mistaken',
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
        r = re.sub(r'\b(hate|racist|nazi|bigot)\b', 
                   'discriminatory language', r, flags=re.IGNORECASE)
        
        # Replace threats
        threat_patterns = [
            r'\b(kill yourself|drop dead|go die)\b',
            r'\b(i will kill|i\'ll kill)\b',
            r'\b(i hope you die|die)\b',
            r'\b(burn in hell|go to hell)\b'
        ]
        for pattern in threat_patterns:
            r = re.sub(pattern, '[threatening language removed]', r, flags=re.IGNORECASE)
        
        # Add respectful prefix
        if classification in ['toxic', 'hate_speech']:
            r = 'I respectfully express my disagreement: ' + r.strip().rstrip('.')
        else:
            r = 'I would like to express this more constructively: ' + r.strip().rstrip('.')
        
        if not r.endswith('.'):
            r += '.'
        
        return r