export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  tags: string[]; // e.g., 'Spicy', 'Vegan', 'Halal'
}

export interface Restaurant {
  id: string;
  name: string;
  rating: number;
  deliveryTime: string;
  deliveryFee: number;
  image: string;
  categories: string[];
  menu: MenuItem[];
}

export interface CartItem extends MenuItem {
  quantity: number;
}
