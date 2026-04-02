import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Star, Gift, ChevronRight, Settings, LogOut, Heart, LogIn, ArrowLeft, Clock, Bell, CreditCard, Shield, X, Receipt, Database, Code, ExternalLink, Mail, Lock, UserPlus, Plus, AlertTriangle, Store, Utensils, Sparkles, Image as ImageIcon, MapPin, Edit2, Check, Navigation, Loader2, Camera, Save, Languages } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { Restaurant, Promotion } from '../types';
import { MOCK_RESTAURANTS } from '../data/mockData';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where, doc, updateDoc, getDoc } from 'firebase/firestore';
import { supabase } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { User as FirebaseUser } from 'firebase/auth';
import { RestaurantMenuView } from './RestaurantMenuView';
import { RestaurantStats } from './RestaurantStats';
import { DriverDashboard } from './DriverDashboard';

interface ProfileProps {
  favorites: string[];
  toggleFavorite: (id: string) => void;
  onSelectRestaurant: (restaurant: Restaurant) => void;
  onOpenSuggestion?: () => void;
  onOpenRestaurantOnboarding?: () => void;
}

interface PaymentMethod {
  id: string;
  type: 'visa' | 'mastercard' | 'apple';
  last4: string;
  expiry: string;
  isDefault: boolean;
}

