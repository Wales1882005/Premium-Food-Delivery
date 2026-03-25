import { Restaurant } from '../types';

export const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id: 'r1',
    name: 'Sakura Sushi House',
    rating: 4.8,
    deliveryTime: '25-35 min',
    deliveryFee: 2.99,
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=2070&auto=format&fit=crop',
    categories: ['Sushi', 'Japanese', 'Seafood'],
    priceRange: '$$$',
    popularity: 95,
    menu: [
      {
        id: 'm1',
        name: 'Dragon Roll',
        description: 'Eel, cucumber, topped with avocado and unagi sauce.',
        price: 16.99,
        image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?q=80&w=1925&auto=format&fit=crop',
        category: 'Mains',
        tags: ['Popular']
      },
      {
        id: 'm2',
        name: 'Spicy Tuna Crispy Rice',
        description: 'Crispy sushi rice topped with spicy tuna and jalapeño.',
        price: 12.99,
        image: 'https://images.unsplash.com/photo-1615361200141-f45040f367be?q=80&w=1964&auto=format&fit=crop',
        category: 'Appetizers',
        tags: ['Spicy']
      },
      {
        id: 'm3',
        name: 'Matcha Mochi Ice Cream',
        description: 'Sweet rice dough filled with premium matcha ice cream.',
        price: 6.99,
        image: 'https://images.unsplash.com/photo-1563805042-7684c8a9e9cb?q=80&w=2027&auto=format&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?q=80&w=2070&auto=format&fit=crop',
    categories: ['Pizza', 'Italian', 'Comfort Food'],
    priceRange: '$$',
    popularity: 88,
    menu: [
      {
        id: 'm4',
        name: 'Truffle Mushroom Pizza',
        description: 'White sauce, wild mushrooms, mozzarella, truffle oil.',
        price: 22.99,
        image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=2070&auto=format&fit=crop',
        category: 'Mains',
        tags: ['Vegetarian', 'Popular']
      },
      {
        id: 'm5',
        name: 'Spicy Diavola',
        description: 'San Marzano tomato, fior di latte, spicy salami, chili honey.',
        price: 20.99,
        image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?q=80&w=2080&auto=format&fit=crop',
        category: 'Mains',
        tags: ['Spicy']
      },
      {
        id: 'm6',
        name: 'Garlic Knots',
        description: 'Wood-fired dough knots tossed in garlic herb butter.',
        price: 8.99,
        image: 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?q=80&w=2000&auto=format&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1974&auto=format&fit=crop',
    categories: ['Halal', 'Mediterranean', 'Healthy'],
    priceRange: '$$',
    popularity: 92,
    menu: [
      {
        id: 'm7',
        name: 'Mixed Grill Platter',
        description: 'Chicken shish, lamb kofta, beef kebab over saffron rice.',
        price: 24.99,
        image: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?q=80&w=2000&auto=format&fit=crop',
        category: 'Mains',
        tags: ['Halal', 'Popular']
      },
      {
        id: 'm8',
        name: 'Classic Hummus & Pita',
        description: 'Creamy chickpea dip with olive oil, served with warm pita.',
        price: 7.99,
        image: 'https://images.unsplash.com/photo-1577906096429-f73c2c312435?q=80&w=2070&auto=format&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=2070&auto=format&fit=crop',
    categories: ['Vegan', 'Healthy', 'Salads'],
    priceRange: '$$',
    popularity: 75,
    menu: [
      {
        id: 'm9',
        name: 'Buddha Bowl',
        description: 'Quinoa, roasted sweet potato, kale, avocado, tahini dressing.',
        price: 15.99,
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=2080&auto=format&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1899&auto=format&fit=crop',
    categories: ['Burgers', 'American', 'Fast Food'],
    priceRange: '$',
    popularity: 98,
    menu: [
      {
        id: 'm10',
        name: 'Classic Smash Burger',
        description: 'Double beef patty, american cheese, house sauce, pickles, brioche bun.',
        price: 12.99,
        image: 'https://images.unsplash.com/photo-1594212691516-436f8f6c582f?q=80&w=2000&auto=format&fit=crop',
        category: 'Mains',
        tags: ['Popular']
      },
      {
        id: 'm11',
        name: 'Truffle Parmesan Fries',
        description: 'Crispy shoestring fries tossed in truffle oil and parmesan cheese.',
        price: 6.99,
        image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=2000&auto=format&fit=crop',
        category: 'Sides',
        tags: ['Vegetarian']
      },
      {
        id: 'm12',
        name: 'Spicy Chicken Sandwich',
        description: 'Crispy fried chicken breast, spicy mayo, slaw, brioche bun.',
        price: 13.99,
        image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?q=80&w=2000&auto=format&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=2000&auto=format&fit=crop',
    categories: ['Desserts', 'Bakery', 'Ice Cream'],
    priceRange: '$$',
    popularity: 82,
    menu: [
      {
        id: 'm13',
        name: 'Molten Chocolate Lava Cake',
        description: 'Warm chocolate cake with a gooey center, served with vanilla bean ice cream.',
        price: 9.99,
        image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?q=80&w=2000&auto=format&fit=crop',
        category: 'Cakes',
        tags: ['Popular', 'Vegetarian']
      },
      {
        id: 'm14',
        name: 'Strawberry Cheesecake',
        description: 'Classic New York style cheesecake topped with fresh strawberry compote.',
        price: 8.49,
        image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?q=80&w=2000&auto=format&fit=crop',
        category: 'Cakes',
        tags: ['Vegetarian']
      },
      {
        id: 'm15',
        name: 'Matcha Mochi Ice Cream',
        description: 'Three pieces of premium matcha ice cream wrapped in soft, chewy mochi dough.',
        price: 6.99,
        image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=2000&auto=format&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=1974&auto=format&fit=crop',
    categories: ['Drinks', 'Coffee', 'Smoothies'],
    priceRange: '$',
    popularity: 90,
    menu: [
      {
        id: 'm16',
        name: 'Iced Caramel Macchiato',
        description: 'Freshly pulled espresso with vanilla syrup, milk, and caramel drizzle.',
        price: 5.49,
        image: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?q=80&w=1974&auto=format&fit=crop',
        category: 'Coffee',
        tags: ['Popular']
      },
      {
        id: 'm17',
        name: 'Tropical Fruit Smoothie',
        description: 'Mango, pineapple, and passionfruit blended with coconut water.',
        price: 6.99,
        image: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?q=80&w=2000&auto=format&fit=crop',
        category: 'Smoothies',
        tags: ['Vegan', 'Healthy']
      },
      {
        id: 'm18',
        name: 'Classic Thai Milk Tea',
        description: 'Traditional Thai tea with condensed milk and brown sugar boba.',
        price: 5.99,
        image: 'https://images.unsplash.com/photo-1558857563-b371f30ca6a5?q=80&w=2000&auto=format&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?q=80&w=1974&auto=format&fit=crop',
    categories: ['Drinks', 'Juice', 'Healthy'],
    priceRange: '$$',
    popularity: 78,
    menu: [
      {
        id: 'm19',
        name: 'Cold Pressed Green Juice',
        description: 'Kale, spinach, green apple, cucumber, and lemon.',
        price: 8.99,
        image: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?q=80&w=1974&auto=format&fit=crop',
        category: 'Juice',
        tags: ['Healthy', 'Vegan']
      },
      {
        id: 'm20',
        name: 'Ginger Shot',
        description: 'Pure ginger root with a hint of lemon and cayenne.',
        price: 3.99,
        image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?q=80&w=1974&auto=format&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1525203135335-74d272fc8d9c?q=80&w=2000&auto=format&fit=crop',
    categories: ['Drinks', 'Boba Tea', 'Fruit Tea'],
    priceRange: '$',
    popularity: 96,
    menu: [
      {
        id: 'm21',
        name: 'Brown Sugar Deerioca',
        description: 'Fresh milk with slow-cooked brown sugar pearls and caramelized syrup.',
        price: 6.49,
        image: 'https://images.unsplash.com/photo-1558857563-b371f30ca6a5?q=80&w=2000&auto=format&fit=crop',
        category: 'Boba Tea',
        tags: ['Popular', 'Sweet']
      },
      {
        id: 'm22',
        name: 'Taro Milk Tea',
        description: 'Creamy taro root blended with jasmine green tea and milk.',
        price: 5.99,
        image: 'https://images.unsplash.com/photo-1594631252845-29fc4586c562?q=80&w=2000&auto=format&fit=crop',
        category: 'Boba Tea',
        tags: ['Vegetarian']
      },
      {
        id: 'm23',
        name: 'Passion Fruit Green Tea',
        description: 'Refreshing green tea infused with fresh passion fruit pulp and seeds.',
        price: 5.49,
        image: 'https://images.unsplash.com/photo-1544145945-f904253d0c7b?q=80&w=1974&auto=format&fit=crop',
        category: 'Fruit Tea',
        tags: ['Vegan', 'Refreshing']
      },
      {
        id: 'm24',
        name: 'Strawberry Lychee Fizz',
        description: 'Sparkling green tea with fresh strawberries and lychee jelly.',
        price: 6.25,
        image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=1974&auto=format&fit=crop',
        category: 'Fruit Tea',
        tags: ['Popular', 'Iced']
      },
      {
        id: 'm25',
        name: 'Matcha Latte with Boba',
        description: 'Premium ceremonial grade matcha with creamy milk and honey boba.',
        price: 6.99,
        image: 'https://images.unsplash.com/photo-1515823662273-ad951e6f327c?q=80&w=2000&auto=format&fit=crop',
        category: 'Boba Tea',
        tags: ['Classic']
      }
    ]
  }
];

export const CATEGORIES = [
  { name: 'Pizza', icon: '🍕', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1981&auto=format&fit=crop' },
  { name: 'Sushi', icon: '🍣', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=2070&auto=format&fit=crop' },
  { name: 'Halal', icon: '🥙', image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1974&auto=format&fit=crop' },
  { name: 'Vegan', icon: '🥗', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=2070&auto=format&fit=crop' },
  { name: 'Burgers', icon: '🍔', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1899&auto=format&fit=crop' },
  { name: 'Desserts', icon: '🍰', image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=2000&auto=format&fit=crop' },
  { name: 'Drinks', icon: '🥤', image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=1974&auto=format&fit=crop' },
  { name: 'Boba Tea', icon: '🧋', image: 'https://images.unsplash.com/photo-1558857563-b371f30ca6a5?q=80&w=2000&auto=format&fit=crop' },
  { name: 'Fruit Tea', icon: '🍹', image: 'https://images.unsplash.com/photo-1544145945-f904253d0c7b?q=80&w=1974&auto=format&fit=crop' },
];
