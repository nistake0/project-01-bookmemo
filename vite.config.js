import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl()],
  base: '/project-01-bookmemo/',
  server: {
    host: true,
    // CI/CD環境でのHTTPS対応
    https: process.env.CI ? false : true,
  },
  test: {
  },
})
