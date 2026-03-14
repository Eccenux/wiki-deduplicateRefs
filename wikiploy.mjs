import { Wikiploy, verlib } from 'wikiploy';

import * as botpass from './bot.config.mjs';
const ployBot = new Wikiploy(botpass);

// common deploy function(s)
import { addConfig, addConfigRelease, setupSummaryDated } from './wikiploy-common.mjs';

// run asynchronously to be able to wait for results
(async () => {
	// opis zmian: wdrożenie jeśli data opisu zmian się zgadza
	const summaryDate = { date: '2026-03-14', text: 'Statystyki zmian (duplikatów)' };
	const version = await verlib.readVersion('./package.json');
	setupSummaryDated(ployBot, summaryDate, version);

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
