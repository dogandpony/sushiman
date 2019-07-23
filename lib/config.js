const util = require("util.js");

const isProduction = (argv.env === "production" || argv.env === "prod");

/* Default Options
 * --------------------------- */

// not used yet
const defaultOptions = {
	manifestPath: path.join(__dirname, "web/static/manifest.json"),
	updateRevisionedAssetsIn: "./web/**/*.{html,css,js}",
};

const defaultBuildOptions = {
	css: {
		dest: "./web/static/styles/",
	},
	js: {
		dest: "./web/static/scripts/",
		file: "app.js",
		concat: true,
	},
	images: {
		dest: "./web/static/images/",
		flatten: true,
	},
	copy: {
		dest: "./web/static/",
		flatten: true,
	},
	html: {
		dest: "./web/",
		revision: false,
	},
};

const commonDefaultBuildOptions = {
	revision: isProduction,
	manifestBase: "./web/static/",
};

/* Config
 * --------------------------- */

const loadConfig = () => {
	let config = util.requireNoCache("./build.config.js");

	Object.keys(config.builds).forEach(buildType => config.builds[buildType].forEach(
		(build, index) => config.builds[buildType][index] = Object.assign(
			{},
			defaultBuildOptions[buildType],
			commonDefaultBuildOptions,
			config.builds[buildType][index],
		)),
	);

	return config;
};

let config = loadConfig();

module.exports = {
	isProduction,
	config,
};
