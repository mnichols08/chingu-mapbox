const path = require('path');

module.exports = {
    mode: "development",
    entry: path.resolve(__dirname, './src/index.js'),
    devtool: "source-map",
    resolve: {
        extensions: ['*', '.js', '.jsx']
    },
    output: {
        path: path.resolve(__dirname, './public'),
        filename: 'app.js',
    },
    devServer: {
        contentBase: path.resolve(__dirname, './public'),
        hot: true
    },
};