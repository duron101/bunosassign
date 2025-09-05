import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 8080,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // 后端端口3000
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
    hmr: {
      port: 8080,
      overlay: false,
    },
  },
  // 支持 NeDB 数据库文件和 WebAssembly
  assetsInclude: ['**/*.db', '**/*.wasm'],
  // 优化依赖
  optimizeDeps: {
    exclude: ['nedb'],
  },
  // 构建配置
  build: {
    rollupOptions: {
      external: ['nedb'],
    },
    // 确保数据库文件被正确复制
    assetsInlineLimit: 0,
  },
})