import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import { APP_VERSION } from './src/version.js'

function injectSwVersion(version) {
  return {
    name: 'inject-sw-version',
    closeBundle() {
      const swPath = resolve(__dirname, 'dist/sw.js')
      const content = readFileSync(swPath, 'utf-8')
      writeFileSync(swPath, content.replace('__APP_VERSION__', version))
    },
  }
}

export default defineConfig({
  base: '/habit-tracker/',
  plugins: [react(), injectSwVersion(APP_VERSION)],
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
  },
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 5173,
    strictPort: !!process.env.PORT,
  },
})