export function Profile(props: ProfileProps) {
  const { user, isAuthReady } = useAuth();

  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-24 pt-8 px-6 max-w-5xl mx-auto space-y-8 overflow-x-hidden">
      <AnimatePresence mode="wait">
        {!user ? (
          <motion.div
            key="auth"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <AuthView />
          </motion.div>
        ) : (
          <motion.div
            key="profile-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ProfileContent {...props} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AuthView() {
  const { login, loginWithEmail, signUpWithEmail } = useAuth();
  const [authMode, setAuthMode] = useState<'google' | 'email' | 'signup'>('google');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<'customer' | 'restaurant' | 'driver'>('customer');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsAuthLoading(true);
    try {
      await login();
    } finally {
      setIsAuthLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
      <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center mb-4 border border-white/10">
        <User size={40} className="text-white/40" />
      </div>
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Sign in to Crave</h1>
        <p className="text-white/60 max-w-md">
          Save your favorite restaurants, track your orders, and earn Crave Points for free meals!
        </p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        {authMode === 'google' ? (
          <div className="space-y-4">
            <button 
              onClick={handleGoogleLogin}
              disabled={isAuthLoading}
              className="w-full bg-primary text-white font-bold py-4 px-8 rounded-2xl flex items-center justify-center gap-3 hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {isAuthLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogIn size={20} />
              )}
              {isAuthLoading ? 'Connecting...' : 'Continue with Google'}
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
                await signUpWithEmail(email, password, name, selectedRole);
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
            <div className="space-y-2">
              <label className="text-sm font-bold text-white/60">I am a...</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'customer', label: 'Customer', icon: User },
                  { id: 'restaurant', label: 'Owner', icon: Store },
                  { id: 'driver', label: 'Driver', icon: Navigation }
                ].map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id as any)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-1 ${
                      selectedRole === role.id 
                        ? 'bg-primary/20 border-primary text-primary' 
                        : 'bg-black/20 border-white/10 text-white/40 hover:bg-white/5'
                    }`}
                  >
                    <role.icon size={18} />
                    <span className="text-[10px] font-bold uppercase">{role.label}</span>
                  </button>
                ))}
              </div>
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

interface RestaurantDashboardViewProps {
  user: any;
  authType: string;
  setActiveSection: (section: any) => void;
  onOpenRestaurantOnboarding?: () => void;
  onSelectRestaurant: (restaurant: Restaurant) => void;
  setSelectedRestaurantForOrders: (restaurant: Restaurant) => void;
  language: string;
  setLanguage: (lang: string) => void;
}

const RestaurantDashboardView = ({ 
  user, 
  authType, 
  setActiveSection, 
  onOpenRestaurantOnboarding, 
  onSelectRestaurant,
  setSelectedRestaurantForOrders,
  language,
  setLanguage
}: RestaurantDashboardViewProps) => {
  const [myRestaurants, setMyRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeRestaurantTab, setActiveRestaurantTab] = useState<Record<string, 'overview' | 'stats' | 'promos'>>({});
  const [showPromoForm, setShowPromoForm] = useState<string | null>(null);
  const [promoType, setPromoType] = useState<'bogo' | 'discount' | 'fixed'>('bogo');
  const [promoCode, setPromoCode] = useState('');
  const [promoDesc, setPromoDesc] = useState('');
  const [promoValue, setPromoValue] = useState('');
  const [isCreatingPromo, setIsCreatingPromo] = useState(false);

  const handleCreatePromo = async (restaurantId: string) => {
    if (!promoCode || !promoDesc) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsCreatingPromo(true);
    try {
      const restaurantRef = doc(db, 'restaurants', restaurantId);
      const restaurantDoc = await getDoc(restaurantRef);
      
      if (!restaurantDoc.exists()) throw new Error('Restaurant not found');
      
      const currentRestaurant = restaurantDoc.data() as Restaurant;
      const promoId = `promo_${Date.now()}`;
      const newPromo: Promotion = {
        id: promoId,
        restaurantId: restaurantId,
        restaurantName: currentRestaurant.name,
        type: promoType,
        code: promoCode.toUpperCase(),
        description: promoDesc,
        value: promoValue ? parseFloat(promoValue) : undefined,
        isActive: true,
        createdAt: serverTimestamp()
      };

      // 1. Update restaurant's internal promotions array (for backward compatibility/easy access)
      const updatedPromotions = [...(currentRestaurant.promotions || []), newPromo];
      await updateDoc(restaurantRef, {
        promotions: updatedPromotions
      });

      // 2. Save to global promotions collection for efficient lookup
      await addDoc(collection(db, 'promotions'), newPromo);

      toast.success('Promotion launched successfully!');
      setShowPromoForm(null);
      setPromoCode('');
      setPromoDesc('');
      setPromoValue('');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `restaurants/${restaurantId}`);
    } finally {
      setIsCreatingPromo(false);
    }
  };

  const toggleRestaurantTab = (restaurantId: string, tab: 'overview' | 'stats' | 'promos') => {
    setActiveRestaurantTab(prev => ({ ...prev, [restaurantId]: tab }));
  };

  useEffect(() => {
    if (!user) return;
    const userId = authType === 'firebase' ? (user as FirebaseUser).uid : (user as SupabaseUser).id;
    
    const q = query(
      collection(db, 'restaurants'),
      where('ownerId', '==', userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const restaurants = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Restaurant));
      setMyRestaurants(restaurants);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'restaurants');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authType]);

  const handleImageUpload = async (restaurantId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingId(restaurantId);
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 600; // Reduced for faster upload
          const MAX_HEIGHT = 450; // Reduced for faster upload
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.5); // Lower quality for faster upload
          
          await updateDoc(doc(db, 'restaurants', restaurantId), {
            image: dataUrl
          });
          toast.success('Image updated successfully!');
          setUploadingId(null);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'restaurants');
      setUploadingId(null);
    }
    
    // Reset input
    if (event.target) {
      event.target.value = '';
    }
  };

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
        <h2 className="text-2xl font-bold">Restaurant Dashboard</h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : myRestaurants.length === 0 ? (
        <div className="bg-surface rounded-3xl p-12 text-center border border-white/5">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <Store className="text-white/20" size={40} />
          </div>
          <h3 className="text-xl font-bold mb-2">No Restaurants Found</h3>
          <p className="text-white/60 mb-8">You haven't registered any restaurants yet.</p>
          <button 
            onClick={() => {
              setActiveSection('main');
              onOpenRestaurantOnboarding?.();
            }}
            className="px-8 py-4 bg-primary rounded-2xl font-bold hover:scale-105 transition-all"
          >
            Register Now
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {myRestaurants.map(restaurant => (
            <div key={restaurant.id} className="bg-surface rounded-3xl border border-white/5 overflow-hidden">
              <div className="relative h-48 group">
                <img src={restaurant.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                {/* Image Edit Controls */}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => setEditingRestaurant(restaurant)}
                    className="p-2 bg-black/50 hover:bg-black/80 backdrop-blur-md rounded-xl text-white transition-colors"
                    title="Edit Details"
                  >
                    <Edit2 size={18} />
                  </button>
                  <label className="p-2 bg-black/50 hover:bg-black/80 backdrop-blur-md rounded-xl text-white transition-colors cursor-pointer" title="Upload Image">
                    {uploadingId === restaurant.id ? (
                      <div className="w-[18px] h-[18px] border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ImageIcon size={18} />
                    )}
                    <input 
                      type="file" 
                      accept="image/jpeg, image/png, image/webp" 
                      className="hidden" 
                      onChange={(e) => handleImageUpload(restaurant.id, e)}
                      disabled={uploadingId === restaurant.id}
                    />
                  </label>
                </div>

                <div className="absolute bottom-6 left-6">
                  <h3 className="text-2xl font-bold">{restaurant.name}</h3>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1 text-yellow-400">
                      <Star size={16} fill="currentColor" />
                      <span className="text-sm font-bold">{restaurant.rating}</span>
                    </div>
                    {restaurant.address && (
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name + ' ' + restaurant.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm text-white/60 flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
                      >
                        <MapPin size={12} />
                        {restaurant.address}
                      </a>
                    )}
                    <span className="text-sm text-white/60">{restaurant.categories.join(', ')}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                  <button 
                    onClick={() => toggleRestaurantTab(restaurant.id, 'overview')}
                    className={`px-4 py-2 rounded-xl font-bold transition-all ${
                      (activeRestaurantTab[restaurant.id] || 'overview') === 'overview' ? 'bg-primary text-white' : 'text-white/40 hover:text-white'
                    }`}
                  >
                    Overview
                  </button>
                  <button 
                    onClick={() => toggleRestaurantTab(restaurant.id, 'stats')}
                    className={`px-4 py-2 rounded-xl font-bold transition-all ${
                      activeRestaurantTab[restaurant.id] === 'stats' ? 'bg-primary text-white' : 'text-white/40 hover:text-white'
                    }`}
                  >
                    Stats
                  </button>
                  <button 
                    onClick={() => toggleRestaurantTab(restaurant.id, 'promos')}
                    className={`px-4 py-2 rounded-xl font-bold transition-all ${
                      activeRestaurantTab[restaurant.id] === 'promos' ? 'bg-primary text-white' : 'text-white/40 hover:text-white'
                    }`}
                  >
                    Promos
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {(activeRestaurantTab[restaurant.id] || 'overview') === 'overview' ? (
                    <motion.div
                      key="overview"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white/5 rounded-2xl">
                          <p className="text-xs text-white/40 uppercase font-black tracking-widest mb-1">Status</p>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${restaurant.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            <span className="font-bold">{restaurant.isActive ? 'Active' : 'Inactive'}</span>
                          </div>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl">
                          <p className="text-xs text-white/40 uppercase font-black tracking-widest mb-1">Delivery</p>
                          <span className="font-bold">{restaurant.deliveryTime} • {restaurant.currencySymbol || '$'}{restaurant.deliveryFee}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-4">
                        <div className="flex gap-4">
                          <button 
                            onClick={() => {
                              setSelectedRestaurantForOrders(restaurant);
                              setActiveSection('restaurant_menu');
                            }}
                            className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                          >
                            <Utensils size={18} /> Manage Menu
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedRestaurantForOrders(restaurant);
                              setActiveSection('restaurant_orders');
                            }}
                            className="flex-1 py-4 bg-primary rounded-2xl font-bold hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                          >
                            <Receipt size={18} /> Manage Orders
                          </button>
                        </div>
                        <button 
                          onClick={() => onSelectRestaurant(restaurant)}
                          className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-bold transition-all border border-white/10 flex items-center justify-center gap-2"
                        >
                          <ExternalLink size={18} /> View Public Page
                        </button>
                      </div>
                    </motion.div>
                  ) : activeRestaurantTab[restaurant.id] === 'stats' ? (
                    <motion.div
                      key="stats"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <RestaurantStats restaurant={restaurant} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="promos"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-surface rounded-3xl p-8 border border-white/5"
                    >
                      {showPromoForm === restaurant.id ? (
                        <div className="space-y-6">
                          <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold">New Promotion</h3>
                            <button onClick={() => setShowPromoForm(null)} className="text-white/40 hover:text-white">
                              <X size={20} />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-bold text-white/60">Promo Type</label>
                              <select 
                                value={promoType}
                                onChange={(e) => setPromoType(e.target.value as any)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50"
                              >
                                <option value="bogo">Buy 1 Get 1 Free</option>
                                <option value="discount">Percentage Discount</option>
                                <option value="fixed">Fixed Amount Off</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-bold text-white/60">Promo Code</label>
                              <input 
                                type="text" 
                                value={promoCode}
                                onChange={(e) => setPromoCode(e.target.value)}
                                placeholder="e.g. SUMMER20" 
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 uppercase"
                              />
                            </div>
                          </div>
                          {promoType !== 'bogo' && (
                            <div className="space-y-2">
                              <label className="text-sm font-bold text-white/60">
                                {promoType === 'discount' ? 'Discount Percentage (%)' : 'Discount Amount ($)'}
                              </label>
                              <input 
                                type="number" 
                                value={promoValue}
                                onChange={(e) => setPromoValue(e.target.value)}
                                placeholder={promoType === 'discount' ? 'e.g. 20' : 'e.g. 5.00'} 
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50"
                              />
                            </div>
                          )}
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-white/60">Description</label>
                            <textarea 
                              value={promoDesc}
                              onChange={(e) => setPromoDesc(e.target.value)}
                              placeholder="Describe your offer..." 
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 min-h-[100px] resize-none"
                            />
                          </div>
                          <button 
                            onClick={() => handleCreatePromo(restaurant.id)}
                            disabled={isCreatingPromo}
                            className="w-full py-4 bg-primary rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {isCreatingPromo ? <Loader2 className="animate-spin" size={20} /> : 'Launch Promotion'}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold">Promotions</h3>
                            <button 
                              onClick={() => setShowPromoForm(restaurant.id)}
                              className="px-4 py-2 bg-primary/10 text-primary rounded-xl font-bold text-sm hover:bg-primary/20 transition-all"
                            >
                              + New Promo
                            </button>
                          </div>
                          
                          {restaurant.promotions && restaurant.promotions.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                              {restaurant.promotions.map((promo) => (
                                <div key={promo.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] font-black uppercase rounded tracking-widest">{promo.code}</span>
                                      <span className="text-xs text-white/40">{promo.type === 'bogo' ? 'BOGO' : promo.type === 'discount' ? `${promo.value}% OFF` : `$${promo.value} OFF`}</span>
                                    </div>
                                    <p className="text-sm font-medium">{promo.description}</p>
                                  </div>
                                  <div className={`w-2 h-2 rounded-full ${promo.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <Gift className="text-white/20 mx-auto mb-4" size={40} />
                              <p className="text-white/60 mb-6">Create "Buy 1 Get 1 Free" deals or promo codes to boost your sales.</p>
                              <button 
                                onClick={() => setShowPromoForm(restaurant.id)}
                                className="px-8 py-3 bg-primary rounded-xl font-bold hover:scale-105 transition-all shadow-lg shadow-primary/20"
                              >
                                Create New Promo
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Restaurant Modal */}
      <AnimatePresence>
        {editingRestaurant && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingRestaurant(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-surface rounded-[2.5rem] border border-white/10 p-8 shadow-2xl overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Edit Restaurant</h3>
                <button 
                  onClick={() => setEditingRestaurant(null)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-white/40">Restaurant Name</label>
                  <input 
                    type="text"
                    value={editingRestaurant.name}
                    onChange={e => setEditingRestaurant({...editingRestaurant, name: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-white/40">Location Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                    <input 
                      type="text"
                      value={editingRestaurant.address || ''}
                      onChange={e => setEditingRestaurant({...editingRestaurant, address: e.target.value})}
                      placeholder="e.g. Kuala Lumpur, Malaysia"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase tracking-widest text-white/40">Latitude</label>
                    <input 
                      type="number"
                      step="any"
                      value={editingRestaurant.lat}
                      onChange={e => setEditingRestaurant({...editingRestaurant, lat: parseFloat(e.target.value) || 0})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase tracking-widest text-white/40">Longitude</label>
                    <input 
                      type="number"
                      step="any"
                      value={editingRestaurant.lng}
                      onChange={e => setEditingRestaurant({...editingRestaurant, lng: parseFloat(e.target.value) || 0})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-white/40">Currency Symbol</label>
                  <select 
                    value={editingRestaurant.currencySymbol || '$'}
                    onChange={e => setEditingRestaurant({...editingRestaurant, currencySymbol: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-primary text-white appearance-none"
                  >
                    <option value="$" className="bg-surface text-white">$ (USD/Default)</option>
                    <option value="RM" className="bg-surface text-white">RM (MYR)</option>
                    <option value="€" className="bg-surface text-white">€ (EUR)</option>
                    <option value="£" className="bg-surface text-white">£ (GBP)</option>
                    <option value="¥" className="bg-surface text-white">¥ (JPY/CNY)</option>
                    <option value="฿" className="bg-surface text-white">฿ (THB)</option>
                    <option value="S$" className="bg-surface text-white">S$ (SGD)</option>
                    <option value="₩" className="bg-surface text-white">₩ (KRW)</option>
                    <option value="₹" className="bg-surface text-white">₹ (INR)</option>
                  </select>
                </div>

                <button
                  onClick={async () => {
                    setIsSaving(true);
                    try {
                      await updateDoc(doc(db, 'restaurants', editingRestaurant.id), {
                        name: editingRestaurant.name,
                        address: editingRestaurant.address,
                        lat: editingRestaurant.lat,
                        lng: editingRestaurant.lng,
                        currencySymbol: editingRestaurant.currencySymbol || '$'
                      });
                      toast.success('Restaurant details updated!');
                      setEditingRestaurant(null);
                    } catch (error) {
                      handleFirestoreError(error, OperationType.UPDATE, `restaurants/${editingRestaurant.id}`);
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  disabled={isSaving}
                  className="w-full py-4 bg-primary rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>Save Changes <Check size={20} /></>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

interface RestaurantOrdersViewProps {
  selectedRestaurantForOrders: Restaurant | null;
  setActiveSection: (section: any) => void;
}

const RestaurantOrdersView = ({ selectedRestaurantForOrders, setActiveSection }: RestaurantOrdersViewProps) => {
  const { user, authType } = useAuth();
  const [restaurantOrders, setRestaurantOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const prevPendingCount = useRef(0);

  // Audio alert for new orders
  useEffect(() => {
    const currentPendingCount = restaurantOrders.filter(o => o.status === 'pending').length;
    if (currentPendingCount > prevPendingCount.current) {
      // Play a loud ringing sound for new orders
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(e => console.log('Audio play failed (browser policy):', e));
      toast.success('New Order Received!', { duration: 5000, icon: '🔔' });
    }
    prevPendingCount.current = currentPendingCount;
  }, [restaurantOrders]);

  useEffect(() => {
    if (!selectedRestaurantForOrders) return;
    
    if (authType === 'firebase') {
      const q = query(
        collection(db, 'orders'),
        where('restaurantOwnerId', '==', (user as FirebaseUser).uid),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const orders = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).filter((o: any) => o.restaurantId === selectedRestaurantForOrders.id);
        setRestaurantOrders(orders);
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'orders');
        setLoading(false);
      });

      return () => unsubscribe();
    } else if (authType === 'supabase') {
      const fetchSupabaseOrders = async () => {
        try {
          const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('restaurant_owner_id', (user as SupabaseUser).id)
            .eq('restaurant_id', selectedRestaurantForOrders.id)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Error fetching Supabase orders:', error);
            toast.error('Failed to load orders');
          } else {
            setRestaurantOrders(data || []);
          }
        } catch (err) {
          console.error('Supabase restaurant orders fetch error:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchSupabaseOrders();

      const subscription = supabase
        .channel('public:orders')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'orders',
          filter: `restaurant_owner_id=eq.${(user as SupabaseUser).id}`
        }, () => {
          fetchSupabaseOrders();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [selectedRestaurantForOrders, authType, user]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      if (authType === 'firebase') {
        await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      } else if (authType === 'supabase') {
        const { error } = await supabase
          .from('orders')
          .update({ status: newStatus })
          .eq('id', orderId);
        if (error) throw error;
      }
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      if (authType === 'firebase') {
        handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
      } else {
        console.error('Error updating order:', error);
        toast.error('Failed to update order status');
      }
    }
  };

  const totalRevenue = restaurantOrders.reduce((sum, order) => sum + (order.total || 0), 0);
  const activeOrders = restaurantOrders.filter(order => !['delivered', 'cancelled'].includes(order.status)).length;
  const totalOrders = restaurantOrders.length;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => setActiveSection('restaurant_dashboard')}
          className="p-2 bg-surface rounded-full hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 className="text-2xl font-bold">Manage Orders</h2>
          <p className="text-white/60">{selectedRestaurantForOrders?.name}</p>
        </div>
      </div>

      {/* Stats Overview */}
      {!loading && restaurantOrders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-surface rounded-3xl p-6 border border-white/5">
            <p className="text-xs text-white/40 uppercase font-black tracking-widest mb-2">Total Revenue</p>
            <p className="text-3xl font-bold text-emerald-400">${totalRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-surface rounded-3xl p-6 border border-white/5">
            <p className="text-xs text-white/40 uppercase font-black tracking-widest mb-2">Active Orders</p>
            <p className="text-3xl font-bold text-primary">{activeOrders}</p>
          </div>
          <div className="bg-surface rounded-3xl p-6 border border-white/5">
            <p className="text-xs text-white/40 uppercase font-black tracking-widest mb-2">Total Orders</p>
            <p className="text-3xl font-bold text-white">{totalOrders}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : restaurantOrders.length === 0 ? (
        <div className="bg-surface rounded-3xl p-12 text-center border border-white/5">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <Receipt className="text-white/20" size={40} />
          </div>
          <h3 className="text-xl font-bold mb-2">No Orders Yet</h3>
          <p className="text-white/60">Orders will appear here once customers start buying!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {restaurantOrders.map((order: any) => (
            <div key={order.id} className="bg-surface rounded-3xl border border-white/5 p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-white/40 uppercase font-black tracking-widest mb-1">Order #{order.id.slice(-6)}</p>
                  <p className="font-bold text-lg">${order.total}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  order.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-400' :
                  order.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                  'bg-primary/20 text-primary'
                }`}>
                  {order.status.replace('_', ' ')}
                </div>
              </div>

              <div className="space-y-2">
                {JSON.parse(order.items).map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-white/60">{item.quantity}x {item.name}</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-white/5 flex gap-2">
                {order.status === 'pending' && (
                  <button 
                    onClick={() => updateOrderStatus(order.id, 'confirmed')}
                    className="flex-1 py-3 bg-blue-500 rounded-xl font-bold text-sm hover:scale-105 transition-all"
                  >
                    Accept Order
                  </button>
                )}
                {order.status === 'confirmed' && (
                  <button 
                    onClick={() => updateOrderStatus(order.id, 'preparing')}
                    className="flex-1 py-3 bg-primary rounded-xl font-bold text-sm hover:scale-105 transition-all"
                  >
                    Start Preparing
                  </button>
                )}
                {order.status === 'preparing' && (
                  <button 
                    onClick={() => updateOrderStatus(order.id, 'ready_for_pickup')}
                    className="flex-1 py-3 bg-emerald-500 rounded-xl font-bold text-sm hover:scale-105 transition-all"
                  >
                    Ready for Collection
                  </button>
                )}
                {order.status === 'driver_arrived_at_restaurant' && (
                  <button 
                    onClick={() => updateOrderStatus(order.id, 'picked_up')}
                    className="flex-1 py-3 bg-purple-500 rounded-xl font-bold text-sm hover:scale-105 transition-all"
                  >
                    Handover to Rider
                  </button>
                )}
                {order.status === 'ready_for_pickup' && (
                  <div className="flex-1 py-3 bg-white/5 rounded-xl font-bold text-sm text-center text-white/40 border border-white/5">
                    Waiting for Driver...
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

const translations = {
  en: {
    editProfile: 'Edit Profile',
    myOrders: 'My Orders',
    savedAddresses: 'Saved Addresses',
    paymentMethods: 'Payment Methods',
    cravePoints: 'Crave Points',
    communitySuggestions: 'Community Suggestions',
    restaurantDashboard: 'Restaurant Dashboard',
    registerRestaurant: 'Register as a Restaurant',
    driverDashboard: 'Driver Dashboard',
    earnWithCrave: 'Earn with Crave',
    becomeDriver: 'Become a Driver',
    settings: 'Settings',
    logout: 'Log Out',
    deliverJoy: 'Deliver joy and earn on your schedule',
    earnPoints: 'Earn 500 Crave Points on signup!',
    manageMenu: 'Manage your menu and orders',
    manageDeliveries: 'Manage your deliveries and earnings',
    viewHistory: 'View your order history',
    manageAddresses: 'Manage your delivery locations',
    manageCards: 'Manage your cards and payment options',
    viewRewards: 'View your rewards and tier status',
    voteNew: 'Vote for new food and restaurants',
    updateInfo: 'Update your personal information',
    settingsMenu: 'Settings',
    notifications: 'Notifications',
    notificationsDesc: 'Push and email alerts',
    paymentMethodsMenu: 'Payment Methods',
    paymentMethodsDesc: 'Manage cards and Apple Pay',
    privacySecurity: 'Privacy & Security',
    privacySecurityDesc: 'Password and data',
    language: 'Language / Bahasa',
    languageDesc: 'Choose your preferred language',
    signOut: 'Sign Out',
  },
  ms: {
    editProfile: 'Edit Profil',
    myOrders: 'Pesanan Saya',
    savedAddresses: 'Alamat Disimpan',
    paymentMethods: 'Kaedah Pembayaran',
    cravePoints: 'Mata Crave',
    communitySuggestions: 'Cadangan Komuniti',
    restaurantDashboard: 'Papan Pemuka Restoran',
    registerRestaurant: 'Daftar sebagai Restoran',
    driverDashboard: 'Papan Pemuka Pemandu',
    earnWithCrave: 'Jana Pendapatan dengan Crave',
    becomeDriver: 'Jadi Pemandu',
    settings: 'Tetapan',
    logout: 'Log Keluar',
    deliverJoy: 'Hantar kegembiraan dan jana pendapatan mengikut jadual anda',
    earnPoints: 'Dapatkan 500 Mata Crave semasa mendaftar!',
    manageMenu: 'Urus menu dan pesanan anda',
    manageDeliveries: 'Urus penghantaran dan pendapatan anda',
    viewHistory: 'Lihat sejarah pesanan anda',
    manageAddresses: 'Urus lokasi penghantaran anda',
    manageCards: 'Urus kad dan pilihan pembayaran anda',
    viewRewards: 'Lihat ganjaran dan status tahap anda',
    voteNew: 'Undi untuk makanan dan restoran baharu',
    updateInfo: 'Kemas kini maklumat peribadi anda',
    settingsMenu: 'Tetapan',
    notifications: 'Pemberitahuan',
    notificationsDesc: 'Makluman tolak dan e-mel',
    paymentMethodsMenu: 'Kaedah Pembayaran',
    paymentMethodsDesc: 'Urus kad dan Apple Pay',
    privacySecurity: 'Privasi & Keselamatan',
    privacySecurityDesc: 'Kata laluan dan data',
    language: 'Bahasa',
    languageDesc: 'Pilih bahasa pilihan anda',
    signOut: 'Log Keluar',
  },
  zh: {
    editProfile: '编辑个人资料',
    myOrders: '我的订单',
    savedAddresses: '已保存地址',
    paymentMethods: '付款方式',
    cravePoints: 'Crave 积分',
    communitySuggestions: '社区建议',
    restaurantDashboard: '餐厅仪表板',
    registerRestaurant: '注册成为餐厅',
    driverDashboard: '司机仪表板',
    earnWithCrave: '通过 Crave 赚钱',
    becomeDriver: '成为司机',
    settings: '设置',
    logout: '登出',
    deliverJoy: '传递快乐并按您的时间表赚钱',
    earnPoints: '注册即赚取 500 Crave 积分！',
    manageMenu: '管理您的菜单和订单',
    manageDeliveries: '管理您的送货和收入',
    viewHistory: '查看您的订单历史记录',
    manageAddresses: '管理您的送货地址',
    manageCards: '管理您的卡和付款选项',
    viewRewards: '查看您的奖励和等级状态',
    voteNew: '投票选出新食物和餐厅',
    updateInfo: '更新您的个人信息',
    settingsMenu: '设置',
    notifications: '通知',
    notificationsDesc: '推送和电子邮件警报',
    paymentMethodsMenu: '付款方式',
    paymentMethodsDesc: '管理卡和Apple Pay',
    privacySecurity: '隐私与安全',
    privacySecurityDesc: '密码和数据',
    language: '语言',
    languageDesc: '选择您的首选语言',
    signOut: '登出',
  }
};

function ProfileContent({ favorites, toggleFavorite, onSelectRestaurant, onOpenSuggestion, onOpenRestaurantOnboarding }: ProfileProps) {
  const { user, authType, role, cravePoints, logout, deleteAccount, updateProfileName, setRole } = useAuth();
  const [activeSection, setActiveSection] = useState<'main' | 'saved' | 'promos' | 'settings' | 'payments' | 'privacy' | 'orders' | 'supabase' | 'suggestions' | 'restaurant_dashboard' | 'restaurant_orders' | 'restaurant_menu' | 'driver_dashboard'>('main');
  
  // Return null if user is not available (e.g. during logout animation)
  if (!user) return null;
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [selectedRestaurantForOrders, setSelectedRestaurantForOrders] = useState<Restaurant | null>(null);
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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [language, setLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('crave_language') || 'en';
    }
    return 'en';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('crave_language', language);
    }
  }, [language]);

  const t = translations[language as keyof typeof translations] || translations.en;

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCard.number.length < 16) {
      toast.error('Invalid card number');
      return;
    }
    const id = Math.random().toString(36).substr(2, 9);
    setPaymentMethods(prev => [...prev, {
      id,
      type: newCard.type,
      last4: newCard.number.slice(-4),
      expiry: newCard.expiry,
      isDefault: false
    }]);
    setIsAddingCard(false);
    setNewCard({ number: '', expiry: '', cvv: '', type: 'visa' });
    toast.success('Card added successfully');
  };

  const setDefaultPayment = (id: string) => {
    setPaymentMethods(prev => prev.map(m => ({
      ...m,
      isDefault: m.id === id
    })));
    toast.success('Default payment method updated');
  };

  const removePaymentMethod = (id: string) => {
    setPaymentMethods(prev => prev.filter(m => m.id !== id));
    toast.success('Payment method removed');
  };

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
    'Ice Cream': 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=800&q=80',
    'Boba Tea': 'https://images.unsplash.com/photo-1558160074-4d7d8bdf4256?w=800&q=80',
    'Fruit Tea': 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=800&q=80'
  };

  const profileBg = categoryBackgrounds[mostOrderedCategory] || categoryBackgrounds['Pizza'];

  useEffect(() => {
    if (!user) return;

    setLoadingOrders(true);
    setLoadingSuggestions(true);
    
    let unsubscribeFirebase: (() => void) | undefined;
    let unsubscribeSupabase: (() => void) | undefined;
    let unsubscribeSuggestions: (() => void) | undefined;

    if (authType === 'firebase') {
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', (user as FirebaseUser).uid),
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

  if (!user) return null;

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

        <button 
          onClick={() => setIsDeleteModalOpen(true)}
          className="w-full p-6 text-red-400 font-bold hover:bg-red-500/5 transition-colors text-left"
        >
          Delete Account
        </button>
      </div>

      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface border border-red-500/30 p-8 rounded-3xl max-w-md w-full text-center space-y-6 shadow-2xl"
            >
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="text-red-500" size={40} />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">Delete Account?</h2>
                <p className="text-white/60 text-sm">
                  This action is permanent. You will lose all your Crave Points, order history, and saved restaurants.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  disabled={isDeleting}
                  onClick={async () => {
                    setIsDeleting(true);
                    try {
                      await deleteAccount();
                      toast.success('Account deleted successfully');
                    } catch (error: any) {
                      toast.error(error.message || 'Failed to delete account');
                    } finally {
                      setIsDeleting(false);
                      setIsDeleteModalOpen(false);
                    }
                  }}
                  className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : 'Yes, Delete Account'}
                </button>
                <button
                  disabled={isDeleting}
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="w-full py-4 bg-white/5 text-white rounded-2xl font-bold hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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

      <div className="bg-primary/10 border border-primary/20 p-6 rounded-3xl mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-primary/20 rounded-2xl text-primary">
            <Plus size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg">Have a Suggestion?</h3>
            <p className="text-sm text-white/60">Help us improve Crave by suggesting new features or restaurants!</p>
          </div>
        </div>
        <button 
          onClick={onOpenSuggestion}
          className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
        >
          Submit Suggestion
        </button>
      </div>

      {loadingSuggestions ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : suggestions.length > 0 ? (
        <div className="space-y-4">
          {suggestions.map(suggestion => (
            <div key={suggestion.id} className="bg-surface p-6 rounded-3xl border border-white/5 space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg">{suggestion.title}</h3>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                  suggestion.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                  suggestion.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-white/10 text-white/40'
                }`}>
                  {suggestion.status?.replace('_', ' ') || 'pending'}
                </span>
              </div>
              <p className="text-sm text-white/60">{suggestion.description}</p>
              <div className="flex items-center justify-between text-xs text-white/40 pt-2 border-t border-white/5">
                <span>By {suggestion.authorName || 'Anonymous'}</span>
                <span>{suggestion.createdAt?.toDate ? suggestion.createdAt.toDate().toLocaleDateString() : 'Recently'}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-surface rounded-3xl border border-white/5">
          <Plus size={48} className="mx-auto text-white/10 mb-4" />
          <h3 className="text-xl font-bold mb-2">No suggestions yet</h3>
          <p className="text-white/40">Be the first to suggest something!</p>
        </div>
      )}
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

      <div className="bg-surface p-6 rounded-3xl border border-white/5 space-y-6">
        <div className="flex items-center gap-4 text-emerald-400">
          <Database size={32} />
          <div>
            <h3 className="font-bold text-xl">Setup Your Database</h3>
            <p className="text-sm text-white/60">Run these SQL scripts in your Supabase SQL Editor</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white/40 uppercase tracking-wider">1. Profiles Table</span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  display_name text,
  email text,
  avatar_url text,
  crave_points integer default 0,
  driver_earnings decimal default 0,
  role text default 'customer',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);`);
                  toast.success('SQL copied!');
                }}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Code size={12} /> Copy SQL
              </button>
            </div>
            <pre className="bg-black/40 p-4 rounded-xl text-xs font-mono overflow-x-auto text-emerald-400/80 border border-white/5">
{`create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  display_name text,
  email text,
  avatar_url text,
  crave_points integer default 0,
  driver_earnings decimal default 0,
  role text default 'customer',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);`}
            </pre>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white/40 uppercase tracking-wider">2. Orders Table</span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`create table public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  restaurant_name text not null,
  total decimal not null,
  status text default 'pending' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);`);
                  toast.success('SQL copied!');
                }}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Code size={12} /> Copy SQL
              </button>
            </div>
            <pre className="bg-black/40 p-4 rounded-xl text-xs font-mono overflow-x-auto text-emerald-400/80 border border-white/5">
{`create table public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  restaurant_name text not null,
  total decimal not null,
  status text default 'pending' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);`}
            </pre>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white/40 uppercase tracking-wider">3. Restaurants Table & Rules</span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`create table public.restaurants (
  id text primary key,
  owner_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text,
  image text,
  rating decimal default 5.0,
  delivery_time text,
  delivery_fee decimal default 0,
  address text not null,
  lat decimal not null check (lat >= -90 and lat <= 90),
  lng decimal not null check (lng >= -180 and lng <= 180),
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.restaurants enable row level security;

-- RLS Policies for data integrity
create policy "Restaurants are viewable by everyone" 
  on public.restaurants for select using (true);

create policy "Users can insert their own restaurants" 
  on public.restaurants for insert 
  with check (auth.uid() = owner_id);

create policy "Users can update their own restaurants" 
  on public.restaurants for update 
  using (auth.uid() = owner_id);`);
                  toast.success('SQL copied!');
                }}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Code size={12} /> Copy SQL
              </button>
            </div>
            <pre className="bg-black/40 p-4 rounded-xl text-xs font-mono overflow-x-auto text-emerald-400/80 border border-white/5">
{`create table public.restaurants (
  id text primary key,
  owner_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text,
  image text,
  rating decimal default 5.0,
  delivery_time text,
  delivery_fee decimal default 0,
  address text not null,
  lat decimal not null check (lat >= -90 and lat <= 90),
  lng decimal not null check (lng >= -180 and lng <= 180),
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.restaurants enable row level security;

-- RLS Policies for data integrity
create policy "Restaurants are viewable by everyone" 
  on public.restaurants for select using (true);

create policy "Users can insert their own restaurants" 
  on public.restaurants for insert 
  with check (auth.uid() = owner_id);

create policy "Users can update their own restaurants" 
  on public.restaurants for update 
  using (auth.uid() = owner_id);`}
            </pre>
          </div>

          <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex gap-4">
            <div className="p-2 bg-emerald-500/20 rounded-lg h-fit">
              <ExternalLink size={16} className="text-emerald-400" />
            </div>
            <div className="text-sm">
              <p className="font-bold text-emerald-400 mb-1">Row Level Security (RLS)</p>
              <p className="text-white/60">Don't forget to enable RLS and add policies to allow users to read/write their own data.</p>
            </div>
          </div>
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
        <h2 className="text-2xl font-bold">{t.settingsMenu}</h2>
      </div>

      <div className="bg-surface rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/5 rounded-xl text-white/70"><Bell size={20} /></div>
            <div>
              <h3 className="font-medium text-lg">{t.notifications}</h3>
              <p className="text-sm text-white/50">{t.notificationsDesc}</p>
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
              <h3 className="font-medium text-lg">{t.paymentMethodsMenu}</h3>
              <p className="text-sm text-white/50">{t.paymentMethodsDesc}</p>
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
              <h3 className="font-medium text-lg">{t.privacySecurity}</h3>
              <p className="text-sm text-white/50">{t.privacySecurityDesc}</p>
            </div>
          </div>
          <ChevronRight className="text-white/40" />
        </div>
        
        <div 
          onClick={() => setActiveSection('supabase')}
          className="p-6 border-b border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/5 rounded-xl text-emerald-400"><Database size={20} /></div>
            <div>
              <h3 className="font-medium text-lg">Supabase Integration</h3>
              <p className="text-sm text-white/50">Database setup and SQL scripts</p>
            </div>
          </div>
          <ChevronRight className="text-white/40" />
        </div>

        {/* Language Switcher */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/5 rounded-xl text-blue-400"><Navigation size={20} /></div>
            <div>
              <h3 className="font-medium text-lg">{t.language}</h3>
              <p className="text-sm text-white/50">{t.languageDesc}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'en', name: 'English' },
              { id: 'ms', name: 'Malay' },
              { id: 'zh', name: '中文' },
            ].map((lang) => (
              <button
                key={lang.id}
                onClick={() => {
                  setLanguage(lang.id);
                  toast.success(`Language changed to ${lang.name}`);
                }}
                className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                  language === lang.id 
                    ? 'bg-primary/20 border-primary text-primary' 
                    : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                }`}
              >
                {lang.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-4">
        <button 
          onClick={logout}
          className="w-full py-4 bg-red-500/10 text-red-500 rounded-2xl font-bold hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
        >
          <LogOut size={20} /> {t.signOut}
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-8">
      <AnimatePresence mode="wait">
        {activeSection === 'saved' && <div key="saved">{renderSavedRestaurants()}</div>}
        {activeSection === 'promos' && <div key="promos">{renderPromos()}</div>}
        {activeSection === 'orders' && <div key="orders">{renderOrderHistory()}</div>}
        {activeSection === 'settings' && <div key="settings">{renderSettings()}</div>}
        {activeSection === 'payments' && <div key="payments">{renderPaymentMethods()}</div>}
        {activeSection === 'privacy' && <div key="privacy">{renderPrivacy()}</div>}
        {activeSection === 'suggestions' && <div key="suggestions">{renderSuggestions()}</div>}
        {activeSection === 'supabase' && <div key="supabase">{renderSupabaseGuide()}</div>}
        {activeSection === 'driver_dashboard' && (
          <div key="driver_dashboard">
            <DriverDashboard onBack={() => setActiveSection('main')} />
          </div>
        )}
        {activeSection === 'restaurant_dashboard' && (
          <div key="restaurant_dashboard">
            <RestaurantDashboardView 
              user={user}
              authType={authType}
              setActiveSection={setActiveSection}
              onOpenRestaurantOnboarding={onOpenRestaurantOnboarding}
              onSelectRestaurant={onSelectRestaurant}
              setSelectedRestaurantForOrders={setSelectedRestaurantForOrders}
              language={language}
              setLanguage={setLanguage}
            />
          </div>
        )}
        {activeSection === 'restaurant_orders' && (
          <div key="restaurant_orders">
            <RestaurantOrdersView 
              selectedRestaurantForOrders={selectedRestaurantForOrders}
              setActiveSection={setActiveSection}
            />
          </div>
        )}
        {activeSection === 'restaurant_menu' && (
          <div key="restaurant_menu">
            <RestaurantMenuView 
              restaurant={selectedRestaurantForOrders}
              setActiveSection={setActiveSection}
            />
          </div>
        )}
        
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
                <div className="flex-1">
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Enter your name"
                        className="bg-black/20 border border-white/10 rounded-xl px-3 py-1.5 text-white focus:border-primary outline-none transition-colors w-full max-w-[200px]"
                        autoFocus
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter' && newName.trim()) {
                            setIsSavingName(true);
                            try {
                              await updateProfileName(newName.trim());
                              setIsEditingName(false);
                              toast.success('Profile name updated!');
                            } catch (error) {
                              toast.error('Failed to update name');
                            } finally {
                              setIsSavingName(false);
                            }
                          } else if (e.key === 'Escape') {
                            setIsEditingName(false);
                          }
                        }}
                      />
                      <button
                        onClick={async () => {
                          if (newName.trim()) {
                            setIsSavingName(true);
                            try {
                              await updateProfileName(newName.trim());
                              setIsEditingName(false);
                              toast.success('Profile name updated!');
                            } catch (error) {
                              toast.error('Failed to update name');
                            } finally {
                              setIsSavingName(false);
                            }
                          }
                        }}
                        disabled={isSavingName || !newName.trim()}
                        className="p-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                      >
                        {isSavingName ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check size={16} />}
                      </button>
                      <button
                        onClick={() => setIsEditingName(false)}
                        disabled={isSavingName}
                        className="p-1.5 bg-white/10 text-white rounded-lg hover:bg-white/20 disabled:opacity-50"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold">{(user as any).displayName || (user as any).user_metadata?.full_name || 'Foodie'}</h2>
                      <button 
                        onClick={() => {
                          setNewName((user as any).displayName || (user as any).user_metadata?.full_name || '');
                          setIsEditingName(true);
                        }}
                        className="p-1 text-white/40 hover:text-white transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>
                  )}
                  <p className="text-white/60">{user.email}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                      {mostOrderedCategory} Lover
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ perspective: "1000px" }}>
              {(() => {
                const isMobile = typeof window !== 'undefined' && !window.matchMedia("(pointer: fine)").matches;
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={!isMobile ? { rotateX: 5, rotateY: -2, scale: 1.02 } : {}}
                    className="bg-gradient-to-br from-primary/20 to-surface rounded-3xl p-6 border border-primary/30 relative overflow-hidden shadow-2xl"
                  >
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
                    
                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <div>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                          <Star className="text-yellow-400 fill-yellow-400" size={24} />
                          {t.cravePoints}
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
                );
              })()}
            </div>

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
                  <span className="font-medium text-lg">{t.myOrders}</span>
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
                  <span className="font-medium text-lg">{t.communitySuggestions}</span>
                </div>
                <ChevronRight className="text-white/40" />
              </button>

              {/* Restaurant Section */}
              {role === 'restaurant' ? (
                <button 
                  onClick={() => setActiveSection('restaurant_dashboard')}
                  className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors border-b border-white/5 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                      <Utensils size={20} />
                    </div>
                    <div className="text-left">
                      <span className="font-medium text-lg block">{t.restaurantDashboard}</span>
                      <span className="text-xs text-white/40">{t.manageMenu}</span>
                    </div>
                  </div>
                  <ChevronRight className="text-white/40" />
                </button>
              ) : (
                <button 
                  onClick={onOpenRestaurantOnboarding}
                  className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors border-b border-white/5 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl text-primary group-hover:bg-primary group-hover:text-white transition-all">
                      <Store size={20} />
                    </div>
                    <div className="text-left">
                      <span className="font-medium text-lg block">{t.registerRestaurant}</span>
                      <span className="text-xs text-white/40">{t.earnPoints}</span>
                    </div>
                  </div>
                  <ChevronRight className="text-white/40" />
                </button>
              )}

              {/* Driver Section */}
              {role === 'driver' ? (
                <button 
                  onClick={() => setActiveSection('driver_dashboard')}
                  className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors border-b border-white/5 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                      <Navigation size={20} />
                    </div>
                    <div className="text-left">
                      <span className="font-medium text-lg block">{t.driverDashboard}</span>
                      <span className="text-xs text-white/40">{t.manageDeliveries}</span>
                    </div>
                  </div>
                  <ChevronRight className="text-white/40" />
                </button>
              ) : (
                <div className="p-6 bg-emerald-500/10 border-b border-white/5">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-emerald-500 rounded-xl text-white">
                      <Navigation size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-emerald-400">{t.earnWithCrave}</h4>
                      <p className="text-xs text-white/60">{t.deliverJoy}</p>
                    </div>
                  </div>
                  <button 
                    onClick={async () => {
                      try {
                        await setRole('driver');
                        toast.success('You are now a driver!');
                      } catch (error) {
                        toast.error('Failed to become a driver. Please try again.');
                      }
                    }}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20"
                  >
                    {t.becomeDriver}
                  </button>
                </div>
              )}

              <button 
                onClick={() => setActiveSection('settings')}
                className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors border-b border-white/5"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/5 rounded-xl text-white/70">
                    <Settings size={20} />
                  </div>
                  <span className="font-medium text-lg">{t.settings}</span>
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
                  <span className="font-medium text-lg">{t.logout}</span>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
