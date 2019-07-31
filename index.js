/* ==============================================================================================
 * SUSHIMAN
 *
 * Our builder with lasers
 * ============================================================================================== */

// Dependencies
const { watch: gulpWatch, src } = require('gulp');
const browsersync = require('browser-sync').create();

// Lib
const { load: loadConfig } = require('./lib/buildConfigParser');
const { writeManifest, updateRevisionedAssets } = require('./lib/cacheBusting');
const builder = require('./lib/builder');
const runtimeConfig = require('./lib/runtimeConfig');
const util = require('./lib/util');

// Global Variables
const buildConfig = loadConfig('./build.config.js');

// Merge custom pipelines into the default pipelines
if (buildConfig.pipelines !== void 0) {
	builder.merge(buildConfig.pipelines);
}


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
 * @param gulpInstance
 */
const watch = gulpInstance => next => {
	Object.keys(buildConfig.builds).forEach(buildType => {
		const builds = buildConfig.builds[buildType];

		builds.forEach(options => {
			gulpInstance.watch(
				(options.watch || options.src),
				builder.getTask(buildType, options)
			);
		});
	});

	next();
};

const buildTasks = builder.getAllTasks(buildConfig.builds);

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
		dev: series(parallel(buildTasks), browserSyncInit, watch(gulpInstance)),
	};
};
