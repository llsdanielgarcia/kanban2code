import * as esbuild from "esbuild";
import * as fs from 'fs/promises';
import * as path from 'path';

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

async function copyMonacoAssets() {
  const src = path.join(process.cwd(), 'node_modules', 'monaco-editor', 'min', 'vs');
  const dest = path.join(process.cwd(), 'dist', 'monaco', 'vs');

  try {
    await fs.rm(dest, { recursive: true, force: true });
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.cp(src, dest, { recursive: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[build] Skipping Monaco asset copy: ${message}`);
  }
}

const extensionCtx = await esbuild.context({
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  sourcemap: !production,
  minify: production,
  logLevel: 'info',
});

const webviewCtx = await esbuild.context({
  entryPoints: ['src/webview/ui/main.tsx'],
  bundle: true,
  outfile: 'dist/webview.js',
  format: 'iife',
  platform: 'browser',
  sourcemap: !production,
  minify: production,
  logLevel: 'info',
});

if (watch) {
  await copyMonacoAssets();
  await Promise.all([
    extensionCtx.watch(),
    webviewCtx.watch()
  ]);
} else {
  await Promise.all([
    extensionCtx.rebuild(),
    webviewCtx.rebuild()
  ]);
  await copyMonacoAssets();
  await Promise.all([
    extensionCtx.dispose(),
    webviewCtx.dispose()
  ]);
}
