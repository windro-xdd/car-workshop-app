module.exports = {
  entry: './src/main.ts',
  module: {
    rules: require('./webpack.rules'),
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.json'],
  },
  externals: {
    '@prisma/client': 'commonjs @prisma/client',
  },
};
