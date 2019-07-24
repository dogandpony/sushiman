/* ==============================================================================================
 * BROWSERSYNC CONFIG
 *
 * See http://www.browsersync.io/docs/options/ for more options.
 * ============================================================================================== */

module.exports = {
	proxy: "https://wpstarter.dps.test",
	host: "wpstarter.dps.test",
	port: 3000,
	ui: {
		"port": 3001,
	},
	files: [
		"views/**/*",
	],
	logPrefix: "BS",
	open: false,
	injectNotification: false,
	https: {
		key: "~/www/cert/server.key",
		cert: "~/www/cert/server.crt",
	},
};
