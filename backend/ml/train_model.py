"""
Train TF-IDF + MultinomialNB model using backend/ml/train_dataset.csv.
Produces backend/ml/vectorizer.pkl and backend/ml/model.pkl
"""

import pandas as pd
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
import re, os

def clean_text(s):
    s = str(s).lower()
    s = re.sub(r'http\\S+', '', s)
    s = re.sub(r'[^a-zA-Z ]', ' ', s)
    s = re.sub(r'\\s+', ' ', s).strip()
    return s

def main():
    df = pd.read_csv('train_dataset.csv')
    df['text_clean'] = df['text'].astype(str).apply(clean_text)
    X = df['text_clean'].values
    y = df['label'].values

    vect = TfidfVectorizer(ngram_range=(1,2), max_features=8000)
    Xv = vect.fit_transform(X)
    clf = MultinomialNB()
    clf.fit(Xv, y)

    os.makedirs('backend/ml', exist_ok=True)
    joblib.dump(vect, 'backend/ml/vectorizer.pkl')
    joblib.dump(clf, 'backend/ml/model.pkl')
    print('Training complete. Saved vectorizer.pkl and model.pkl into backend/ml')

if __name__ == '__main__':
    main()