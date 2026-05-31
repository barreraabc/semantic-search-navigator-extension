// Copyright 2026
//
// Injects a persistent in-page control panel using Shadow DOM.

(() => {
  const HOST_ID = 'advanced-search-shadow-host';
  const HIGHLIGHT_STYLE_ID = 'advanced-search-highlight-styles';
  const QUERY_INDEX = 0;
  const SEARCH_DEBOUNCE_MS = 500;

  const existingHost = document.getElementById(HOST_ID);
  if (existingHost) {
    return;
  }

  const host = document.createElement('div');
  host.id = HOST_ID;
  document.documentElement.appendChild(host);

  const removeInjectedHighlightStyles = injectHighlightStyles();

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
        width: min(560px, 86vw);
        padding: 14px 12px 12px;
        border-radius: 12px;
        background: #333131;
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.18);
        font-family: 'Segoe UI', Arial, sans-serif;
        color: #222;
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: nowrap;
        box-sizing: border-box;
      }

      .panel #searchBar {
        flex: 1 1 auto;
        min-width: 0;
        box-sizing: border-box;
        height: 34px;
        padding: 0 10px;
        border-radius: 10px;
        border: 0;
        background: transparent;
        color: #ffffff;
        transition: background-color 0.2s ease;
      }

      .panel #searchBar:hover,
      .panel #searchBar:focus {
        background: #666;
        outline: none;
      }

      .panel #searchBar::placeholder {
        color: rgba(255, 255, 255, 0.75);
      }

      .panel-divider {
        width: 1px;
        height: 34px;
        background: rgba(255, 255, 255, 0.35);
        flex: 0 0 1px;
      }

      .nav-btn {
        width: 30px;
        height: 30px;
        border: 0;
        border-radius: 50%;
        margin-left: 0;
        background: transparent;
        cursor: pointer;
        flex: 0 0 30px;
        position: relative;
        padding: 0;
        font-size: 0;
        transition: background-color 0.2s ease;
      }

      .nav-btn::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 7px;
        height: 7px;
        border-top: 1px solid #ffffff;
        border-right: 1px solid #ffffff;
        transition: border-color 0.2s ease;
      }

      .nav-btn.nav-up::before {
        transform: translate(-50%, -20%) rotate(-45deg);
      }

      .nav-btn.nav-down::before {
        transform: translate(-50%, -80%) rotate(135deg);
      }

      .nav-btn.nav-down {
        margin-left: -10px;
      }

      .nav-btn:hover {
        background: #666;
      }

      .nav-btn:hover::before {
        border-color: #dcdcdc;
      }

      .nav-btn.blink {
        animation: nav-btn-blink 420ms ease-in-out 1;
      }

      @keyframes nav-btn-blink {
        0% { background: transparent; }
        20% { background: #666; }
        40% { background: transparent; }
        60% { background: #666; }
        100% { background: transparent; }
      }

      .close {
        width: 32px;
        height: 32px;
        border: 0;
        background: transparent;
        color: #ffffff;
        line-height: 1;
        cursor: pointer;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s ease;
        flex: 0 0 32px;
        position: relative;
        font-size: 0;
      }

      .close::before,
      .close::after {
        content: '';
        position: absolute;
        width: 18px;
        height: 1px;
        background: #ffffff;
        border-radius: 2px;
      }

      .close::before {
        transform: rotate(45deg);
      }

      .close::after {
        transform: rotate(-45deg);
      }

      .close:hover {
        background: #666;
        color: #ffffff;
        border-radius: 50%;
      }
    </style>
    <div class="panel" role="dialog" aria-label="Literal search controls">
      <input type="text" id="searchBar" placeholder="Search exact term...">
      <span class="panel-divider" aria-hidden="true"></span>
      <button id="prevMatchBtn" class="nav-btn nav-up" aria-label="Previous result"></button>
      <button id="nextMatchBtn" class="nav-btn nav-down" aria-label="Next result"></button>
      <button class="close" aria-label="Close">&times;</button>
    </div>
  `;

  const input = shadowRoot.querySelector('#searchBar');
  const closeButton = shadowRoot.querySelector('.close');
  const prevMatchBtn = shadowRoot.querySelector('#prevMatchBtn');
  const nextMatchBtn = shadowRoot.querySelector('#nextMatchBtn');

  if (!input || !closeButton || !prevMatchBtn || !nextMatchBtn) {
    return;
  }

  const state = initializeHighlightState();
  let searchDebounceTimer = null;

  function runHighlight() {
    const query = input.value.trim();
    highlight(state, query, QUERY_INDEX);
  }

  function clearHighlights() {
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = null;
    }

    unhighlight(QUERY_INDEX);
    state.totalMatches = 0;
    state.focusIndex = 0;
    state.nodes = [document.createElement('span')];
  }

  closeButton.addEventListener('click', () => {
    clearHighlights();
    removeInjectedHighlightStyles();
    host.remove();
  });

  input.addEventListener('input', () => {
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    searchDebounceTimer = setTimeout(() => {
      runHighlight();
    }, SEARCH_DEBOUNCE_MS);
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      runHighlight();
    }
  });

  prevMatchBtn.addEventListener('click', () => {
    if (state.totalMatches === 0) {
      blinkButton(prevMatchBtn);
      return;
    }

    const previousIndex =
      state.focusIndex <= 1 ? state.totalMatches : state.focusIndex - 1;
    focusHighlight(state, previousIndex, QUERY_INDEX);
  });

  nextMatchBtn.addEventListener('click', () => {
    if (state.totalMatches === 0) {
      blinkButton(nextMatchBtn);
      return;
    }

    const nextIndex =
      state.focusIndex >= state.totalMatches ? 1 : state.focusIndex + 1;
    focusHighlight(state, nextIndex, QUERY_INDEX);
  });

  input.focus();

  function blinkButton(button) {
    button.classList.remove('blink');
    void button.offsetWidth;
    button.classList.add('blink');
  }

  function initializeHighlightState() {
    return {
      nodes: [document.createElement('span')],
      focusIndex: 0,
      totalMatches: 0,
    };
  }

  function highlight(currentState, searchQuery, queryIndex) {
    unhighlight(queryIndex);

    if (!searchQuery) {
      currentState.totalMatches = 0;
      currentState.focusIndex = 0;
      return;
    }

    const textNodes = findTextNodes();
    const searchRegex = getSearchRegex(searchQuery);
    currentState.totalMatches = 0;
    currentState.focusIndex = 1;
    currentState.nodes = [document.createElement('span')];

    const selection = window.getSelection();
    const selectionNode = selection ? selection.anchorNode : null;
    const selectionFoundState = { value: false };

    textNodes.forEach((textNode) => {
      processTextNode(
        currentState,
        textNode,
        searchRegex,
        selectionNode,
        selectionFoundState,
        queryIndex,
      );
    });

    focusHighlight(currentState, currentState.focusIndex, queryIndex);
  }

  function processTextNode(
    currentState,
    textNode,
    searchRegex,
    selectionNode,
    selectionFoundState,
    queryIndex,
  ) {
    let textContent = textNode.textContent || '';
    if (!textContent) return;

    let processedContent = removeDiacritics(textContent);
    searchRegex.lastIndex = 0;

    let match;
    while ((match = searchRegex.exec(processedContent)) !== null) {
      currentState.totalMatches += 1;

      const matchStart = match.index;
      const matchEnd = matchStart + match[0].length;
      const matchString = textContent.slice(matchStart, matchEnd);
      const span = createSpan(currentState.totalMatches, matchString, queryIndex);
      currentState.nodes.push(span);

      if (
        !selectionFoundState.value &&
        selectionNode &&
        (textNode === selectionNode || textNode.contains(selectionNode))
      ) {
        selectionFoundState.value = true;
      }

      if (selectionFoundState.value && currentState.focusIndex === 1) {
        currentState.focusIndex = currentState.totalMatches;
      }

      const after = textNode.splitText(match.index);
      if (after.textContent) {
        after.textContent = after.textContent.substring(match[0].length);
      }
      textNode.parentNode && textNode.parentNode.insertBefore(span, after);

      textContent = after.textContent || '';
      processedContent = removeDiacritics(textContent);
      textNode = after;
      searchRegex.lastIndex = 0;
    }
  }

  function unhighlight(queryIndex) {
    const highlightSpans = document.querySelectorAll(
      `span.better-ctrl-f-highlight-${queryIndex}`,
    );

    highlightSpans.forEach((span) => {
      const parent = span.parentNode;
      if (!parent) return;

      while (span.firstChild) {
        parent.insertBefore(span.firstChild, span);
      }
      parent.removeChild(span);
      parent.normalize();
    });
  }

  function focusHighlight(currentState, index, queryIndex) {
    if (currentState.totalMatches === 0) return;

    const previousNode = currentState.nodes[currentState.focusIndex];
    if (previousNode) {
      previousNode.classList.remove(`better-ctrl-f-focus-${queryIndex}`);
    }

    const nextNode = currentState.nodes[index];
    if (!nextNode) return;

    nextNode.classList.add(`better-ctrl-f-focus-${queryIndex}`);
    nextNode.scrollIntoView({ block: 'center', inline: 'nearest' });
    currentState.focusIndex = index;
  }

  function isVisible(element) {
    const style = window.getComputedStyle(element);
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0'
    );
  }

  function escapeSpecialChars(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function removeDiacritics(text) {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function getSearchRegex(searchQuery) {
    const escapedQuery = escapeSpecialChars(searchQuery);
    const diacriticInsensitiveQuery = removeDiacritics(escapedQuery);
    return new RegExp(diacriticInsensitiveQuery, 'gi');
  }

  function createSpan(matchCount, matchString, queryIndex) {
    const span = document.createElement('span');
    span.classList.add(`better-ctrl-f-highlight-${queryIndex}`);
    span.classList.add(`better-ctrl-f-${matchCount}`);
    span.appendChild(document.createTextNode(matchString));
    return span;
  }

  function findTextNodes(body = document.body) {
    const textNodes = [];

    function traverse(node) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node;
        if (!isVisible(element)) return;
        if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE') return;
      }

      if (node.nodeType === Node.TEXT_NODE && node.textContent && node.textContent.trim() !== '') {
        textNodes.push(node);
      }

      node.childNodes.forEach((child) => traverse(child));
    }

    traverse(body);
    return textNodes;
  }

  function injectHighlightStyles() {
    const existingStyle = document.getElementById(HIGHLIGHT_STYLE_ID);
    if (existingStyle) {
      return () => {};
    }

    const styleElement = document.createElement('style');
    styleElement.id = HIGHLIGHT_STYLE_ID;
    styleElement.textContent = `
      :root {
        --better-ctrl-f-highlight-color-0: #FFFF00;
        --better-ctrl-f-focus-color-0: #FFA500;
        --better-ctrl-f-highlight-color-1: #FFFF00;
        --better-ctrl-f-focus-color-1: #FFA500;
        --better-ctrl-f-text-color: #000000;
      }

      span.better-ctrl-f-highlight-0 {
        background-color: var(--better-ctrl-f-highlight-color-0) !important;
        color: var(--better-ctrl-f-text-color) !important;
      }

      span.better-ctrl-f-focus-0 {
        background-color: var(--better-ctrl-f-focus-color-0) !important;
        color: var(--better-ctrl-f-text-color) !important;
      }

      span.better-ctrl-f-highlight-1 {
        background-color: var(--better-ctrl-f-highlight-color-1) !important;
        color: var(--better-ctrl-f-text-color) !important;
      }

      span.better-ctrl-f-focus-1 {
        background-color: var(--better-ctrl-f-focus-color-1) !important;
        color: var(--better-ctrl-f-text-color) !important;
      }
    `;

    document.head.appendChild(styleElement);

    return () => {
      styleElement.remove();
    };
  }
})();
