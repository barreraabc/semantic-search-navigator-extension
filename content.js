let searchResults = [];
let currentIndex = -1;

// Function to highlight matches
function findTextOnPage(query) {
    removeHighlights(); // Clear previous highlights
    searchResults = [];
    currentIndex = -1;

    const regex = new RegExp(query, "gi");
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);

    while (walker.nextNode()) {
        const node = walker.currentNode;
        if (node.nodeValue.match(regex)) {
            const span = document.createElement("span");
            span.innerHTML = node.nodeValue.replace(regex, (match) => `<mark class="search-highlight">${match}</mark>`);
            node.parentNode.replaceChild(span, node);
        }
    }

    searchResults = document.querySelectorAll(".search-highlight");

    if (searchResults.length > 0) {
        currentIndex = 0;
        focusOnResult(currentIndex);
    } else {
        alert("No matches found.");
    }
}

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

// Function to remove highlights when a new search starts
function removeHighlights() {
    document.querySelectorAll(".search-highlight").forEach((el) => {
        el.parentNode.replaceChild(document.createTextNode(el.textContent), el);
    });
}
