export function deduplicateRefs(text) {
	const refTagPattern = /<ref>(.*?)<\/ref>/g;
	let refs = {};
	let refCounter = 1;

	text = text.replace(refTagPattern, (all, content) => {
		let normalized = normalizeContent(content);
		if (refs[normalized]) {
			return `<ref name="dd:${refs[normalized]}" />`;
		} else {
			refs[normalized] = refCounter++;
			return `<ref name="dd:${refs[normalized]}">${content}</ref>`;
		}
	});

	return text;
}

/**
 * Normalize for compare.
 * @param {String} content wikitext in ref.
 * @returns 
 */
export function normalizeContent(content) {
	// todo: url support
	/*
	this is: {{cite | url = https://abc.com }}
	same as: https://abc.com
	and the longer should always win (cite should be used; if both are cite then e.g. the one with archived url is better).
	*/

	// is a template with params
	if (content.indexOf('|') > 0) {
		let tpl = content.trim();
		// a single template
		if (tpl.indexOf('{{') == 0 && tpl.indexOf('{{', 1) < 0) {
			let {name, params} = prepareTpl(tpl);
			return `${name}|${params.join('|')}}}`;
		}
	}
}

/**
 * Normalize template to pseudo parameters.
 * 
 * Note that this is only usefull for compare.
 * 
 * @param {String} content template wikitext.
 * @returns Array of parameters.
 */
export function prepareTpl(content) {
	let numbered = 0;
	let [name, ...params] = content.replace(/\}\}\s*$/, '').split('|').map(v=>v.trim());
	params = params
		.map(param => {
			let parts = param.split('=');
			// add explicit numbers for parameters
			if (parts.length == 1) {
				parts[1] = parts[0];
				parts[0] = `n::${++numbered}`;
			} else {
				parts = parts.map(p=>p.trim());
			}
			return parts.join('=');
		})
		.sort()
	;

	return {name, params};
}

// quick check
function usageCheck() {
	console.log(JSON.stringify(prepareTpl(`{{cite 1 | author=info1|title=info2 }}`)));
	console.log(JSON.stringify(prepareTpl(`{{cite 1 | title=info2| author=info1}}`)));
	console.log(JSON.stringify(prepareTpl(`{{cite 2 | title=info2|author=info1}}`)));
	
	console.log(JSON.stringify(normalizeContent(` {{cite 1 | author=info1|title=info2 }}`)));
	console.log(JSON.stringify(normalizeContent(`{{cite 1 | title=info2| author=info1}}`  )));
	console.log(JSON.stringify(normalizeContent(`{{cite 2 | title=info2|author=info1}}`)));	
}
// usageCheck();