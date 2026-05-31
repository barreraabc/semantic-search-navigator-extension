// Copyright 2026
//
// Provides fuzzy text search and in-page highlight utilities.

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

		if (!searchQuery || !searchQuery.trim()) {
			currentState.totalMatches = 0;
			currentState.focusIndex = 0;
			return;
		}

		const textNodes = findTextNodes();
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
				searchQuery,
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
		searchQuery,
		selectionNode,
		selectionFoundState,
		queryIndex,
	) {
		const originalText = textNode.textContent || '';
		if (!originalText) return;

		const matches = findApproximateMatches(originalText, searchQuery);
		if (matches.length === 0) return;

		let consumedChars = 0;
		let currentNode = textNode;

		for (const match of matches) {
			const relativeStart = match.start - consumedChars;
			const matchLength = match.end - match.start;

			if (relativeStart < 0 || matchLength <= 0) {
				continue;
			}

			const currentText = currentNode.textContent || '';
			if (relativeStart >= currentText.length) {
				continue;
			}

			const matchString = currentText.slice(relativeStart, relativeStart + matchLength);
			if (!matchString.trim()) {
				continue;
			}

			currentState.totalMatches += 1;
			const span = createSpan(currentState.totalMatches, matchString, queryIndex);
			currentState.nodes.push(span);

			if (
				!selectionFoundState.value &&
				selectionNode &&
				(currentNode === selectionNode || currentNode.contains(selectionNode))
			) {
				selectionFoundState.value = true;
			}

			if (selectionFoundState.value && currentState.focusIndex === 1) {
				currentState.focusIndex = currentState.totalMatches;
			}

			const after = currentNode.splitText(relativeStart);
			if (after.textContent) {
				after.textContent = after.textContent.substring(matchLength);
			}
			currentNode.parentNode && currentNode.parentNode.insertBefore(span, after);

			consumedChars = match.end;
			currentNode = after;
		}
	}

	function findApproximateMatches(textContent, searchQuery) {
		const normalizedText = removeDiacritics(textContent).toLowerCase();
		const normalizedQuery = normalizeForDistance(searchQuery);
		if (!normalizedQuery) return [];

		const tokenRegex = /\S+/g;
		const tokens = [];
		let tokenMatch;
		while ((tokenMatch = tokenRegex.exec(normalizedText)) !== null) {
			tokens.push({ value: tokenMatch[0], index: tokenMatch.index });
		}

		if (tokens.length === 0) return [];

		const queryWordCount = normalizedQuery.split(/\s+/).filter(Boolean).length;
		const candidateWordLengths = [
			Math.max(1, queryWordCount - 1),
			Math.max(1, queryWordCount),
			Math.max(1, queryWordCount + 1),
		];
		const maxDistance = getMaxDistance(normalizedQuery.length);

		const candidateMatches = [];
		for (let startTokenIndex = 0; startTokenIndex < tokens.length; startTokenIndex += 1) {
			candidateWordLengths.forEach((wordLength) => {
				const endTokenIndex = startTokenIndex + wordLength - 1;
				if (endTokenIndex >= tokens.length) return;

				const start = tokens[startTokenIndex].index;
				const end = tokens[endTokenIndex].index + tokens[endTokenIndex].value.length;
				const candidateRaw = normalizedText.slice(start, end);
				const candidate = normalizeForDistance(candidateRaw);
				if (!candidate) return;

				const distance = calculateLevenshtein(normalizedQuery, candidate);
				if (distance <= maxDistance) {
					candidateMatches.push({ start, end, distance });
				}
			});
		}

		if (candidateMatches.length === 0) return [];

		candidateMatches.sort((a, b) => {
			if (a.start !== b.start) return a.start - b.start;
			if (a.distance !== b.distance) return a.distance - b.distance;
			return (a.end - a.start) - (b.end - b.start);
		});

		const nonOverlappingMatches = [];
		let lastEnd = -1;
		for (const candidate of candidateMatches) {
			if (candidate.start < lastEnd) continue;
			nonOverlappingMatches.push(candidate);
			lastEnd = candidate.end;
		}

		return nonOverlappingMatches;
	}

	function getMaxDistance(queryLength) {
		if (queryLength <= 4) return 1;
		if (queryLength <= 8) return 2;
		return Math.max(3, Math.floor(queryLength * 0.3));
	}

	function normalizeForDistance(text) {
		return removeDiacritics(text).toLowerCase().replace(/\s+/g, ' ').trim();
	}

	function calculateLevenshtein(a, b) {
		const matrix = [];
		for (let i = 0; i <= b.length; i++) matrix[i] = [i];
		for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

		for (let i = 1; i <= b.length; i++) {
			for (let j = 1; j <= a.length; j++) {
				if (b.charAt(i - 1) === a.charAt(j - 1)) {
					matrix[i][j] = matrix[i - 1][j - 1];
				} else {
					matrix[i][j] = Math.min(
						matrix[i - 1][j - 1] + 1,
						Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
					);
				}
			}
		}
		return matrix[b.length][a.length];
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

	function removeDiacritics(text) {
		return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
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

	window.FUZZY_SEARCH_ENGINE = {
		initializeHighlightState,
		highlight,
		unhighlight,
		focusHighlight,
	};
})();
