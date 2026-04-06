export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  tags: string[]; // e.g., 'Spicy', 'Vegan', 'Halal'
  imagePrompt?: string;
}

export interface Promotion {
  id: string;
  restaurantId: string;
  restaurantName: string;
  type: 'bogo' | 'discount' | 'fixed';
  code: string;
  description: string;
  value?: number; // e.g. 20 for 20%
  isActive: boolean;
  createdAt: any;
}

export interface Restaurant {
  id: string;
  ownerId?: string;
  name: string;
  description?: string;
  rating: number;
  deliveryTime: string;
  deliveryFee: number;
  image: string;
  categories: string[];
  menu: MenuItem[];
  priceRange: '$' | '$$' | '$$$' | '$$$$';
  currencySymbol?: string;
  popularity?: number; // 0-100 score for "Mostly Ordered"
  isActive?: boolean;
  promotions?: Promotion[];
  createdAt?: any;
  // Location fields for Google Maps integration
  address?: string;
  lat?: number;
  lng?: number;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'preparing' 
  | 'ready_for_pickup' 
  | 'picked_up'
  | 'on_the_way'
  | 'delivered' 
  | 'cancelled';

export type PaymentMethod = 'card' | 'wallet' | 'cod';

export interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

export interface OrderData {
  id: string;
  restaurantName: string;
  restaurantId?: string;
  restaurantOwnerId?: string;
  total: number;
  status: string;
  createdAt: any;
  items: string; // JSON string of OrderItem[]
  userId?: string;
  deliveryAddress?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  restaurantLat?: number;
  restaurantLng?: number;
  estimatedDeliveryTime?: any;
}

export interface Order {
  id: string;
  userId: string;
  restaurantId: string;
  restaurantOwnerId?: string;
  restaurantName: string;
  items: CartItem[];
  total: number;
  subtotal?: number;
  deliveryFee?: number;
  serviceFee?: number;
  paymentMethod?: PaymentMethod;
  status: OrderStatus;
  createdAt: any;
  deliveryAddress: string;
  deliveryLat?: number;
  deliveryLng?: number;
  estimatedDeliveryTime?: any;
}
