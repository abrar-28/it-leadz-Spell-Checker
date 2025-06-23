document.addEventListener('DOMContentLoaded', function () {
    const textInput = document.getElementById('text-input');
    const checkBtn = document.getElementById('check-btn');
    const clearBtn = document.getElementById('clear-btn');
    const resultsContainer = document.getElementById('results-container');
    const wordCount = document.getElementById('word-count');
    const charCount = document.getElementById('char-count');
    const errorCount = document.getElementById('error-count');

    updateStats();

    textInput.addEventListener('input', updateStats);

    checkBtn.addEventListener('click', () => {
        const text = textInput.value.trim();
        if (!text) {
            showNoErrors();
            return;
        }
        showLoading();
        checkSpelling(text);
    });

    clearBtn.addEventListener('click', () => {
        textInput.value = '';
        updateStats();
        showNoErrors();
    });

    function updateStats() {
        const text = textInput.value;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const chars = text.length;

        wordCount.textContent = words;
        charCount.textContent = chars;
    }

    function showNoErrors() {
        resultsContainer.innerHTML = `
            <div class="no-errors">
                <i class="fas fa-check-circle"></i>
                <h3>No spelling errors detected!</h3>
                <p>Your text appears to be error-free.</p>
            </div>
        `;
        errorCount.textContent = '0';
    }

    function showLoading() {
        resultsContainer.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <div class="loading-text">Analyzing your text...</div>
            </div>
        `;
    }

    async function checkSpelling(text) {
        try {
            const response = await fetch("https://api.languagetoolplus.com/v2/check", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    text: text,
                    language: "en-US"
                })
            });

            const data = await response.json();

            if (data.matches.length === 0) {
                showNoErrors();
                return;
            }

            displayResults(data.matches, text);
        } catch (error) {
            resultsContainer.innerHTML = `<p style="color:red">Error checking spelling: ${error.message}</p>`;
            errorCount.textContent = '0';
        }
    }

    function displayResults(matches, originalText) {
        errorCount.textContent = matches.length;
        let resultHTML = '';

        matches.forEach(match => {
            const errorText = originalText.substring(match.offset, match.offset + match.length);
            const context = originalText.substring(
                Math.max(0, match.offset - 30),
                Math.min(originalText.length, match.offset + match.length + 30)
            ).replace(errorText, `<span class="highlight">${errorText}</span>`);

            const suggestions = match.replacements.map(rep => rep.value).slice(0, 5);

            resultHTML += `
                <div class="result-item">
                    <div class="word"><i class="fas fa-exclamation-circle"></i> ${errorText}</div>
                    <div class="context">${context}</div>
                    <div class="suggestions-title"><i class="fas fa-lightbulb"></i> SUGGESTIONS:</div>
                    <div class="suggestion-list">
                        ${suggestions.map(s => `
                            <div class="suggestion" data-correction="${s}">
                                ${s}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });

        resultsContainer.innerHTML = resultHTML;

        document.querySelectorAll('.suggestion').forEach(suggestion => {
            suggestion.addEventListener('click', function () {
                const replacement = this.getAttribute('data-correction');
                const errorItem = this.closest('.result-item');
                const errorWord = errorItem.querySelector('.word').textContent.replace(/^\W+/, '').trim();

                textInput.value = textInput.value.replace(
                    new RegExp(`\\b${errorWord}\\b`, 'g'),
                    replacement
                );

                updateStats();
                checkBtn.click();
            });
        });
    }
});
