# advanced-search-navigator-extension
Searching tool navigator extension using literal search (the traditional Ctrl + F), string similarity (Levenshtein's distance) and cosine similarity (using embeddings models).

# Purpose
The idea of this extension is to mimic the traditional Ctrl + F's UX but adding two extra searching options. The intention is keeping that simplicity and minimal style.

# Explanation of certain aspects
- By default, extensions are closed when the user clicks anywhere in the browser, outside the extension's popup. To overpass this behaviour, the GUI is injected in the content scripts through the service workers. This way, we can modify the DOM adding an extra section.
- The return of the literal search is fixed, but the returns of the string and cosine similarity searches aren't. A threshold must be set to control the number of returned words.
    - String similarity: If you search 'Pneumonoultramicroscopicsilicovolcanoconiosis' which has every vowel and a lot of consonants, with a small enough threshold you could match almost every word in the DOM.
    - Cosine similarity: This is a semantic search, so if you set the threshold to 0, you are basically searching in the semantic domain of all the words.