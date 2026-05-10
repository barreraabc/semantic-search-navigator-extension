let searchResults = [];
let currentIndex = -1;

// Read the text content of the page
let pageText = document.body?.innerText || '';


// Function to navigate through search results
function navigateResults(direction) {
    if (searchResults.length === 0) return;

    searchResults[currentIndex]?.classList.remove("active-highlight");
    currentIndex = (currentIndex + direction + searchResults.length) % searchResults.length;
    focusOnResult(currentIndex);
}

// Function to focus on the selected result
function focusOnResult(index) {
    searchResults[index].classList.add("active-highlight");
    searchResults[index].scrollIntoView({ behavior: "smooth", block: "center" });
}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
        if (message.action === 'getPageText') {
            const text = (document.body?.innerText || '').trim();
            sendResponse({ ok: true, text });
            return;
        }

        if (message.action === 'exactSearch') {
            const query = (message.query || '').trim();
            if (!query) {
                sendResponse({ ok: false, error: 'Missing query.' });
                return;
            }

            const count = findTextOnPage(query);
            sendResponse({ ok: true, found: count > 0, count });
            return;
        }

        if (message.action === 'clearExactSearch') {
            removeHighlights();
            sendResponse({ ok: true });
            return;
        }

        sendResponse({ ok: false, error: 'Unknown action.' });
    } catch (error) {
        sendResponse({ ok: false, error: error.message || 'Unexpected error.' });
    }
});
