const http = require('http');

const endpoints = [
  '/api/health',
  '/api/admin/analytics',
  '/api/admin/commission-stats',
  '/api/admin/users',
];

function testEndpoint(path) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'GET',
      timeout: 3000,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          path,
          status: res.statusCode,
          ok: res.statusCode < 500,
        });
      });
    });

    req.on('error', () => {
      resolve({
        path,
        status: 'ERROR',
        ok: false,
      });
    });

    req.end();
  });
}

async function main() {
  console.log('Testing Backend Endpoints...\n');
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    console.log(`${result.ok ? '✓' : '✗'} ${result.path}: ${result.status}`);
  }
  console.log('\n✓ All endpoints tested');
  process.exit(0);
}

main();
