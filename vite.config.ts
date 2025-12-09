import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/SolanaTools',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        'hex-base58': resolve(__dirname, 'hex-base58.html'),
        'pda-derivation': resolve(__dirname, 'pda-derivation.html'),
        'ata-derivation': resolve(__dirname, 'ata-derivation.html'),
        'account-viewer': resolve(__dirname, 'account-viewer.html'),
        'account-compare': resolve(__dirname, 'account-compare.html'),
        'core-addresses': resolve(__dirname, 'core-addresses.html'),
        'documentation': resolve(__dirname, 'documentation.html'),
      },
    },
  },
})
