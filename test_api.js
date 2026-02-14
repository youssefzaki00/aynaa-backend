const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/v1/sync',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'wekayaa-api-secret-key-2024-change-me' // The correct key from .env
  }
};

const req = http.request(options, (res) => {
  let data = '';

  console.log(`Status Code: ${res.statusCode}`);

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response Body:', data);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(JSON.stringify({
  deviceId: 'test-script-device',
  metadata: { source: 'test-script' }
}));

req.end();
