import type { Configuration } from 'webpack';

import { rules } from './webpack.rules';
import { plugins } from './webpack.plugins';

// TypeScript/TSX loader
rules.push({
  test: /\.(ts|tsx)$/,
  exclude: /node_modules/,
  use: [
    {
      loader: 'ts-loader',
      options: {
        transpileOnly: true, // быстрее, но без типовой проверки (используй eslint отдельно)
      },
    },
  ],
});

// CSS loader
rules.push({
  test: /\.css$/,
  use: [
    { loader: 'style-loader' },
    { loader: 'css-loader' },
  ],
});

export const rendererConfig: Configuration = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',

  entry: './src/renderer.tsx',

  devtool: 'cheap-module-source-map', // безопаснее, чем eval (и без unsafe-eval)

  module: {
    rules,
  },

  plugins,

  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
  },
};
