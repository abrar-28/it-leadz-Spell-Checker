document.addEventListener('DOMContentLoaded', function () {
  const textInput = document.getElementById('text-input');
  const checkBtn = document.getElementById('check-btn');
  const clearBtn = document.getElementById('clear-btn');
  const wordCount = document.getElementById('word-count');
  const charCount = document.getElementById('char-count');
  const errorCount = document.getElementById('error-count');
  const analyzing = document.getElementById('analyzing');

  const MAX_LENGTH = 20000;

  updateStats();

  textInput.addEventListener('input', updateStats);

  clearBtn.addEventListener('click', () => {
    textInput.innerHTML = '';
    updateStats();
  });

  checkBtn.addEventListener('click', async () => {
    let text = textInput.innerText.trim();
    if (!text) return;

    if (text.length > MAX_LENGTH) {
      alert(`Only the first ${MAX_LENGTH} characters will be checked due to API limitations.`);
      text = text.slice(0, MAX_LENGTH);
    }

    analyzing.classList.remove('hidden');

    try {
      const response = await fetch("https://api.languagetool.org/v2/check", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          text: text,
          language: "en-US"
        })
      });

      const data = await response.json();
      analyzing.classList.add('hidden');

      if (!data || !data.matches || data.matches.length === 0) {
        errorCount.textContent = '0';
        return;
      }

      highlightErrors(data.matches, text);
    } catch (err) {
      analyzing.classList.add('hidden');
      alert("Error checking spelling: " + err.message);
    }
  });

  function updateStats() {
    const text = textInput.innerText;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    wordCount.textContent = words;
    charCount.textContent = chars;
  }

  function highlightErrors(matches, originalText) {
    errorCount.textContent = matches.length;

    let modifiedText = originalText;

    matches.sort((a, b) => b.offset - a.offset); // process in reverse to preserve offsets

    matches.forEach(match => {
      const word = originalText.substring(match.offset, match.offset + match.length);
      const suggestions = match.replacements.map(r => r.value).slice(0, 5);
      const span = `<span class="highlight" data-suggestions='${JSON.stringify(suggestions)}'>${word}</span>`;

      modifiedText =
        modifiedText.slice(0, match.offset) +
        span +
        modifiedText.slice(match.offset + match.length);
    });

    textInput.innerHTML = modifiedText;

    document.querySelectorAll('.highlight').forEach(span => {
      span.addEventListener('click', function (e) {
        e.stopPropagation();
        removePopups();

        const suggestions = JSON.parse(this.dataset.suggestions);
        const popup = document.createElement('div');
        popup.classList.add('suggestion-popup');

        suggestions.forEach(s => {
          const option = document.createElement('div');
          option.textContent = s;
          option.addEventListener('click', () => {
            this.outerHTML = s;
            updateStats();
            removePopups();
          });
          popup.appendChild(option);
        });

        this.appendChild(popup);
      });
    });

    document.body.addEventListener('click', removePopups);
  }

  function removePopups() {
    document.querySelectorAll('.suggestion-popup').forEach(p => p.remove());
  }
});
