import { Restaurant } from '../types';

export const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id: 'r1',
    name: 'Sakura Sushi House',
    rating: 4.8,
    deliveryTime: '25-35 min',
    deliveryFee: 2.99,
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80',
    categories: ['Sushi', 'Japanese', 'Seafood'],
    address: 'Bukit Bintang, Kuala Lumpur, Malaysia',
    lat: 3.1466,
    lng: 101.7111,
    priceRange: '$$$',
    popularity: 95,
    menu: [
      {
        id: 'm1',
        name: 'Dragon Roll',
        description: 'Eel, cucumber, topped with avocado and unagi sauce.',
        price: 16.99,
        image: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=800&q=80',
        category: 'Mains',
        tags: ['Popular']
      },
      {
        id: 'm2',
        name: 'Spicy Tuna Crispy Rice',
        description: 'Crispy sushi rice topped with spicy tuna and jalapeño.',
        price: 12.99,
        image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80',
        category: 'Appetizers',
        tags: ['Spicy']
      },
      {
        id: 'm3',
        name: 'Matcha Mochi Ice Cream',
        description: 'Sweet rice dough filled with premium matcha ice cream.',
        price: 6.99,
        image: 'https://images.unsplash.com/photo-1582733315328-8441992128a1?w=800&q=80',
        category: 'Desserts',
        tags: ['Vegetarian']
      }
    ]
  },
  {
    id: 'r2',
    name: 'Firewood Pizza Co.',
    rating: 4.6,
    deliveryTime: '30-45 min',
    deliveryFee: 1.99,
    image: 'https://ordermeal.blob.core.windows.net/omc/media/restaurant/headers/ad0cfbb0-ca23-41b6-bc12-649090c23093.jpg',
    categories: ['Pizza', 'Italian', 'Comfort Food'],
    address: 'Bangsar, Kuala Lumpur, Malaysia',
    lat: 3.1292,
    lng: 101.6783,
    priceRange: '$$',
    popularity: 88,
    menu: [
      {
        id: 'm4',
        name: 'Truffle Mushroom Pizza',
        description: 'White sauce, wild mushrooms, mozzarella, truffle oil.',
        price: 22.99,
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
        category: 'Mains',
        tags: ['Vegetarian', 'Popular']
      },
      {
        id: 'm5',
        name: 'Spicy Diavola',
        description: 'San Marzano tomato, fior di latte, spicy salami, chili honey.',
        price: 20.99,
        image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&q=80',
        category: 'Mains',
        tags: ['Spicy']
      },
      {
        id: 'm6',
        name: 'Garlic Knots',
        description: 'Wood-fired dough knots tossed in garlic herb butter.',
        price: 8.99,
        image: 'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=800&q=80',
        category: 'Appetizers',
        tags: ['Vegetarian']
      }
    ]
  },
  {
    id: 'r3',
    name: 'The Halal Grill',
    rating: 4.9,
    deliveryTime: '20-30 min',
    deliveryFee: 0.00,
    image: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=800&q=80',
    categories: ['Halal', 'Mediterranean', 'Healthy'],
    address: 'TTDI, Kuala Lumpur, Malaysia',
    lat: 3.1412,
    lng: 101.6295,
    priceRange: '$$',
    popularity: 92,
    menu: [
      {
        id: 'm7',
        name: 'Mixed Grill Platter',
        description: 'Chicken shish, lamb kofta, beef kebab over saffron rice.',
        price: 24.99,
        image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
        category: 'Mains',
        tags: ['Halal', 'Popular']
      },
      {
        id: 'm8',
        name: 'Classic Hummus & Pita',
        description: 'Creamy chickpea dip with olive oil, served with warm pita.',
        price: 7.99,
        image: 'https://images.unsplash.com/photo-1577906096429-f73c2c312435?w=800&q=80',
        category: 'Appetizers',
        tags: ['Vegan', 'Halal']
      }
    ]
  },
  {
    id: 'r4',
    name: 'Green Bowl Vegan',
    rating: 4.7,
    deliveryTime: '15-25 min',
    deliveryFee: 3.99,
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
    categories: ['Vegan', 'Healthy', 'Salads'],
    address: 'Mont Kiara, Kuala Lumpur, Malaysia',
    lat: 3.1673,
    lng: 101.6521,
    priceRange: '$$',
    popularity: 75,
    menu: [
      {
        id: 'm9',
        name: 'Buddha Bowl',
        description: 'Quinoa, roasted sweet potato, kale, avocado, tahini dressing.',
        price: 15.99,
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
        category: 'Mains',
        tags: ['Vegan', 'Gluten-Free']
      }
    ]
  },
  {
    id: 'r5',
    name: 'Smash & Grab Burgers',
    rating: 4.6,
    deliveryTime: '20-35 min',
    deliveryFee: 1.99,
    image: 'https://images.unsplash.com/photo-1606131731446-5568d87113aa?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8QnVyZ2Vyc3xlbnwwfHwwfHx8MA%3D%3D',
    categories: ['Burgers', 'American', 'Fast Food'],
    address: 'Petaling Jaya, Selangor, Malaysia',
    lat: 3.1073,
    lng: 101.6067,
    priceRange: '$',
    popularity: 98,
    menu: [
      {
        id: 'm10',
        name: 'Classic Smash Burger',
        description: 'Double beef patty, american cheese, house sauce, pickles, brioche bun.',
        price: 12.99,
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
        category: 'Mains',
        tags: ['Popular']
      },
      {
        id: 'm11',
        name: 'Truffle Parmesan Fries',
        description: 'Crispy shoestring fries tossed in truffle oil and parmesan cheese.',
        price: 6.99,
        image: 'https://images.unsplash.com/photo-1647591545909-91f064148630?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8VHJ1ZmZsZSUyMFBhcm1lc2FuJTIwRnJpZXN8ZW58MHx8MHx8fDA%3D',
        category: 'Sides',
        tags: ['Vegetarian']
      },
      {
        id: 'm12',
        name: 'Spicy Chicken Sandwich',
        description: 'Crispy fried chicken breast, spicy mayo, slaw, brioche bun.',
        price: 13.99,
        image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800&q=80',
        category: 'Mains',
        tags: ['Spicy']
      }
    ]
  },
  {
    id: 'r6',
    name: 'Midnight Cravings Desserts',
    rating: 4.9,
    deliveryTime: '15-25 min',
    deliveryFee: 2.49,
    image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80',
    categories: ['Desserts', 'Bakery', 'Ice Cream'],
    address: 'Subang Jaya, Selangor, Malaysia',
    lat: 3.0567,
    lng: 101.5851,
    priceRange: '$$',
    popularity: 82,
    menu: [
      {
        id: 'm13',
        name: 'Molten Chocolate Lava Cake',
        description: 'Warm chocolate cake with a gooey center, served with vanilla bean ice cream.',
        price: 9.99,
        image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&q=80',
        category: 'Cakes',
        tags: ['Popular', 'Vegetarian']
      },
      {
        id: 'm14',
        name: 'Strawberry Cheesecake',
        description: 'Classic New York style cheesecake topped with fresh strawberry compote.',
        price: 8.49,
        image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800&q=80',
        category: 'Cakes',
        tags: ['Vegetarian']
      },
      {
        id: 'm15',
        name: 'Matcha Mochi Ice Cream',
        description: 'Three pieces of premium matcha ice cream wrapped in soft, chewy mochi dough.',
        price: 6.99,
        image: 'https://images.unsplash.com/photo-1582733315328-8441992128a1?w=800&q=80',
        category: 'Ice Cream',
        tags: ['Vegetarian', 'Gluten-Free']
      }
    ]
  },
  {
    id: 'r7',
    name: 'Sip & Chill Beverages',
    rating: 4.7,
    deliveryTime: '10-20 min',
    deliveryFee: 1.49,
    image: 'https://images.unsplash.com/photo-1767065703068-3cbb9eefff1f?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8U2lwJTIwJTI2JTIwQ2hpbGwlMjBCZXZlcmFnZXN8ZW58MHx8MHx8fDA%3D',
    categories: ['Drinks', 'Coffee', 'Smoothies'],
    address: 'Cheras, Kuala Lumpur, Malaysia',
    lat: 3.1033,
    lng: 101.7322,
    priceRange: '$',
    popularity: 90,
    menu: [
      {
        id: 'm16',
        name: 'Iced Caramel Macchiato',
        description: 'Freshly pulled espresso with vanilla syrup, milk, and caramel drizzle.',
        price: 5.49,
        image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&q=80',
        category: 'Coffee',
        tags: ['Popular']
      },
      {
        id: 'm17',
        name: 'Tropical Fruit Smoothie',
        description: 'Mango, pineapple, and passionfruit blended with coconut water.',
        price: 6.99,
        image: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=800&q=80',
        category: 'Smoothies',
        tags: ['Vegan', 'Healthy']
      },
      {
        id: 'm18',
        name: 'Classic Thai Milk Tea',
        description: 'Traditional Thai tea with condensed milk and brown sugar boba.',
        price: 5.99,
        image: 'https://images.unsplash.com/photo-1594631252845-29fc45865157?w=800&q=80',
        category: 'Tea',
        tags: ['Popular']
      }
    ]
  },
  {
    id: 'r8',
    name: 'The Juice Lab',
    rating: 4.8,
    deliveryTime: '15-25 min',
    deliveryFee: 2.00,
    image: 'https://images.unsplash.com/photo-1618379400384-a6dd2e1e0979?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjZ8fFRoZSUyMEp1aWNlJTIwTGFifGVufDB8fDB8fHww',
    categories: ['Drinks', 'Juice', 'Healthy'],
    address: 'Sri Hartamas, Kuala Lumpur, Malaysia',
    lat: 3.1611,
    lng: 101.6500,
    priceRange: '$$',
    popularity: 78,
    menu: [
      {
        id: 'm19',
        name: 'Cold Pressed Green Juice',
        description: 'Kale, spinach, green apple, cucumber, and lemon.',
        price: 8.99,
        image: 'https://plus.unsplash.com/premium_photo-1701886274689-859a9c223c8a?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8Q29sZCUyMFByZXNzZWQlMjBHcmVlbiUyMEp1aWNlfGVufDB8fDB8fHww',
        category: 'Juice',
        tags: ['Healthy', 'Vegan']
      },
      {
        id: 'm20',
        name: 'Ginger Shot',
        description: 'Pure ginger root with a hint of lemon and cayenne.',
        price: 3.99,
        image: 'https://plus.unsplash.com/premium_photo-1708985665217-edf6f05dd828?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        category: 'Shots',
        tags: ['Healthy']
      }
    ]
  },
  {
    id: 'r9',
    name: 'Boba Bliss',
    rating: 4.9,
    deliveryTime: '20-30 min',
    deliveryFee: 1.99,
    image: 'https://static.wixstatic.com/media/418ed8_f35a1396cd2d4a709d0daaa7942a9ab9~mv2_d_3570_2677_s_4_2.jpg/v1/fit/w_2500,h_1330,al_c/418ed8_f35a1396cd2d4a709d0daaa7942a9ab9~mv2_d_3570_2677_s_4_2.jpg',
    categories: ['Drinks', 'Boba Tea', 'Fruit Tea'],
    address: 'SS15, Subang Jaya, Malaysia',
    lat: 3.0760,
    lng: 101.5898,
    priceRange: '$',
    popularity: 96,
    menu: [
      {
        id: 'm21',
        name: 'Brown Sugar Deerioca',
        description: 'Fresh milk with slow-cooked brown sugar pearls and caramelized syrup.',
        price: 6.49,
        image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQcM2e6huPgOtgsnN9sCZkEwk4165lg8Eg_-g&s',
        category: 'Boba Tea',
        tags: ['Popular', 'Sweet']
      },
      {
        id: 'm22',
        name: 'Taro Milk Tea',
        description: 'Creamy taro root blended with jasmine green tea and milk.',
        price: 5.99,
        image: 'https://hungryinthailand.com/wp-content/uploads/2025/03/taro-milk-tea-boba.webp',
        category: 'Boba Tea',
        tags: ['Vegetarian']
      },
      {
        id: 'm23',
        name: 'Passion Fruit Green Tea',
        description: 'Refreshing green tea infused with fresh passion fruit pulp and seeds.',
        price: 5.49,
        image: 'https://images.unsplash.com/photo-1571161473325-1594dece4499?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fFBhc3Npb24lMjBGcnVpdCUyMEdyZWVuJTIwVGVhfGVufDB8fDB8fHww',
        category: 'Fruit Tea',
        tags: ['Vegan', 'Refreshing']
      },
      {
        id: 'm24',
        name: 'Strawberry Lychee Fizz',
        description: 'Sparkling green tea with fresh strawberries and lychee jelly.',
        price: 6.25,
        image: 'https://images.unsplash.com/photo-1603471431201-a526d16e4569?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        category: 'Fruit Tea',
        tags: ['Popular', 'Iced']
      },
      {
        id: 'm25',
        name: 'Matcha Latte with Boba',
        description: 'Premium ceremonial grade matcha with creamy milk and honey boba.',
        price: 6.99,
        image: 'https://lizzylovesfood.com/wp-content/uploads/2024/05/Matcha-Bubble-Tea-from-Taiwan-18.jpg',
        category: 'Boba Tea',
        tags: ['Classic']
      }
    ]
  },
  {
    id: 'r10',
    name: 'Pizza Hut Pavilion KL',
    rating: 4.5,
    deliveryTime: '30-45 min',
    deliveryFee: 3.50,
    image: 'https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=800&q=80',
    categories: ['Pizza', 'Fast Food', 'Italian'],
    address: 'Pavilion Kuala Lumpur, 168, Jln Bukit Bintang, Bukit Bintang, 55100 Kuala Lumpur, Malaysia',
    lat: 3.1484,
    lng: 101.7134,
    priceRange: '$$',
    popularity: 99,
    menu: [
      {
        id: 'm26',
        name: 'Hawaiian Chicken Supreme',
        description: 'Chicken meat, chicken salami, pineapples, mozzarella cheese and signature tomato sauce.',
        price: 28.90,
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
        category: 'Pizza',
        tags: ['Popular', 'Halal']
      },
      {
        id: 'm27',
        name: 'Beef Pepperoni',
        description: 'Beef pepperoni, mozzarella cheese and signature tomato sauce.',
        price: 26.90,
        image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&q=80',
        category: 'Pizza',
        tags: ['Halal']
      },
      {
        id: 'm28',
        name: 'Garlic Bread',
        description: '4 pieces of freshly baked garlic bread.',
        price: 6.90,
        image: 'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=800&q=80',
        category: 'Sides',
        tags: ['Vegetarian']
      }
    ]
  }
];

export const CATEGORIES = [
  { name: 'Pizza', icon: '🍕', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80' },
  { name: 'Sushi', icon: '🍣', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80' },
  { name: 'Halal', icon: '🥙', image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80' },
  { name: 'Vegan', icon: '🥗', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80' },
  { name: 'Burgers', icon: '🍔', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80' },
  { name: 'Desserts', icon: '🍰', image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80' },
  { name: 'Drinks', icon: '🥤', image: 'https://whitekitchenredwine.com/wp-content/uploads/2022/07/StrawberryBobaTe3a-11-min-scaled.jpg' },
  { name: 'Boba Tea', icon: '🧋', image: 'https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcRb3LnxlC2f660OoPcJsJxVOZzAWQ-XbavTG4S4xcXJr5ByfaYXQtSiVN3wJtMzo3fdLOlcgeB4q1c2GhMBXrvdplSHYTxM636h9VSdrYxX9Sxuj-SHp81rPY3hOiHjcBE7SikUTpA_QA&usqp=CAc' },
  { name: 'Fruit Tea', icon: '🍹', image: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=800&q=80' },
];
