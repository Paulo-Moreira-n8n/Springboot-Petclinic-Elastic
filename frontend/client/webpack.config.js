const path = require('path');
const webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
const port = process.env.PORT || 3000;
const api_server_url = process.env.API_SERVER_URL || 'http://localhost:4000';

const entries = [
  'webpack-dev-server/client?http://localhost:' + port,
  'webpack/hot/only-dev-server',
  'react-hot-loader/patch',
  './src/main.tsx'
];

var config = {
  devtool: 'source-map',
  entry: './src/main.tsx',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'index.js',
    publicPath: '/'
  },
  plugins: [
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
   devServer: {
        historyApiFallback: true,
        proxy: {
            '/api': {
                target: api_server_url,
                secure: false
            },
            '/images': {
                target: api_server_url,
                secure: false
            },
            '/config':{
              target: api_server_url,
              secure: false
            }
        }
   },
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
