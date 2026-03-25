import { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search as SearchIcon, Star, Clock, Heart, Sparkles, MessageSquare } from 'lucide-react';
import { MOCK_RESTAURANTS } from '../data/mockData';
import { Restaurant } from '../types';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

interface SearchProps {
  onSelectRestaurant: (restaurant: Restaurant) => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
}

export function Search({ onSelectRestaurant, favorites, toggleFavorite }: SearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentReviews, setRecentReviews] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchRecentReviews = async () => {
      const reviews: Record<string, any> = {};
      for (const restaurant of MOCK_RESTAURANTS) {
        try {
          const q = query(
            collection(db, 'comments'),
            where('restaurantId', '==', restaurant.id),
            orderBy('createdAt', 'desc'),
            limit(1)
          );
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            reviews[restaurant.id] = snapshot.docs[0].data();
          }
        } catch (error) {
          console.error(`Error fetching review for ${restaurant.id}:`, error);
        }
      }
      setRecentReviews(reviews);
    };

    fetchRecentReviews();
  }, []);

  const topRatedRestaurants = useMemo(() => {
    return [...MOCK_RESTAURANTS].sort((a, b) => b.rating - a.rating).slice(0, 5);
  }, []);

  const mostlyOrderedRestaurants = useMemo(() => {
    return [...MOCK_RESTAURANTS].sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 5);
  }, []);

  const filteredRestaurants = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    return MOCK_RESTAURANTS.filter(r => 
      r.name.toLowerCase().includes(query) || 
      r.categories.some(c => c.toLowerCase().includes(query)) ||
      r.menu.some(m => m.name.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  return (
    <div className="pb-24 pt-8 px-6 max-w-5xl mx-auto space-y-8 relative min-h-screen">
      {/* Background Food Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full flex flex-wrap gap-20 p-10 rotate-12 scale-150">
          {['🍕', '🍣', '🍔', '🥗', '🍰', '🌮', '🍜', '🍦', '🍩', '🍗'].map((emoji, i) => (
            <div key={i} className="text-8xl grayscale">{emoji}</div>
          ))}
        </div>
      </div>

      <div className="relative z-10 space-y-8">
        <h1 className="text-3xl font-bold">Search</h1>
        
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for restaurants, dishes, or categories..."
            className="w-full bg-surface/80 backdrop-blur-xl border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-xl"
            autoFocus
          />
        </div>

        {searchQuery.trim() ? (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Results for "{searchQuery}"</h2>
            
            {filteredRestaurants.length === 0 ? (
              <div className="text-center py-12 text-white/50">
                No restaurants or dishes found matching your search.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRestaurants.map((restaurant, index) => (
                  <motion.div
                    key={restaurant.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => onSelectRestaurant(restaurant)}
                    className="bg-surface rounded-3xl overflow-hidden border border-white/5 hover:border-white/20 transition-all cursor-pointer group"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={restaurant.image} 
                        alt={restaurant.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(restaurant.id);
                        }}
                        className="absolute top-4 right-4 p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/60 transition-colors z-10"
                      >
                        <Heart 
                          size={20} 
                          className={favorites.includes(restaurant.id) ? "fill-primary text-primary" : "text-white"} 
                        />
                      </button>

                      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">{restaurant.name}</h3>
                          <p className="text-sm text-white/80">{restaurant.categories.join(' • ')}</p>
                        </div>
                        <div className="bg-white text-black px-2 py-1 rounded-lg font-bold text-sm flex items-center gap-1">
                          <Star size={14} className="fill-black" />
                          {restaurant.rating}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      {/* Recent Review Snippet */}
                      {recentReviews[restaurant.id] && (
                        <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <div className="flex gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} size={8} className={i < recentReviews[restaurant.id].rating ? "text-yellow-400 fill-yellow-400" : "text-white/10"} />
                              ))}
                            </div>
                            <span className="text-[9px] text-white/30 font-bold uppercase tracking-tighter">Recent Review</span>
                          </div>
                          <p className="text-[10px] text-white/50 italic line-clamp-1">
                            "{recentReviews[restaurant.id].text}"
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm text-white/60">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Clock size={16} />
                            {restaurant.deliveryTime}
                          </span>
                          <span>${restaurant.deliveryFee} delivery</span>
                        </div>
                        <span className="font-medium text-white/80">{restaurant.priceRange}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-10">
            {/* Top Rated Horizontal Scroll */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Star className="text-yellow-400 fill-yellow-400" size={24} />
                Top Rated
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 hide-scrollbar snap-x">
                {topRatedRestaurants.map((restaurant, i) => (
                  <motion.div
                    key={`top-${restaurant.id}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => onSelectRestaurant(restaurant)}
                    className="min-w-[200px] h-28 rounded-2xl overflow-hidden relative group cursor-pointer snap-start border border-white/5"
                  >
                    <img 
                      src={restaurant.image} 
                      alt={restaurant.name} 
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-sm font-bold text-white mb-0.5 line-clamp-1">{restaurant.name}</h3>
                      <div className="flex items-center gap-2 text-[10px] text-white/80">
                        <span className="flex items-center gap-1 font-bold text-yellow-400"><Star size={10} className="fill-current" /> {restaurant.rating}</span>
                        <span>•</span>
                        <span>{restaurant.categories[0]}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Mostly Ordered Horizontal Scroll */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Heart className="text-red-500 fill-red-500" size={24} />
                Mostly Ordered
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 hide-scrollbar snap-x">
                {mostlyOrderedRestaurants.map((restaurant, i) => (
                  <motion.div
                    key={`mostly-${restaurant.id}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => onSelectRestaurant(restaurant)}
                    className="min-w-[200px] h-28 rounded-2xl overflow-hidden relative group cursor-pointer snap-start border border-white/5"
                  >
                    <img 
                      src={restaurant.image} 
                      alt={restaurant.name} 
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-sm font-bold text-white mb-0.5 line-clamp-1">{restaurant.name}</h3>
                      <div className="flex items-center gap-2 text-[10px] text-white/80">
                        <span className="flex items-center gap-1 font-bold text-primary"><Sparkles size={10} className="fill-current" /> Popular</span>
                        <span>•</span>
                        <span>{restaurant.deliveryTime}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="text-primary" size={24} />
                All Restaurants
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MOCK_RESTAURANTS.map((restaurant, index) => (
                  <motion.div
                    key={restaurant.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => onSelectRestaurant(restaurant)}
                    className="bg-surface/50 backdrop-blur-md rounded-3xl overflow-hidden border border-white/5 hover:border-primary/30 transition-all cursor-pointer group shadow-lg"
                  >
                    <div className="relative h-40 overflow-hidden bg-surface-light">
                      <img 
                        src={restaurant.image} 
                        alt={restaurant.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=2080&auto=format&fit=crop';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
                      <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border border-white/10">
                        <Star size={12} className="text-yellow-400 fill-yellow-400" />
                        {restaurant.rating}
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors">{restaurant.name}</h3>
                      <p className="text-sm text-white/50 mb-3 line-clamp-1">{restaurant.categories.join(' • ')}</p>
                      
                      {/* Recent Review Snippet */}
                      {recentReviews[restaurant.id] && (
                        <div className="mb-3 p-2.5 bg-white/5 rounded-xl border border-white/5">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <div className="flex gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} size={8} className={i < recentReviews[restaurant.id].rating ? "text-yellow-400 fill-yellow-400" : "text-white/10"} />
                              ))}
                            </div>
                            <span className="text-[9px] text-white/30 font-bold uppercase tracking-tighter">Recent Review</span>
                          </div>
                          <p className="text-[10px] text-white/50 italic line-clamp-1">
                            "{recentReviews[restaurant.id].text}"
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-white/40">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {restaurant.deliveryTime}
                        </span>
                        <span className="font-bold text-white/60">{restaurant.priceRange}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary/10 to-surface p-10 rounded-[2.5rem] border border-primary/20 text-center space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -ml-16 -mb-16" />
              
              <div className="text-5xl mb-4">🍕🍔🍣🥤</div>
              <h3 className="text-2xl font-bold">Hungry for something specific?</h3>
              <p className="text-white/60 max-w-sm mx-auto">
                Search for your favorite dishes like <span className="text-primary font-semibold">"Dragon Roll"</span> or categories like <span className="text-primary font-semibold">"Drinks"</span>.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
