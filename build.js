import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const outPath = join('dist', 'deduplicateRefs.js');
mkdirSync('dist', { recursive: true });

const fileContent = readFileSync('deduplicateRefs.js', 'utf8');

const updatedContent = fileContent.replace(/^export /gm, '');

writeFileSync(outPath, updatedContent, 'utf8');

console.log('Removed export keywords from', outPath);
