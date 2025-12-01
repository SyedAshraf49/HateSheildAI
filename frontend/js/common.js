document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('inputText');
  if (input) {
    input.addEventListener('input', () => {
      const c = document.getElementById('charcount');
      if (c) c.innerText = input.value.length + ' chars';
    });
  }
});

function setExampleText(txt){
  const el = document.getElementById('inputText');
  if (el) el.value = txt;
  const c = document.getElementById('charcount'); if (c) c.innerText = txt.length + ' chars';
}

function copyRewrite() {
  const txt = document.getElementById('rewrittenText')?.innerText || '';
  if (!txt) return;
  navigator.clipboard.writeText(txt).then(()=> alert('Copied!'));
}

function saveSettings(){
  const mode = document.getElementById('runMode')?.value || 'local';
  localStorage.setItem('hs_runMode', mode);
  alert('Settings saved (mode: ' + mode + ')');
}

function toggleTheme(){
  document.documentElement.classList.toggle('light-theme');
}