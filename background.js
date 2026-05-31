chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: {tabId: tab.id},
    files: ['src/literal_search/literalSearchEngine.js', 'src/fuzzy_search/fuzzySearchEngine.js', 'src/panelTemplate.js', 'src/content.js']
  });
});