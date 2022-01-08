import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/sswr.ts'),
      name: 'sswr',
      fileName: 'sswr',
    },
    rollupOptions: {
      external: ['swrev', 'svelte'],
      output: {
        globals: {
          swrev: 'swrev',
          svelte: 'svelte',
        },
      },
    },
  },
})
