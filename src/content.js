// Copyright 2026
//
// Injects a persistent in-page control panel using Shadow DOM.

(() => {
  const HOST_ID = 'advanced-search-shadow-host';
  const HIGHLIGHT_STYLE_ID = 'advanced-search-highlight-styles';
  const PANEL_TEMPLATE_GLOBAL_KEY = 'ADVANCED_SEARCH_PANEL_HTML';
  const LITERAL_SEARCH_ENGINE_GLOBAL_KEY = 'LITERAL_SEARCH_ENGINE';
  const FUZZY_SEARCH_ENGINE_GLOBAL_KEY = 'FUZZY_SEARCH_ENGINE';
  const QUERY_INDEX = 0;
  const SEARCH_DEBOUNCE_MS = 500;

  const existingHost = document.getElementById(HOST_ID);
  if (existingHost) {
    return;
  }

  const literalSearchEngine = window[LITERAL_SEARCH_ENGINE_GLOBAL_KEY];
  if (!literalSearchEngine) {
    return;
  }

  const fuzzySearchEngine = window[FUZZY_SEARCH_ENGINE_GLOBAL_KEY];

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
  const prevEngineBtn = shadowRoot.querySelector('#prevEngineBtn');
  const nextEngineBtn = shadowRoot.querySelector('#nextEngineBtn');
  const prevMatchBtn = shadowRoot.querySelector('#prevMatchBtn');
  const nextMatchBtn = shadowRoot.querySelector('#nextMatchBtn');
  const matchCounter = shadowRoot.querySelector('#matchCounter');

  if (
    !input ||
    !closeButton ||
    !prevEngineBtn ||
    !nextEngineBtn ||
    !prevMatchBtn ||
    !nextMatchBtn ||
    !matchCounter
  ) {
    return;
  }

  const engineDefinitions = [
    {
      placeholder: 'Search exact term...',
      engine: literalSearchEngine,
    },
    {
      placeholder: 'Search approximate term...',
      engine: fuzzySearchEngine || literalSearchEngine,
    },
    {
      placeholder: 'Search by meaning...',
      engine: literalSearchEngine,
    },
  ];

  let currentEngine = engineDefinitions[0].engine;
  let state = currentEngine.initializeHighlightState();
  let selectedEngineIndex = 0;
  let searchDebounceTimer = null;

  function runHighlight() {
    const query = input.value.trim();
    currentEngine.highlight(state, query, QUERY_INDEX);
    updateMatchCounter();
  }

  function clearHighlights() {
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = null;
    }

    currentEngine.unhighlight(QUERY_INDEX);
    state.totalMatches = 0;
    state.focusIndex = 0;
    state.nodes = [document.createElement('span')];
    updateMatchCounter();
  }

  function switchEngine(nextEngineIndex) {
    clearHighlights();
    selectedEngineIndex = nextEngineIndex;
    currentEngine = engineDefinitions[selectedEngineIndex].engine;
    state = currentEngine.initializeHighlightState();
    input.placeholder = engineDefinitions[selectedEngineIndex].placeholder;
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

  prevEngineBtn.addEventListener('click', () => {
    const nextEngineIndex =
      selectedEngineIndex === 0
        ? engineDefinitions.length - 1
        : selectedEngineIndex - 1;
    switchEngine(nextEngineIndex);
  });

  nextEngineBtn.addEventListener('click', () => {
    const nextEngineIndex =
      selectedEngineIndex === engineDefinitions.length - 1
        ? 0
        : selectedEngineIndex + 1;
    switchEngine(nextEngineIndex);
  });

  prevMatchBtn.addEventListener('click', () => {
    if (state.totalMatches === 0) {
      blinkButton(prevMatchBtn);
      return;
    }

    const previousIndex =
      state.focusIndex <= 1 ? state.totalMatches : state.focusIndex - 1;
    currentEngine.focusHighlight(state, previousIndex, QUERY_INDEX);
    updateMatchCounter();
  });

  nextMatchBtn.addEventListener('click', () => {
    if (state.totalMatches === 0) {
      blinkButton(nextMatchBtn);
      return;
    }

    const nextIndex =
      state.focusIndex >= state.totalMatches ? 1 : state.focusIndex + 1;
    currentEngine.focusHighlight(state, nextIndex, QUERY_INDEX);
    updateMatchCounter();
  });

  input.focus();

  function blinkButton(button) {
    button.classList.remove('blink');
    void button.offsetWidth;
    button.classList.add('blink');
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
