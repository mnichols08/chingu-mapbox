const path = require('path');

module.exports = {
    mode: "development",
    entry: path.resolve(__dirname, './src/index.js'),
    devtool: "source-map",
    module: {
        rules: [
          {
             test: /\.(js|jsx)$/,
             exclude: /node_modules/,
             use: ['babel-loader']
          },
          {
            test: /\.css$/i,
            use: ["style-loader", "css-loader"],
          },
          {
             test: /\.(s(a|c)ss)$/,
             use: ['style-loader','css-loader', 'sass-loader']
          }
        ]
    },
    resolve: {
        extensions: ['*', '.js', '.jsx']
    },
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: 'app.js',
    },
    devServer: {
        contentBase: path.resolve(__dirname, './dist'),
        hot: true
    },
};