const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    main: './letterGenerator.js',
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  plugins: [
    // Define the environment variable for the API key
    new webpack.DefinePlugin({
      'process.env.GOOGLE_API_KEY': JSON.stringify(process.env.GOOGLE_API_KEY),
    }),
    // Copy the HTML file and inject the bundled JS
    new HtmlWebpackPlugin({
      template: './index.html',
      filename: 'index.html',
    }),
    // Copy other static assets
    new CopyPlugin({
      patterns: [
        { from: 'styles.css', to: 'styles.css' },
      ],
    }),
  ],
};