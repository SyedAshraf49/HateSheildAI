// Load theme on page load
document.addEventListener('DOMContentLoaded', () => {
  loadTheme();
  initializeCharCounter();
  loadSettings();
});

function loadTheme() {
  const settings = getSettings();
  const isDark = settings.darkMode !== false; // Default to dark
  
  if (!isDark) {
    document.documentElement.classList.add('light-theme');
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) themeBtn.textContent = '☀️';
  }
}

function toggleTheme() {
  document.documentElement.classList.toggle('light-theme');
  const icon = document.getElementById('themeToggle');
  const isLight = document.documentElement.classList.contains('light-theme');
  
  if (icon) {
    icon.textContent = isLight ? '☀️' : '🌙';
  }
  
  // Save to settings
  const settings = getSettings();
  settings.darkMode = !isLight;
  localStorage.setItem('hs_settings', JSON.stringify(settings));
  
  // Show feedback if function exists
  if (typeof showFeedback === 'function') {
    showFeedback(isLight ? '☀️ Light mode enabled' : '🌙 Dark mode enabled');
  }
}

function getSettings() {
  const saved = localStorage.getItem('hs_settings');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse settings:', e);
      return getDefaultSettings();
    }
  }
  return getDefaultSettings();
}

function getDefaultSettings() {
  return {
    darkMode: true,
    animations: true,
    autoAnalyze: false,
    confidenceThreshold: 50,
    showEmotions: true,
    backendUrl: 'http://127.0.0.1:5000',
    saveHistory: true,
    historyLimit: 5
  };
}

function loadSettings() {
  const settings = getSettings();
  
  // Apply animations setting
  if (!settings.animations) {
    const style = document.createElement('style');
    style.textContent = '* { animation: none !important; transition: none !important; }';
    document.head.appendChild(style);
  }
}

function initializeCharCounter() {
  const input = document.getElementById('inputText');
  if (input) {
    input.addEventListener('input', () => {
      const counter = document.getElementById('charcount');
      if (counter) {
        const len = input.value.length;
        const max = parseInt(input.getAttribute('maxlength') || '5000');
        counter.innerText = `${len} / ${max} chars`;
        
        // Add warning classes
        if (len > max * 0.9) {
          counter.classList.add('char-limit-warning');
        } else {
          counter.classList.remove('char-limit-warning');
        }
        
        if (len >= max) {
          counter.classList.add('char-limit-error');
        } else {
          counter.classList.remove('char-limit-error');
        }
      }
    });
  }
}

function setExampleText(txt) {
  const el = document.getElementById('inputText');
  if (el) {
    el.value = txt;
    // Trigger input event to update char count
    el.dispatchEvent(new Event('input'));
  }
}

function copyRewrite() {
  const txt = document.getElementById('rewrittenText')?.innerText || '';
  if (!txt) return;
  
  navigator.clipboard.writeText(txt).then(() => {
    if (typeof showFeedback === 'function') {
      showFeedback('✅ Copied to clipboard!');
    } else {
      alert('Copied to clipboard!');
    }
  }).catch(err => {
    console.error('Copy failed:', err);
    alert('Failed to copy to clipboard');
  });
}

function saveSettings() {
  const mode = document.getElementById('runMode')?.value || 'local';
  localStorage.setItem('hs_runMode', mode);
  
  if (typeof showFeedback === 'function') {
    showFeedback('✅ Settings saved!');
  } else {
    alert('Settings saved (mode: ' + mode + ')');
  }
}

// Utility functions
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getSettings,
    loadTheme,
    toggleTheme,
    setExampleText,
    copyRewrite,
    saveSettings,
    formatNumber,
    debounce
  };
}