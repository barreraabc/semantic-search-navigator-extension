window.ADVANCED_SEARCH_PANEL_HTML = `
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

    .match-counter {
      min-width: 50px;
      height: 34px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-size: 12px;
      font-weight: 500;
      flex: 0 0 auto;
    }

    .panel-divider {
      width: 1px;
      height: 34px;
      background: rgba(255, 255, 255, 0.35);
      flex: 0 0 1px;
      margin: 0 4px;
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

    .nav-btn.nav-right::before {
      transform: translate(-65%, -50%) rotate(45deg);
    }

    .nav-btn.nav-left::before {
      transform: translate(-35%, -50%) rotate(-135deg);
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
    <button id="prevEngineBtn" class="nav-btn nav-left" aria-label="Previous search engine"></button>
    <button id="nextEngineBtn" class="nav-btn nav-right" aria-label="Next search engine"></button>
    <input type="text" id="searchBar" placeholder="Search exact term...">
    <span id="matchCounter" class="match-counter" aria-label="Current match index">0/0</span>
    <span class="panel-divider" aria-hidden="true"></span>
    <button id="prevMatchBtn" class="nav-btn nav-up" aria-label="Previous result"></button>
    <button id="nextMatchBtn" class="nav-btn nav-down" aria-label="Next result"></button>
    <button class="close" aria-label="Close">&times;</button>
  </div>
`;
