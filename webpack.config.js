const path = require('path');

module.exports = {
	mode: "development",
	entry: {
		index:'./src/index.js',
		up:'./src/up.js'
	},
	output: {
		filename: '[name].js',
		path: path.resolve(__dirname, 'dist'),
	},
};