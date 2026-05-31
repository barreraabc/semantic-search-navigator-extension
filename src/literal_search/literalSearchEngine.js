// Copyright 2026
//
// Provides literal text search and in-page highlight utilities.

(() => {
	function initializeHighlightState() {
		return {
			nodes: [document.createElement('span')],
			focusIndex: 0,
			totalMatches: 0,
		};
	}

	function highlight(currentState, searchQuery, queryIndex) {
		unhighlight(queryIndex);

		if (!searchQuery) {
			currentState.totalMatches = 0;
			currentState.focusIndex = 0;
			return;
		}

		const textNodes = findTextNodes();
		const searchRegex = getSearchRegex(searchQuery);
		currentState.totalMatches = 0;
		currentState.focusIndex = 1;
		currentState.nodes = [document.createElement('span')];

		const selection = window.getSelection();
		const selectionNode = selection ? selection.anchorNode : null;
		const selectionFoundState = { value: false };

		textNodes.forEach((textNode) => {
			processTextNode(
				currentState,
				textNode,
				searchRegex,
				selectionNode,
				selectionFoundState,
				queryIndex,
			);
		});

		focusHighlight(currentState, currentState.focusIndex, queryIndex);
	}

	function processTextNode(
		currentState,
		textNode,
		searchRegex,
		selectionNode,
		selectionFoundState,
		queryIndex,
	) {
		let textContent = textNode.textContent || '';
		if (!textContent) return;

		let processedContent = removeDiacritics(textContent);
		searchRegex.lastIndex = 0;

		let match;
		while ((match = searchRegex.exec(processedContent)) !== null) {
			currentState.totalMatches += 1;

			const matchStart = match.index;
			const matchEnd = matchStart + match[0].length;
			const matchString = textContent.slice(matchStart, matchEnd);
			const span = createSpan(currentState.totalMatches, matchString, queryIndex);
			currentState.nodes.push(span);

			if (
				!selectionFoundState.value &&
				selectionNode &&
				(textNode === selectionNode || textNode.contains(selectionNode))
			) {
				selectionFoundState.value = true;
			}

			if (selectionFoundState.value && currentState.focusIndex === 1) {
				currentState.focusIndex = currentState.totalMatches;
			}

			const after = textNode.splitText(match.index);
			if (after.textContent) {
				after.textContent = after.textContent.substring(match[0].length);
			}
			textNode.parentNode && textNode.parentNode.insertBefore(span, after);

			textContent = after.textContent || '';
			processedContent = removeDiacritics(textContent);
			textNode = after;
			searchRegex.lastIndex = 0;
		}
	}

	function unhighlight(queryIndex) {
		const highlightSpans = document.querySelectorAll(
			`span.better-ctrl-f-highlight-${queryIndex}`,
		);

		highlightSpans.forEach((span) => {
			const parent = span.parentNode;
			if (!parent) return;

			while (span.firstChild) {
				parent.insertBefore(span.firstChild, span);
			}
			parent.removeChild(span);
			parent.normalize();
		});
	}

	function focusHighlight(currentState, index, queryIndex) {
		if (currentState.totalMatches === 0) return;

		const previousNode = currentState.nodes[currentState.focusIndex];
		if (previousNode) {
			previousNode.classList.remove(`better-ctrl-f-focus-${queryIndex}`);
		}

		const nextNode = currentState.nodes[index];
		if (!nextNode) return;

		nextNode.classList.add(`better-ctrl-f-focus-${queryIndex}`);
		nextNode.scrollIntoView({ block: 'center', inline: 'nearest' });
		currentState.focusIndex = index;
	}

	function isVisible(element) {
		const style = window.getComputedStyle(element);
		return (
			style.display !== 'none' &&
			style.visibility !== 'hidden' &&
			style.opacity !== '0'
		);
	}

	function escapeSpecialChars(text) {
		return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	function removeDiacritics(text) {
		return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
	}

	function getSearchRegex(searchQuery) {
		const escapedQuery = escapeSpecialChars(searchQuery);
		const diacriticInsensitiveQuery = removeDiacritics(escapedQuery);
		return new RegExp(diacriticInsensitiveQuery, 'gi');
	}

	function createSpan(matchCount, matchString, queryIndex) {
		const span = document.createElement('span');
		span.classList.add(`better-ctrl-f-highlight-${queryIndex}`);
		span.classList.add(`better-ctrl-f-${matchCount}`);
		span.appendChild(document.createTextNode(matchString));
		return span;
	}

	function findTextNodes(body = document.body) {
		const textNodes = [];

		function traverse(node) {
			if (node.nodeType === Node.ELEMENT_NODE) {
				const element = node;
				if (!isVisible(element)) return;
				if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE') return;
			}

			if (node.nodeType === Node.TEXT_NODE && node.textContent && node.textContent.trim() !== '') {
				textNodes.push(node);
			}

			node.childNodes.forEach((child) => traverse(child));
		}

		traverse(body);
		return textNodes;
	}

	window.LITERAL_SEARCH_ENGINE = {
		initializeHighlightState,
		highlight,
		unhighlight,
		focusHighlight,
	};
})();
