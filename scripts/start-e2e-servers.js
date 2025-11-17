#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

function spawnProcess(command, args, opts = {}) {
  const p = spawn(command, args, { stdio: 'inherit', shell: true, ...opts });
  p.on('error', (err) => console.error(`Failed to start ${command}:`, err));
  return p;
}

// Start Wrangler dev (Cloudflare Workers) on port 8787
console.log('Starting Wrangler dev (backend) on port 8787...');
const wrangler = spawnProcess('npx', ['wrangler', 'dev', '--local', '--port', '8787']);

// After starting wrangler, wait for it to become ready then seed the local D1 database
setTimeout(() => {
  console.log('Seeding local D1 for E2E tests...');
  const seed = spawnProcess('node', ['backend/scripts/seed-e2e.js']);
  seed.on('exit', (code) => {
    if (code !== 0) {
      console.error('Seeding script exited with code', code);
    } else {
      console.log('Seeding completed.');
    }
  });
}, 3000);

// Build frontend and start preview server
async function buildAndPreview() {
  console.log('Building frontend...');
  const build = spawnProcess('npm', ['run', 'build'], { cwd: path.join(__dirname, '..', 'frontend') });
  await new Promise((res) => build.on('exit', res));

  console.log('Starting frontend preview on port 3000...');
  const preview = spawnProcess('node', ['server.js'], { cwd: path.join(__dirname, '..', 'frontend') });
  return preview;
}

buildAndPreview().catch((err) => {
  console.error('Failed to build or preview frontend:', err);
  process.exit(1);
});

// Ensure child processes are killed on exit
process.on('SIGINT', () => process.exit());
process.on('SIGTERM', () => process.exit());

process.on('exit', () => {
  try { wrangler.kill(); } catch (e) {}
});
