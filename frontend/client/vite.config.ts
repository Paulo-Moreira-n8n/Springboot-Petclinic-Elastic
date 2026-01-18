
/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Carrega variáveis do .env (somente as que começam com API_SERVER_URL)
  const env = loadEnv(mode, process.cwd(), ['API_SERVER_URL']);
  const apiTarget = env.API_SERVER_URL ?? 'http://localhost:4000';

  return {
    plugins: [react()],
    // ====== Vite (dev/build) ======
    server: {
      port: 3000,
      open: true,
      proxy: {
        '/api':    { target: apiTarget, changeOrigin: true },
        '/images': { target: apiTarget, changeOrigin: true },
        '/config': { target: apiTarget, changeOrigin: true }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    css: {
      preprocessorOptions: {
        less: {
          javascriptEnabled: true
        }
      }
    },
    build: {
      outDir: 'dist',
	  sourcemap: true               // <<< gera *.js.map no dist (produção)
    },

    // ====== Vitest (testes) ======
    test: {
      environment: 'jsdom',       // ambiente de navegador simulado
      globals: true,              // describe/it/expect globais
      setupFiles: './tests/setup.ts',
      include: [
        'tests/**/*.test.ts',
        'tests/**/*.test.tsx',
        'tests/**/*.spec.ts',
        'tests/**/*.spec.tsx'
      ]
    }
  };
});
``
