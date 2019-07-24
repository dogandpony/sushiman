const { src, dest } = require('gulp');

const fs = require('fs');
const path = require('path');
const through = require('through2');
const upath = require('upath');
const util = require('./util.js');

const manifestPath = path.join(process.cwd(), 'web/static/manifest.json');

let manifest = {};

const rev = () => through.obj(function (chunk, enc, next) {
	const parsedPath = path.parse(chunk.path);

	chunk.originalBase = parsedPath.base;

	parsedPath.base
		= `${parsedPath.name}-${util.createHash(chunk.contents.toString())}${parsedPath.ext}`;

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


/**
 * Updates the URLs of the revisioned assets in the selected files
 *
 * @returns {(function(): *)|*}
 */
const updateRevisionedAssets = filePathsToUpdate => src(filePathsToUpdate, {
	cwd: process.cwd(),
	base: './',
})
	.pipe(through.obj(function (chunk, enc, next) {
		let contents = chunk.contents.toString(enc);

		Object.keys(manifest).forEach(originalFile => {
			contents = contents.replace(originalFile, manifest[originalFile]);
		});

		chunk.contents = Buffer.from(contents, enc);

		this.push(chunk);

		next();
	}))
	.pipe(dest('./'));


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


module.exports = {
	rev,
	readManifest,
	writeManifest,
	updateManifestData,
	updateRevisionedAssets,
};
