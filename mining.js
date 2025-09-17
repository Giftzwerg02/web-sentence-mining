browser.runtime.onMessage.addListener(onMessage);

function onMessage(msg) {
	console.log("recv: ", msg);
	switch (msg.messageType) {
		case "sentence-select": 
			handleSentenceSelect(msg.info, msg.tab);
			break;
		default:
			throw new Error("invalid message_type: ", msg.message_type, msg);
	}
}

function handleSentenceSelect(info, tab) {
	const selection = window.getSelection();
	console.log(selection);
	let text = selection.anchorNode.textContent;
	
	let startOffset = Math.min(selection.anchorOffset, selection.focusOffset);
	let endOffset = Math.max(selection.anchorOffset, selection.focusOffset);

	let previousSibling = selection.anchorNode.previousSibling;
	while (previousSibling !== null) {
		const siblingText = previousSibling.textContent;
		text = siblingText + text;
		startOffset += siblingText.length;
		endOffset += siblingText.length;

		// lmao
		previousSibling = previousSibling.previousSibling;
	}

	let nextSibling = selection.anchorNode.nextSibling;
	while (nextSibling !== null) {
		const siblingText = nextSibling.textContent;
		text = text + siblingText;

		// rofl
		nextSibling = nextSibling.nextSibling;
	}

	console.log("text, offset: ", text, startOffset, endOffset);

	const sentence = extractSentence(text, startOffset, endOffset);
	const word = extractWord(text, startOffset, endOffset);

	browser.runtime.sendMessage({
		messageType: "create-sentence-card",
		sentence,
		word,
	});
}

function extractBetweenDelimiter(text, startOffset, endOffset, delims) {
	let sentenceStart = Math.max(...delims.map(delim => text.slice(0, startOffset).lastIndexOf(delim)));

	let endings = delims.map(delim => text.slice(endOffset).indexOf(delim)).filter(idx => idx > -1);
	let sentenceEnd = -1;
	if (endings.length > 0) {
		sentenceEnd = Math.min(...endings);
	}

	console.log({ sentenceStart, sentenceEnd });

	// if no prev sentence was found, just start from the beginning
	if (sentenceStart === -1) {
		sentenceStart = 0;
	} else {
		sentenceStart++;
	}

	// if the sentence didn't end, just read until the end
	if (sentenceEnd === -1) {
		sentenceEnd = text.length;
	} else {
		sentenceEnd += endOffset;
	}

	const result = text.slice(sentenceStart, sentenceEnd);
	return { result, endingDelimiter: text[sentenceEnd] };
}

function extractSentence(text, startOffset, endOffset) {
	const { result, endingDelimiter } = extractBetweenDelimiter(text, startOffset, endOffset, [".", "!", "?"]);

	if (endingDelimiter) {
		return result + endingDelimiter;
	} else {
		return result;
	}
}

function extractWord(text, startOffset, endOffset) {
	while (text[startOffset] === " ") {
		startOffset++;
	}

	while (text[endOffset] === " ") {
		endOffset--;
	}
	const { result } = extractBetweenDelimiter(text, startOffset, endOffset, [" "]);
	return result.replace(/^[\s\.,]+|[\s\.,]+$/g, "");
}
