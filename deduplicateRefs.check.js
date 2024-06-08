import { deduplicateRefs, normalizeContent, parseAttributes, prepareTpl } from "./deduplicateRefs.js";

// quick check
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
usageCheck();