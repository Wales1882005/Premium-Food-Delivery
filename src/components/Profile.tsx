import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Star, Gift, ChevronRight, Settings, LogOut, Heart, LogIn, ArrowLeft, Clock, Bell, CreditCard, Shield, X, Receipt, Database, Code, ExternalLink, Mail, Lock, UserPlus, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { Restaurant } from '../types';
import { MOCK_RESTAURANTS } from '../data/mockData';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { supabase } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { User as FirebaseUser } from 'firebase/auth';

interface ProfileProps {
  favorites: string[];
  toggleFavorite: (id: string) => void;
  onSelectRestaurant: (restaurant: Restaurant) => void;
  onOpenSuggestion?: () => void;
}

interface PaymentMethod {
  id: string;
  type: 'visa' | 'mastercard' | 'apple';
  last4: string;
  expiry: string;
  isDefault: boolean;
}

export function Profile({ favorites, toggleFavorite, onSelectRestaurant, onOpenSuggestion }: ProfileProps) {
  const { user, authType, cravePoints, login, loginWithEmail, signUpWithEmail, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<'main' | 'saved' | 'promos' | 'settings' | 'payments' | 'privacy' | 'orders' | 'supabase' | 'suggestions'>('main');
  const [authMode, setAuthMode] = useState<'google' | 'email' | 'signup'>('google');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCard, setNewCard] = useState({ number: '', expiry: '', cvv: '', type: 'visa' as PaymentMethod['type'] });
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { id: '1', type: 'visa', last4: '4242', expiry: '12/25', isDefault: true },
    { id: '2', type: 'mastercard', last4: '8888', expiry: '09/24', isDefault: false }
  ]);
  const [privacySettings, setPrivacySettings] = useState({
    locationAccess: true,
    dataSharing: false,
    personalizedAds: true,
    twoFactor: false
  });
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  
  const pointsToNextReward = 500;
  const progress = Math.min((cravePoints / pointsToNextReward) * 100, 100);

  const mostOrderedCategory = useMemo(() => {
    if (orders.length === 0) return 'Pizza';
    const categories: Record<string, number> = {};
    orders.forEach(order => {
      const restaurant = MOCK_RESTAURANTS.find(r => r.name === order.restaurantName);
      if (restaurant) {
        restaurant.categories.forEach(cat => {
          categories[cat] = (categories[cat] || 0) + 1;
        });
      }
    });
    return Object.entries(categories).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Pizza';
  }, [orders]);

  const categoryBackgrounds: Record<string, string> = {
    'Pizza': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=2070&auto=format&fit=crop',
    'Sushi': 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=2070&auto=format&fit=crop',
    'Japanese': 'https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?q=80&w=1974&auto=format&fit=crop',
    'Seafood': 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=2070&auto=format&fit=crop',
    'Italian': 'https://images.unsplash.com/photo-1498579150354-977475b7ea0b?q=80&w=2070&auto=format&fit=crop',
    'Comfort Food': 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1965&auto=format&fit=crop',
    'Halal': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1974&auto=format&fit=crop',
    'Mediterranean': 'https://images.unsplash.com/photo-1544124499-58912cbddaad?q=80&w=2070&auto=format&fit=crop',
    'Healthy': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=2070&auto=format&fit=crop',
    'Vegan': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=2070&auto=format&fit=crop',
    'Salads': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=2070&auto=format&fit=crop',
    'Burgers': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1899&auto=format&fit=crop',
    'American': 'https://images.unsplash.com/photo-1594212691516-436f8f6c582f?q=80&w=2000&auto=format&fit=crop',
    'Fast Food': 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?q=80&w=2070&auto=format&fit=crop',
    'Desserts': 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=2000&auto=format&fit=crop',
    'Bakery': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=2072&auto=format&fit=crop',
    'Ice Cream': 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?q=80&w=2070&auto=format&fit=crop'
  };

  const profileBg = categoryBackgrounds[mostOrderedCategory] || categoryBackgrounds['Pizza'];

  if (!user) {
    return (
      <div className="pb-24 pt-8 px-6 max-w-5xl mx-auto space-y-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center mb-4 border border-white/10">
          <User size={40} className="text-white/40" />
        </div>
        <h1 className="text-3xl font-bold text-center">Sign in to Crave</h1>
        <p className="text-white/60 text-center max-w-md">
          Save your favorite restaurants, track your orders, and earn Crave Points for free meals!
        </p>

        <div className="w-full max-w-sm space-y-4 mt-4">
          {authMode === 'google' ? (
            <div className="space-y-4">
              <button 
                onClick={login}
                className="w-full bg-primary text-white font-bold py-4 px-8 rounded-2xl flex items-center justify-center gap-3 hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
              >
                <LogIn size={20} />
                Continue with Google
              </button>
              <button 
                onClick={() => setAuthMode('email')}
                className="w-full bg-white/5 text-white font-bold py-4 px-8 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all border border-white/10"
              >
                <Mail size={20} />
                Family Login (Email)
              </button>
            </div>
          ) : authMode === 'email' ? (
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                setIsAuthLoading(true);
                try {
                  await loginWithEmail(email, password);
                  toast.success('Welcome back!');
                } catch (error: any) {
                  toast.error(error.message || 'Login failed');
                } finally {
                  setIsAuthLoading(false);
                }
              }}
              className="space-y-4 bg-surface p-6 rounded-3xl border border-white/10"
            >
              <div className="space-y-2">
                <label className="text-sm font-bold text-white/60">Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl p-3 focus:border-primary outline-none transition-colors"
                  placeholder="family@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-white/60">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl p-3 focus:border-primary outline-none transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button 
                type="submit"
                disabled={isAuthLoading}
                className="w-full bg-primary text-white font-bold py-4 rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isAuthLoading ? 'Signing in...' : 'Sign In'}
              </button>
              <div className="flex justify-between text-sm">
                <button type="button" onClick={() => setAuthMode('signup')} className="text-primary hover:underline">Create Account</button>
                <button type="button" onClick={() => setAuthMode('google')} className="text-white/40 hover:text-white">Back to Google</button>
              </div>
            </form>
          ) : (
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                setIsAuthLoading(true);
                try {
                  await signUpWithEmail(email, password, name);
                  toast.success('Account created! Please sign in.');
                  setAuthMode('email');
                } catch (error: any) {
                  toast.error(error.message || 'Signup failed');
                } finally {
                  setIsAuthLoading(false);
                }
              }}
              className="space-y-4 bg-surface p-6 rounded-3xl border border-white/10"
            >
              <div className="space-y-2">
                <label className="text-sm font-bold text-white/60">Full Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl p-3 focus:border-primary outline-none transition-colors"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-white/60">Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl p-3 focus:border-primary outline-none transition-colors"
                  placeholder="family@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-white/60">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl p-3 focus:border-primary outline-none transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button 
                type="submit"
                disabled={isAuthLoading}
                className="w-full bg-primary text-white font-bold py-4 rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isAuthLoading ? 'Creating Account...' : 'Sign Up'}
              </button>
              <div className="flex justify-between text-sm">
                <button type="button" onClick={() => setAuthMode('email')} className="text-primary hover:underline">Already have an account?</button>
                <button type="button" onClick={() => setAuthMode('google')} className="text-white/40 hover:text-white">Back to Google</button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCard.number.length < 16 || !newCard.expiry || newCard.cvv.length < 3) {
      toast.error('Please fill in all card details correctly');
      return;
    }

    const method: PaymentMethod = {
      id: Math.random().toString(36).substr(2, 9),
      type: newCard.type,
      last4: newCard.number.slice(-4),
      expiry: newCard.expiry,
      isDefault: paymentMethods.length === 0
    };

    setPaymentMethods([...paymentMethods, method]);
    setIsAddingCard(false);
    setNewCard({ number: '', expiry: '', cvv: '', type: 'visa' });
    toast.success('Payment method added successfully!');
  };

  const removePaymentMethod = (id: string) => {
    setPaymentMethods(paymentMethods.filter(p => p.id !== id));
    toast.error('Payment method removed');
  };

  const setDefaultPayment = (id: string) => {
    setPaymentMethods(paymentMethods.map(p => ({
      ...p,
      isDefault: p.id === id
    })));
    toast.success('Default payment updated');
  };

  useEffect(() => {
    if (!user) return;

    setLoadingOrders(true);
    setLoadingSuggestions(true);
    
    let unsubscribeFirebase: (() => void) | undefined;
    let unsubscribeSupabase: (() => void) | undefined;
    let unsubscribeSuggestions: (() => void) | undefined;

    if (authType === 'firebase') {
      const q = query(
        collection(db, 'users', (user as FirebaseUser).uid, 'orders'),
        orderBy('createdAt', 'desc')
      );

      unsubscribeFirebase = onSnapshot(q, (snapshot) => {
        const fetchedOrders = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setOrders(fetchedOrders);
        setLoadingOrders(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${(user as FirebaseUser).uid}/orders`);
        setLoadingOrders(false);
      });

      // Fetch suggestions
      const suggestionsQuery = query(
        collection(db, 'suggestions'),
        orderBy('createdAt', 'desc')
      );

      unsubscribeSuggestions = onSnapshot(suggestionsQuery, (snapshot) => {
        const fetchedSuggestions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSuggestions(fetchedSuggestions);
        setLoadingSuggestions(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'suggestions');
        setLoadingSuggestions(false);
      });
    } else if (authType === 'supabase') {
      const fetchSupabaseOrders = async () => {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', (user as SupabaseUser).id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching Supabase orders:', error);
        } else {
          setOrders(data.map(o => ({
            ...o,
            restaurantName: o.restaurant_name,
            createdAt: { toDate: () => new Date(o.created_at) } // Mocking Firebase timestamp for compatibility
          })));
        }
        setLoadingOrders(false);
      };

      fetchSupabaseOrders();

      // Realtime subscription for Supabase orders
      const channel = supabase
        .channel('orders-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${(user as SupabaseUser).id}` }, () => {
          fetchSupabaseOrders();
        })
        .subscribe();
      
      unsubscribeSupabase = () => {
        supabase.removeChannel(channel);
      };
    }

    return () => {
      if (unsubscribeFirebase) unsubscribeFirebase();
      if (unsubscribeSupabase) unsubscribeSupabase();
      if (unsubscribeSuggestions) unsubscribeSuggestions();
    };
  }, [user, authType]);

  const renderOrderHistory = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => setActiveSection('main')}
          className="p-2 bg-surface rounded-full hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold">Order History</h2>
      </div>

      {loadingOrders ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-surface p-6 rounded-3xl border border-white/5 flex justify-between items-center group hover:border-white/10 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/5 rounded-2xl text-primary">
                  <Receipt size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{order.restaurantName}</h3>
                  <p className="text-sm text-white/40">
                    {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'Recently'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-primary">${order.total?.toFixed(2)}</p>
                <p className="text-xs text-white/40 uppercase tracking-wider font-bold">{order.status?.replace('_', ' ')}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-surface rounded-3xl border border-white/5">
          <Receipt size={48} className="mx-auto text-white/10 mb-4" />
          <h3 className="text-xl font-bold mb-2">No orders found</h3>
          <p className="text-white/40">Your past orders will appear here.</p>
        </div>
      )}
    </motion.div>
  );

  const renderSavedRestaurants = () => {
    const savedRestaurants = MOCK_RESTAURANTS.filter(r => favorites.includes(r.id));
    
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => setActiveSection('main')}
            className="p-2 bg-surface rounded-full hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-2xl font-bold">Saved Restaurants</h2>
        </div>

        {savedRestaurants.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {savedRestaurants.map(restaurant => (
              <motion.div
                key={restaurant.id}
                layoutId={`restaurant-${restaurant.id}`}
                onClick={() => onSelectRestaurant(restaurant)}
                className="bg-surface rounded-3xl overflow-hidden border border-white/5 group cursor-pointer hover:border-primary/30 transition-all"
              >
                <div className="relative h-48">
                  <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(restaurant.id);
                    }}
                    className="absolute top-4 right-4 p-3 bg-black/50 backdrop-blur-md rounded-full text-primary border border-white/10"
                  >
                    <Heart size={20} fill="currentColor" />
                  </button>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{restaurant.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-white/60">
                    <span className="flex items-center gap-1"><Star size={14} className="text-yellow-400 fill-yellow-400" /> {restaurant.rating}</span>
                    <span>•</span>
                    <span>{restaurant.deliveryTime}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-surface rounded-3xl border border-white/5">
            <Heart size={48} className="mx-auto text-white/10 mb-4" />
            <h3 className="text-xl font-bold mb-2">No favorites yet</h3>
            <p className="text-white/40">Start exploring and save your favorite spots!</p>
          </div>
        )}
      </motion.div>
    );
  };

  const renderPromos = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => setActiveSection('main')}
          className="p-2 bg-surface rounded-full hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold">Promos & Offers</h2>
      </div>

      <div className="space-y-4">
        {[
          { code: 'WELCOME50', title: '50% Off First Order', desc: 'Valid on orders over $20', expiry: 'Ends in 2 days', color: 'from-primary to-orange-500' },
          { code: 'FREEDEL', title: 'Free Delivery', desc: 'On all orders from selected restaurants', expiry: 'Ends in 5 days', color: 'from-blue-500 to-purple-500' },
          { code: 'CRAVE10', title: '$10 Cashback', desc: 'Earn extra points on your next order', expiry: 'Permanent', color: 'from-green-500 to-emerald-500' }
        ].map((promo, idx) => (
          <div key={idx} className="bg-surface rounded-3xl border border-white/5 overflow-hidden group">
            <div className={`h-2 bg-gradient-to-r ${promo.color}`} />
            <div className="p-6 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold bg-white/10 px-2 py-0.5 rounded uppercase tracking-wider">{promo.code}</span>
                  <span className="text-xs text-white/40">{promo.expiry}</span>
                </div>
                <h3 className="text-xl font-bold mb-1">{promo.title}</h3>
                <p className="text-sm text-white/50">{promo.desc}</p>
              </div>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(promo.code);
                  toast.success('Promo code copied!');
                }}
                className="p-4 bg-white/5 rounded-2xl hover:bg-primary hover:text-white transition-all group-hover:scale-110"
              >
                <Clock size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );

  const renderPaymentMethods = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => setActiveSection('settings')}
          className="p-2 bg-surface rounded-full hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold">Payment Methods</h2>
      </div>

      <div className="space-y-4">
        {isAddingCard ? (
          <motion.form 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleAddCard}
            className="bg-surface p-6 rounded-3xl border border-primary/30 space-y-4"
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold">Add New Card</h3>
              <button type="button" onClick={() => setIsAddingCard(false)} className="text-white/40 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/40 uppercase font-bold mb-1 block">Card Number</label>
                <input 
                  type="text" 
                  maxLength={16}
                  placeholder="0000 0000 0000 0000"
                  value={newCard.number}
                  onChange={e => setNewCard({...newCard, number: e.target.value.replace(/\D/g, '')})}
                  className="w-full bg-black/20 border border-white/10 rounded-xl p-3 focus:border-primary outline-none transition-colors"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/40 uppercase font-bold mb-1 block">Expiry</label>
                  <input 
                    type="text" 
                    placeholder="MM/YY"
                    value={newCard.expiry}
                    onChange={e => setNewCard({...newCard, expiry: e.target.value})}
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3 focus:border-primary outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/40 uppercase font-bold mb-1 block">CVV</label>
                  <input 
                    type="password" 
                    maxLength={3}
                    placeholder="***"
                    value={newCard.cvv}
                    onChange={e => setNewCard({...newCard, cvv: e.target.value.replace(/\D/g, '')})}
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3 focus:border-primary outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                {(['visa', 'mastercard'] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setNewCard({...newCard, type})}
                    className={`flex-1 p-3 rounded-xl border transition-all capitalize font-bold ${newCard.type === type ? 'bg-primary/20 border-primary text-primary' : 'bg-black/20 border-white/10 text-white/40'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
            >
              Save Card
            </button>
          </motion.form>
        ) : (
          <>
            {paymentMethods.map(method => (
              <div key={method.id} className="bg-surface p-6 rounded-3xl border border-white/5 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-8 bg-white/10 rounded flex items-center justify-center font-bold text-[10px] uppercase">
                    {method.type}
                  </div>
                  <div>
                    <p className="font-bold">•••• •••• •••• {method.last4}</p>
                    <p className="text-xs text-white/40">Expires {method.expiry}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {method.isDefault ? (
                    <span className="text-[10px] bg-primary/20 text-primary px-2 py-1 rounded-full font-bold uppercase">Default</span>
                  ) : (
                    <button 
                      onClick={() => setDefaultPayment(method.id)}
                      className="text-[10px] text-white/40 hover:text-white transition-colors uppercase font-bold"
                    >
                      Set Default
                    </button>
                  )}
                  <button 
                    onClick={() => removePaymentMethod(method.id)}
                    className="p-2 text-white/20 hover:text-red-400 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ))}

            <button 
              onClick={() => setIsAddingCard(true)}
              className="w-full py-4 border-2 border-dashed border-white/10 rounded-3xl text-white/40 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2 font-bold"
            >
              <CreditCard size={20} />
              Add New Card
            </button>
          </>
        )}
      </div>
    </motion.div>
  );

  const renderPrivacy = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => setActiveSection('settings')}
          className="p-2 bg-surface rounded-full hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold">Privacy & Security</h2>
      </div>

      <div className="bg-surface rounded-3xl border border-white/5 overflow-hidden">
        {[
          { id: 'locationAccess', label: 'Location Access', desc: 'Used for faster delivery addresses', icon: Shield },
          { id: 'dataSharing', label: 'Data Sharing', desc: 'Share anonymous usage data to improve Crave', icon: Shield },
          { id: 'personalizedAds', label: 'Personalized Ads', desc: 'Show offers based on your preferences', icon: Shield },
          { id: 'twoFactor', label: 'Two-Factor Auth', desc: 'Extra layer of security for your account', icon: Shield }
        ].map((item) => (
          <div key={item.id} className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/5 rounded-xl text-white/70"><item.icon size={20} /></div>
              <div>
                <h3 className="font-medium text-lg">{item.label}</h3>
                <p className="text-sm text-white/50">{item.desc}</p>
              </div>
            </div>
            <button 
              onClick={() => {
                setPrivacySettings(prev => ({ ...prev, [item.id]: !prev[item.id as keyof typeof privacySettings] }));
                toast.success('Setting updated');
              }}
              className={`w-12 h-6 rounded-full relative transition-colors ${privacySettings[item.id as keyof typeof privacySettings] ? 'bg-primary' : 'bg-white/10'}`}
            >
              <motion.div 
                animate={{ x: privacySettings[item.id as keyof typeof privacySettings] ? 26 : 4 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
              />
            </button>
          </div>
        ))}

        <button className="w-full p-6 text-red-400 font-bold hover:bg-red-500/5 transition-colors text-left">
          Delete Account
        </button>
      </div>
    </motion.div>
  );

  const renderSupabaseGuide = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => setActiveSection('settings')}
          className="p-2 bg-surface rounded-full hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold">Supabase Integration</h2>
      </div>

      <div className="bg-surface rounded-3xl border border-white/5 p-8 space-y-8">
        <div className="flex items-center gap-4 p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
          <Database className="text-emerald-400" size={32} />
          <div>
            <h3 className="font-bold text-lg">Why Supabase?</h3>
            <p className="text-sm text-white/60">Supabase is an open-source Firebase alternative that uses PostgreSQL. It's great if you need complex relational queries.</p>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="font-bold text-xl flex items-center gap-2">
            <Database className="text-primary" size={20} />
            Database Setup (SQL)
          </h3>
          <p className="text-sm text-white/60">Run these scripts in your Supabase SQL Editor to create the necessary tables:</p>
          
          <div className="bg-black/40 rounded-2xl p-6 border border-white/10 font-mono text-xs overflow-x-auto space-y-4">
            <div>
              <p className="text-emerald-400 mb-2">-- 1. Create Profiles Table</p>
              <pre className="text-white/80">
{`create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  display_name text,
  crave_points integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table profiles enable row level security;

-- Create policies
create policy "Public profiles are viewable by everyone." on profiles for select using ( true );
create policy "Users can insert their own profile." on profiles for insert with check ( auth.uid() = id );
create policy "Users can update own profile." on profiles for update using ( auth.uid() = id );`}
              </pre>
            </div>

            <div>
              <p className="text-emerald-400 mb-2">-- 2. Create Orders Table</p>
              <pre className="text-white/80">
{`create table orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  restaurant_id text not null,
  restaurant_name text not null,
  items jsonb not null,
  total numeric not null,
  status text not null,
  delivery_address text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table orders enable row level security;

-- Create policies
create policy "Users can view their own orders." on orders for select using ( auth.uid() = user_id );
create policy "Users can insert their own orders." on orders for insert with check ( auth.uid() = user_id );`}
              </pre>
            </div>
          </div>
        </div>

        <div className="bg-black/40 rounded-2xl p-6 border border-white/10 font-mono text-xs overflow-x-auto">
          <p className="text-emerald-400 mb-2">// Example Initialization</p>
          <p className="text-white/80">import &#123; createClient &#125; from '@supabase/supabase-js'</p>
          <p className="text-white/80 mt-2">const supabaseUrl = 'https://your-project.supabase.co'</p>
          <p className="text-white/80">const supabaseKey = process.env.SUPABASE_KEY</p>
          <p className="text-white/80 mt-2">export const supabase = createClient(supabaseUrl, supabaseKey)</p>
        </div>

        <a 
          href="https://supabase.com/docs" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-500 transition-colors"
        >
          View Full Documentation <ExternalLink size={18} />
        </a>
      </div>
    </motion.div>
  );

  const renderSuggestions = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => setActiveSection('main')}
          className="p-2 bg-surface rounded-full hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold">Community Suggestions</h2>
      </div>

      <div className="space-y-6">
        <button 
          onClick={onOpenSuggestion}
          className="w-full py-6 border-2 border-dashed border-white/10 rounded-3xl text-white/40 hover:text-white hover:border-white/20 transition-all flex flex-col items-center justify-center gap-2 font-bold bg-white/5"
        >
          <Plus size={32} />
          <span>Suggest a Restaurant or Food</span>
          <p className="text-xs font-normal opacity-60">Help us grow our community!</p>
        </button>

        <div className="space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Star size={20} className="text-yellow-400" />
            Recent Suggestions
          </h3>
          
          {loadingSuggestions ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : suggestions.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {suggestions.map(suggestion => (
                <div key={suggestion.id} className="bg-surface p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-primary">{suggestion.foodType}</h4>
                      <p className="text-sm font-medium">at {suggestion.restaurantName}</p>
                    </div>
                    <span className="text-[10px] text-white/40 uppercase font-bold">
                      {suggestion.createdAt?.toDate ? suggestion.createdAt.toDate().toLocaleDateString() : 'Recently'}
                    </span>
                  </div>
                  <p className="text-white/70 text-sm italic mb-4">"{suggestion.description}"</p>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">
                      {suggestion.userName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs text-white/40">Suggested by {suggestion.userName}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-surface rounded-3xl border border-white/5">
              <Database size={48} className="mx-auto text-white/10 mb-4" />
              <h3 className="text-xl font-bold mb-2">No suggestions yet</h3>
              <p className="text-white/40">Be the first to suggest something new!</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  const renderSettings = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => setActiveSection('main')}
          className="p-2 bg-surface rounded-full hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold">Settings</h2>
      </div>

      <div className="bg-surface rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/5 rounded-xl text-white/70"><Bell size={20} /></div>
            <div>
              <h3 className="font-medium text-lg">Notifications</h3>
              <p className="text-sm text-white/50">Push and email alerts</p>
            </div>
          </div>
          <div className="w-12 h-6 bg-primary rounded-full relative cursor-pointer">
            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
          </div>
        </div>
        
        <div 
          onClick={() => setActiveSection('payments')}
          className="p-6 border-b border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/5 rounded-xl text-white/70"><CreditCard size={20} /></div>
            <div>
              <h3 className="font-medium text-lg">Payment Methods</h3>
              <p className="text-sm text-white/50">Manage cards and Apple Pay</p>
            </div>
          </div>
          <ChevronRight className="text-white/40" />
        </div>

        <div 
          onClick={() => setActiveSection('privacy')}
          className="p-6 border-b border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/5 rounded-xl text-white/70"><Shield size={20} /></div>
            <div>
              <h3 className="font-medium text-lg">Privacy & Security</h3>
              <p className="text-sm text-white/50">Password and data</p>
            </div>
          </div>
          <ChevronRight className="text-white/40" />
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="pb-24 pt-8 px-6 max-w-5xl mx-auto space-y-8 overflow-x-hidden">
      <AnimatePresence mode="wait">
        {activeSection === 'saved' && <div key="saved">{renderSavedRestaurants()}</div>}
        {activeSection === 'promos' && <div key="promos">{renderPromos()}</div>}
        {activeSection === 'orders' && <div key="orders">{renderOrderHistory()}</div>}
        {activeSection === 'settings' && <div key="settings">{renderSettings()}</div>}
        {activeSection === 'payments' && <div key="payments">{renderPaymentMethods()}</div>}
        {activeSection === 'privacy' && <div key="privacy">{renderPrivacy()}</div>}
        {activeSection === 'suggestions' && <div key="suggestions">{renderSuggestions()}</div>}
        
        {activeSection === 'main' && (
          <motion.div
            key="main"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8"
          >
            <h1 className="text-3xl font-bold">Profile</h1>

            <div className="relative bg-surface rounded-3xl border border-white/5 shadow-xl overflow-hidden">
              {/* Dynamic Background based on most ordered food */}
              <div className="absolute inset-0 z-0">
                <img src={profileBg} className="w-full h-full object-cover opacity-20 blur-sm" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/80 to-transparent" />
              </div>

              <div className="relative z-10 flex items-center gap-6 p-6">
                {(user as any).photoURL || (user as any).user_metadata?.avatar_url ? (
                  <img src={(user as any).photoURL || (user as any).user_metadata?.avatar_url} alt={(user as any).displayName || (user as any).user_metadata?.full_name || 'User'} className="w-20 h-20 rounded-full border-4 border-background shadow-lg object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-orange-400 flex items-center justify-center text-3xl font-bold border-4 border-background shadow-lg">
                    {((user as any).displayName || (user as any).user_metadata?.full_name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold">{(user as any).displayName || (user as any).user_metadata?.full_name || 'Foodie'}</h2>
                  <p className="text-white/60">{user.email}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                      {mostOrderedCategory} Lover
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Crave Points Gamification */}
            <div style={{ perspective: "1000px" }}>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ rotateX: 5, rotateY: -2, scale: 1.02 }}
                className="bg-gradient-to-br from-primary/20 to-surface rounded-3xl p-6 border border-primary/30 relative overflow-hidden shadow-2xl"
              >
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
                
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Star className="text-yellow-400 fill-yellow-400" size={24} />
                      Crave Points
                    </h3>
                    <p className="text-white/70 text-sm mt-1">Earn 10 points for every $1 spent</p>
                  </div>
                  <div className="text-3xl font-black text-primary">{cravePoints}</div>
                </div>

                <div className="space-y-3 relative z-10">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Progress to Free Meal</span>
                    <span>{cravePoints} / {pointsToNextReward} pts</span>
                  </div>
                  <div className="h-4 bg-black/40 rounded-full overflow-hidden border border-white/10">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-primary to-yellow-400 relative"
                    >
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay" />
                    </motion.div>
                  </div>
                  <p className="text-xs text-white/50 text-right">
                    {cravePoints >= pointsToNextReward 
                      ? "You've earned a free meal! Claim it at checkout." 
                      : `${pointsToNextReward - cravePoints} more points to go!`}
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Menu Options */}
            <div className="bg-surface rounded-3xl border border-white/5 overflow-hidden">
              <button 
                onClick={() => setActiveSection('saved')}
                className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors border-b border-white/5"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/5 rounded-xl text-primary">
                    <Heart size={20} />
                  </div>
                  <span className="font-medium text-lg">Saved Restaurants</span>
                </div>
                <ChevronRight className="text-white/40" />
              </button>

              <button 
                onClick={() => setActiveSection('orders')}
                className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors border-b border-white/5"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/5 rounded-xl text-orange-400">
                    <Receipt size={20} />
                  </div>
                  <span className="font-medium text-lg">Order History</span>
                </div>
                <ChevronRight className="text-white/40" />
              </button>
              
              <button 
                onClick={() => setActiveSection('promos')}
                className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors border-b border-white/5"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/5 rounded-xl text-blue-400">
                    <Gift size={20} />
                  </div>
                  <span className="font-medium text-lg">Promos & Offers</span>
                </div>
                <ChevronRight className="text-white/40" />
              </button>

              <button 
                onClick={() => setActiveSection('suggestions')}
                className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors border-b border-white/5"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/5 rounded-xl text-emerald-400">
                    <Plus size={20} />
                  </div>
                  <span className="font-medium text-lg">Community Suggestions</span>
                </div>
                <ChevronRight className="text-white/40" />
              </button>

              <button 
                onClick={() => setActiveSection('settings')}
                className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors border-b border-white/5"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/5 rounded-xl text-white/70">
                    <Settings size={20} />
                  </div>
                  <span className="font-medium text-lg">Settings</span>
                </div>
                <ChevronRight className="text-white/40" />
              </button>

              <button 
                onClick={logout}
                className="w-full flex items-center justify-between p-6 hover:bg-red-500/10 transition-colors text-red-400"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-500/10 rounded-xl">
                    <LogOut size={20} />
                  </div>
                  <span className="font-medium text-lg">Log Out</span>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
