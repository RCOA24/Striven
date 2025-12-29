
const https = require('https');

const options = {
  hostname: 'exercisedb.p.rapidapi.com',
  path: '/exercises?limit=1',
  method: 'GET',
  headers: {
    'x-rapidapi-host': 'exercisedb.p.rapidapi.com',
    'x-rapidapi-key': 'a1ef16478dmshfa2196906761101p1da34ejsn088c64356d48'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(data);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.end();
