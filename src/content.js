// Copyright 2026
//
// Injects a persistent in-page control panel using Shadow DOM.

(() => {
  const HOST_ID = 'advanced-search-shadow-host';
  const HIGHLIGHT_STYLE_ID = 'advanced-search-highlight-styles';
  const PANEL_TEMPLATE_GLOBAL_KEY = 'ADVANCED_SEARCH_PANEL_HTML';
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

  const panelTemplateHtml = window[PANEL_TEMPLATE_GLOBAL_KEY];
  if (typeof panelTemplateHtml !== 'string' || panelTemplateHtml.length === 0) {
    removeInjectedHighlightStyles();
    host.remove();
    return;
  }
  shadowRoot.innerHTML = panelTemplateHtml;

  const input = shadowRoot.querySelector('#searchBar');
  const closeButton = shadowRoot.querySelector('.close');
  const prevMatchBtn = shadowRoot.querySelector('#prevMatchBtn');
  const nextMatchBtn = shadowRoot.querySelector('#nextMatchBtn');
  const matchCounter = shadowRoot.querySelector('#matchCounter');

  if (!input || !closeButton || !prevMatchBtn || !nextMatchBtn || !matchCounter) {
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
    updateMatchCounter();
  }

  function updateMatchCounter() {
    const displayIndex = state.totalMatches === 0 ? 0 : state.focusIndex;
    matchCounter.textContent = `${displayIndex}/${state.totalMatches}`;
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
    updateMatchCounter();
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
    updateMatchCounter();
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
