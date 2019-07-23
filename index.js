/* Environment Config
 * --------------------------- */

require("dotenv").config();



/* Dependencies
 * --------------------------- */

const { src, dest, parallel, series } = require("gulp");

const argv = require('minimist')(process.argv.slice(2));
const autoprefixer = require("autoprefixer");
const browsersync = require("browser-sync").create();
const changed = require("gulp-changed");
const chromatic = require("chromatic-sass");
const concat = require("gulp-concat");
const crypto = require("crypto");
const cssnano = require("cssnano");
const data = require("gulp-data");
const del = require("del");
const flatten = require("gulp-flatten");
const fs = require("fs");
const eslint = require("gulp-eslint");
const gulpWatch = require("gulp").watch;
const htmlMin = require("gulp-htmlmin");
const imagemin = require("gulp-imagemin");
const path = require("path");
const plumber = require("gulp-plumber");
const postcss = require("gulp-postcss");
const sass = require("gulp-sass");
const pxtorem = require("gulp-pxtorem");
const sourceMaps = require("gulp-sourcemaps");
const through = require("through2");
const twig = require("gulp-twig");
const uglify = require("gulp-uglify");
const upath = require("upath");

const isProduction = (argv.env === "production" || argv.env === "prod");
const manifestPath = path.join(__dirname, "web/static/manifest.json");

let manifest = {};



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
	manifestBase: "web/",
};



/* Utils
 * --------------------------- */

const createRevisionHash = string =>
	crypto.createHash("md5").update(string).digest("hex").substr(0, 12);

const rev = () => through.obj(function (chunk, enc, next) {
	const parsedPath = path.parse(chunk.path);

	chunk.originalBase = parsedPath.base;

	parsedPath.base
		= `${parsedPath.name}-${createRevisionHash(chunk.contents.toString())}${parsedPath.ext}`;

	chunk.path = path.format(parsedPath);

	this.push(chunk);

	next();
});


// @TODO: return manifest file to the main stream
const updateManifestData = baseDest => through.obj(function (chunk, enc, next) {
	if (!chunk.originalBase) {
		this.push(chunk);

		return next();
	}

	const relativePath = path.relative(baseDest, chunk.path);
	const parsedPath = path.parse(relativePath);

	parsedPath.base = chunk.originalBase;

	const originalRelativePath = upath.normalize(path.format(parsedPath));

	manifest[originalRelativePath] = upath.normalize(relativePath);

	this.push(chunk);

	return next();
});

const noop = () => through.obj();

const requireNoCache = dependency => {
	delete require.cache[require.resolve(dependency)];

	return require(dependency);
};

const loadConfig = () => {
	let config = requireNoCache("./build.config.js");

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

const readDataFile = file => fs.existsSync(file) ? require(file) : {};

const getTemplateDataPath = file => path.join(
	".",
	"data",
	path.dirname(path.relative("./views", file.path)),
	path.parse(file.path).name + ".js",
);

const runIf = (condition, fn) => condition ? fn() : noop();
const dev = fn => runIf(!isProduction, fn);
const prod = fn => runIf(isProduction, fn);



/* Config
 * --------------------------- */

let config = loadConfig();



/* Build Pipelines
 * --------------------------- */

const builders = {
	// CSS
	css: options => css = () => src(options.src)
		.pipe(plumber())
		.pipe(dev(sourceMaps.init))
		.pipe(sass({
			outputStyle: "nested",
			precision: 10,
			functions: chromatic,
			includePaths: [
				"./",
				"../../node_modules/sushi-base",
			],
		}).on("error", sass.logError))
		.pipe(prod(() => postcss([autoprefixer(), cssnano()])))
		.pipe(pxtorem())
		.pipe(dev(() => sourceMaps.write(".")))
		.pipe(runIf(options.revision, rev))
		.pipe(dest(options.dest))
		.pipe(dev(browsersync.stream))
		.pipe(updateManifestData(options.manifestBase || options.dest)),

	// JavaScript
	js: options => js = () => src(options.src)
		.pipe(plumber())
		.pipe(dev(sourceMaps.init))
		.pipe(runIf((options.concat && options.file), () => concat(options.file)))
		.pipe(prod(uglify))
		.pipe(dev(() => sourceMaps.write(".")))
		.pipe(runIf(options.revision, rev))
		.pipe(dest(options.dest))
		.pipe(dev(browsersync.stream))
		.pipe(updateManifestData(options.manifestBase || options.dest)),

	// Images
	images: options => images = () => src(options.src)
		.pipe(dev(() => changed(options.dest)))
		.pipe(prod(() => imagemin([
			imagemin.gifsicle({ interlaced: true }),
			imagemin.jpegtran({ progressive: true }),
			imagemin.optipng({ optimizationLevel: 5 }),
			imagemin.svgo({
				plugins: [{
					removeViewBox: false,
					collapseGroups: true,
				}],
			}),
		], {
			verbose: true,
		})))
		.pipe(runIf(options.revision, rev))
		.pipe(dest(options.dest))
		.pipe(updateManifestData(options.manifestBase || options.dest)),

	// Raw copy
	copy: options => copy = () => src(options.src)
		.pipe(runIf(options.flatten, flatten))
		.pipe(runIf(options.revision, rev))
		.pipe(dest(options.dest))
		.pipe(updateManifestData(options.manifestBase || options.dest)),

	// HTML
	html: options => html = () => src(options.src)
		.pipe(data(file => ({
			...readDataFile("./data/global.js"),
			...(options.data || {}),
			...readDataFile(getTemplateDataPath(file)),
		})))
		.pipe(twig({ base: "views" }))
		.pipe(prod(() => htmlMin({
			collapseWhitespace: true,
			removeComments: true,
			minifyCSS: true,
			minifyJS: true,
		})))
		.pipe(dest(options.dest)),
};



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
 * Reads the manifest and updates the global variable with its contents.
 *
 * @param next
 */
const readManifest = next => {
	manifest = (fs.existsSync(manifestPath)
			? JSON.parse(fs.readFileSync(manifestPath).toString())
			: {}
	);

	next();
};


/**
 * Writes the manifest variable to the manifest file
 *
 * @param next
 */
const writeManifest = next => {
	fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

	next();
};


/**
 * Updates the URLs of the revisioned assets in the selected files
 *
 * @returns {(function(): *)|*}
 */
const updateRevisionedAssets = () => src(config.options.updateRevisionedAssetsIn, { base: "./" })
	.pipe(through.obj(function (chunk, enc, next) {
		let contents = chunk.contents.toString(enc);

		Object.keys(manifest).forEach(originalFile => {
			contents = contents.replace(originalFile, manifest[originalFile]);
		});

		chunk.contents = Buffer.from(contents, enc);

		this.push(chunk);

		next();
	}))
	.pipe(dest("./"));


/**
 * Deletes the static assets folder
 *
 * @returns {Promise<string[]>}
 */
const clean = () => del(["./web/"]);


// Watch files
const watch = next => {
	Object.keys(config.builds).forEach(buildType => {
		const builds = config.builds[buildType];

		builds.forEach(buildConfig => {
			gulpWatch((buildConfig.watch || buildConfig.src), builders[buildType](buildConfig));
		});
	});

	next();
};


// define complex tasks
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
