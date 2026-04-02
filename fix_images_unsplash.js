import fs from 'fs';

const imageMap = {
  // Restaurants
  'Sakura Sushi House': 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80',
  'Firewood Pizza Co.': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
  'The Halal Grill': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
  'Green Bowl Vegan': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
  'Smash & Grab Burgers': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
  'Midnight Cravings Desserts': 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80',
  'Sip & Chill Beverages': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&q=80',
  'The Juice Lab': 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&q=80',
  'Boba Bliss': 'https://images.unsplash.com/photo-1558855567-1a341be85b6a?w=800&q=80',
  'Pizza Hut Pavilion KL': 'https://images.unsplash.com/photo-1604381536136-57f99201460c?w=800&q=80',

  // Menu Items - Sakura Sushi
  'Dragon Roll': 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&q=80',
  'Spicy Tuna Crispy Rice': 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80',
  'Matcha Mochi Ice Cream': 'https://images.unsplash.com/photo-1563805042-7684c8a9e9cb?w=800&q=80',

  // Menu Items - Firewood Pizza
  'Truffle Mushroom Pizza': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
  'Spicy Diavola': 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&q=80',
  'Garlic Knots': 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=800&q=80',

  // Menu Items - Halal Grill
  'Mixed Grill Platter': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
  'Classic Hummus & Pita': 'https://images.unsplash.com/photo-1577906096429-f73c2c312435?w=800&q=80',

  // Menu Items - Green Bowl
  'Buddha Bowl': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',

  // Menu Items - Smash & Grab
  'Classic Smash Burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
  'Truffle Parmesan Fries': 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=800&q=80',
  'Spicy Chicken Sandwich': 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800&q=80',

  // Menu Items - Midnight Cravings
  'Molten Chocolate Lava Cake': 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&q=80',
  'Strawberry Cheesecake': 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800&q=80',

  // Menu Items - Sip & Chill
  'Iced Caramel Macchiato': 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&q=80',
  'Tropical Fruit Smoothie': 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=800&q=80',
  'Classic Thai Milk Tea': 'https://images.unsplash.com/photo-1558160074-4d7d8bdf4256?w=800&q=80',

  // Menu Items - The Juice Lab
  'Cold Pressed Green Juice': 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&q=80',
  'Ginger Shot': 'https://images.unsplash.com/photo-1595981267035-7b04d84b4f1c?w=800&q=80',

  // Menu Items - Boba Bliss
  'Brown Sugar Deerioca': 'https://images.unsplash.com/photo-1558855567-1a341be85b6a?w=800&q=80',
  'Taro Milk Tea': 'https://images.unsplash.com/photo-1558855567-1a341be85b6a?w=800&q=80',
  'Passion Fruit Green Tea': 'https://images.unsplash.com/photo-1558855567-1a341be85b6a?w=800&q=80',
  'Strawberry Lychee Fizz': 'https://images.unsplash.com/photo-1558855567-1a341be85b6a?w=800&q=80',
  'Matcha Latte with Boba': 'https://images.unsplash.com/photo-1558855567-1a341be85b6a?w=800&q=80',

  // Menu Items - Pizza Hut
  'Hawaiian Chicken Supreme': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
  'Beef Pepperoni': 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&q=80',
  'BBQ Chicken': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
  'Garlic Bread': 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=800&q=80',
  'Mushroom Soup': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80'
};

let mockData = fs.readFileSync('src/data/mockData.ts', 'utf-8');

// Replace restaurant images
mockData = mockData.replace(/name:\s*'([^']+)',\s*rating:\s*[\d.]+,\s*deliveryTime:\s*'[^']+',\s*deliveryFee:\s*[\d.]+,\s*image:\s*'([^']+)'/g, (match, name, oldImage) => {
  const newImage = imageMap[name] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80';
  return match.replace(oldImage, newImage);
});

// Replace menu item images
mockData = mockData.replace(/name:\s*'([^']+)',\s*description:\s*'[^']*',\s*price:\s*[\d.]+,\s*image:\s*'([^']+)'/g, (match, name, oldImage) => {
  const newImage = imageMap[name] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80';
  return match.replace(oldImage, newImage);
});

fs.writeFileSync('src/data/mockData.ts', mockData);

// Also fix Home.tsx hero image
let homeData = fs.readFileSync('src/components/Home.tsx', 'utf-8');
homeData = homeData.replace(/https:\/\/picsum\.photos\/seed\/[^'"]+/g, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&q=80');
fs.writeFileSync('src/components/Home.tsx', homeData);

// Also fix Profile.tsx category images
let profileData = fs.readFileSync('src/components/Profile.tsx', 'utf-8');
profileData = profileData.replace(/https:\/\/picsum\.photos\/seed\/[^'"]+/g, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80');
fs.writeFileSync('src/components/Profile.tsx', profileData);

// Also fix CartDrawer.tsx fallback image
let cartData = fs.readFileSync('src/components/CartDrawer.tsx', 'utf-8');
cartData = cartData.replace(/https:\/\/picsum\.photos\/seed\/[^'"]+/g, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80');
fs.writeFileSync('src/components/CartDrawer.tsx', cartData);

// Also fix Search.tsx fallback image
let searchData = fs.readFileSync('src/components/Search.tsx', 'utf-8');
searchData = searchData.replace(/https:\/\/picsum\.photos\/seed\/[^'"]+/g, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80');
fs.writeFileSync('src/components/Search.tsx', searchData);

// Also fix RestaurantMenu.tsx fallback image
let menuData = fs.readFileSync('src/components/RestaurantMenu.tsx', 'utf-8');
menuData = menuData.replace(/https:\/\/picsum\.photos\/seed\/[^'"]+/g, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80');
fs.writeFileSync('src/components/RestaurantMenu.tsx', menuData);

console.log('Done');
