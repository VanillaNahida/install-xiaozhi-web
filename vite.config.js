import { defineConfig } from 'vite'

export default defineConfig({
  base: './', // 设置相对路径
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
})