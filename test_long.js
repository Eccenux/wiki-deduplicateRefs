import { deduplicateRefs } from "./deduplicateRefs.js";
import * as fs from 'fs';

let text = fs.readFileSync('test_long_in.mediawiki', { encoding: 'utf8', flag: 'r' });
let result = deduplicateRefs(text, fs);
fs.writeFileSync('test_long_out.mediawiki', result);
