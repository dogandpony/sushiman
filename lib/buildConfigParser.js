const fs = require('fs');
const util = require('./util');

// not used yet
const defaultOptions = {
	manifestPath: 'web/static/manifest.json',
	updateRevisionedAssetsIn: 'web/**/*.{html,css,js}',
};

const defaultBuildOptions = {
	css: {
		dest: 'web/static/styles/',
	},
	js: {
		dest: 'web/static/scripts/',
		file: 'app.js',
		concat: true,
	},
	images: {
		dest: 'web/static/images/',
		flatten: true,
	},
	copy: {
		dest: 'web/static/',
		flatten: true,
	},
	html: {
		dest: 'web/',
		enableCacheBusting: false,
	},
};

const commonDefaultBuildOptions = {
	enableCacheBusting: true,
	manifestBase: 'web/static/',
};

const load = (configFilePath) => {
	const relativePath = util.getCwdRelativePath(configFilePath);

	if (!fs.existsSync(relativePath)) {
		throw Error('No build config file has been found in the current directory.');
	}

	let config = util.requireNoCache(relativePath);

	Object.keys(config.builds).forEach(buildType => config.builds[buildType].forEach(
		(build, index) => config.builds[buildType][index] = Object.assign(
			{},
			defaultBuildOptions[buildType],
			commonDefaultBuildOptions,
			config.builds[buildType][index],
		)),
	);

	config.options = {
		...defaultOptions,
		...(config.options || {}),
	};

	return config;
};

module.exports = {
	load,
};
