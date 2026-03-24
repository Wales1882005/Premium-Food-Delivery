import { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'motion/react';
import { ArrowLeft, MapPin, CreditCard, CheckCircle2, Clock, Navigation, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { CartItem, Restaurant } from '../types';

interface CheckoutProps {
  key?: string;
  onBack: () => void;
  onComplete: () => void;
  total: number;
  cart: CartItem[];
  restaurant: Restaurant | null;
}

export function Checkout({ onBack, onComplete, total, cart, restaurant }: CheckoutProps) {
  const [step, setStep] = useState(1);
  const [address, setAddress] = useState("123 Design Avenue, Suite 4B, San Francisco, CA 94105");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  
  const { user, updateCravePoints } = useAuth();
  
  const mapRef = useRef<HTMLDivElement>(null);
  const pinX = useMotionValue(0);
  const pinY = useMotionValue(0);

  // Simulate address change when pin moves
  useEffect(() => {
    const unsubscribeX = pinX.on("change", (v) => {
      if (Math.abs(v) > 50) setAddress("456 Tech Boulevard, Floor 12, San Francisco, CA 94107");
      else setAddress("123 Design Avenue, Suite 4B, San Francisco, CA 94105");
    });
    return () => unsubscribeX();
  }, [pinX]);

  const handleNextStep = async () => {
    if (step === 2) {
      if (!user || !restaurant) {
        setStep(3); // Allow guest checkout or handle gracefully
        return;
      }
      
      setIsPlacingOrder(true);
      try {
        const orderId = `ord_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const orderRef = doc(db, 'users', user.uid, 'orders', orderId);
        
        await setDoc(orderRef, {
          userId: user.uid,
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          items: JSON.stringify(cart),
          total: total,
          status: 'preparing',
          deliveryAddress: address,
          createdAt: serverTimestamp()
        });
        
        // Award points
        await updateCravePoints(Math.floor(total * 10));
        
        setStep(3);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/orders`);
      } finally {
        setIsPlacingOrder(false);
      }
    } else {
      setStep(s => s + 1);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-background pb-24 pt-safe px-6 max-w-2xl mx-auto"
    >
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
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MapPin className="text-primary" /> Delivery Address
          </h2>

          {/* Interactive Map */}
          <div className="bg-surface rounded-3xl overflow-hidden border border-white/5 shadow-xl relative h-64 w-full" ref={mapRef}>
            {/* Map Background Pattern */}
            <div className="absolute inset-0 opacity-20 bg-zinc-800" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            
            {/* Draggable Pin */}
            <motion.div 
              drag
              dragConstraints={mapRef}
              dragElastic={0.1}
              dragMomentum={false}
              style={{ x: pinX, y: pinY }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full flex flex-col items-center cursor-grab active:cursor-grabbing z-10"
            >
              <div className="bg-primary text-white p-3 rounded-full shadow-[0_10px_20px_rgba(242,125,38,0.4)] border-2 border-white relative">
                <MapPin size={24} className="fill-white" />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-primary" />
              </div>
              <span className="mt-3 text-xs font-bold bg-black/80 px-3 py-1 rounded-full backdrop-blur-md whitespace-nowrap shadow-lg border border-white/10">
                Drag to adjust
              </span>
            </motion.div>
          </div>

          <div className="bg-surface p-4 rounded-2xl border border-primary/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-bl-full" />
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold mb-1">Selected Location</p>
                <p className="text-white/60 text-sm">{address}</p>
              </div>
              <div className="w-5 h-5 rounded-full border-4 border-primary bg-background" />
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
            <CreditCard className="text-primary" /> Payment Method
          </h2>
          <div className="bg-surface p-4 rounded-2xl border border-primary/50 cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-bl-full" />
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-8 bg-white/10 rounded flex items-center justify-center font-bold text-xs">VISA</div>
                <div>
                  <p className="font-bold">•••• •••• •••• 4242</p>
                  <p className="text-white/60 text-xs">Expires 12/28</p>
                </div>
              </div>
              <div className="w-5 h-5 rounded-full border-4 border-primary bg-background" />
            </div>
          </div>
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-8 bg-white/10 rounded flex items-center justify-center font-bold text-xs">Pay</div>
                <p className="font-bold">Apple Pay</p>
              </div>
              <div className="w-5 h-5 rounded-full border-2 border-white/30" />
            </div>
          </div>
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
            <p className="text-3xl font-bold text-primary mb-6">${total.toFixed(2)}</p>
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
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-background/80 backdrop-blur-xl border-t border-white/10 z-10">
        <div className="max-w-2xl mx-auto flex gap-4">
          {step === 3 ? (
            <button 
              onClick={onComplete}
              className="w-full bg-primary hover:bg-primary-hover text-white py-4 rounded-2xl font-bold text-lg transition-all active:scale-[0.98]"
            >
              Track Order
            </button>
          ) : (
            <button 
              onClick={handleNextStep}
              disabled={isPlacingOrder}
              className="w-full bg-primary hover:bg-primary-hover text-white py-4 rounded-2xl font-bold text-lg transition-all active:scale-[0.98] flex justify-between items-center px-6 disabled:opacity-70"
            >
              <span>
                {isPlacingOrder ? (
                  <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={20} /> Processing...</span>
                ) : (
                  step === 1 ? 'Continue to Payment' : 'Place Order'
                )}
              </span>
              {!isPlacingOrder && <span>${total.toFixed(2)}</span>}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
