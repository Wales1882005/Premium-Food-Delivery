import fs from 'fs';

const categoryMap = {
  'Pizza': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
  'Sushi': 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80',
  'Japanese': 'https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=800&q=80',
  'Seafood': 'https://images.unsplash.com/photo-1615141982883-c7da0e69f5c8?w=800&q=80',
  'Italian': 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&q=80',
  'Comfort Food': 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&q=80',
  'Halal': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
  'Mediterranean': 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=800&q=80',
  'Healthy': 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80',
  'Vegan': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
  'Salads': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
  'Burgers': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
  'American': 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80',
  'Fast Food': 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=800&q=80',
  'Desserts': 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80',
  'Bakery': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
  'Ice Cream': 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=800&q=80'
};

let profileData = fs.readFileSync('src/components/Profile.tsx', 'utf-8');

profileData = profileData.replace(/'([^']+)':\s*'https:\/\/images\.unsplash\.com\/photo-[^']+'/g, (match, name) => {
  const newImage = categoryMap[name] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80';
  return `'${name}': '${newImage}'`;
});

fs.writeFileSync('src/components/Profile.tsx', profileData);
console.log('Done');
