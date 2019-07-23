/* ==============================================================================================
 * SUSHIMAN
 *
 * Our builder with lasers
 * ============================================================================================== */


/* Dependencies
 * --------------------------- */

const { parallel, series } = require("gulp");

const browsersync = require("browser-sync").create();
const del = require("del");
const fs = require("fs");
const gulpWatch = require("gulp").watch;



/* Gulp Tasks
 * --------------------------- */

/**
 * Inits Browsersync server
 *
 * @param next
 */
const browserSync = next => {
	browsersync.init(fs.existsSync("./bs.config.js")
		? require("./bs.config.js")
		: {},
	);

	next();
};


/**
 * Deletes the static assets folder
 *
 * @returns {Promise<string[]>}
 */
const clean = () => del(["./web/"]);


/**
 * Watches files for changes
 *
 * @param next
 */
const watch = next => {
	Object.keys(config.builds).forEach(buildType => {
		const builds = config.builds[buildType];

		builds.forEach(buildConfig => {
			gulpWatch((buildConfig.watch || buildConfig.src), builders[buildType](buildConfig));
		});
	});

	next();
};


/**
 * Builds all pipelines
 */
const buildAll = (() => {
	const tasks = [];
	const builderIndex = {};

	Object.keys(config.builds).forEach(buildType => {
		if (builders[buildType] === void 0) {
			console.log(`There is no builder for the ${buildType} task.`);

			return;
		}

		builderIndex[buildType] = (builderIndex[buildType] || 0);

		config.builds[buildType].forEach(options => {
			const task = builders[buildType](options);

			task.displayName = `${buildType}:${++builderIndex[buildType]}`;

			tasks.push(task);
		});
	});

	return parallel.apply({}, tasks);
})();

const build = (isProduction
	? series(clean, buildAll, parallel(writeManifest, updateRevisionedAssets))
	: series(clean, buildAll)
);

exports.build = series(clean, build);
exports.dev = series(clean, build, browserSync, watch);
