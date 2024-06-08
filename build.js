import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const outPath = join('dist', 'deduplicateRefs.js');
mkdirSync('dist', { recursive: true });

function build(code) {
	// remove export keyword
	code = code.replace(/^export /gm, '');
	// add isolation
	code = `(function(){\n${code}\nwindow.deduplicateRefs = deduplicateRefs;\n})();`;

	return code;
}
let code = readFileSync('deduplicateRefs.js', 'utf8');
code = build(code);
writeFileSync(outPath, code, 'utf8');

console.log('Build done. Output: ', outPath);
