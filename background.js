chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetchPageText") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                function: getPageText
            }, (result) => {
                sendResponse({ text: result[0].result });
            });
        });
        return true;
    }
});
