// Copyright 2026
//
// Injects a persistent in-page control panel using Shadow DOM.

(() => {
  const HOST_ID = 'advanced-search-shadow-host';

  const existingHost = document.getElementById(HOST_ID);
  if (existingHost) {
    return;
  }

  const host = document.createElement('div');
  host.id = HOST_ID;
  document.documentElement.appendChild(host);

  const shadowRoot = host.attachShadow({ mode: 'open' });

  shadowRoot.innerHTML = `
    <style>
      :host {
        all: initial;
      }

      .panel {
        position: fixed;
        top: 16px;
        right: 16px;
        z-index: 2147483647;
        width: 180px;
        padding: 14px 12px 12px;
        border-radius: 12px;
        border: 1px solid #d9d9d9;
        background: #333131;
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.18);
        font-family: 'Segoe UI', Arial, sans-serif;
        color: #222;
      }

      #searchBar {
          height: 36px;
          min-width: 0;
          padding: 0 10px;
          font-size: 14px;
          border: 1px solid var(--input-border);
          border-radius: 8px;
          background: var(--input-bg);
          color: var(--text);
      }

      #searchBar:focus {
          outline: 2px solid color-mix(in srgb, var(--btn-bg) 45%, transparent);
          outline-offset: 1px;
      }

      button {
          height: 36px;
          border: 1px solid transparent;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
      }

      #searchBtn {
          min-width: 86px;
          padding: 0 12px;
          background: var(--btn-bg);
          color: var(--btn-text);
      }

      #searchBtn:hover:not(:disabled) {
          background: var(--btn-bg-hover);
      }

      /* STYLE 1: Exact Match (Yellow) */
      .highlight-exact {
          background-color: #ffeb3b;
          color: black;
          font-weight: bold;
      }

      /* STYLE 2: Fuzzy Match (Blue Underline) */
      .highlight-fuzzy {
          background-color: #e3f2fd;
          border-bottom: 2px solid #2196f3;
          color: #0d47a1;
      }

      /* STYLE 3: Semantic Match (Purple Bold) */
      .highlight-semantic {
          background-color: #e3f2fd;
          color: #7c02a1;
          font-weight: bold;
      }

      /* Button Styles */
      #deleteBtn {
          width: 36px;
          height: 36px;
          font-size: 20px;
          line-height: 1;
          padding: 0;
          text-align: center;
          cursor: pointer;
          background: var(--btn-delete-bg);
          color: #ffffff;
      }

      #deleteBtn:hover:not(:disabled) {
          background: var(--btn-delete-hover);
      }

      /* Visual cue for disabled buttons */
      button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background-color: color-mix(in srgb, var(--panel) 70%, var(--text) 30%);
          border: 1px solid var(--border);
          color: var(--text);
      }

      .close {
        position: absolute;
        top: 6px;
        right: 8px;
        border: 0;
        background: transparent;
        color: #666;
        font-size: 16px;
        line-height: 1;
        cursor: pointer;
        padding: 2px 4px;
      }

      .close:hover {
        color: #111;
      }
    </style>
    <div class="panel" role="dialog" aria-label="Literal search controls">
        <input type="text" id="searchBar" placeholder="Search exact term...">
        <button class="close" aria-label="Close">x</button>
        <button id="searchBtn">Highlight</button>
        <button id="deleteBtn" class="delete-btn" disabled>&times;</button>
    </div>
  `;

  const searchBtn =  shadowRoot.querySelector('#searchBtn');
  const deleteBtn =  shadowRoot.querySelector('#deleteBtn');
  const input = shadowRoot.querySelector('#searchBar');
  const closeButton = shadowRoot.querySelector('.close');

  closeButton.addEventListener('click', () => {
    host.remove();
  });

  searchBtn.addEventListener('click', search);
  input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') search();
  });
  deleteBtn.addEventListener('click', clearSearch);

  function search() {
      const input = shadowRoot.querySelector('#searchBar');
      const webpageContent = document.body; // You can scope this to a specific container if needed
      const searchBtn = shadowRoot.querySelector('#searchBtn');
      const deleteBtn = shadowRoot.querySelector('#deleteBtn');
      
      const query = input.value.trim();

      if (!query) {
          alert("Please enter a term.");
          return;
      }

      // 1. Clean previous EXACT matches only (in case user hits search twice without clearing)
      removeExactHighlights();

      // 2. Create Regex
      const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // We match text that is NOT inside a generic HTML tag to avoid breaking HTML structure
      // (A simple approach for this demo)
      const regex = new RegExp(`(${safeQuery})`, 'gi');

      // 3. Apply highlights to current innerHTML
      // Note: This might wrap text inside existing fuzzy spans, which is fine (nested highlights)
      if (!webpageContent.innerText.match(regex)) {
          alert('Not Found: ' + query);
          return;
      }

      const newHTML = webpageContent.innerHTML.replace(regex, '<span class="highlight-exact">$1</span>');
      webpageContent.innerHTML = newHTML;

      // 4. Update UI
      searchBtn.disabled = true;
      input.disabled = true;
      deleteBtn.disabled = false;
  }

  function removeExactHighlights() {
      // Find all spans with the exact-match class
      const highlights = document.querySelectorAll('.highlight-exact');
      
      highlights.forEach(span => {
          // "Unwrap" the span: replace the span element with its own text content
          // This preserves any other tags (like fuzzy highlights) that might be nested or surrounding it
          const parent = span.parentNode;
          while (span.firstChild) {
              parent.insertBefore(span.firstChild, span);
          }
          parent.removeChild(span);
      });
      
      // Normalize text nodes to merge split text (optional cleanup)
      document.body.normalize();
  }

  function clearSearch() {
      const input = shadowRoot.querySelector('#searchBar');
      const searchBtn = shadowRoot.querySelector('#searchBtn');
      const deleteBtn = shadowRoot.querySelector('#deleteBtn');

      // 1. Specific cleanup
      removeExactHighlights();

      // 2. Reset UI
      input.value = "";
      input.disabled = false;
      searchBtn.disabled = false;
      deleteBtn.disabled = true;
      input.focus();
  }
})();
