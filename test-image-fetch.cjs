
const https = require('https');
const fs = require('fs');

const options = {
  hostname: 'exercisedb.p.rapidapi.com',
  path: '/image?exerciseId=0001&resolution=360',
  method: 'GET',
  headers: {
    'x-rapidapi-host': 'exercisedb.p.rapidapi.com',
    'x-rapidapi-key': 'a1ef16478dmshfa2196906761101p1da34ejsn088c64356d48'
  }
};

const req = https.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  
  if (res.statusCode === 200) {
    const file = fs.createWriteStream("test-image.gif");
    res.pipe(file);
    console.log("Image saved to test-image.gif");
  } else {
    res.on('data', (d) => {
      process.stdout.write(d);
    });
  }
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.end();
