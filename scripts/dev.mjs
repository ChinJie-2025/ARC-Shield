import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';

async function getApiPort() {
  if (process.env.API_PORT) return Number(process.env.API_PORT);
  try {
    const envFile = await readFile('.env', 'utf8');
    const match = envFile.match(/^\s*API_PORT\s*=\s*['"]?([0-9]+)['"]?\s*$/m);
    return Number(match?.[1] || 3002);
  } catch {
    return 3002;
  }
}

async function probeApi(port) {
  try {
    const response = await fetch(`http://localhost:${port}/api/health`, {
      signal: AbortSignal.timeout(1200),
    });
    if (!response.ok) return 'other';
    const body = await response.json();
    if (body.service !== 'ARC-Shield incident service') return 'other';

    // A 400 here is expected: empty text is rejected before Gemini is called.
    // This verifies the route without spending tokens or sending report data.
    const triageResponse = await fetch(`http://localhost:${port}/api/triage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: '', location: '' }),
      signal: AbortSignal.timeout(1200),
    });
    return triageResponse.status === 400 ? 'ready' : 'outdated';
  } catch {
    return 'offline';
  }
}

const port = await getApiPort();
let api = null;
let web = null;
let stopping = false;

function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  if (api) api.kill();
  if (web) web.kill();
  process.exitCode = exitCode;
}

const apiState = await probeApi(port);
if (apiState === 'ready') {
  console.log(`Reusing the ARC-Shield API already running on port ${port}.`);
} else if (apiState === 'outdated') {
  console.error(`An older ARC-Shield API is using port ${port}. Stop that API process, then run npm run dev:all again.`);
  process.exitCode = 1;
  process.exit();
} else if (apiState === 'other') {
  console.error(`Port ${port} is in use by another service. Stop it or choose another API_PORT in .env.`);
  process.exitCode = 1;
  process.exit();
} else {
  api = spawn(process.execPath, ['server.mjs'], { stdio: 'inherit' });
  api.on('error', (error) => {
    console.error(`Could not start the ARC-Shield API: ${error.message}`);
    stop(1);
  });
  api.on('exit', (code) => {
    if (!stopping) {
      console.error(`The ARC-Shield API stopped${code === null ? '' : ` with code ${code}`}.`);
      stop(code || 1);
    }
  });
}

web = spawn(process.execPath, ['node_modules/vite/bin/vite.js'], { stdio: 'inherit' });
web.on('error', (error) => {
  console.error(`Could not start Vite: ${error.message}`);
  stop(1);
});
web.on('exit', (code) => stop(code || 0));

process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
