const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const isWatch = process.argv.includes('--watch');
const isMinify = process.argv.includes('--minify');

// Ensure dist directory exists
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist', { recursive: true });
}

// Ensure media directory exists
if (!fs.existsSync('media')) {
  fs.mkdirSync('media', { recursive: true });
}

// Copy styles.css and katex assets
function copyAssets() {
  // 1. Copy webview styles
  fs.copyFileSync(
    path.join(__dirname, 'src', 'webview', 'styles.css'),
    path.join(__dirname, 'dist', 'webview.css')
  );

  // 2. Copy KaTeX CSS
  const katexCssSrc = path.join(__dirname, 'node_modules', 'katex', 'dist', 'katex.min.css');
  if (fs.existsSync(katexCssSrc)) {
    fs.copyFileSync(katexCssSrc, path.join(__dirname, 'dist', 'katex.min.css'));
    console.log('Copied KaTeX CSS -> dist/katex.min.css');
  }

  // 3. Copy KaTeX fonts directory
  const katexFontsSrc = path.join(__dirname, 'node_modules', 'katex', 'dist', 'fonts');
  const distFonts = path.join(__dirname, 'dist', 'fonts');
  if (fs.existsSync(katexFontsSrc)) {
    if (!fs.existsSync(distFonts)) {
      fs.mkdirSync(distFonts, { recursive: true });
    }
    fs.cpSync(katexFontsSrc, distFonts, { recursive: true });
    console.log('Copied KaTeX fonts -> dist/fonts');
  }
}

copyAssets();

async function runBuild() {
  // 1. Build Extension Host (Node.js)
  const extensionCtx = await esbuild.context({
    entryPoints: ['src/extension.ts'],
    bundle: true,
    outfile: 'dist/extension.js',
    external: ['vscode'],
    format: 'cjs',
    platform: 'node',
    target: 'node20',
    sourcemap: !isMinify,
    minify: isMinify
  });

  // 2. Build Webview (Browser)
  const webviewCtx = await esbuild.context({
    entryPoints: ['src/webview/webview.ts'],
    bundle: true,
    outfile: 'dist/webview.js',
    format: 'iife',
    platform: 'browser',
    target: 'es2020',
    sourcemap: !isMinify,
    minify: isMinify
  });

  if (isWatch) {
    await extensionCtx.watch();
    await webviewCtx.watch();
    console.log('Watching for changes...');
  } else {
    await extensionCtx.rebuild();
    await webviewCtx.rebuild();
    await extensionCtx.dispose();
    await webviewCtx.dispose();
    console.log('Build completed successfully!');
  }
}

runBuild().catch((e) => {
  console.error(e);
  process.exit(1);
});
