import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

function getVersion() {
  try {
    return execSync('git describe --tags --always').toString().trim()
  } catch {
    return 'unknown'
  }
}

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

const version = getVersion()

export default defineConfig({
  base: '/habit-tracker/',
  plugins: [react(), injectSwVersion(version)],
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 5173,
    strictPort: !!process.env.PORT,
  },
})
