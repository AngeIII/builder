import path from 'path'
import ExtractTextPlugin from 'extract-text-webpack-plugin'
import VirtualModulePlugin from 'virtual-module-webpack-plugin'
import webpack from 'webpack'

import Collector from './tools/webpack-collector-4x'

module.exports = {
  devtool: 'eval',
  mode: 'development',
  entry: {
    wp: './public/wp-main',
    pe: './public/pe-main',
    front: './public/front-main',
    wpbackendswitch: './public/wpbackend-switch',
    vendor: [
      'jquery',
      'react',
      './oldreact.js',
      'react-dom',
      'create-react-class',
      'classnames',
      'lodash',
      'vc-cake',
      'pako',
      'base-64',
      'babel-runtime/core-js.js',
      'babel-runtime/helpers/createClass.js',
      'babel-runtime/helpers/inherits.js',
      'babel-runtime/helpers/typeof.js',
      'babel-runtime/helpers/possibleConstructorReturn.js',
      'babel-runtime/helpers/classCallCheck.js',
      'babel-runtime/helpers/extends.js',
      'babel-runtime/core-js/symbol.js',
      'babel-runtime/core-js/symbol/iterator.js',
      'babel-runtime/core-js/object/set-prototype-of.js',
      'babel-runtime/core-js/object/get-prototype-of.js',
      'babel-runtime/core-js/object/define-property.js',
      'babel-runtime/core-js/object/create.js',
      'babel-runtime/core-js/object/assign.js',
      'babel-runtime/core-js/object/keys.js'
    ],
    wpPostRebuild: './public/wp-post-rebuild-main'
  },
  output: {
    path: path.resolve(__dirname, 'public/dist/'), // Assets dist path
    publicPath: '.', // Used to generate URL's
    filename: '[name].bundle.js', // Main bundle file
    chunkFilename: '[name].bundle.js',
    jsonpFunction: 'vcvWebpackJsonp4x'
  },
  node: {
    'fs': 'empty'
  },
  optimization: {
    minimize: false,
    runtimeChunk: false,
    splitChunks: {
      cacheGroups: {
        default: false,
        vendor: {
          chunks: 'initial',
          name: 'vendor',
          test: 'vendor',
          enforce: true
        }
      }
    }
  },
  plugins: [
    new Collector({
      wp: {
        modules: [
          'content/modernLayout',
          'wordpressWorkspace'
        ],
        services: [
          'utils',
          'document',
          'wordpress-post-data',
          'cook',
          'sharedAssetsLibrary',
          'elementAssetsLibrary',
          'actions-manager',
          'rules-manager',
          'api',
          'dataProcessor',
          'modernAssetsStorage',
          'stylesManager',
          'wpMyTemplates',
          'hubCategories',
          'hubGroups',
          'hubElements',
          'elementAccessPoint',
          'hubAddons'
        ]
      },
      wpbackend: {
        modules: [
          'content/backendContent',
          'content/modernLayoutBackend',
          'wordpressBackendWorkspace'
        ],
        services: [
          'utils',
          'document',
          'wordpress-post-data',
          'cook',
          'sharedAssetsLibrary',
          'elementAssetsLibrary',
          'time-machine',
          'actions-manager',
          'rules-manager',
          'api',
          'dataProcessor',
          'modernAssetsStorage',
          'stylesManager',
          'wpMyTemplates',
          'hubCategories',
          'hubGroups',
          'hubElements'
        ]
      },
      'wpbackend-switcher': {
        services: [],
        modules: [
          'content/backendSwitcher'
        ]
      }
    }),
    new ExtractTextPlugin('[name].bundle.css'),
    new VirtualModulePlugin({
      moduleName: 'node_modules/react/react.js',
      contents: `module.exports = require('react')`
    }),
    new VirtualModulePlugin({
      moduleName: 'node_modules/babel-runtime/node_modules/core-js/library/modules/web.dom.iterable.js',
      contents: `module.exports = require('core-js/library/modules/web.dom.iterable.js')`
    }),
    new VirtualModulePlugin({
      moduleName: 'node_modules/babel-runtime/node_modules/core-js/library/modules/es6.string.iterator.js',
      contents: `module.exports = require('core-js/library/modules/es6.string.iterator.js')`
    }),
    new VirtualModulePlugin({
      moduleName: 'node_modules/babel-runtime/node_modules/core-js/library/modules/core.is-iterable.js',
      contents: `module.exports = require('core-js/library/modules/core.is-iterable.js')`
    }),
    new webpack.NamedModulesPlugin()
  ],
  module: {
    rules: [
      { parser: { amd: false } },
      {
        test: /\.mjs$/,
        include: /node_modules/,
        type: 'javascript/auto'
      },
      {
        test: /\.js$/,
        use: { loader: 'babel-loader' },
        exclude: /node_modules/
        // exclude: new RegExp('node_modules\\' + path.sep + '(?!postcss-prefix-url)'),
        // query: {
        //   // https://github.com/babel/babel-loader#options
        //   cacheDirectory: true
        // }
      },
      // {
      //   test: /\.js$/,
      //   include: /node_modules/,
      //   loader: StringReplacePlugin.replace({ // from the 'string-replace-webpack-plugin'
      //     replacements: [ {
      //       pattern: /define\.amd/ig,
      //       replacement: function () {
      //         return false
      //       }
      //     } ]
      //   })
      // },
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [ 'css-loader', {
            loader: 'postcss-loader',
            options: {
              plugins: () => [ require('autoprefixer') ]
            }
          } ]
        })
      },
      {
        test: /\.less$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [ 'css-loader', {
            loader: 'postcss-loader',
            options: {
              plugins: () => [ require('autoprefixer') ]
            }
          }, 'less-loader' ]
        })
      },
      // use ! to chain loaders./
      { test: /\.(png|jpe?g|gif)$/, use: 'url-loader?limit=10000&name=/images/[name].[ext]?[hash]' }, // inline base64 URLs for <=8k images, direct URLs for the rest.
      { test: /\.woff(2)?(\?.+)?$/, use: 'url-loader?limit=10000&mimetype=application/font-woff&name=/fonts/[name].[ext]?[hash]' },
      { test: /\.(ttf|eot|svg)(\?.+)?$/, use: 'file-loader?name=/fonts/[name].[ext]?[hash]' },
      { test: /\.raw(\?v=\d+\.\d+\.\d+)?$/, use: 'raw-loader' }
      // { test: /bootstrap\/js\//, loader: 'imports?jQuery=jquery&$=jquery' }
    ]
  },
  resolve: {
    alias: { 'public': path.resolve(__dirname, 'public') }
  }
}
