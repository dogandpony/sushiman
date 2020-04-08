const fs = require('fs');
const util = require('./util');

const defaultOptions = {
	basePath: 'web/',
	manifestPath: 'manifest.json',
	updateRevisionedAssetsIn: '**/*.{html,css,js}',
};

const defaultBuildOptions = {
	css: {
		dest: 'static/styles/',
	},
	js: {
		dest: 'static/scripts/',
		file: 'app.js',
		concat: true,
	},
	images: {
		dest: 'static/images/',
		flatten: true,
	},
	copy: {
		dest: 'static/',
		flatten: true,
	},
	html: {
		dest: '/',
		enableCacheBusting: false,
	},
};

const commonDefaultBuildOptions = {
	enableCacheBusting: true,
	manifestBase: '/',
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
