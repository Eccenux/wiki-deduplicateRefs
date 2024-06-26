/**
 * Reference de-duplication.
 * 
 * Should be lang-agnostic (should work on pl, en, de...).
 * But is integrated with pl.wiki's [[WP:SK]].
 */
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
			if (content.length) {
				this.content = content;
				this.normalized = normalizeContent(content);
			} else {
				this.content = this.normalized = false;
			}
		}
	}
}
class Refs {
	constructor() {
		/** normalized → ref list */
		this.refMap = {};
		/** removed → winner  */
		this.nameMap = {};
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
				this.nameMap[ref.name] = name;
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
				return false;
			}
			if (!ref.duplicate) {
				return false;
			}
			return ref;
		}
	}
}

/**
 * Main (find and resolve duplicates).
 * @param {String} text wikitext.
 * @param {fs} fs Node.js FS module for debug.
 * @returns 
 */
export function deduplicateRefs(text, fs=false) {
	const refTagPattern = /<ref([^>/]*)>(.+?)<\/ref>/g; // non-empty ref
	const shortRefPattern = /<ref([^>/]*)\/>/g; // empty ref (ref to ref)
	let refs = new Refs();
	
	// debug
	var temp_names = new Set();
	var temp_all = new Set();
	// gather data of non-empty refs
	text.replace(refTagPattern, (all, attr, content) => {
		// check if there was a matching problem
		if (all.indexOf('<ref', 2) > 0) {
			throw `invalid match: ${all}`;
		}

		const ref = new Ref(attr, content);
		refs.add(ref);
		if (fs) {
			if (ref.name && ref.name.length) {
				temp_names.add(ref.name);
			}
			temp_all.add(all);
		}
	});
	if (fs) {
		console.log(temp_names);
		fs.writeFileSync("test_long_refs.mediawiki", [...temp_all].sort().join('\n'));
	}

	// finalize data
	refs.finalize();

	// for <ref name="removed"/> replace with a name of a winner
	text = text.replace(shortRefPattern, (all, attr) => {
		const ref = new Ref(attr, '');
		if (ref.skip) {
			return all;
		}
		if (!ref.name || !ref.name.length) {
			return all;
		}
		if (ref.name in refs.nameMap) {
			let name = refs.nameMap[ref.name];
			return `<ref name="${name}" />`;
		}
		return all;
	});

	// use data to replace duplicates
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
export function normalizeContent(content) {
	let norm = content.trim();

	if (!content.length) {
		console.error("empty content not supported in normalization");
		return "-";
	}

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

/**
 * Parse attrs.
 * @param {String} attributeString 
 * @returns {Object} map.
 */
export function parseAttributes(attributeString) {
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

if (typeof mw === 'object') {
	// eslint-disable-next-line no-undef
	mw.hook('userjs.wp_sk.ready').add(function (wp_sk) {
		let orig_cleanerWikiVaria = wp_sk.cleanerWikiVaria;
	
		wp_sk.cleanerWikiVaria = function(str) {
			// oryginalny cleaner
			str = orig_cleanerWikiVaria.apply(this, arguments);
	
			// dodatek
			let mod = deduplicateRefs(str);
			// info jeśli zmienione
			if (mod != str) {
				wp_sk.extension += "+[[User:Nux/Refdedu|Refdedu]]";
				str = mod;
			}
	
			return str;
		};
	});
}
