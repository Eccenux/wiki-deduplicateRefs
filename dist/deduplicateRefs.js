/** Simple ref record. */
class Ref {
	constructor(attr, content) {
		this.first = false;
		this.duplicate = false;

		this.name = '';
		this.attrs = parseAttributes(attr);
		let limit = 0;
		if ('name' in this.attrs) {
			this.name = this.attrs.name;
			limit++;
		}
		// skip ref with group attr (or with any attr other then name)
		if (Object.keys(this.attrs).length > limit) {
			this.skip = true;
		} else {
			this.content = content;
			this.normalized = normalizeContent(content);
		}
	}
}
class Refs {
	constructor() {
		this.refMap = {};
		this.refs = [];
	}
	/**
	 * Add ref.
	 * @param {Ref} ref 
	 */
	add(ref) {
		if (ref.skip) {
			return;
		}
		// fill refs map
		const normalized = ref.normalized;
		if (!(normalized in this.refMap)) {
			this.refMap[normalized] = [];
			ref.first = true;
		}
		this.refMap[normalized].push(ref);
		this.refs.push(ref);
	}
	/** 2nd pass for detecting duplicates. */
	finalize() {
		let no = 1;
		// loop over groups
		for (let list of Object.values(this.refMap)) {
			// not a group of duplicates
			if (list.length <= 1) {
				continue
			}
			// figure out best name (if there is a name attr in the group)
			let name = '';
			for (const ref of list) {
				if (ref.name.length && ref.name.length > name.length) {
					name = ref.name;
				}
			}
			if (!name.length) {
				name = `dd:${no}`;
			}
			// finalize duplicates in this group
			for (const ref of list) {
				// add name to refs
				ref.name = name;
				ref.duplicate = true;
			}
			no++;
		}
	}
	/**
	 * Check if the content is a duplicate.
	 * @param {String} index Match or add index.
	 * @param {String} content Just for sanity check. 
	 * @returns {Ref} or false if not a duplicate.
	 */
	isdup(index, content) {
		const ref = this.refs[index];
		if (ref instanceof Ref) {
			if (ref.content != content) {
				console.error(`Contents don't match! Something went wrong`);
			}
			if (!ref.duplicate) {
				return false;
			}
			return ref;
		}
	}
}

function deduplicateRefs(text) {
	const refTagPattern = /<ref([^>]*)>(.*?)<\/ref>/g;
	let refs = new Refs();

	// gather data
	text = text.replace(refTagPattern, (all, attr, content) => {
		refs.add(new Ref(attr, content));
		return all;
	});

	// finalize data
	refs.finalize();

	// use data
	let index = 0;
	text = text.replace(refTagPattern, (all, attr, content) => {
		let ref = refs.isdup(index, content);
		index++;
		// duplicate
		if (ref instanceof Ref) {
			if (ref.first) {
				return `<ref name="${ref.name}">${content}</ref>`;
			}
			return `<ref name="${ref.name}" />`;
		}
		return all;
	});

	return text;
}

/**
 * Normalize for compare.
 * @param {String} content wikitext in ref.
 * @returns 
 */
function normalizeContent(content) {
	let norm = content.trim();

	// todo: url support
	/*
	this is: {{cite | url = https://abc.com }}
	same as: https://abc.com
	and the longer should always win (cite should be used; if both are cite then e.g. the one with archived url is better).
	*/
	
	// is a template with params
	if (norm.indexOf('|') > 0) {
		// a single template
		if (norm.indexOf('{{') == 0 && norm.indexOf('{{', 1) < 0) {
			let {name, params} = prepareTpl(norm);
			return `${name}|${params.join('|')}}}`;
		}
	}

	return norm;
}

/**
 * Normalize template to pseudo parameters.
 * 
 * Note that this is only usefull for compare.
 * 
 * @param {String} content template wikitext.
 * @returns Array of parameters.
 */
function prepareTpl(content) {
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

/**
 * Parse attrs.
 * @param {String} attributeString 
 * @returns {Object} map.
 */
function parseAttributes(attributeString) {
	const attributes = {};

	// standard attrs
	attributeString = attributeString.replace(/(\w+)=["'](.*?)["']/g, (a, key, value)=>{
		attributes[key] = value;
		return "";
	});
	// malformed
	attributeString = attributeString.trim().replace(/(\w+)=(\S+)/g, (a, key, value)=>{
		attributes[key] = value;
		return "";
	});
	// just the name?
	attributeString = attributeString.trim();
	if (attributeString.length) {
		console.warn(`Unable to parse some attrs: ${attributeString}`);
	}

	return attributes;
}

// quick check
// eslint-disable-next-line no-unused-vars
function usageCheck() {
	console.log(JSON.stringify(prepareTpl(`{{cite 1 | author=info1|title=info2 }}`)));
	console.log(JSON.stringify(prepareTpl(`{{cite 1 | title=info2| author=info1}}`)));
	console.log(JSON.stringify(prepareTpl(`{{cite 2 | title=info2|author=info1}}`)));
	
	console.log(JSON.stringify(normalizeContent(` {{cite 1 | author=info1|title=info2 }}`)));
	console.log(JSON.stringify(normalizeContent(`{{cite 1 | title=info2| author=info1}}`  )));
	console.log(JSON.stringify(normalizeContent(`{{cite 2 | title=info2|author=info1}}`)));

	console.log(deduplicateRefs(`
		Some text with refs.<ref>abc</ref>
		More text.<ref>def</ref>
		Even more text.<ref>abc</ref>
	`));

	// attrs
	const parsedAttributes = parseAttributes(`name="x" group="notes"`);
	console.log(parsedAttributes); // { name: 'x', group: 'notes' }
}
// usageCheck();