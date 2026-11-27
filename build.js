const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

let rootDir = process.cwd();
if (!fs.existsSync(path.join(rootDir, 'client')) && fs.existsSync(path.join(rootDir, '..', 'client'))) {
  rootDir = path.resolve(rootDir, '..');
}

const clientDir = path.join(rootDir, 'client');
console.log('🚀 Building FitCoach AI frontend in:', clientDir);

execSync('npm install', { cwd: clientDir, stdio: 'inherit' });
execSync('npm run build', { cwd: clientDir, stdio: 'inherit' });

// Ensure dist exists both in client/dist and root dist for any Vercel configuration
const clientDist = path.join(clientDir, 'dist');
const rootDist = path.join(rootDir, 'dist');
if (fs.existsSync(clientDist)) {
  fs.cpSync(clientDist, rootDist, { recursive: true });
  console.log('✅ Build completed successfully and synced to dist/');
}
