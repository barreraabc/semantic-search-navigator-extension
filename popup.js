async function search() {
    const input = document.getElementById('searchBar');
    const searchBtn = document.getElementById('searchBtn');
    const deleteBtn = document.getElementById('deleteBtn');

    const query = input.value.trim();
    if (!query) {
        alert('Please enter a term.');
        return;
    }

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: findTextOnPage,
            args: [query]
        });

        searchBtn.disabled = true;
        input.disabled = true;
        deleteBtn.disabled = false;
    } catch (error) {
        alert('Open a regular webpage tab and try again.');
    }
}

// Function to highlight matches
function findTextOnPage(query) {
    console.log(`Searching for: ${query}`);
    const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${safeQuery})`, "gi");
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);

    while (walker.nextNode()) {
        const node = walker.currentNode;
        if (!node.parentElement || node.parentElement.closest("script, style, noscript, textarea")) {
            continue;
        }

        if (node.nodeValue.match(regex)) {
            const span = document.createElement("span");
            span.innerHTML = node.nodeValue.replace(regex, (match) => `<mark class="search-highlight">${match}</mark>`);
            node.parentNode.replaceChild(span, node);
        }
    }

}

// Function to remove highlights when a new search starts
function removeHighlights() {
    document.querySelectorAll(".search-highlight").forEach((el) => {
        const parent = el.parentNode;
        if (!parent) {
            return;
        }
        parent.replaceChild(document.createTextNode(el.textContent), el);
        parent.normalize();
    });
}

async function clearSearch() {
    const input = document.getElementById('searchBar');
    const searchBtn = document.getElementById('searchBtn');
    const deleteBtn = document.getElementById('deleteBtn');

    try {
        await sendToActiveTab({ action: 'clearExactSearch' });
    } catch (error) {
        // Ignore failures here; UI reset is still useful for the popup state.
    }

    input.value = "";
    input.disabled = false;
    searchBtn.disabled = false;
    deleteBtn.disabled = true;
    input.focus();
}

document.addEventListener('DOMContentLoaded', () => {
    const searchBtn = document.getElementById('searchBtn');
    const deleteBtn = document.getElementById('deleteBtn');
    const input = document.getElementById('searchBar');

    if(searchBtn && deleteBtn && input) {
        searchBtn.addEventListener('click', search);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') search();
        });
        deleteBtn.addEventListener('click', clearSearch);
    }
});