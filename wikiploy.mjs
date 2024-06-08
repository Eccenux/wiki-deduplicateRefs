import { Wikiploy, setupSummary } from 'wikiploy';

import * as botpass from './bot.config.mjs';
const ployBot = new Wikiploy(botpass);

// common deploy function(s)
import { addConfig, addConfigRelease } from './wikiploy-common.mjs';

// run asynchronously to be able to wait for results
(async () => {
	// custom summary from a prompt
	await setupSummary(ployBot);

	// push out file(s) to wiki
	const configs = [];
	// dev version
	addConfig(configs, 'pl.wikipedia.org');
	// release versions
	addConfigRelease(configs, 'pl.wikipedia.org');
	addConfigRelease(configs, 'en.wikipedia.org');

	await ployBot.deploy(configs);

})().catch(err => {
	console.error(err);
	process.exit(1);
});
