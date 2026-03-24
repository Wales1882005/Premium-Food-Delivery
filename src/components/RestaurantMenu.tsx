import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Star, Clock, Info, Plus, X } from 'lucide-react';
import { Restaurant, MenuItem } from '../types';

interface RestaurantMenuProps {
  key?: string;
  restaurant: Restaurant;
  onBack: () => void;
  onAddToCart: (item: MenuItem) => void;
}

export function RestaurantMenu({ restaurant, onBack, onAddToCart }: RestaurantMenuProps) {
  const [activeCategory, setActiveCategory] = useState(restaurant.menu[0]?.category || '');
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);

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
      const y = element.getBoundingClientRect().top + window.scrollY - 100;
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
      <div className="relative h-72 md:h-96">
        <img 
          src={restaurant.image} 
          alt={restaurant.name} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        
        <button 
          onClick={onBack}
          className="fixed top-6 left-4 z-50 p-3 bg-black/40 backdrop-blur-md rounded-full hover:bg-black/60 transition-colors border border-white/10 shadow-lg"
        >
          <ArrowLeft size={24} />
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-6 max-w-5xl mx-auto">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{restaurant.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm md:text-base">
              <button 
                onClick={() => setIsReviewsOpen(true)}
                className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 hover:bg-white/20 transition-colors cursor-pointer"
              >
                <Star size={18} className="text-yellow-400 fill-yellow-400" />
                <span className="font-bold">{restaurant.rating}</span>
                <span className="text-white/50 underline decoration-white/30 underline-offset-2">(Read Reviews)</span>
              </button>
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

      <div className="max-w-5xl mx-auto px-6 mt-8">
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
            <div key={category} id={`category-${category}`} className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-6">{category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {groupedMenu[category].map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-surface p-4 rounded-3xl border border-white/5 flex gap-4 group hover:border-white/10 transition-colors"
                  >
                    <div className="flex-1 flex flex-col justify-between">
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
                        onClick={() => onAddToCart(item)}
                        className="mt-4 w-fit flex items-center gap-2 bg-white/5 hover:bg-primary hover:text-white text-white/80 px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95"
                      >
                        <Plus size={16} /> Add to Order
                      </button>
                    </div>
                    <div className="w-32 h-32 shrink-0 rounded-2xl overflow-hidden bg-white/5">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews Modal */}
      <AnimatePresence>
        {isReviewsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-surface w-full max-w-lg rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                <div>
                  <h2 className="text-2xl font-bold">Reviews</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Star size={18} className="text-yellow-400 fill-yellow-400" />
                    <span className="font-bold text-lg">{restaurant.rating}</span>
                    <span className="text-white/50">out of 5</span>
                  </div>
                </div>
                <button 
                  onClick={() => setIsReviewsOpen(false)}
                  className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                {/* Mock Reviews */}
                {[
                  { name: "Sarah M.", rating: 5, date: "2 days ago", text: "Absolutely delicious! The food arrived hot and the portions were huge. Will definitely order again." },
                  { name: "David K.", rating: 4, date: "1 week ago", text: "Great flavors, but delivery took a little longer than expected. Still worth it." },
                  { name: "Emily R.", rating: 5, date: "2 weeks ago", text: "My go-to spot for weekend cravings. Never disappoints!" },
                  { name: "Michael T.", rating: 5, date: "1 month ago", text: "Best in the city. The packaging was also very secure." }
                ].map((review, idx) => (
                  <div key={idx} className="border-b border-white/5 pb-6 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold">{review.name}</span>
                      <span className="text-white/40 text-sm">{review.date}</span>
                    </div>
                    <div className="flex gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} className={i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-white/20"} />
                      ))}
                    </div>
                    <p className="text-white/70 text-sm leading-relaxed">{review.text}</p>
                  </div>
                ))}
              </div>

              <div className="p-6 border-t border-white/10 bg-white/5">
                <button className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity">
                  Write a Review
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
