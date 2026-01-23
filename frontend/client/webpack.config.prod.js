const path = require('path');
const webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
const port = process.env.PORT || 3000;

var config = {
  devtool: 'source-map',
  entry: './src/main.tsx',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'index.js',
    publicPath: '/'
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('production'),
      }
    }),
    new HtmlWebpackPlugin({
      template: 'src/index.html'
    }),
    new webpack.LoaderOptionsPlugin({
      debug: false,
      options: {
          tslint: {
              emitErrors: true,
              failOnHint: true
          },
          resolve: {}
      }
    })
  ],
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  resolveLoader: {
    modules: [ path.join(__dirname, 'node_modules') ]
  },
  module: {
      rules: [
          {
              enforce: 'pre',
              test: /\.tsx?$/,
              loader: 'tslint-loader',
              include: path.join(__dirname, 'src')
          },
          {
              test: /\.css$/,
              loader: 'style-loader!css-loader'
          },
          {
              test: /\.less$/,
              loader: 'style-loader!css-loader!less-loader',
              include: path.join(__dirname, 'src/styles')
          },
          {
              test: /\.(png|jpg)$/,
              loader: 'url-loader?limit=25000'
          },
          {
              test: /\.(eot|svg|ttf|woff|woff2)$/,
              loader: 'file-loader?name=public/fonts/[name].[ext]'
          },

          {
              test: /\.tsx?$/,
              loader: 'babel-loader!ts-loader',
              include: path.join(__dirname, 'src')
          }
      ]
  }
};




module.exports = config;
