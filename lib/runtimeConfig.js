const argv = require('minimist')(process.argv.slice(2));

exports.isProduction = argv.env && ['production', 'prod', 'p'].includes(argv.env);
