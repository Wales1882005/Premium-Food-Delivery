import fs from 'fs';

let mockData = fs.readFileSync('src/data/mockData.ts', 'utf-8');

// Replace item images
mockData = mockData.replace(/name:\s*'([^']+)',\s*description:\s*'[^']*',\s*price:\s*[\d.]+,\s*image:\s*'([^']+)'/g, (match, name, oldImage) => {
  const encodedName = encodeURIComponent(name.toLowerCase());
  const newImage = `https://image.pollinations.ai/prompt/${encodedName}?width=800&height=600&nologo=true&seed=42`;
  return match.replace(oldImage, newImage);
});

fs.writeFileSync('src/data/mockData.ts', mockData);

let menuData = fs.readFileSync('src/components/RestaurantMenu.tsx', 'utf-8');
menuData = menuData.replace(
  /\(e\.target as HTMLImageElement\)\.src = 'https:\/\/images\.unsplash\.com\/photo-1546069901-ba9599a7e63c\?q=80&w=2080&auto=format&fit=crop';/,
  "(e.target as HTMLImageElement).src = 'https://image.pollinations.ai/prompt/delicious%20food?width=800&height=600&nologo=true&seed=42';"
);
fs.writeFileSync('src/components/RestaurantMenu.tsx', menuData);

console.log('Done');
