const crypto = require('crypto');
const fs = require('fs');
const through = require('through2');
const path = require('path');

let uniqueId = 0;

const noop = () => through.obj();

module.exports = {
	createHash: string => crypto.createHash('md5').update(string).digest('hex').substr(0, 12),

	getCwdRelativePath: filePath => path.join(process.cwd(), filePath),

	getTemplateDataPath: file => path.join(
		'.',
		'data',
		path.dirname(path.relative('./views', file.path)),
		path.parse(file.path).name + '.js',
	),

	noop: noop,

	readFile: file => fs.existsSync(file) ? require(file) : {},

	requireNoCache: dependency => {
		delete require.cache[require.resolve(dependency)];

		return require(dependency);
	},

	runIf: (condition, fn) => condition ? fn() : noop(),

	uniqueId: prefix => ++uniqueId + (prefix || ''),
};
