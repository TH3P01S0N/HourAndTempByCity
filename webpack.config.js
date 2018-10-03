

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    //publicPath: '/',
    path: __dirname + '/dist'
  },
  module: {
    rules: [
      {
          use: 'babel-loader',
          test: /\.js$/,
          exclude: /node_modules/
      }
    ]
  }
};