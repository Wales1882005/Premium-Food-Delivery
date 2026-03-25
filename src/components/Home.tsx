import { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Star, Clock, ChevronRight, ArrowRight, Heart, Sparkles, Plus, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { MOCK_RESTAURANTS, CATEGORIES } from '../data/mockData';
import { Restaurant } from '../types';
import { ThreeDCard } from './ThreeDCard';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

const DIETARY_FILTERS = ['Vegan', 'Gluten-Free', 'Halal', 'Spicy'];

interface HomeProps {
  onSelectRestaurant: (restaurant: Restaurant) => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  onOpenMatchmaker?: () => void;
  onOpenSuggestion?: () => void;
  onSeeAllCategories?: () => void;
}

export function Home({ onSelectRestaurant, favorites, toggleFavorite, onOpenMatchmaker, onOpenSuggestion, onSeeAllCategories }: HomeProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDietaryFilters, setActiveDietaryFilters] = useState<string[]>([]);
  const [recentReviews, setRecentReviews] = useState<Record<string, any>>({});
  const resultsRef = useRef<HTMLElement>(null);

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

  const toggleDietaryFilter = (filter: string) => {
    setActiveDietaryFilters(prev => {
      const isRemoving = prev.includes(filter);
      const next = isRemoving ? prev.filter(f => f !== filter) : [...prev, filter];
      
      // Scroll to results if we are adding a filter
      if (!isRemoving) {
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
      
      return next;
    });
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

  const topRatedRestaurants = useMemo(() => {
    return [...MOCK_RESTAURANTS].sort((a, b) => b.rating - a.rating).slice(0, 6);
  }, []);

  const mostlyOrderedRestaurants = useMemo(() => {
    return [...MOCK_RESTAURANTS].sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 6);
  }, []);

  const handleCategoryClick = (catName: string) => {
    const isActive = selectedCategory === catName;
    setSelectedCategory(isActive ? null : catName);
    
    if (!isActive) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  return (
    <div className="pb-24 pt-8 px-6 max-w-5xl mx-auto space-y-10">
      {/* Hero & Search */}
      <div style={{ perspective: "1000px" }}>
        <motion.section 
          initial={{ opacity: 0, y: 20, rotateX: 10 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          whileHover={{ rotateX: 2, rotateY: -1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
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
      </div>

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

      {/* Community Suggestions Banner */}
      <motion.section
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.08 }}
        className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-3xl p-6 border border-emerald-500/30 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
        <div className="relative z-10 flex-1">
          <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
            <Plus className="text-emerald-400" /> Community Suggestions
          </h2>
          <p className="text-white/80">Have a favorite restaurant or dish we're missing? Let us know and help us grow our community!</p>
        </div>
        <button 
          onClick={onOpenSuggestion}
          className="relative z-10 bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform shadow-[0_0_20px_rgba(16,185,129,0.4)] whitespace-nowrap"
        >
          Suggest Now
        </button>
      </motion.section>

      {/* Trending Now Horizontal Scroll - Moving Marquee */}
      <section className="space-y-6 overflow-hidden">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="text-primary" size={20} />
            Trending Now
          </h2>
        </div>
        
        <div className="relative -mx-6">
          <motion.div 
            className="flex gap-6 px-6 w-max"
            animate={{ x: [0, -1520] }} // 5 cards * (280px + 24px gap) = 1520px
            transition={{ 
              duration: 30, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            whileHover={{ animationPlayState: 'paused' }}
          >
            {[...MOCK_RESTAURANTS.slice(0, 5), ...MOCK_RESTAURANTS.slice(0, 5)].map((restaurant, i) => (
              <motion.div
                key={`${restaurant.id}-${i}`}
                onClick={() => onSelectRestaurant(restaurant)}
                className="min-w-[280px] h-40 rounded-3xl overflow-hidden relative group cursor-pointer border border-white/5"
              >
                <img 
                  src={restaurant.image} 
                  alt={restaurant.name} 
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-lg font-bold text-white mb-1">{restaurant.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-white/70">
                    <span className="flex items-center gap-1"><Star size={12} className="text-yellow-400 fill-yellow-400" /> {restaurant.rating}</span>
                    <span>•</span>
                    <span>{restaurant.deliveryTime}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Top Rated Horizontal Scroll */}
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Star className="text-yellow-400 fill-yellow-400" size={20} />
            Top Rated
          </h2>
        </div>
        <div className="flex gap-6 overflow-x-auto pb-4 -mx-6 px-6 hide-scrollbar snap-x">
          {topRatedRestaurants.map((restaurant, i) => (
            <motion.div
              key={`top-${restaurant.id}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => onSelectRestaurant(restaurant)}
              className="min-w-[220px] h-32 rounded-2xl overflow-hidden relative group cursor-pointer snap-start border border-white/5"
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
      </section>

      {/* Mostly Ordered Horizontal Scroll */}
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Heart className="text-red-500 fill-red-500" size={20} />
            Mostly Ordered
          </h2>
        </div>
        <div className="flex gap-6 overflow-x-auto pb-4 -mx-6 px-6 hide-scrollbar snap-x">
          {mostlyOrderedRestaurants.map((restaurant, i) => (
            <motion.div
              key={`mostly-${restaurant.id}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => onSelectRestaurant(restaurant)}
              className="min-w-[220px] h-32 rounded-2xl overflow-hidden relative group cursor-pointer snap-start border border-white/5"
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
      </section>

      {/* Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        
        {/* Categories (Spans 2 columns on desktop) */}
        <div className="md:col-span-2" style={{ perspective: "1000px" }}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ rotateX: 1, rotateY: -1, scale: 1.005 }}
            transition={{ delay: 0.1 }}
            className="h-full bg-surface rounded-3xl p-6 border border-white/5 shadow-xl overflow-hidden relative"
          >
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="text-primary" size={20} />
                Explore Categories
              </h2>
              <button 
                onClick={() => {
                  if (onSeeAllCategories) {
                    onSeeAllCategories();
                  } else {
                    setSelectedCategory(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="text-sm text-primary hover:text-primary-hover flex items-center gap-1 font-semibold"
              >
                See all <ChevronRight size={16} />
              </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 relative z-10">
              {CATEGORIES.map((cat, i) => {
                const isActive = selectedCategory === cat.name;
                return (
                  <motion.div
                    key={cat.name}
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCategoryClick(cat.name)}
                    className={`relative h-24 rounded-2xl overflow-hidden cursor-pointer group border-2 transition-all ${
                      isActive ? 'border-primary shadow-lg shadow-primary/20' : 'border-transparent hover:border-white/20'
                    }`}
                  >
                    <img 
                      src={cat.image} 
                      alt={cat.name} 
                      className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                      referrerPolicy="no-referrer"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t ${isActive ? 'from-primary/80' : 'from-black/80'} to-transparent`} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                      <span className="text-2xl mb-1 drop-shadow-lg">{cat.icon}</span>
                      <span className="text-xs font-bold uppercase tracking-wider text-white drop-shadow-lg">{cat.name}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Recently Ordered (1 column) */}
        <div style={{ perspective: "1000px" }}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ rotateX: 5, rotateY: 2, scale: 1.02 }}
            transition={{ delay: 0.2 }}
            className="h-full bg-surface rounded-3xl border border-white/5 shadow-xl overflow-hidden group cursor-pointer relative"
            onClick={() => onSelectRestaurant(MOCK_RESTAURANTS[0])}
          >
            <div className="absolute inset-0">
              <img 
                src={MOCK_RESTAURANTS[0].image} 
                alt="Last order" 
                className="w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/60 to-transparent" />
            </div>

            <div className="relative z-10 p-6 h-full flex flex-col justify-between">
              <div>
                <div className="bg-primary text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full w-fit mb-4 shadow-lg shadow-primary/30">
                  Order Again
                </div>
                <h2 className="text-2xl font-black leading-tight mb-2 group-hover:text-primary transition-colors">
                  {MOCK_RESTAURANTS[0].name}
                </h2>
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <Clock size={14} />
                  <span>Delivered 2 days ago</span>
                </div>
              </div>
              
              <div className="mt-8 flex items-center justify-between">
                <div className="flex items-center gap-1 text-primary font-bold">
                  Reorder <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </div>
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                  <Heart size={18} className="fill-current" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

      </section>

      {/* Top Picks */}
      <motion.section
        ref={resultsRef}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredRestaurants.map((restaurant, i) => (
              <div key={restaurant.id} style={{ perspective: "1000px" }}>
                <ThreeDCard onClick={() => onSelectRestaurant(restaurant)}>
                  <div className="bg-surface rounded-3xl overflow-hidden border border-white/5 cursor-pointer group h-full shadow-xl">
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={restaurant.image} 
                        alt={restaurant.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
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
                      
                      {/* Recent Review Snippet */}
                      {recentReviews[restaurant.id] && (
                        <div className="mb-4 p-3 bg-white/5 rounded-xl border border-white/5 relative group/review">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} size={8} className={i < recentReviews[restaurant.id].rating ? "text-yellow-400 fill-yellow-400" : "text-white/10"} />
                              ))}
                            </div>
                            <span className="text-[10px] text-white/40 font-bold uppercase tracking-tighter">Recent Review</span>
                          </div>
                          <p className="text-[11px] text-white/60 italic line-clamp-1">
                            "{recentReviews[restaurant.id].text}"
                          </p>
                        </div>
                      )}

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
                  </div>
                </ThreeDCard>
              </div>
            ))}
          </div>
        )}
      </motion.section>
    </div>
  );
}
