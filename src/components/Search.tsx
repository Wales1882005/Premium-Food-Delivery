import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Search as SearchIcon, Star, Clock, Heart } from 'lucide-react';
import { MOCK_RESTAURANTS } from '../data/mockData';
import { Restaurant } from '../types';

interface SearchProps {
  onSelectRestaurant: (restaurant: Restaurant) => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
}

export function Search({ onSelectRestaurant, favorites, toggleFavorite }: SearchProps) {
  const [searchQuery, setSearchQuery] = useState('');

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
    <div className="pb-24 pt-8 px-6 max-w-5xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Search</h1>
      
      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for restaurants, dishes, or categories..."
          className="w-full bg-surface border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-xl"
          autoFocus
        />
      </div>

      {searchQuery.trim() && (
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
                  transition={{ delay: index * 0.1 }}
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

                  <div className="p-4 flex items-center justify-between text-sm text-white/60">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Clock size={16} />
                        {restaurant.deliveryTime}
                      </span>
                      <span>${restaurant.deliveryFee} delivery</span>
                    </div>
                    <span className="font-medium text-white/80">{restaurant.priceRange}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {!searchQuery.trim() && (
        <div className="text-center py-12 text-white/50">
          Start typing to search for your favorite food...
        </div>
      )}
    </div>
  );
}
