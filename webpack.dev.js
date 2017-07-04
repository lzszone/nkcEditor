const path = require('path');
const webpack = require('webpack');

const config = {
  entry: [
    'babel-polyfill',
    'react-hot-loader/patch',
    './src/app.js'
  ],

  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'bundle.js',
    publicPath: "/",
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          'babel-loader',
        ],
        include: path.resolve(__dirname, './src')
      },
      {
        test: /\.css/,
        use: [
          'style-loader', 'css-loader'
        ]
      },
      {
        test: /\.(png| jpg| svg| gif| woff| woff2| eot| ttf| otf)/,
        use: ['file-loader']
      }
    ]
  },

  plugins: [
    new webpack.HotModuleReplacementPlugin()
  ],
};

module.exports = config;

/**
 * Created by lzszone on 6/21/17.
 */
