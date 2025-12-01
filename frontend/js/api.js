async function analyzeComment() {
  const textEl = document.getElementById('inputText');
  const resultBox = document.getElementById('analysisResult');
  const badge = document.getElementById('resultBadge');
  const meta = document.getElementById('resultMeta');
  const rewritten = document.getElementById('rewrittenText');

  const text = textEl.value.trim();
  if (!text) { alert('Please enter text to analyze'); return; }

  document.getElementById('analyzeBtn').disabled = true;
  document.getElementById('analyzeBtn').innerText = 'Analyzing...';

  try {
    const resp = await fetch('http://127.0.0.1:5000/analyze', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ text })
    });
    if (!resp.ok) throw new Error('Network response was not ok');
    const data = await resp.json();

    badge.innerText = (data.classification || 'safe').toUpperCase();
    meta.innerText = `Confidence: ${data.confidence}% • Processed in ${data.processing_time_ms || 0}ms`;
    rewritten.innerText = data.rewritten_text || '';
    resultBox.classList.remove('visually-hidden');
  } catch (e) {
    alert('Failed to call backend. Is the backend running on http://127.0.0.1:5000 ?\n' + e);
    console.error(e);
  } finally {
    document.getElementById('analyzeBtn').disabled = false;
    document.getElementById('analyzeBtn').innerText = 'Analyze & Shield';
  }
}