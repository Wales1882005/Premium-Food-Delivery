import https from 'https';
import fs from 'fs';

const mockData = fs.readFileSync('src/data/mockData.ts', 'utf-8');
const urls = mockData.match(/https:\/\/images\.unsplash\.com\/photo-[a-zA-Z0-9-]+/g);

const uniqueUrls = [...new Set(urls)];

async function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({ url, status: res.statusCode });
    }).on('error', () => {
      resolve({ url, status: 'error' });
    });
  });
}

async function main() {
  for (const url of uniqueUrls) {
    const res = await checkUrl(url);
    if (res.status !== 200) {
      console.log(`Failed: ${url} - Status: ${res.status}`);
    }
  }
}

main();
