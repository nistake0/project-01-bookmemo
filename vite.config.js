/* eslint-env node */
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'
  const env = loadEnv(mode, process.cwd(), '')

  return {
    // logger.js 等が Jest でも import.meta なしで動くよう、ブラウザビルドで process.env を明示的に埋め込む
    define: {
      'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
      'process.env.VITE_LOG_LEVEL': JSON.stringify(env.VITE_LOG_LEVEL ?? ''),
      'process.env.VITE_DEBUG_LOGS': JSON.stringify(env.VITE_DEBUG_LOGS ?? ''),
    },
    plugins: [react(), basicSsl()],
    base: isProduction ? '/project-01-bookmemo/' : '/',
    server: {
      host: true,
      // CI/CD環境でのHTTPS対応
      https: process.env.CI ? false : true,
    },
    build: {
      // バンドルサイズの最適化
      chunkSizeWarningLimit: 1000, // 警告閾値を1MBに設定
      rollupOptions: {
        output: {
          // コード分割の設定
          manualChunks: {
            // React関連を分離
            'react-vendor': ['react', 'react-dom'],
            // Material-UI関連を分離
            'mui-vendor': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
            // その他のライブラリを分離
            'utils-vendor': ['axios', 'react-router-dom', 'react-swipeable', 'react-swipeable-list'],
          },
        },
      },
    },
    test: {
    },
  }
})
