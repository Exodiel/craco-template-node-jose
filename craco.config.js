const path = require('path');
const BUILD_PATH = path.resolve(__dirname, './build');

module.exports = {
    webpack: {
        configure: {
            output: {
                path: BUILD_PATH,
                filename: 'static/js/[name].js',
                chunkFilename: 'static/js/[name].chunk.js',
            },
        },
        optimization: {
            runtimeChunk: false,
            splitChunks: {
              cacheGroups: {
                default: false
              },
              chunks: () => false
            }
          }
    }
};
