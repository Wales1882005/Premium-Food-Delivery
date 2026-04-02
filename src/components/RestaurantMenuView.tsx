import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import { Restaurant, MenuItem } from '../types';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';

interface RestaurantMenuViewProps {
  restaurant: Restaurant | null;
  setActiveSection: (section: any) => void;
}

export const RestaurantMenuView = ({ restaurant, setActiveSection }: RestaurantMenuViewProps) => {
  const [menu, setMenu] = useState<MenuItem[]>(restaurant?.menu || []);
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: '',
    description: '',
    price: 0,
    category: 'Mains',
    image: '',
    tags: []
  });

  if (!restaurant) return null;

  const handleSaveMenu = async (updatedMenu: MenuItem[]) => {
    try {
      await updateDoc(doc(db, 'restaurants', restaurant.id), {
        menu: updatedMenu
      });
      setMenu(updatedMenu);
      toast.success('Menu updated successfully!');
    } catch (error) {
      console.error('Error updating menu:', error);
      toast.error('Failed to update menu');
    }
  };

  const handleAddItem = () => {
    const price = Number(newItem.price);
    if (!newItem.name?.trim() || isNaN(price) || price < 0) {
      toast.error('Valid name and price are required');
      return;
    }

    const itemToAdd: MenuItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: newItem.name.trim(),
      description: newItem.description?.trim() || '',
      price: price,
      category: newItem.category || 'Mains',
      image: newItem.image || `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80`,
      tags: newItem.tags || []
    };

    const updatedMenu = [...menu, itemToAdd];
    handleSaveMenu(updatedMenu);
    setIsAdding(false);
    setNewItem({ name: '', description: '', price: 0, category: 'Mains', image: '', tags: [] });
  };

  const handleDeleteItem = (itemId: string) => {
    const updatedMenu = menu.filter(item => item.id !== itemId);
    handleSaveMenu(updatedMenu);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 300;
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
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setNewItem({ ...newItem, image: dataUrl });
        toast.success('Image processed successfully!');
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
    
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
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setActiveSection('restaurant_dashboard')}
            className="p-2 bg-surface rounded-full hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-bold">Manage Menu</h2>
            <p className="text-white/60">{restaurant.name}</p>
          </div>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-4 py-2 bg-primary rounded-xl font-bold hover:scale-105 transition-all"
        >
          <Plus size={20} /> Add Item
        </button>
      </div>

      {isAdding && (
        <div className="bg-surface rounded-3xl p-6 border border-white/5 mb-8 space-y-4">
          <h3 className="text-lg font-bold">New Menu Item</h3>
          
          {/* Image Preview Area */}
          <div className="relative h-48 rounded-2xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center group">
            {newItem.image ? (
              <img src={newItem.image} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="text-center text-white/40">
                <ImageIcon size={48} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No image selected</p>
              </div>
            )}
            
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
              <div className="flex flex-col gap-2 p-2">
                <div className="flex gap-2">
                  <label className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/80 rounded-xl font-bold transition-all cursor-pointer text-sm shadow-lg shadow-primary/20">
                    <ImageIcon size={18} /> Upload Food Photo
                    <input 
                      type="file" 
                      accept="image/jpeg, image/png, image/webp" 
                      className="hidden" 
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Item Name"
              value={newItem.name}
              onChange={e => setNewItem({...newItem, name: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-primary"
            />
            <input
              type="number"
              placeholder={`Price (${restaurant.currencySymbol || '$'})`}
              value={newItem.price === 0 ? '' : newItem.price}
              onChange={e => setNewItem({...newItem, price: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-primary"
            />
            <input
              type="text"
              placeholder="Category (e.g., Mains, Drinks)"
              value={newItem.category}
              onChange={e => setNewItem({...newItem, category: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-primary"
            />
            <input
              type="text"
              placeholder="Or paste Image URL manually..."
              value={newItem.image}
              onChange={e => setNewItem({...newItem, image: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-primary"
            />
          </div>
          <textarea
            placeholder="Description"
            value={newItem.description}
            onChange={e => setNewItem({...newItem, description: e.target.value})}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-primary h-24 resize-none"
          />
          <div className="flex justify-end gap-2">
            <button 
              onClick={() => setIsAdding(false)}
              className="px-6 py-2 bg-white/10 rounded-xl font-bold hover:bg-white/20 transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={handleAddItem}
              className="px-6 py-2 bg-primary rounded-xl font-bold hover:scale-105 transition-all"
            >
              Save Item
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {menu.length === 0 ? (
          <div className="text-center py-12 bg-surface rounded-3xl border border-white/5">
            <p className="text-white/60">No items in your menu yet.</p>
          </div>
        ) : (
          menu.map(item => (
            <div key={item.id} className="flex items-center justify-between bg-surface p-4 rounded-2xl border border-white/5">
              <div className="flex items-center gap-4">
                <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover" referrerPolicy="no-referrer" />
                <div>
                  <h4 className="font-bold">{item.name}</h4>
                  <p className="text-sm text-white/60">{item.category} • {restaurant.currencySymbol || '$'}{item.price.toFixed(2)}</p>
                </div>
              </div>
              <button 
                onClick={() => handleDeleteItem(item.id)}
                className="p-2 text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};
