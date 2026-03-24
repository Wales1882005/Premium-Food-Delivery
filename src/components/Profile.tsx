import { motion } from 'motion/react';
import { User, Star, Gift, ChevronRight, Settings, LogOut, Heart, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Profile() {
  const { user, cravePoints, login, logout } = useAuth();
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

  return (
    <div className="pb-24 pt-8 px-6 max-w-5xl mx-auto space-y-8">
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
        <button className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/5 rounded-xl text-primary">
              <Heart size={20} />
            </div>
            <span className="font-medium text-lg">Saved Restaurants</span>
          </div>
          <ChevronRight className="text-white/40" />
        </button>
        
        <button className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/5 rounded-xl text-blue-400">
              <Gift size={20} />
            </div>
            <span className="font-medium text-lg">Promos & Offers</span>
          </div>
          <ChevronRight className="text-white/40" />
        </button>

        <button className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors border-b border-white/5">
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
    </div>
  );
}
