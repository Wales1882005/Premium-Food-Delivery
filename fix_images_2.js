import fs from 'fs';

let mockData = fs.readFileSync('src/data/mockData.ts', 'utf-8');

// Replace restaurant images
mockData = mockData.replace(/name:\s*'([^']+)',\s*rating:\s*[\d.]+,\s*deliveryTime:\s*'[^']+',\s*deliveryFee:\s*[\d.]+,\s*image:\s*'([^']+)'/g, (match, name, oldImage) => {
  const encodedName = encodeURIComponent(name.toLowerCase() + ' restaurant exterior');
  const newImage = `https://image.pollinations.ai/prompt/${encodedName}?width=800&height=600&nologo=true&seed=42`;
  return match.replace(oldImage, newImage);
});

// Replace category images
mockData = mockData.replace(/\{ name:\s*'([^']+)',\s*icon:\s*'[^']+',\s*image:\s*'([^']+)' \}/g, (match, name, oldImage) => {
  const encodedName = encodeURIComponent(name.toLowerCase() + ' food');
  const newImage = `https://image.pollinations.ai/prompt/${encodedName}?width=800&height=600&nologo=true&seed=42`;
  return match.replace(oldImage, newImage);
});

fs.writeFileSync('src/data/mockData.ts', mockData);

console.log('Done');
