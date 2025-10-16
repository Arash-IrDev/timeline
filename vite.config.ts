import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { viteSingleFile } from "vite-plugin-singlefile";
import { babel } from '@rollup/plugin-babel';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isGasMode = mode === 'gas';
  
  return {
    plugins: [
      vue({
        template: {
          compilerOptions: {
            isCustomElement: (tag) => tag.startsWith("svg:style"),
          },
        },
      }),
      babel({
        babelHelpers: 'bundled',
        exclude: ['node_modules/**', '**/*.css'],
        extensions: ['.js', '.ts', '.vue']
      }),
      isGasMode ? null : viteSingleFile(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    build: {
      target: "es2017",
      ...(isGasMode ? {
        lib: {
          entry: "src/main.ts",
          name: "MarkwhenTimeline",
          fileName: "markwhen-timeline",
          formats: ["iife"]
        },
        rollupOptions: {
          output: {
            inlineDynamicImports: true,
            manualChunks: undefined,
            format: "iife",
            name: "MarkwhenTimeline"
          }
        }
      } : {}),
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: false,
          drop_debugger: true
        },
        format: {
          comments: false
        }
      }
    },
    server: {
      port: 6180,
      host: "0.0.0.0",
    },
  };
});
