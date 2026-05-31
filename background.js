chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: {tabId: tab.id},
    files: ['src/literal_search/literalSearchEngine.js', 'src/panelTemplate.js', 'src/content.js']
  });
});