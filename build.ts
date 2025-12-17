import * as fs from 'fs/promises';
import * as path from 'path';
import { spawn } from 'node:child_process';

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');
const debug = process.env.BUILD_DEBUG === '1';

function logDebug(message: string) {
  if (debug) console.log(`[build:debug] ${message}`);
}

async function copyMonacoAssets() {
  const src = path.join(process.cwd(), 'node_modules', 'monaco-editor', 'min', 'vs');
  const dest = path.join(process.cwd(), 'dist', 'monaco', 'vs');

  try {
    logDebug('copyMonacoAssets: rm');
    await fs.rm(dest, { recursive: true, force: true });
    logDebug('copyMonacoAssets: mkdir');
    await fs.mkdir(path.dirname(dest), { recursive: true });
    logDebug('copyMonacoAssets: cp');
    await fs.cp(src, dest, { recursive: true });
    logDebug('copyMonacoAssets: done');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[build] Skipping Monaco asset copy: ${message}`);
  }
}

function runEsbuild(args: string[]): Promise<void> {
  const esbuildBin = path.join(
    process.cwd(),
    'node_modules',
    '@esbuild',
    'linux-x64',
    'bin',
    'esbuild',
  );

  return new Promise((resolve, reject) => {
    logDebug(`esbuild ${args.join(' ')}`);
    const child = spawn(esbuildBin, args, { stdio: 'inherit' });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`esbuild exited with code ${code ?? 'unknown'}`));
    });
  });
}

const commonArgs: string[] = [];
if (!production) commonArgs.push('--sourcemap');
if (production) commonArgs.push('--minify');

const extensionArgs = [
  'src/extension.ts',
  '--bundle',
  '--platform=node',
  '--format=cjs',
  '--external:vscode',
  '--outfile=dist/extension.js',
  ...commonArgs,
  ...(watch ? ['--watch'] : []),
];

const webviewArgs = [
  'src/webview/ui/main.tsx',
  '--bundle',
  '--platform=browser',
  '--format=iife',
  '--outfile=dist/webview.js',
  ...commonArgs,
  ...(watch ? ['--watch'] : []),
];

if (watch) {
  logDebug('watch mode');
  await copyMonacoAssets();
  await Promise.all([
    runEsbuild(extensionArgs),
    runEsbuild(webviewArgs),
  ]);
} else {
  logDebug('build start');
  await Promise.all([
    runEsbuild(extensionArgs),
    runEsbuild(webviewArgs),
  ]);
  logDebug('build done');
  await copyMonacoAssets();
}

