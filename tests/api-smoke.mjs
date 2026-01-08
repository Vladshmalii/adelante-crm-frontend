/* Simple API smoke test. Requires backend running at BACKEND_URL (default http://localhost:8000). */

const BASE = process.env.BACKEND_URL || 'http://localhost:8000';

const tests = [
  { name: 'root', url: `${BASE}/`, expectStatus: 200 },
  { name: 'health', url: `${BASE}/health`, expectStatus: 200 },
  { name: 'api root', url: `${BASE}/api/v1`, expectStatus: 404 }, // can be 404; main check is reachability
];

async function run() {
  let failed = false;
  for (const t of tests) {
    try {
      const res = await fetch(t.url);
      const ok = t.expectStatus ? res.status === t.expectStatus : res.ok;
      console.log(`[API] ${t.name}: ${res.status} ${res.statusText}`);
      if (!ok) {
        failed = true;
      }
    } catch (err) {
      failed = true;
      console.error(`[API] ${t.name}: error`, err.message);
    }
  }
  if (failed) {
    console.error('API smoke failed');
    process.exit(1);
  } else {
    console.log('API smoke passed');
  }
}

run();

