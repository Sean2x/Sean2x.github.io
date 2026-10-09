import { renameSync } from 'node:fs';
renameSync('dist/index.html', 'dist/explorer.html');
console.log('dist/explorer.html ready');
