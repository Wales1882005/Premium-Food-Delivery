import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, MapPin, CreditCard, CheckCircle2, Clock, Navigation, Loader2, AlertCircle, Award, DollarSign } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { supabase } from '../lib/supabase';
import { CartItem, Restaurant, PaymentMethod, OrderData } from '../types';
import { User as FirebaseUser } from 'firebase/auth';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { StripePayment } from './StripePayment';
// OrderData import removed as it's now in types.ts
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_mock_key');

interface CheckoutProps {
  key?: string;
  onBack: () => void;
  onComplete: (demoOrder?: OrderData) => void;
  total: number;
  cart: CartItem[];
  restaurant: Restaurant | null;
}

export function Checkout({ onBack, onComplete, total, cart, restaurant }: CheckoutProps) {
  const [step, setStep] = useState(1);
  const [address, setAddress] = useState("123 Design Avenue, Suite 4B, San Francisco, CA 94105");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [demoOrder, setDemoOrder] = useState<OrderData | null>(null);
  
  const { user, authType, updateCravePoints, cravePoints } = useAuth();
  const [redeemPoints, setRedeemPoints] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  
  const [position, setPosition] = useState<[number, number]>([37.7749, -122.4194]); // Default SF
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [customAddress, setCustomAddress] = useState(address);
  const [isLocating, setIsLocating] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);

  const searchAddress = async (query: string) => {
    setCustomAddress(query);
    if (query.length < 3) {
      setAddressSuggestions([]);
      return;
    }
    
    setIsSearchingAddress(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
      const data = await response.json();
      setAddressSuggestions(data);
    } catch (error) {
      console.error("Error searching address:", error);
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const getCurrentLocation = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setPosition([lat, lng]);
          
          try {
            // Reverse geocoding using OpenStreetMap Nominatim API
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
            const data = await response.json();
            if (data && data.display_name) {
              // Try to construct a more readable address if possible
              let readableAddress = data.display_name;
              if (data.address) {
                const { road, house_number, suburb, city, town, village, state, postcode, country } = data.address;
                const parts = [];
                if (house_number && road) parts.push(`${house_number} ${road}`);
                else if (road) parts.push(road);
                if (suburb) parts.push(suburb);
                if (city || town || village) parts.push(city || town || village);
                if (state) parts.push(state);
                if (postcode) parts.push(postcode);
                if (country) parts.push(country);
                
                if (parts.length > 0) {
                  readableAddress = parts.join(', ');
                }
              }
              setAddress(readableAddress);
              setCustomAddress(readableAddress);
            } else {
              setAddress(`Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
              setCustomAddress(`Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
            }
          } catch (error) {
            console.error("Error reverse geocoding:", error);
            setAddress(`Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
            setCustomAddress(`Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
          }
          
          const dist = Math.max(1, Math.random() * 10);
          setDistanceKm(dist);
          setIsLocating(false);
        },
        (error) => {
          console.error("Error getting location:", error.message || error);
          let errorMessage = "Could not get your location.";
          if (error.code === 1) {
            errorMessage = "Location access denied. Please enable location permissions in your browser settings.";
          } else if (error.code === 2) {
            errorMessage = "Location information is unavailable.";
          } else if (error.code === 3) {
            errorMessage = "The request to get user location timed out.";
          }
          toast.error(errorMessage);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      toast.error("Geolocation is not supported by your browser");
      setIsLocating(false);
    }
  };

  function LocationMarker() {
    const map = useMapEvents({
      async click(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        setPosition([lat, lng]);
        
        // Calculate a mock distance based on the new position
        const dist = Math.max(1, Math.random() * 10);
        setDistanceKm(dist);
        
        try {
          // Reverse geocoding
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
          const data = await response.json();
          if (data && data.display_name) {
            let readableAddress = data.display_name;
            if (data.address) {
              const { road, house_number, suburb, city, town, village, state, postcode, country } = data.address;
              const parts = [];
              if (house_number && road) parts.push(`${house_number} ${road}`);
              else if (road) parts.push(road);
              if (suburb) parts.push(suburb);
              if (city || town || village) parts.push(city || town || village);
              if (state) parts.push(state);
              if (postcode) parts.push(postcode);
              if (country) parts.push(country);
              
              if (parts.length > 0) {
                readableAddress = parts.join(', ');
              }
            }
            setAddress(readableAddress);
            setCustomAddress(readableAddress);
          } else {
            setAddress(`Selected Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
            setCustomAddress(`Selected Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
          }
        } catch (error) {
          setAddress(`Selected Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
          setCustomAddress(`Selected Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        }
      },
    });

    useEffect(() => {
      if (position) {
        map.flyTo(position, map.getZoom());
      }
    }, [position, map]);

    return position === null ? null : (
      <Marker position={position} />
    );
  }

  // Calculate fees
  const subtotal = total;
  const serviceFee = subtotal * 0.05; // 5% service fee
  
  // Mock distance calculation based on pin movement
  const [distanceKm, setDistanceKm] = useState(2.5);
  const deliveryFee = Math.max(1.99, distanceKm * 1.5); // $1.50 per km, min $1.99

  const discount = pointsToRedeem / 100;
  const finalTotal = Math.max(0, subtotal + serviceFee + deliveryFee - discount);

  const handleNextStep = async () => {
    if (step === 1) {
      if (paymentMethod === 'cod') {
        // Skip Stripe for Cash on Delivery
        handlePaymentSuccess();
        return;
      }

      // Fetch client secret from server
      try {
        setIsPlacingOrder(true);
        const response = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: finalTotal, currency: 'usd' }),
        });
        
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        
        setClientSecret(data.clientSecret);
        setIsDemo(!!data.isDemo);
        setStep(2);
      } catch (error: any) {
        setPaymentError(error.message || "Failed to initialize payment");
      } finally {
        setIsPlacingOrder(false);
      }
    } else {
      setStep(s => s + 1);
    }
  };

  const handleToggleRedeem = () => {
    if (!redeemPoints) {
      // Max points we can redeem is either all points or enough to cover the total
      const maxRedeemable = Math.min(cravePoints, Math.floor(total * 100));
      setPointsToRedeem(maxRedeemable);
    } else {
      setPointsToRedeem(0);
    }
    setRedeemPoints(!redeemPoints);
  };

  const handlePaymentSuccess = async () => {
    setIsPlacingOrder(true);
    console.log('Starting order placement...', { 
      authType, 
      paymentMethod, 
      userId: authType === 'firebase' ? (user as FirebaseUser)?.uid : (user as SupabaseUser)?.id 
    });
    
    // Create a promise that rejects after a specified time
    const timeout = (ms: number, dbName: string) => {
      console.log(`Creating timeout for ${dbName} with ${ms}ms`);
      let timer: any;
      const promise = new Promise((_, reject) => {
        timer = setTimeout(() => {
          console.error(`Timeout triggered for ${dbName} after ${ms}ms`);
          reject(new Error(`Request to ${dbName} timed out after ${ms/1000}s`));
        }, ms);
      });
      return { promise, clear: () => {
        console.log(`Clearing timeout for ${dbName}`);
        clearTimeout(timer);
      } };
    };

    const placeOrderInDatabase = async (): Promise<OrderData | null> => {
      try {
        // Determine initial status: sample restaurants (no ownerId or starts with 'r') are auto-confirmed
        const isSampleRestaurant = !restaurant?.ownerId || restaurant?.id.startsWith('r');
        const initialStatus = isSampleRestaurant ? 'confirmed' : 'pending';

        if (authType === 'firebase' && user && restaurant) {
          const orderId = `ord_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const orderRef = doc(db, 'orders', orderId);
          
          console.log('Inserting into Firebase...', { orderId, initialStatus });
          const { promise: timeoutPromise, clear } = timeout(10000, 'Firebase');
          await Promise.race([
            setDoc(orderRef, {
              id: orderId,
              userId: (user as FirebaseUser).uid,
              restaurantId: restaurant.id,
              restaurantOwnerId: restaurant.ownerId || null,
              restaurantName: restaurant.name,
              items: JSON.stringify(cart),
              total: finalTotal,
              subtotal: subtotal,
              deliveryFee: deliveryFee,
              serviceFee: serviceFee,
              paymentMethod: paymentMethod,
              discountApplied: discount,
              pointsRedeemed: pointsToRedeem,
              status: initialStatus,
              deliveryAddress: address,
              deliveryLat: position ? position[0] : 37.7749,
              deliveryLng: position ? position[1] : -122.4194,
              restaurantLat: restaurant.lat || 37.7749,
              restaurantLng: restaurant.lng || -122.4194,
              createdAt: serverTimestamp()
            }),
            timeoutPromise
          ]);
          clear();
          console.log('Firebase insert successful');
          
          // Update points
          const pointsEarned = Math.floor(finalTotal * 10);
          await updateCravePoints(pointsEarned - pointsToRedeem);
          
          return null;
        } else if (authType === 'supabase' && user && restaurant) {
          console.log('Inserting into Supabase...', {
            userId: (user as SupabaseUser).id,
            restaurantId: restaurant.id,
            finalTotal,
            initialStatus
          });
          
          const supabaseInsert = async (retryCount = 0): Promise<any> => {
            const payload = {
              user_id: (user as SupabaseUser).id,
              restaurant_id: restaurant.id,
              restaurant_name: restaurant.name,
              restaurant_owner_id: restaurant.ownerId,
              items: cart,
              total: finalTotal,
              subtotal: subtotal,
              delivery_fee: deliveryFee,
              service_fee: serviceFee,
              payment_method: paymentMethod,
              status: initialStatus,
              delivery_address: address,
              delivery_lat: position ? position[0] : 37.7749,
              delivery_lng: position ? position[1] : -122.4194,
              restaurant_lat: restaurant.lat || 37.7749,
              restaurant_lng: restaurant.lng || -122.4194,
              created_at: new Date().toISOString()
            };
            
            try {
              const { data, error } = await supabase.from('orders').insert(payload);
              if (error) throw error;
              return data;
            } catch (err) {
              if (retryCount < 2) {
                await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)));
                return supabaseInsert(retryCount + 1);
              }
              throw err;
            }
          };

          const { promise: timeoutPromise, clear } = timeout(300000, 'Supabase');
          await Promise.race([supabaseInsert(), timeoutPromise]);
          clear();
          
          // Update points
          const pointsEarned = Math.floor(finalTotal * 10);
          await updateCravePoints(pointsEarned - pointsToRedeem);
          
          return null;
        } else if (isDemo && restaurant) {
          // Return a mock OrderData for the demo session
          return {
            id: `demo_${Date.now()}`,
            restaurantName: restaurant.name,
            restaurantId: restaurant.id,
            total: finalTotal,
            status: initialStatus,
            createdAt: { toDate: () => new Date(), toMillis: () => Date.now() },
            items: JSON.stringify(cart),
            deliveryAddress: address
          };
        }
        return null;
      } catch (error) {
        console.error('Order placement failed:', error);
        if (!isDemo) {
          if (authType === 'firebase') {
            handleFirestoreError(error, OperationType.CREATE, `orders`);
          }
          toast.error('Failed to place order. Please try again.');
        } else {
          toast.error('Failed to place demo order: ' + (error as Error).message);
        }
        throw error;
      }
    };

    try {
      const order = await placeOrderInDatabase();
      if (order) setDemoOrder(order);
      setStep(3);
    } catch (error) {
      // Error already handled in placeOrderInDatabase
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-background"
    >
      <div className="min-h-screen pb-[calc(6rem+env(safe-area-inset-bottom))] pt-safe px-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-4 py-6 mb-6 border-b border-white/10">
          <button 
            onClick={onBack}
            className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold">Checkout</h1>
        </div>

      {/* Progress Steps */}
      <div className="flex justify-between mb-12 relative">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/10 -z-10 -translate-y-1/2" />
        <div className="absolute top-1/2 left-0 h-0.5 bg-primary -z-10 -translate-y-1/2 transition-all duration-500" style={{ width: `${(step - 1) * 50}%` }} />
        
        {[1, 2, 3].map((s) => (
          <div 
            key={s} 
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-500 ${
              step >= s ? 'bg-primary text-white' : 'bg-surface text-white/50 border border-white/10'
            }`}
          >
            {s === 3 && step === 3 ? <CheckCircle2 size={20} /> : s}
          </div>
        ))}
      </div>

      {/* Step 1: Address */}
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-6"
        >
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <MapPin className="text-primary" /> Delivery Address
            </h2>
            <button 
              onClick={getCurrentLocation}
              disabled={isLocating}
              className="flex items-center gap-2 text-xs font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors disabled:opacity-50"
            >
              {isLocating ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
              Use Current Location
            </button>
          </div>

          {/* Interactive Map */}
          <div className="bg-surface rounded-3xl overflow-hidden border border-white/5 shadow-xl relative h-64 w-full z-0">
            <MapContainer 
              center={position} 
              zoom={13} 
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationMarker />
            </MapContainer>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[400] pointer-events-none">
              <span className="text-xs font-bold bg-black/80 px-3 py-1 rounded-full backdrop-blur-md whitespace-nowrap shadow-lg border border-white/10">
                Click map to set location
              </span>
            </div>
          </div>

          <div className="bg-surface p-4 rounded-2xl border border-primary/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-bl-full" />
            <div className="flex justify-between items-start">
              <div className="w-full pr-8">
                <p className="font-bold mb-1">Selected Location</p>
                {isEditingAddress ? (
                  <div className="relative mt-2">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={customAddress}
                        onChange={(e) => searchAddress(e.target.value)}
                        className="flex-1 bg-background border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
                        placeholder="Enter full address"
                        autoFocus
                      />
                      <button 
                        onClick={() => {
                          setAddress(customAddress);
                          setIsEditingAddress(false);
                          setAddressSuggestions([]);
                        }}
                        className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold"
                      >
                        Save
                      </button>
                    </div>
                    {isSearchingAddress && (
                      <div className="absolute z-[500] w-full mt-1 bg-surface border border-white/10 rounded-xl shadow-xl p-3 flex justify-center">
                        <Loader2 size={16} className="animate-spin text-primary" />
                      </div>
                    )}
                    {addressSuggestions.length > 0 && (
                      <div className="absolute z-[500] w-full mt-1 bg-surface border border-white/10 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                        {addressSuggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 border-b border-white/5 last:border-0 transition-colors"
                            onClick={() => {
                              setCustomAddress(suggestion.display_name);
                              setAddress(suggestion.display_name);
                              setPosition([parseFloat(suggestion.lat), parseFloat(suggestion.lon)]);
                              setAddressSuggestions([]);
                              setIsEditingAddress(false);
                            }}
                          >
                            {suggestion.display_name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-white/60 text-sm">{address}</p>
                    <button 
                      onClick={() => setIsEditingAddress(true)}
                      className="text-primary text-xs mt-2 font-bold hover:underline"
                    >
                      Edit Address
                    </button>
                  </div>
                )}
                <p className="text-primary text-xs mt-2">{distanceKm.toFixed(1)} km away</p>
              </div>
              <div className="w-5 h-5 rounded-full border-4 border-primary bg-background shrink-0" />
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            <h3 className="font-bold">Payment Method</h3>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setPaymentMethod('card')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                  paymentMethod === 'card' ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                <CreditCard size={20} />
                <span className="text-xs font-bold">Card</span>
              </button>
              <button
                onClick={() => setPaymentMethod('wallet')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                  paymentMethod === 'wallet' ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-current flex items-center justify-center text-[10px] font-bold text-background">W</div>
                <span className="text-xs font-bold">E-Wallet</span>
              </button>
              <button
                onClick={() => setPaymentMethod('cod')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                  paymentMethod === 'cod' ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                <DollarSign size={20} />
                <span className="text-xs font-bold">Cash</span>
              </button>
            </div>
          </div>

          {/* Crave Points Redemption */}
          {cravePoints > 0 && (
            <div className="bg-surface p-6 rounded-3xl border border-white/5 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary">
                    <Award size={20} />
                  </div>
                  <div>
                    <p className="font-bold">Crave Points</p>
                    <p className="text-xs text-white/40">You have {cravePoints} points</p>
                  </div>
                </div>
                <button 
                  onClick={handleToggleRedeem}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    redeemPoints ? 'bg-primary text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {redeemPoints ? 'Redeemed' : 'Redeem'}
                </button>
              </div>
              
              {redeemPoints && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="pt-4 border-t border-white/5 space-y-2"
                >
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Points to use</span>
                    <span className="font-bold text-primary">-{pointsToRedeem}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Discount applied</span>
                    <span className="font-bold text-emerald-400">-${discount.toFixed(2)}</span>
                  </div>
                  <p className="text-[10px] text-white/30 italic">100 points = $1.00 discount</p>
                </motion.div>
              )}
            </div>
          )}

          {/* Order Summary */}
          <div className="bg-surface p-6 rounded-3xl border border-white/5 space-y-3">
            <h3 className="font-bold mb-4">Order Summary</h3>
            <div className="flex justify-between text-sm text-white/60">
              <span>Subtotal</span>
              <span>{restaurant?.currencySymbol || '$'}{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-white/60">
              <span>Delivery Fee ({distanceKm.toFixed(1)} km)</span>
              <span>{restaurant?.currencySymbol || '$'}{deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-white/60">
              <span>Service Fee</span>
              <span>{restaurant?.currencySymbol || '$'}{serviceFee.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-emerald-400">
                <span>Discount</span>
                <span>-{restaurant?.currencySymbol || '$'}{discount.toFixed(2)}</span>
              </div>
            )}
            <div className="pt-3 border-t border-white/10 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{restaurant?.currencySymbol || '$'}{finalTotal.toFixed(2)}</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Step 2: Payment */}
      {step === 2 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-6"
        >
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CreditCard className="text-primary" /> Secure Payment
          </h2>
          
          {clientSecret ? (
            <div className="bg-surface p-6 rounded-3xl border border-white/5 shadow-xl">
              {isDemo ? (
                <div className="space-y-6">
                  <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-center gap-3 text-primary text-sm">
                    <CheckCircle2 size={18} />
                    <p>Demo Mode Active: No real payment required.</p>
                  </div>
                  <div className="space-y-4">
                    <p className="text-white/60 text-sm">This is a simulation of the payment process. Click the button below to complete your order.</p>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setStep(1)}
                        className="flex-1 py-4 rounded-2xl font-bold text-white/60 bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={handlePaymentSuccess}
                        disabled={isPlacingOrder}
                        className="flex-[2] bg-primary hover:bg-primary-hover text-white py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2"
                      >
                        {isPlacingOrder ? <Loader2 className="animate-spin" size={20} /> : `Pay ${restaurant?.currencySymbol || '$'}${finalTotal.toFixed(2)} (Demo)`}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Elements 
                  stripe={stripePromise} 
                  options={{
                    clientSecret,
                    appearance: {
                      theme: 'night',
                      variables: {
                        colorPrimary: '#F27D26',
                        colorBackground: '#151619',
                        colorText: '#ffffff',
                        colorDanger: '#df1b41',
                        fontFamily: 'Inter, system-ui, sans-serif',
                        spacingUnit: '4px',
                        borderRadius: '16px',
                      },
                    },
                  }}
                >
                  <StripePayment 
                    amount={total} 
                    onSuccess={handlePaymentSuccess} 
                    onCancel={() => setStep(1)} 
                  />
                </Elements>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="animate-spin text-primary" size={32} />
              <p className="text-white/60">Initializing secure payment...</p>
            </div>
          )}

          {paymentError && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm">
              <AlertCircle size={18} />
              <p>{paymentError}</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 py-12"
        >
          <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 size={48} className="text-primary" />
          </div>
          <h2 className="text-3xl font-bold">Order Confirmed!</h2>
          <p className="text-white/60">Your food is being prepared and will be with you shortly.</p>
              <div className="bg-surface p-6 rounded-3xl border border-white/5 text-left mt-8">
                <p className="text-sm text-white/50 mb-1">Order Total</p>
                <div className="flex items-baseline gap-2 mb-6">
                  <p className="text-3xl font-bold text-primary">{restaurant?.currencySymbol || '$'}{finalTotal.toFixed(2)}</p>
                  {discount > 0 && (
                    <p className="text-sm text-white/40 line-through">{restaurant?.currencySymbol || '$'}{total.toFixed(2)}</p>
                  )}
                </div>
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
                  <Clock className="text-primary" />
                  <div>
                    <p className="font-bold">Estimated Delivery</p>
                    <p className="text-white/60 text-sm">25-35 minutes</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Bottom Action */}
          <div className="fixed bottom-0 left-0 right-0 p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] bg-background/80 backdrop-blur-xl border-t border-white/10 z-10">
            <div className="max-w-2xl mx-auto flex gap-4">
              {step === 3 ? (
                <button 
                  onClick={() => onComplete(demoOrder || undefined)}
                  className="w-full bg-primary hover:bg-primary-hover text-white py-4 rounded-2xl font-bold text-lg transition-colors"
                >
                  Track Order
                </button>
              ) : step === 1 ? (
                <button 
                  onClick={handleNextStep}
                  disabled={isPlacingOrder}
                  className="w-full bg-primary hover:bg-primary-hover text-white py-4 rounded-2xl font-bold text-lg transition-colors flex justify-between items-center px-6 disabled:opacity-70"
                >
                  <span>
                    {isPlacingOrder ? (
                      <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={20} /> Processing...</span>
                    ) : (
                      'Continue to Payment'
                    )}
                  </span>
                  {!isPlacingOrder && (
                    <div className="text-right">
                      <span>{restaurant?.currencySymbol || '$'}{finalTotal.toFixed(2)}</span>
                      {discount > 0 && <p className="text-[10px] text-white/40 line-through">Was {restaurant?.currencySymbol || '$'}{total.toFixed(2)}</p>}
                    </div>
                  )}
                </button>
              ) : null}
            </div>
          </div>
      </div>
    </motion.div>
  );
}
