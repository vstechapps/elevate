import { build } from 'esbuild';

build({
  entryPoints: ['src/js/index.js'], // Points to your main entry file
  bundle: true,                  // Follows imports to merge files into one
  minify: true,                  // Shrinks variable names and removes whitespace
  outfile: 'docs/elevate.min.js',    // The final single minified file
  sourcemap: true,               // Helps you debug errors back to your original code
}).then(() => {
  console.log('🎉 Production build generated: docs/elevate.min.js');
}).catch(() => process.exit(1));