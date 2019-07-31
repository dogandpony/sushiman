const util = require('./util');
const { rev, updateManifestData } = require('./cacheBusting');
const { isProduction } = require('./runtimeConfig');

const { src, dest } = require('gulp');
const autoprefixer = require('autoprefixer');
const changed = require('gulp-changed');
const chromatic = require('chromatic-sass');
const concat = require('gulp-concat');
const cssnano = require('cssnano');
const data = require('gulp-data');
const flatten = require('gulp-flatten');
const htmlMin = require('gulp-htmlmin');
const imagemin = require('gulp-imagemin');
const plumber = require('gulp-plumber');
const postcss = require('gulp-postcss');
const sass = require('gulp-sass');
const pxtorem = require('gulp-pxtorem');
const sourceMaps = require('gulp-sourcemaps');
const twig = require('gulp-twig');
const uglify = require('gulp-uglify');

const dev = fn => util.runIf(!isProduction, fn);
const prod = fn => util.runIf(isProduction, fn);

module.exports = {
	// CSS
	css: options => src(options.src)
		.pipe(plumber())
		.pipe(dev(sourceMaps.init))
		.pipe(sass({
			outputStyle: 'nested',
			precision: 10,
			functions: chromatic,
			includePaths: [
				'./',
				'../../node_modules/sushi-base',
			],
		}).on('error', sass.logError))
		.pipe(prod(() => postcss([autoprefixer(), cssnano()])))
		.pipe(pxtorem())
		.pipe(dev(() => sourceMaps.write('.')))
		.pipe(util.runIf(options.enableCacheBusting && isProduction, rev))
		.pipe(dest(options.dest))
		// .pipe(dev(browsersync.stream))
		.pipe(updateManifestData(options.manifestBase || options.dest))
	,

	// JavaScript
	js: options => src(options.src)
		.pipe(plumber())
		.pipe(dev(sourceMaps.init))
		.pipe(util.runIf((options.concat && options.file), () => concat(options.file)))
		.pipe(prod(uglify))
		.pipe(dev(() => sourceMaps.write('.')))
		.pipe(util.runIf(options.enableCacheBusting && isProduction, rev))
		.pipe(dest(options.dest))
		// .pipe(dev(browsersync.stream))
		.pipe(updateManifestData(options.manifestBase || options.dest))
	,

	// Images
	images: options => src(options.src)
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
		.pipe(util.runIf(options.enableCacheBusting && isProduction, rev))
		.pipe(dest(options.dest))
		.pipe(updateManifestData(options.manifestBase || options.dest))
	,

	// Raw copy
	copy: options => src(options.src)
		.pipe(util.runIf(options.flatten, flatten))
		.pipe(util.runIf(options.enableCacheBusting && isProduction, rev))
		.pipe(dest(options.dest))
		.pipe(updateManifestData(options.manifestBase || options.dest))
	,

	// HTML
	html: options => src(options.src)
		.pipe(data(file => ({
			...util.readFile('./data/global.js'),
			...(options.data || {}),
			...util.readFile(util.getTemplateDataPath(file)),
		})))
		.pipe(twig({ base: 'views' }))
		.pipe(prod(() => htmlMin({
			collapseWhitespace: true,
			removeComments: true,
			minifyCSS: true,
			minifyJS: true,
		})))
		.pipe(dest(options.dest))
	,
};
