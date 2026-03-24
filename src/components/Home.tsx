import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Search, Star, Clock, ChevronRight, ArrowRight, Heart, Sparkles } from 'lucide-react';
import { MOCK_RESTAURANTS, CATEGORIES } from '../data/mockData';
import { Restaurant } from '../types';

const DIETARY_FILTERS = ['Vegan', 'Gluten-Free', 'Halal', 'Spicy'];

interface HomeProps {
  onSelectRestaurant: (restaurant: Restaurant) => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  onOpenMatchmaker?: () => void;
}

export function Home({ onSelectRestaurant, favorites, toggleFavorite, onOpenMatchmaker }: HomeProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDietaryFilters, setActiveDietaryFilters] = useState<string[]>([]);

  const toggleDietaryFilter = (filter: string) => {
    setActiveDietaryFilters(prev => 
      prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
    );
  };

  const filteredRestaurants = useMemo(() => {
    let result = MOCK_RESTAURANTS;
    
    if (selectedCategory) {
      result = result.filter(r => r.categories.includes(selectedCategory));
    }
    
    if (activeDietaryFilters.length > 0) {
      result = result.filter(r => {
        // A restaurant matches if it has at least one menu item that satisfies ALL active dietary filters
        return r.menu.some(item => 
          activeDietaryFilters.every(filter => item.tags?.includes(filter))
        );
      });
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(r => 
        r.name.toLowerCase().includes(query) || 
        r.categories.some(c => c.toLowerCase().includes(query)) ||
        r.menu.some(m => m.name.toLowerCase().includes(query))
      );
    }
    
    return result;
  }, [selectedCategory, searchQuery, activeDietaryFilters]);

  return (
    <div className="pb-24 pt-8 px-6 max-w-5xl mx-auto space-y-10">
      {/* Hero & Search */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10"
      >
        {/* Appetizing Background */}
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?q=80&w=2070&auto=format&fit=crop" 
            alt="Delicious food craving" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>

        <div className="relative z-10 p-8 md:p-12 lg:p-16 space-y-8 w-full md:w-3/4 lg:w-2/3">
          <div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-4 leading-[1.1] tracking-tight">
              What are you <br/> 
              <span className="relative inline-block mt-2">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-400 to-yellow-400 font-serif italic pr-4">craving</span>
                <motion.span 
                  animate={{ rotate: [0, 14, -8, 14, 0], scale: [1, 1.1, 1] }} 
                  transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                  className="absolute -right-12 -top-6 text-5xl md:text-6xl inline-block drop-shadow-2xl"
                >
                  😋
                </motion.span>
              </span> <br className="md:hidden" />today?
            </h1>
            <p className="text-white/80 text-lg md:text-xl font-medium max-w-md mt-4">
              Discover premium, mouth-watering food delivered fast to your door.
            </p>
          </div>

          <div className="relative group max-w-md">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="text-white/60 group-focus-within:text-primary transition-colors" size={20} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for restaurants, dishes..."
              className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all backdrop-blur-md shadow-2xl"
            />
          </div>

          {/* Dietary Filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            {DIETARY_FILTERS.map(filter => (
              <button
                key={filter}
                onClick={() => toggleDietaryFilter(filter)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border backdrop-blur-md ${
                  activeDietaryFilters.includes(filter)
                    ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                    : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20 hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </motion.section>

      {/* AI Matchmaker Banner */}
      <motion.section
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.05 }}
        className="bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl p-6 border border-purple-500/30 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
        <div className="relative z-10 flex-1">
          <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
            <Sparkles className="text-purple-400" /> AI Food Matchmaker
          </h2>
          <p className="text-white/80">Can't decide? Tell our AI what you're craving and get a personalized recommendation instantly.</p>
        </div>
        <button 
          onClick={onOpenMatchmaker}
          className="relative z-10 bg-white text-black px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform shadow-[0_0_20px_rgba(168,85,247,0.4)] whitespace-nowrap"
        >
          Surprise Me!
        </button>
      </motion.section>

      {/* Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Categories (Spans 2 columns on desktop) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-2 bg-surface rounded-3xl p-6 border border-white/5"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Categories</h2>
            <button className="text-sm text-primary hover:text-primary-hover flex items-center gap-1">
              See all <ChevronRight size={16} />
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
            {CATEGORIES.map((cat, i) => {
              const isActive = selectedCategory === cat.name;
              return (
                <motion.div
                  key={cat.name}
                  whileHover={{ y: -4 }}
                  onClick={() => setSelectedCategory(isActive ? null : cat.name)}
                  className="min-w-[80px] flex flex-col items-center gap-3 cursor-pointer group"
                >
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transition-colors border ${
                    isActive 
                      ? 'bg-primary/20 border-primary/50' 
                      : 'bg-white/5 border-white/10 group-hover:bg-primary/10 group-hover:border-primary/30'
                  }`}>
                    {cat.icon}
                  </div>
                  <span className={`text-sm font-medium transition-colors ${
                    isActive ? 'text-primary' : 'text-white/80 group-hover:text-white'
                  }`}>
                    {cat.name}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Recently Ordered (1 column) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-primary/20 to-surface rounded-3xl p-6 border border-primary/20 flex flex-col justify-between cursor-pointer hover:border-primary/40 transition-colors relative overflow-hidden group"
          onClick={() => onSelectRestaurant(MOCK_RESTAURANTS[0])}
        >
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-colors" />
          <div>
            <div className="bg-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-full w-fit mb-4 backdrop-blur-md border border-primary/20">
              Order Again
            </div>
            <h2 className="text-2xl font-bold leading-tight mb-2">Sakura Sushi House</h2>
            <p className="text-white/60 text-sm">Delivered 2 days ago</p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-primary font-semibold">
            Reorder <ArrowRight size={16} />
          </div>
        </motion.div>

      </section>

      {/* Top Picks */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-2xl font-bold mb-6">
          {searchQuery ? 'Search Results' : selectedCategory ? `${selectedCategory} Restaurants` : 'Top Picks For You'}
        </h2>
        
        {filteredRestaurants.length === 0 ? (
          <div className="text-center py-12 bg-surface rounded-3xl border border-white/5">
            <p className="text-white/50 text-lg">No restaurants found.</p>
            <button 
              onClick={() => { setSelectedCategory(null); setSearchQuery(''); }}
              className="mt-4 text-primary hover:text-primary-hover font-medium"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRestaurants.map((restaurant, i) => (
              <motion.div
                key={restaurant.id}
                whileHover={{ y: -8 }}
                onClick={() => onSelectRestaurant(restaurant)}
                className="bg-surface rounded-3xl overflow-hidden border border-white/5 cursor-pointer group"
              >
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={restaurant.image} 
                  alt={restaurant.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(restaurant.id);
                  }}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-black/60 transition-colors z-10"
                >
                  <Heart size={16} className={favorites.includes(restaurant.id) ? "fill-red-500 text-red-500" : "text-white"} />
                </button>
                <div className="absolute bottom-4 left-4 flex gap-2">
                  {restaurant.categories.slice(0, 2).map(cat => (
                    <span key={cat} className="bg-black/50 backdrop-blur-md text-xs font-medium px-2.5 py-1 rounded-lg border border-white/10">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold line-clamp-1">{restaurant.name}</h3>
                  <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-lg text-sm font-medium">
                    <Star size={14} className="text-yellow-400 fill-yellow-400" />
                    {restaurant.rating}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-white/50 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Clock size={16} />
                    {restaurant.deliveryTime}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                    ${restaurant.deliveryFee.toFixed(2)} delivery
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        )}
      </motion.section>
    </div>
  );
}
