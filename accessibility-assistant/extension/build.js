const { build } = require('esbuild');
const { copyFileSync, mkdirSync } = require('fs');
const { join } = require('path');

// Define entry points for background, content scripts, and popup
const entryPoints = [
  'src/background/index.ts', 
  'src/content/index.ts',
  'src/popup/index.ts'
];

const isWatch = process.argv.includes('--watch');

// Create dist directory if it doesn't exist
try {
  mkdirSync(join(__dirname, 'dist'));
} catch (err) {
  // Directory already exists
}

// Copy manifest and other static files
try {
  copyFileSync(
    join(__dirname, 'public', 'manifest.json'),
    join(__dirname, 'dist', 'manifest.json')
  );
  console.log('Manifest file copied successfully');
  
  // Copy HTML files if they exist
  try {
    copyFileSync(
      join(__dirname, 'public', 'popup.html'),
      join(__dirname, 'dist', 'popup.html')
    );
    console.log('Popup HTML file copied successfully');
  } catch (err) {
    console.log('No popup HTML file to copy');
  }
  
  // Copy CSS files if they exist
  try {
    copyFileSync(
      join(__dirname, 'public', 'content.css'),
      join(__dirname, 'dist', 'content.css')
    );
    console.log('Content CSS file copied successfully');
  } catch (err) {
    console.log('No content CSS file to copy');
  }
  
  // Copy icons folder
  try {
    mkdirSync(join(__dirname, 'dist', 'icons'));
    ['icon16.png', 'icon48.png', 'icon128.png'].forEach(icon => {
      try {
        copyFileSync(
          join(__dirname, 'public', 'icons', icon),
          join(__dirname, 'dist', 'icons', icon)
        );
        console.log(`Icon ${icon} copied successfully`);
      } catch (err) {
        console.log(`No ${icon} to copy`);
      }
    });
  } catch (err) {
    console.log('Error copying icons:', err);
  }
} catch (err) {
  console.error('Error copying files:', err);
}

// Build configuration
const buildOptions = {
  entryPoints,
  bundle: true,
  outdir: 'dist',
  format: 'esm',
  target: 'es2020',
  sourcemap: true,
  minify: !isWatch,
  define: {
    'process.env.NODE_ENV': isWatch ? '"development"' : '"production"'
  }
};

if (isWatch) {
  // Watch mode
  build({
    ...buildOptions,
    watch: {
      onRebuild(error) {
        if (error) {
          console.error('Build failed:', error);
        } else {
          console.log('Build succeeded');
        }
      }
    }
  }).then(() => {
    console.log('Watching for changes...');
  }).catch(err => {
    console.error('Error during watch mode:', err);
    process.exit(1);
  });
} else {
  // One-time build
  build(buildOptions).then(() => {
    console.log('Build completed successfully');
  }).catch(err => {
    console.error('Build failed:', err);
    process.exit(1);
  });
}