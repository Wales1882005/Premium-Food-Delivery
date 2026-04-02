import fs from 'fs';

function replaceImagesInFile(filePath) {
  let data = fs.readFileSync(filePath, 'utf-8');
  
  // Replace pollinations.ai URLs with picsum.photos
  data = data.replace(/https:\/\/image\.pollinations\.ai\/prompt\/([^?]+)\?[^'"]+/g, (match, prompt) => {
    const seed = encodeURIComponent(decodeURIComponent(prompt).trim());
    return `https://picsum.photos/seed/${seed}/800/600`;
  });

  fs.writeFileSync(filePath, data);
}

const files = [
  'src/data/mockData.ts',
  'src/components/Profile.tsx',
  'src/components/Search.tsx',
  'src/components/CartDrawer.tsx',
  'src/components/RestaurantMenu.tsx',
  'src/components/Home.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    replaceImagesInFile(file);
    console.log(`Updated ${file}`);
  }
});

console.log('Done');
