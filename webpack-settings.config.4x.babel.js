import path from 'path'
import ExtractTextPlugin from 'extract-text-webpack-plugin'
import webpack from 'webpack'
import webpackConfig from './webpack.config.4x.babel'

module.exports = Object.assign({}, webpackConfig, {
  entry: {
    wpsettings: './public/wp-settings-main', // todo: remove after redesign
    wpupdate: './public/bundle-update-main', // todo: redesign post update?
    wpActivationRedesign: './public/wpActivationRedesign',
    wpUpdateRedesign: './public/wpUpdateRedesign'
  },
  output: {
    path: path.resolve(__dirname, 'visualcomposer/resources/dist/'), // Assets dist path
    publicPath: '.', // Used to generate URL's
    filename: '[name].bundle.js', // Main bundle file
    chunkFilename: '[name].bundle.js',
    jsonpFunction: 'vcvWebpackJsonp4x'
  },
  optimization: {
    minimize: false,
    runtimeChunk: false
    // splitChunks: {
    //   cacheGroups: {
    //     default: false,
    //     vendor: {
    //       chunks: 'initial',
    //       name: 'vendor',
    //       test: 'vendor',
    //       enforce: true
    //     }
    //   }
    // }
  },
  plugins: [
    new ExtractTextPlugin('[name].bundle.css'),
    new webpack.NamedModulesPlugin()
  ]
})
