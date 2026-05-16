function search() {
    const input = document.getElementById('searchBar');
    const contentDiv = document.getElementById('content');
    const searchBtn = document.getElementById('searchBtn');
    const deleteBtn = document.getElementById('deleteBtn');
    
    const query = input.value.trim();

    if (!query) {
        alert("Please enter a term.");
        return;
    }

    // 1. Clean previous EXACT matches only (in case user hits search twice without clearing)
    removeExactHighlights();

    // 2. Create Regex
    const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // We match text that is NOT inside a generic HTML tag to avoid breaking HTML structure
    // (A simple approach for this demo)
    const regex = new RegExp(`(${safeQuery})`, 'gi');

    // 3. Apply highlights to current innerHTML
    // Note: This might wrap text inside existing fuzzy spans, which is fine (nested highlights)
    if (!contentDiv.innerText.match(regex)) {
        alert('Not Found: ' + query);
        return;
    }

    const newHTML = contentDiv.innerHTML.replace(regex, '<span class="highlight-exact">$1</span>');
    contentDiv.innerHTML = newHTML;

    // 4. Update UI
    searchBtn.disabled = true;
    input.disabled = true;
    deleteBtn.disabled = false;
}

function removeExactHighlights() {
    // Find all spans with the exact-match class
    const highlights = document.querySelectorAll('.highlight-exact');
    
    highlights.forEach(span => {
        // "Unwrap" the span: replace the span element with its own text content
        // This preserves any other tags (like fuzzy highlights) that might be nested or surrounding it
        const parent = span.parentNode;
        while (span.firstChild) {
            parent.insertBefore(span.firstChild, span);
        }
        parent.removeChild(span);
    });
    
    // Normalize text nodes to merge split text (optional cleanup)
    document.getElementById('content').normalize();
}

function clearSearch() {
    const input = document.getElementById('searchBar');
    const searchBtn = document.getElementById('searchBtn');
    const deleteBtn = document.getElementById('deleteBtn');

    // 1. Specific cleanup
    removeExactHighlights();

    // 2. Reset UI
    input.value = "";
    input.disabled = false;
    searchBtn.disabled = false;
    deleteBtn.disabled = true;
    input.focus();
}

export { search, clearSearch, removeExactHighlights };
    