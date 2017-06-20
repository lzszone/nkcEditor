const path = require('path');
const webpack = require('webpack');

const config = {
  entry: ['babel-polyfill', './src/app.js'],
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'nkcEditor.js'
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          'babel-loader?cacheDirectory=true',
        ],
        include: path.resolve(__dirname, './src')
      }
    ]
  },

  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      beautify: false,
      comments: false,
      compress: {
        warnings: false,
        drop_console: false,
        collapse_vars: true,
        reduce_vars: true
      }
    })
  ]
};

module.exports = config;

/**
 * Created by lz on 2017/6/19.
 */
