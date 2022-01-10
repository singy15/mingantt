const path = require('path');
// const HtmlWebpackPlugin = require("html-webpack-plugin");
// const HtmlWebpackInlineSourcePlugin = require("html-webpack-inline-source-plugin");

module.exports = {
  entry: {
    'mingantt': './src/js/mingantt.js',
    // 'style': './src/style.css'
  },
  mode: 'development',
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  },
  // plugins: [
  //   new HtmlWebpackPlugin({
  //     template: './src/index.html',
  //     filename: 'metadoc.html',
  //     // chunks: ['morphdoc'],
  //     inject: true,
  //     inlineSource: '.(js)$'
  //   }),
  //   new HtmlWebpackInlineSourcePlugin(HtmlWebpackPlugin)
  // ],
  module: {
    rules: [
      // {
      //   test: /\.ejs$/,
      //   use: ['ejs-compiled-loader']
      // },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },

  devtool: "inline-source-map"
};

