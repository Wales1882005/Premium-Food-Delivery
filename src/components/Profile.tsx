import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Star, Gift, ChevronRight, Settings, LogOut, Heart, LogIn, ArrowLeft, Clock, Bell, CreditCard, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Restaurant } from '../types';
import { MOCK_RESTAURANTS } from '../data/mockData';

interface ProfileProps {
  favorites: string[];
  toggleFavorite: (id: string) => void;
  onSelectRestaurant: (restaurant: Restaurant) => void;
}

export function Profile({ favorites, toggleFavorite, onSelectRestaurant }: ProfileProps) {
  const { user, cravePoints, login, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<'main' | 'saved' | 'promos' | 'settings'>('main');
  
  const pointsToNextReward = 500;
  const progress = Math.min((cravePoints / pointsToNextReward) * 100, 100);

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
        <button 
          onClick={login}
          className="bg-primary text-white font-bold py-4 px-8 rounded-2xl flex items-center gap-3 hover:opacity-90 transition-opacity mt-4 shadow-lg shadow-primary/20"
        >
          <LogIn size={20} />
          Continue with Google
        </button>
      </div>
    );
  }

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

        {savedRestaurants.length === 0 ? (
          <div className="text-center py-12 text-white/50 bg-surface rounded-3xl border border-white/5">
            <Heart size={48} className="mx-auto mb-4 text-white/20" />
            <p>You haven't saved any restaurants yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedRestaurants.map(restaurant => (
              <div 
                key={restaurant.id}
                onClick={() => onSelectRestaurant(restaurant)}
                className="bg-surface rounded-3xl overflow-hidden border border-white/5 hover:border-white/20 transition-all cursor-pointer flex"
              >
                <img 
                  src={restaurant.image} 
                  alt={restaurant.name}
                  className="w-32 h-32 object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="p-4 flex flex-col justify-between flex-1">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-lg">{restaurant.name}</h3>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(restaurant.id);
                        }}
                        className="text-primary"
                      >
                        <Heart size={20} className="fill-primary" />
                      </button>
                    </div>
                    <p className="text-sm text-white/60">{restaurant.categories.join(', ')}</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-white/80">
                    <span className="flex items-center gap-1"><Star size={14} className="fill-yellow-400 text-yellow-400" /> {restaurant.rating}</span>
                    <span className="flex items-center gap-1"><Clock size={14} /> {restaurant.deliveryTime}</span>
                  </div>
                </div>
              </div>
            ))}
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

      <div className="text-center py-16 px-6 bg-surface rounded-3xl border border-white/5">
        <Gift size={48} className="mx-auto mb-4 text-white/20" />
        <h3 className="text-xl font-bold mb-2">No active promos</h3>
        <p className="text-white/50">You don't have any promos or offers right now. Check back later for special deals!</p>
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
        
        <div className="p-6 border-b border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/5 rounded-xl text-white/70"><CreditCard size={20} /></div>
            <div>
              <h3 className="font-medium text-lg">Payment Methods</h3>
              <p className="text-sm text-white/50">Manage cards and Apple Pay</p>
            </div>
          </div>
          <ChevronRight className="text-white/40" />
        </div>

        <div className="p-6 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors">
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
        {activeSection === 'settings' && <div key="settings">{renderSettings()}</div>}
        
        {activeSection === 'main' && (
          <motion.div
            key="main"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8"
          >
            <h1 className="text-3xl font-bold">Profile</h1>

            <div className="flex items-center gap-6 bg-surface p-6 rounded-3xl border border-white/5 shadow-xl">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'User'} className="w-20 h-20 rounded-full border-4 border-background shadow-lg object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-orange-400 flex items-center justify-center text-3xl font-bold border-4 border-background shadow-lg">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold">{user.displayName || 'Foodie'}</h2>
                <p className="text-white/60">{user.email}</p>
              </div>
            </div>

            {/* Crave Points Gamification */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-primary/20 to-surface rounded-3xl p-6 border border-primary/30 relative overflow-hidden"
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
