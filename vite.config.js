import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/habit-tracker/',
  plugins: [react()],
})
