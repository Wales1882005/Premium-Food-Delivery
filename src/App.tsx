/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ShoppingBag } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { Home } from './components/Home';
import { RestaurantMenu } from './components/RestaurantMenu';
import { CartDrawer } from './components/CartDrawer';
import { Checkout } from './components/Checkout';
import { BottomNav } from './components/BottomNav';
import { Orders } from './components/Orders';
import { Profile } from './components/Profile';
import { AIMatchmaker } from './components/AIMatchmaker';
import { Restaurant, MenuItem, CartItem } from './types';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';

function AppContent() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckout, setIsCheckout] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isMatchmakerOpen, setIsMatchmakerOpen] = useState(false);

  const toggleFavorite = (restaurantId: string) => {
    setFavorites(prev => 
      prev.includes(restaurantId) 
        ? prev.filter(id => id !== restaurantId)
        : [...prev, restaurantId]
    );
    const isFav = !favorites.includes(restaurantId);
    if (isFav) toast.success('Added to favorites!');
  };

  const handleAddToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    toast.success(`Added ${item.name} to cart!`);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + (cart.length > 0 ? 2.99 : 0) + (subtotal * 0.08);

  const handleCheckout = () => {
    setIsCartOpen(false);
    setIsCheckout(true);
  };

  const handleCompleteOrder = () => {
    setCart([]);
    setIsCheckout(false);
    setSelectedRestaurant(null);
    setActiveTab('orders');
    toast.success(`Order placed!`);
  };

  return (
    <div className="min-h-screen bg-background text-white font-sans selection:bg-primary/30">
      <Toaster theme="dark" position="top-center" />
      <AnimatePresence mode="wait">
        {isCheckout ? (
          <Checkout 
            key="checkout"
            onBack={() => setIsCheckout(false)}
            onComplete={handleCompleteOrder}
            total={total}
            cart={cart}
            restaurant={selectedRestaurant}
          />
        ) : selectedRestaurant ? (
          <RestaurantMenu 
            key="menu"
            restaurant={selectedRestaurant}
            onBack={() => setSelectedRestaurant(null)}
            onAddToCart={handleAddToCart}
          />
        ) : (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {activeTab === 'home' && (
              <Home 
                onSelectRestaurant={setSelectedRestaurant} 
                favorites={favorites}
                toggleFavorite={toggleFavorite}
                onOpenMatchmaker={() => setIsMatchmakerOpen(true)}
              />
            )}
            {activeTab === 'search' && <div className="p-6 text-center text-white/50 mt-20">Search functionality coming soon...</div>}
            {activeTab === 'orders' && <Orders />}
            {activeTab === 'profile' && <Profile />}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMatchmakerOpen && (
          <AIMatchmaker 
            onClose={() => setIsMatchmakerOpen(false)}
            onSelectRestaurant={(restaurant, item) => {
              setSelectedRestaurant(restaurant);
              if (item) {
                setTimeout(() => handleAddToCart(item), 500);
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Floating Cart Button */}
      <AnimatePresence>
        {cartItemCount > 0 && !isCheckout && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCartOpen(true)}
            className={`fixed ${selectedRestaurant ? 'bottom-6' : 'bottom-24'} right-6 z-40 bg-primary text-white p-4 rounded-full shadow-2xl shadow-primary/30 flex items-center justify-center gap-2 border border-white/10`}
          >
            <div className="relative">
              <ShoppingBag size={24} />
              <span className="absolute -top-2 -right-2 bg-white text-primary text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-primary">
                {cartItemCount}
              </span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <AnimatePresence>
        {!selectedRestaurant && !isCheckout && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
          >
            <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        updateQuantity={updateQuantity}
        onCheckout={handleCheckout}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
