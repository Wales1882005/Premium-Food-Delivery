import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Star, Clock, Info, Plus, X, MessageSquare, Send, UtensilsCrossed, Share2, Heart } from 'lucide-react';
import { Restaurant, MenuItem } from '../types';
import { ThreeDCard } from './ThreeDCard';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { RestaurantComments } from './RestaurantComments';

interface RestaurantMenuProps {
  key?: string;
  restaurant: Restaurant;
  onBack: () => void;
  onAddToCart: (item: MenuItem) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}

export function RestaurantMenu({ restaurant, onBack, onAddToCart, isFavorite, onToggleFavorite }: RestaurantMenuProps) {
  const { user, authType } = useAuth();
  const [activeTab, setActiveTab] = useState<'menu' | 'reviews'>('menu');
  const [activeCategory, setActiveCategory] = useState(restaurant.menu[0]?.category || '');
  const [commentsCount, setCommentsCount] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleShare = async () => {
    const shareData = {
      title: restaurant.name,
      text: `Check out ${restaurant.name} on Crave!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  useEffect(() => {
    const q = query(
      collection(db, 'comments'),
      where('restaurantId', '==', restaurant.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCommentsCount(snapshot.size);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'comments');
    });

    return () => unsubscribe();
  }, [restaurant.id]);

  // Group menu items by category
  const groupedMenu = restaurant.menu.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const categories = Object.keys(groupedMenu);

  const scrollToCategory = (category: string) => {
    setActiveCategory(category);
    const element = document.getElementById(`category-${category}`);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 160;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handleTabChange = (tab: 'menu' | 'reviews') => {
    setActiveTab(tab);
    if (contentRef.current) {
      const y = contentRef.current.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="pb-24 bg-background min-h-screen"
    >
      {/* Header Image & Info */}
      <div className="relative h-72 md:h-96" style={{ perspective: "1000px" }}>
        <motion.img 
          initial={{ scale: 1.1, rotateX: 5 }}
          animate={{ scale: 1, rotateX: 0 }}
          whileHover={{ scale: 1.05, rotateX: 2 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          src={restaurant.image} 
          alt={restaurant.name} 
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        
        <button 
          onClick={onBack}
          className="fixed top-6 left-4 z-50 p-3 bg-black/40 backdrop-blur-md rounded-full hover:bg-black/60 transition-colors border border-white/10 shadow-lg"
        >
          <ArrowLeft size={24} />
        </button>

        <div className="fixed top-6 right-4 z-50 flex gap-2">
          <button 
            onClick={handleShare}
            className="p-3 bg-black/40 backdrop-blur-md rounded-full hover:bg-black/60 transition-colors border border-white/10 shadow-lg"
          >
            <Share2 size={24} />
          </button>
          <button 
            onClick={() => onToggleFavorite(restaurant.id)}
            className={`p-3 backdrop-blur-md rounded-full transition-all border shadow-lg ${
              isFavorite 
                ? 'bg-primary border-primary text-white shadow-primary/20' 
                : 'bg-black/40 border-white/10 text-white hover:bg-black/60'
            }`}
          >
            <Heart size={24} className={isFavorite ? 'fill-white' : ''} />
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 max-w-5xl mx-auto">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{restaurant.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm md:text-base">
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                <Star size={18} className="text-yellow-400 fill-yellow-400" />
                <span className="font-bold">{restaurant.rating}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                <Clock size={18} className="text-white/70" />
                <span>{restaurant.deliveryTime}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                <Info size={18} className="text-white/70" />
                <span>${restaurant.deliveryFee.toFixed(2)} delivery</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-8" ref={contentRef}>
        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b border-white/5 pb-4">
          <button
            onClick={() => handleTabChange('menu')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${
              activeTab === 'menu' 
                ? 'bg-primary text-white shadow-lg shadow-primary/25' 
                : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            <UtensilsCrossed size={20} />
            Menu
          </button>
          <button
            onClick={() => handleTabChange('reviews')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${
              activeTab === 'reviews' 
                ? 'bg-primary text-white shadow-lg shadow-primary/25' 
                : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            <MessageSquare size={20} />
            Reviews
            {commentsCount > 0 && (
              <span className="bg-white/20 px-2 py-0.5 rounded-md text-[10px] ml-1">
                {commentsCount}
              </span>
            )}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'menu' ? (
            <motion.div
              key="menu-content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-12"
            >
              {/* Sticky Category Nav */}
              <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl py-4 -mx-6 px-6 border-b border-white/5 mb-8">
                <div className="flex gap-3 overflow-x-auto hide-scrollbar">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => scrollToCategory(cat)}
                      className={`px-5 py-2.5 rounded-full font-medium whitespace-nowrap transition-all ${
                        activeCategory === cat 
                          ? 'bg-primary text-white shadow-lg shadow-primary/25' 
                          : 'bg-surface text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Menu Items */}
              <div className="space-y-12">
                {categories.map(category => (
                  <div key={category} id={`category-${category}`} className="scroll-mt-32">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-1.5 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(255,100,0,0.5)]" />
                      <h2 className="text-3xl font-black tracking-tight">{category}</h2>
                      <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent ml-4" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {groupedMenu[category].map((item, i) => (
                        <div key={item.id} className="bg-surface p-4 rounded-3xl border border-white/5 flex flex-col sm:flex-row gap-4 transition-colors h-full shadow-lg">
                          <div className="w-full h-48 sm:w-32 sm:h-32 shrink-0 rounded-2xl overflow-hidden bg-white/5 relative sm:order-2">
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              className="w-full h-full object-cover md:hover:scale-110 transition-transform duration-500"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=2080&auto=format&fit=crop';
                              }}
                            />
                            {item.tags.includes('Popular') && (
                              <div className="absolute top-2 left-2 bg-primary text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md shadow-lg">
                                Popular
                              </div>
                            )}
                          </div>
                          <div className="flex-1 flex flex-col justify-between sm:order-1">
                            <div>
                              <div className="flex justify-between items-start mb-1">
                                <h3 className="text-lg font-bold">{item.name}</h3>
                                <span className="text-primary font-bold">${item.price.toFixed(2)}</span>
                              </div>
                              <p className="text-white/50 text-sm line-clamp-2 mb-3">{item.description}</p>
                              <div className="flex gap-2 flex-wrap">
                                {item.tags.map(tag => (
                                  <span key={tag} className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 bg-white/5 text-white/70 rounded-md border border-white/10">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddToCart(item);
                              }}
                              className="relative z-10 mt-4 w-full bg-primary text-white py-4 rounded-2xl text-base font-bold shadow-lg flex items-center justify-center gap-2 touch-manipulation select-none"
                              style={{ WebkitTapHighlightColor: 'transparent' }}
                            >
                              <Plus size={20} className="pointer-events-none" /> 
                              <span className="pointer-events-none">Add to Order</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="reviews-content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <RestaurantComments 
                restaurantId={restaurant.id} 
                restaurantName={restaurant.name} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
