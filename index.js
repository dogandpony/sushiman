/* ==============================================================================================
 * SUSHIMAN
 *
 * Our builder with lasers
 * ============================================================================================== */

// Dependencies
const { watch: gulpWatch } = require('gulp');
const browsersync = require('browser-sync').create();

// Lib
const { load: loadConfig } = require('./lib/buildConfigParser');
const { writeManifest, updateRevisionedAssets } = require('./lib/cacheBusting');
const runtimeConfig = require('./lib/runtimeConfig');
const pipelines = require('./lib/pipelines');
const util = require('./lib/util');

// Global Variables
const buildConfig = loadConfig('./build.config.js');


/**
 * Inits Browsersync server
 *
 * @param next
 */
const browserSyncInit = next => {
	const bsConfigFile = util.getCwdRelativePath('./bs.config.js');

	browsersync.init(bsConfigFile ? require(bsConfigFile) : {});

	next();
};


/**
 * Watches files for changes
 *
 * @param next
 */
const watch = next => {
	Object.keys(buildConfig.builds).forEach(buildType => {
		const builds = buildConfig.builds[buildType];

		builds.forEach(buildConfig => {
			gulpWatch((buildConfig.watch || buildConfig.src), pipelines[buildType](buildConfig));
		});
	});

	next();
};

const buildTasks = util.getBuildTasks(buildConfig.builds, {
	...pipelines,
	...(buildConfig.builders || {})
});

module.exports = gulpInstance => {
	const { parallel, series } = gulpInstance;

	return {
		build: (runtimeConfig.isProduction
			? series(
				buildTasks,
				writeManifest,
				updateRevisionedAssets.bind({},buildConfig.options.updateRevisionedAssetsIn)
			)
			: series(buildTasks)
		),
		dev: series(parallel(buildTasks), browserSyncInit),
	};
};
