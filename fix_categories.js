import fs from 'fs';

const categoryMap = {
  'Pizza': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
  'Sushi': 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80',
  'Halal': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
  'Vegan': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
  'Burgers': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
  'Desserts': 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80',
  'Drinks': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&q=80',
  'Boba Tea': 'https://images.unsplash.com/photo-1558855567-1a341be85b6a?w=800&q=80',
  'Fruit Tea': 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=800&q=80',
};

let mockData = fs.readFileSync('src/data/mockData.ts', 'utf-8');

mockData = mockData.replace(/\{ name:\s*'([^']+)',\s*icon:\s*'[^']+',\s*image:\s*'([^']+)' \}/g, (match, name, oldImage) => {
  const newImage = categoryMap[name] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80';
  return match.replace(oldImage, newImage);
});

fs.writeFileSync('src/data/mockData.ts', mockData);
console.log('Done');
