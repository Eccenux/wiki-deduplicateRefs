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
