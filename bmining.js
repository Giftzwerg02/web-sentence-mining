browser.runtime.onMessage.addListener(onMessage);

const miningMenuId = "mine-selection";

const ankiUrl = "http://127.0.0.1:8765";

browser.menus.create({
	id: miningMenuId,
	title: "Mine sentence",
	contexts: ["selection"],
}, browser.menus.onCreated);

browser.menus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === miningMenuId) {
	browser.tabs.sendMessage(tab.id, {
	  messageType: "sentence-select",
	  info,
	  tab,
	});
  }
});

async function onMessage(msg) {
	console.log("recv: ", msg);
	switch (msg.messageType) {
		case "create-sentence-card":
			await handleCreateSentenceCard(msg.sentence, msg.word);
			break;
		default:
			throw new Error("invalid message_type: ", msg.message_type, msg);
	}
}

async function handleCreateSentenceCard(sentence, word) {
	const sentenceForeign = sentence.replace(` ${word} `, ` <b><u>${word}</u></b> `);
	const wordForeign = word;
	const sentenceNative = `${new Date()}`;
	const wordNative = sentenceNative;
	const fields = {
		"Sentence-Native": sentenceNative,
		"Word-Native": wordNative,
		"Sentence-Foreign": sentenceForeign,
		"Word-Foreign": wordForeign,
	};

	console.log({ fields });

	await ankiCreateCard(ankiUrl, "test-deck", "Sentence-Mining", fields, {
		"tags": [
			"todo"
		]
	});
}

async function ankiCreateCard(url, deckName, modelName, fields, other = {}) {
	const action = "addNote";
	const params = {
		"note": {
			"deckName": deckName,
			"modelName": modelName,
			"fields": fields,
			...other,
		}
	};

	await sendAnkiRequest(url, action, params);
}

async function sendAnkiRequest(url, action, params) {
	const body = {
		"action": action,
		"params": params,
	};

	console.log(JSON.stringify(body));

	try {
		const res = await fetch(url, {
			method: "POST",
			body: JSON.stringify(body),
		});
		console.log(await res.text());
	} catch (e) {
		console.error(e);
	}
}

// (async () => { await ankiCreateCard(ankiUrl, "test-deck", "Basic", "some front 2", "some back 2"); })();
