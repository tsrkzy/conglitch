import path from 'path';

const entryPoint = path.resolve(__dirname, 'src');
const distribute = path.resolve(__dirname, 'public');

/*
 * ./
 *  |- src
 *  |   |- client.js //-------- entryPoint.jsx
 *  |   |- client
 *  |   |   |- class //---------- webpack targets.js
 *  |   |   |   |- class.js
 *  |   |   |   `- class.js
 *  |   |   `- components //----- webpack targets.jsx
 *  |   |       |- components.jsx
 *  |   |       `- components.jsx
 *  |   `- api        //--------- webpack ignore
 *  |       |- controller
 *  |       |   |- controller1.js
 *  |       |   `- controller2.js
 *  |       `- util.js
 *  |- views
 *  |   `- index.jsx
 *  `- public
 *      `- client.bundle.js  //--------- distribute.js
 */
module.exports = {
  mode: 'development',
  entry: {
    client: `${entryPoint}/client.js`
  },
  output: {
    path: distribute,
    filename: '[name].bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        use: [{
          loader: 'babel-loader',
          options: {
            presets: [
              ['env', { 'modules': false }],
              'react'
            ]
          }
        }],
        exclude: /(node_modules|src\/api)/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(woff|woff2)$/,
        use: {
          loader: 'url-loader',
          options: {
            name: 'fonts/[hash].[ext]',
            limit: 5000,
            mimetype: 'application/font-woff'
          }
        }
      },
      {
        test: /\.(ttf|eot|svg)$/,
        use: {
          loader: 'file-loader',
          options: {
            name: 'fonts/[hash].[ext]'
          }
        }
      },
    ]
  },
  // devtool: 'source-map',
  resolve: {
    extensions: ['.js', '.jsx']
  },
  plugins: []
};
