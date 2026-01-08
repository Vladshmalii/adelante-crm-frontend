/* Simple frontend smoke test. Requires frontend running at FRONTEND_URL (default http://localhost:3000). */

const FRONT = process.env.FRONTEND_URL || 'http://localhost:3000';

async function check(url) {
  const res = await fetch(url);
  console.log(`[FE] ${url}: ${res.status} ${res.statusText}`);
  if (!res.ok) throw new Error(`Status ${res.status}`);
}

async function run() {
  try {
    await check(FRONT);
    console.log('Frontend smoke passed');
  } catch (err) {
    console.error('Frontend smoke failed:', err.message);
    process.exit(1);
  }
}

run();

