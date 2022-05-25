const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    port: 8100,
    proxy: {
    '^/api': {
        target: 'http://localhost:8101',
        ws: true,
        changeOrigin: true,
        pathRewrite: {'^/api' : ''}
      },
    },
  }
})
