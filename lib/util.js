const crypto = require('crypto');
const fs = require('fs');
const through = require('through2');
const path = require('path');

const createHash = string => crypto.createHash('md5').update(string).digest('hex').substr(0, 12);

const getBuildTasks = (buildConfigs, pipelines) => {
	const tasks = [];
	const builderIndex = {};

	Object.keys(buildConfigs).forEach(buildType => {
		if (pipelines[buildType] === void 0) {
			console.log(`There is no builder for the ${buildType} task.`);

			return;
		}

		builderIndex[buildType] = (builderIndex[buildType] || 0);

		buildConfigs[buildType].forEach(options => {
			const task = pipelines[buildType].bind({}, options);

			task.displayName = `${buildType}:${++builderIndex[buildType]}`;

			tasks.push(task);
		});
	});

	return tasks;
};

const getCwdRelativePath = filePath => path.join(process.cwd(), filePath);

const getTemplateDataPath = file => path.join(
	'.',
	'data',
	path.dirname(path.relative('./views', file.path)),
	path.parse(file.path).name + '.js',
);

const noop = () => through.obj();

const readFile = file => fs.existsSync(file) ? require(file) : {};

const requireNoCache = dependency => {
	delete require.cache[require.resolve(dependency)];

	return require(dependency);
};

const runIf = (condition, fn) => condition ? fn() : noop();

module.exports = {
	createHash,
	getBuildTasks,
	getCwdRelativePath,
	getTemplateDataPath,
	noop,
	readFile,
	requireNoCache,
	runIf,
};
