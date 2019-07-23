import { src, dest } from "gulp";
import * as util from "./util";

import autoprefixer from "autoprefixer";
import changed from "gulp-changed";
import chromatic from "chromatic-sass";
import concat from "gulp-concat";
import cssnano from "cssnano";
import data from "gulp-data";
import flatten from "gulp-flatten";
import htmlMin from "gulp-htmlmin";
import imagemin from "gulp-imagemin";
import plumber from "gulp-plumber";
import postcss from "gulp-postcss";
import sass from "gulp-sass";
import pxtorem from "gulp-pxtorem";
import sourceMaps from "gulp-sourcemaps";
import twig from "gulp-twig";
import uglify from "gulp-uglify";

module.exports = {
	// CSS
	css: options => css = () => src(options.src)
		.pipe(plumber())
		.pipe(util.dev(sourceMaps.init))
		.pipe(sass({
			outputStyle: "nested",
			precision: 10,
			functions: chromatic,
			includePaths: [
				"./",
				"../../node_modules/sushi-base",
			],
		}).on("error", sass.logError))
		.pipe(util.prod(() => postcss([autoprefixer(), cssnano()])))
		.pipe(pxtorem())
		.pipe(util.dev(() => sourceMaps.write(".")))
		.pipe(util.runIf(options.revision, rev))
		.pipe(dest(options.dest))
		.pipe(util.dev(browsersync.stream))
		.pipe(util.updateManifestData(options.manifestBase || options.dest)),

	// JavaScript
	js: options => js = () => src(options.src)
		.pipe(plumber())
		.pipe(util.dev(sourceMaps.init))
		.pipe(util.runIf((options.concat && options.file), () => concat(options.file)))
		.pipe(util.prod(uglify))
		.pipe(util.dev(() => sourceMaps.write(".")))
		.pipe(util.runIf(options.revision, rev))
		.pipe(dest(options.dest))
		.pipe(util.dev(browsersync.stream))
		.pipe(util.updateManifestData(options.manifestBase || options.dest)),

	// Images
	images: options => images = () => src(options.src)
		.pipe(util.dev(() => changed(options.dest)))
		.pipe(util.prod(() => imagemin([
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
		.pipe(util.runIf(options.revision, rev))
		.pipe(dest(options.dest))
		.pipe(util.updateManifestData(options.manifestBase || options.dest)),

	// Raw copy
	copy: options => copy = () => src(options.src)
		.pipe(util.runIf(options.flatten, flatten))
		.pipe(util.runIf(options.revision, rev))
		.pipe(dest(options.dest))
		.pipe(util.updateManifestData(options.manifestBase || options.dest)),

	// HTML
	html: options => html = () => src(options.src)
		.pipe(data(file => ({
			...util.readFile("./data/global.js"),
			...(options.data || {}),
			...util.readFile(util.getTemplateDataPath(file)),
		})))
		.pipe(twig({ base: "views" }))
		.pipe(util.prod(() => htmlMin({
			collapseWhitespace: true,
			removeComments: true,
			minifyCSS: true,
			minifyJS: true,
		})))
		.pipe(dest(options.dest)),
};
