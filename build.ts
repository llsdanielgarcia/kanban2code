import * as esbuild from "esbuild";

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

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
  await Promise.all([
    extensionCtx.watch(),
    webviewCtx.watch()
  ]);
} else {
  await Promise.all([
    extensionCtx.rebuild(),
    webviewCtx.rebuild()
  ]);
  await Promise.all([
    extensionCtx.dispose(),
    webviewCtx.dispose()
  ]);
}
