import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { viteSingleFile } from "vite-plugin-singlefile";
import { babel } from '@rollup/plugin-babel';

// Plugin to replace Node.js globals
const replaceNodeGlobalsPlugin = () => {
  return {
    name: 'replace-node-globals',
    transform(code, id) {
      // Only transform source files, not node_modules
      if (id.includes('node_modules')) {
        return null;
      }
      
      if (id.endsWith('.js') || id.endsWith('.ts') || id.endsWith('.vue')) {
        let transformedCode = code;
        
        // Replace Node.js globals with browser-compatible alternatives
        transformedCode = transformedCode
          .replace(/process\.env\.NODE_ENV/g, '"production"')
          .replace(/process\.env/g, '{}')
          .replace(/\bglobal\b/g, 'globalThis')
          .replace(/\bBuffer\b/g, 'undefined')
          .replace(/\b__dirname\b/g, 'undefined')
          .replace(/\b__filename\b/g, 'undefined')
          .replace(/\brequire\b/g, 'undefined')
          .replace(/\bmodule\b/g, 'undefined')
          .replace(/\bexports\b/g, 'undefined');
        
        if (transformedCode !== code) {
          return {
            code: transformedCode,
            map: null
          };
        }
      }
      return null;
    }
  };
};


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
      replaceNodeGlobalsPlugin(),
      isGasMode ? null : viteSingleFile(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    define: {
      // Replace Node.js globals with browser-compatible values
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env': JSON.stringify({}),
      'process': '{}',
      'global': 'globalThis',
      'Buffer': 'undefined',
      '__dirname': 'undefined',
      '__filename': 'undefined',
      'module': 'undefined',
      'exports': 'undefined',
      'require': 'undefined',
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
          },
          external: [],
          // Replace Node.js globals
          plugins: [
            {
              name: 'replace-node-globals',
              generateBundle(options, bundle) {
                for (const fileName in bundle) {
                  const chunk = bundle[fileName];
                  if (chunk.type === 'chunk') {
                    chunk.code = chunk.code
                      .replace(/process\.env\.NODE_ENV/g, '"production"')
                      .replace(/process\.env/g, '{}')
                      .replace(/\bglobal\b/g, 'globalThis');
                  }
                }
              }
            }
          ]
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
        },
        // Don't mangle anything to preserve regex patterns
        mangle: false
      }
    },
    server: {
      port: 6180,
      host: "0.0.0.0",
    },
  };
});
