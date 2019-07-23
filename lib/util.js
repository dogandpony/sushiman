const crypto = require("crypto");
const fs = require("fs");
const through = require("through2");


const createHash = string => crypto.createHash("md5").update(string).digest("hex").substr(0, 12);


const noop = () => through.obj();


const requireNoCache = dependency => {
	delete require.cache[require.resolve(dependency)];

	return require(dependency);
};


const readFile = file => fs.existsSync(file) ? require(file) : {};


const getTemplateDataPath = file => path.join(
	".",
	"data",
	path.dirname(path.relative("./views", file.path)),
	path.parse(file.path).name + ".js",
);


const runIf = (condition, fn) => condition ? fn() : noop();


const dev = fn => runIf(!isProduction, fn);


const prod = fn => runIf(isProduction, fn);


module.exports = {
	createHash,
	noop,
	requireNoCache,
	readFile,
	getTemplateDataPath,
	runIf,
	dev,
	prod,
};
