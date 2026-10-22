const fs = require('fs');
const http = require('http');

const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
const filePath = 'c:/Users/sibel/OneDrive/storyFlow/story-frontend/public/vite.svg';
const fileData = fs.readFileSync(filePath);

let postData = '--' + boundary + '\r\n';
postData += 'Content-Disposition: form-data; name="cover"; filename="vite.svg"\r\n';
postData += 'Content-Type: image/svg+xml\r\n\r\n';

const endData = '\r\n--' + boundary + '--\r\n';

const options = {
  hostname: '127.0.0.1',
  port: 5000,
  path: '/api/upload/cover',
  method: 'POST',
  headers: {
    'Content-Type': 'multipart/form-data; boundary=' + boundary,
    'Content-Length': Buffer.byteLength(postData) + fileData.length + Buffer.byteLength(endData)
  }
};

const req = http.request(options, (res) => {
  console.log('STATUS:', res.statusCode);
  res.on('data', (chunk) => {
    console.log('BODY:', chunk.toString());
  });
});

req.on('error', (e) => {
  console.error('Request Error:', e);
});

req.write(postData);
req.write(fileData);
req.write(endData);
req.end();
