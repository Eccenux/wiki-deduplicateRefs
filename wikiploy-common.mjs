import { DeployConfig } from 'wikiploy';

/**
 * Add config.
 * @param {Array} configs DeployConfig array.
 * @param {String} site Domian of a MW site.
 */
export function addConfig(configs, site, isRelease) {
	let deploymentName = isRelease ? '~/refdedu' : '~/refdedu-dev';
	configs.push(new DeployConfig({
		src: 'dist/refdedu.js',
		dst: `${deploymentName}.js`,
		site,
		nowiki: true,
	}));
}
export function addConfigRelease(configs, site) {
	addConfig(configs, site, true);
}

/**
 * Check if summaryDate.date exists, is a string,
 * and equals today's date (YYYY-MM-DD).
 *
 * @param {object} summaryDate
 * @returns {boolean}
 */
function isValid(summaryDate) {
	if (!summaryDate 
		|| typeof summaryDate.date !== 'string' 
		|| typeof summaryDate.text !== 'string'
		|| summaryDate.date.length < 10
	) {
		return false;
	}

	const today = new Date().toISOString().slice(0, 10);
	return summaryDate.date === today;
}

/**
 * Configure a deployment summary that is only valid for the current date.
 *
 * `summary()` will be setup to return either:
 *   - `v<version>: <text>` when version is provided
 *   - `<text>` when version is empty
 *
 * @param {object} ployBot [IN] Will receive the `summary()` function.
 * @param {{date?: string, text?: string}} summaryDate
 *	Object describing a date-bound summary. Expected structure:
 *	`{ date: 'YYYY-MM-DD', text: 'summary text' }`.
 * @param {string} version Optional version string. If provided, it will be prefixed in the summary.
 * @param {string} standardSummary Fallback summary text used when `summaryDate.text` is empty.
 */
export function setupSummaryDated(ployBot, summaryDate = {}, version = '', standardSummary = 'Ploy from Github') {
	if (!isValid(summaryDate)) {
		throw new Error("summaryDate is invalid, make sure date is current (and text too :-))");
	}
	if (!summaryDate.text.length) {
		summaryDate.text = standardSummary;
	}
	ployBot.summary = () => {
		return version.length ? `v${version}: ${summaryDate.text}` : summaryDate.text;
	};
	console.log(`[INFO] summary: »${ployBot.summary()}«\n`);
}