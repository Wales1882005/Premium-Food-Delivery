import { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Store, Utensils, Clock, DollarSign, Image as ImageIcon, Check, ChevronRight, ChevronLeft, Sparkles, MapPin, Navigation, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { supabase } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Custom Leaflet icon to match the app's theme
const customIcon = new L.DivIcon({
  className: 'custom-leaflet-icon',
  html: `<div style="background-color: #ea580c; color: white; padding: 0.5rem; border-radius: 9999px; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36]
});

function DraggableMarker({ lat, lng, setFormData }: { lat: number, lng: number, setFormData: React.Dispatch<React.SetStateAction<any>> }) {
  const markerRef = useRef<L.Marker>(null);
  const map = useMap();

  useEffect(() => {
    map.flyTo([lat, lng], map.getZoom());
  }, [lat, lng, map]);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const position = marker.getLatLng();
          setFormData((prev: any) => ({ ...prev, lat: position.lat, lng: position.lng }));
        }
      },
    }),
    [setFormData],
  );

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={[lat, lng]}
      icon={customIcon}
      ref={markerRef}
    />
  );
}

interface RestaurantOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function RestaurantOnboarding({ isOpen, onClose, onComplete }: RestaurantOnboardingProps) {
  const { user, authType, updateCravePoints } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    image: '',
    deliveryTime: '20-30 min',
    deliveryFee: 2.99,
    priceRange: '$$' as '$' | '$$' | '$$$' | '$$$$',
    address: '',
    lat: 3.1390, // Default to KL
    lng: 101.6869,
  });

  const categories = ['Burger', 'Pizza', 'Sushi', 'Dessert', 'Healthy', 'Asian', 'Italian', 'Mexican'];

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to register your restaurant');
      return;
    }

    setIsSubmitting(true);
    try {
      const userId = authType === 'firebase' ? (user as FirebaseUser).uid : (user as SupabaseUser).id;
      const restaurantId = `rest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const restaurantData = {
        id: restaurantId,
        ownerId: userId,
        name: formData.name,
        description: formData.description,
        image: formData.image || `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80`,
        categories: [formData.category],
        rating: 5.0,
        deliveryTime: formData.deliveryTime,
        deliveryFee: formData.deliveryFee,
        priceRange: formData.priceRange,
        address: formData.address,
        lat: formData.lat,
        lng: formData.lng,
        isActive: true,
        menu: [], // Start with empty menu
        createdAt: serverTimestamp()
      };

      // 1. Create the restaurant document in Firestore (Primary data store)
      await setDoc(doc(db, 'restaurants', restaurantId), restaurantData);

      // 2. Update user role to 'restaurant'
      if (authType === 'firebase') {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, { role: 'restaurant' }, { merge: true });
      } else if (authType === 'supabase') {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ role: 'restaurant' })
          .eq('id', userId);
        
        if (profileError) throw profileError;

        // Also create the restaurant in Supabase for data integrity
        const { error: restaurantError } = await supabase
          .from('restaurants')
          .insert({
            id: restaurantId,
            owner_id: userId,
            name: formData.name,
            description: formData.description,
            image: formData.image || `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80`,
            rating: 5.0,
            delivery_time: formData.deliveryTime,
            delivery_fee: formData.deliveryFee,
            address: formData.address,
            lat: formData.lat,
            lng: formData.lng,
            is_active: true
          });
          
        if (restaurantError && restaurantError.code !== '42P01') {
          // Ignore 42P01 (relation does not exist) if the user hasn't created the table yet
          console.error('Error creating restaurant in Supabase:', restaurantError);
        }
      }

      // 3. Reward user for onboarding
      await updateCravePoints(500);

      toast.success('Restaurant registered successfully! Welcome to the community.');
      onComplete();
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'restaurants');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.name.trim()) {
        toast.error('Please enter a restaurant name');
        return;
      }
      if (!formData.address.trim()) {
        toast.error('Please enter a restaurant location');
        return;
      }
    }
    if (step === 2) {
      if (!formData.category) {
        toast.error('Please select a category');
        return;
      }
    }
    setStep(prev => Math.min(prev + 1, 3));
  };
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40, rotateX: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40, rotateX: 10 }}
            className="relative w-full max-w-2xl bg-surface rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Progress Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/5 z-10">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(step / 3) * 100}%` }}
                className="h-full bg-gradient-to-r from-primary to-orange-400"
              />
            </div>

            <div className="p-8 md:p-12 overflow-y-auto flex-1">
              <div className="flex items-center gap-4 mb-10">
                <button 
                  onClick={onClose}
                  className="p-3 hover:bg-white/10 rounded-full transition-colors -ml-3"
                >
                  <ArrowLeft size={28} />
                </button>
                <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center text-primary shrink-0">
                  <Store size={32} />
                </div>
                <div>
                  <h2 className="text-3xl font-black">Open Your Shop</h2>
                  <p className="text-white/50 font-medium">Step {step} of 3</p>
                </div>
              </div>

              <div className="min-h-[350px]">
                {step === 1 && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-primary">Restaurant Name</label>
                      <div className="relative">
                        <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                        <input 
                          type="text"
                          value={formData.name}
                          onChange={e => setFormData({...formData, name: e.target.value})}
                          placeholder="e.g. The Burger Palace"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-primary">Description</label>
                      <textarea 
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        placeholder="Tell us about your delicious food..."
                        rows={2}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-primary">Restaurant Location</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                          <input 
                            type="text"
                            value={formData.address}
                            onChange={e => setFormData({...formData, address: e.target.value})}
                            placeholder="e.g. Kuala Lumpur, Malaysia"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                          />
                        </div>
                        <button
                          onClick={async () => {
                            if (!formData.address) return;
                            try {
                              const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.address)}`);
                              const data = await response.json();
                              if (data && data.length > 0) {
                                setFormData(prev => ({
                                  ...prev,
                                  lat: parseFloat(data[0].lat),
                                  lng: parseFloat(data[0].lon)
                                }));
                                toast.success('Location found!');
                              } else {
                                toast.error('Location not found. Please try a different address or drag the pin manually.');
                              }
                            } catch (error) {
                              toast.error('Failed to find location.');
                            }
                          }}
                          className="px-6 py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-bold transition-all flex items-center gap-2"
                        >
                          <Navigation size={18} /> Locate
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-primary">Pin Point Location</label>
                      <div className="relative h-48 bg-zinc-900 rounded-2xl border border-white/10 overflow-hidden group z-0">
                        <MapContainer center={[formData.lat, formData.lng]} zoom={15} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                          />
                          <DraggableMarker lat={formData.lat} lng={formData.lng} setFormData={setFormData} />
                        </MapContainer>

                        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center pointer-events-none z-[1000]">
                          <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[10px] font-mono pointer-events-auto">
                            {formData.lat.toFixed(4)}, {formData.lng.toFixed(4)}
                          </div>
                          <div className="flex gap-1 pointer-events-auto">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-[10px] text-white/40 font-bold uppercase tracking-tighter">Live GPS</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-white/30 italic">Drag the pin to precisely mark your restaurant's location for deliveries.</p>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-primary">Main Category</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {categories.map(cat => (
                          <button
                            key={cat}
                            onClick={() => setFormData({...formData, category: cat})}
                            className={`py-3 rounded-xl text-sm font-bold transition-all border ${
                              formData.category === cat 
                                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-primary">Restaurant Image</label>
                      
                      {/* Image Preview Area */}
                      <div className="relative h-48 rounded-2xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center group mb-4">
                        {formData.image ? (
                          <img src={formData.image} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="text-center text-white/40">
                            <ImageIcon size={48} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No image selected</p>
                          </div>
                        )}
                        
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-sm p-4">
                          <div className="flex gap-2">
                            <label className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/80 rounded-xl font-bold transition-all cursor-pointer text-sm shadow-lg shadow-primary/20">
                              <ImageIcon size={18} /> Upload Restaurant Photo
                              <input 
                                type="file" 
                                accept="image/jpeg, image/png, image/webp" 
                                className="hidden" 
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;

                                  const reader = new FileReader();
                                  reader.onload = (ev) => {
                                    const img = new Image();
                                    img.onload = () => {
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
                                      setFormData({ ...formData, image: dataUrl });
                                      toast.success('Image processed successfully!');
                                    };
                                    img.src = ev.target?.result as string;
                                  };
                                  reader.readAsDataURL(file);
                                  
                                  if (e.target) {
                                    e.target.value = '';
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="relative">
                        <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                        <input 
                          type="url"
                          value={formData.image}
                          onChange={e => setFormData({...formData, image: e.target.value})}
                          placeholder="Or paste Image URL manually..."
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                        />
                      </div>
                      <p className="text-[10px] text-white/30 italic">Upload a photo of your restaurant or provide a direct image link.</p>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-primary">Delivery Time</label>
                        <div className="relative">
                          <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                          <input 
                            type="text"
                            value={formData.deliveryTime}
                            onChange={e => setFormData({...formData, deliveryTime: e.target.value})}
                            placeholder="20-30 min"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-primary">Delivery Fee</label>
                        <div className="relative">
                          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                          <input 
                            type="number"
                            step="0.01"
                            value={formData.deliveryFee}
                            onChange={e => setFormData({...formData, deliveryFee: parseFloat(e.target.value)})}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-primary">Price Range</label>
                      <div className="flex gap-4">
                        {(['$', '$$', '$$$', '$$$$'] as const).map(range => (
                          <button
                            key={range}
                            onClick={() => setFormData({...formData, priceRange: range})}
                            className={`flex-1 py-4 rounded-2xl font-black transition-all border ${
                              formData.priceRange === range 
                                ? 'bg-primary border-primary text-white scale-105 shadow-xl shadow-primary/20' 
                                : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                            }`}
                          >
                            {range}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-6 bg-primary/10 rounded-3xl border border-primary/20 flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
                        <Sparkles size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-primary">Onboarding Bonus!</h4>
                        <p className="text-xs text-white/70">Complete registration to earn 500 Crave Points instantly.</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="flex gap-4 mt-12">
                {step > 1 && (
                  <button
                    onClick={prevStep}
                    className="flex-1 py-5 rounded-2xl font-black flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                  >
                    <ChevronLeft size={20} /> Back
                  </button>
                )}
                
                {step < 3 ? (
                  <div className="flex-[2] flex flex-col gap-2">
                    <button
                      onClick={nextStep}
                      disabled={!formData.name || (step === 2 && !formData.category)}
                      className="w-full py-5 rounded-2xl font-black flex items-center justify-center gap-2 bg-primary text-white hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                    >
                      Next Step <ChevronRight size={20} />
                    </button>
                    {(!formData.name && step === 1) && (
                      <p className="text-[10px] text-center text-white/40 font-bold uppercase tracking-wider">Please enter a restaurant name to continue</p>
                    )}
                    {(!formData.category && step === 2) && (
                      <p className="text-[10px] text-center text-white/40 font-bold uppercase tracking-wider">Please select a category to continue</p>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-[2] py-5 rounded-2xl font-black flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-orange-500 text-white hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/30 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
                      />
                    ) : (
                      <>Launch Restaurant <Check size={20} /></>
                    )}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
