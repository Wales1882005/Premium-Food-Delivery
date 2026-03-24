import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MapPin, Navigation, Clock, CheckCircle2, Package } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

interface OrderData {
  id: string;
  restaurantName: string;
  total: number;
  status: string;
  createdAt: any;
  items: string;
}

export function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'users', user.uid, 'orders'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as OrderData[];
      setOrders(fetchedOrders);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/orders`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className="pb-24 pt-8 px-6 max-w-5xl mx-auto flex justify-center items-center h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || orders.length === 0) {
    return (
      <div className="pb-24 pt-8 px-6 max-w-5xl mx-auto space-y-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center mb-4 border border-white/10">
          <Package size={40} className="text-white/40" />
        </div>
        <h1 className="text-3xl font-bold text-center">No Orders Yet</h1>
        <p className="text-white/60 text-center max-w-md">
          {user ? "You haven't placed any orders yet. Time to explore some delicious food!" : "Sign in to view your active and past orders."}
        </p>
      </div>
    );
  }

  const activeOrder = orders[0]; // Just showing the most recent order as active for demo

  return (
    <div className="pb-24 pt-8 px-6 max-w-5xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Active Order</h1>
      
      <div className="bg-surface rounded-3xl overflow-hidden border border-white/5 shadow-xl">
        {/* Mock Map View */}
        <div className="relative h-64 bg-zinc-800 w-full overflow-hidden">
          {/* Map Background Pattern */}
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          
          {/* Route Line */}
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <motion.path 
              d="M 50 200 Q 150 150 250 100 T 400 50" 
              fill="transparent" 
              stroke="var(--color-primary, #F27D26)" 
              strokeWidth="4" 
              strokeDasharray="8 8"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
          </svg>

          {/* Restaurant Pin */}
          <div className="absolute top-[40px] left-[390px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <div className="bg-white text-black p-2 rounded-full shadow-lg">
              <MapPin size={20} className="fill-black" />
            </div>
            <span className="mt-1 text-xs font-bold bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm">Restaurant</span>
          </div>

          {/* Driver Pin (Animated) */}
          <motion.div 
            className="absolute top-[100px] left-[250px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10"
            animate={{ 
              x: [0, 50, 100, 150], 
              y: [0, -20, -30, -50] 
            }}
            transition={{ 
              duration: 10, 
              repeat: Infinity, 
              repeatType: "reverse",
              ease: "linear" 
            }}
          >
            <div className="bg-primary text-white p-2.5 rounded-full shadow-[0_0_15px_rgba(242,125,38,0.5)] border-2 border-white">
              <Navigation size={18} className="fill-white" />
            </div>
            <span className="mt-1 text-xs font-bold bg-primary/80 px-2 py-0.5 rounded backdrop-blur-sm">Driver</span>
          </motion.div>

          {/* Home Pin */}
          <div className="absolute top-[200px] left-[50px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <div className="bg-zinc-700 text-white p-2 rounded-full shadow-lg border-2 border-white/20">
              <MapPin size={20} />
            </div>
            <span className="mt-1 text-xs font-bold bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm">Home</span>
          </div>
        </div>

        {/* Order Details */}
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">
                {activeOrder.status === 'delivered' ? 'Delivered' : 'Arriving in 15-20 min'}
              </h2>
              <p className="text-white/60 text-sm">Your order from {activeOrder.restaurantName}</p>
            </div>
            <div className="bg-primary/20 text-primary p-3 rounded-2xl">
              <Clock size={24} />
            </div>
          </div>

          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
            {/* Status Steps */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-primary text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <CheckCircle2 size={20} />
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="font-bold text-primary">Order Confirmed</h3>
                <p className="text-sm text-white/60">The restaurant has accepted your order.</p>
              </div>
            </div>

            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-background text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ${activeOrder.status !== 'preparing' ? 'bg-primary' : 'bg-zinc-800 text-white/40'}`}>
                {activeOrder.status !== 'preparing' ? <CheckCircle2 size={20} /> : <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />}
              </div>
              <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border ${activeOrder.status === 'preparing' ? 'bg-white/10 border-primary/30 shadow-[0_0_15px_rgba(242,125,38,0.1)]' : 'bg-white/5 border-white/10'}`}>
                <h3 className={`font-bold ${activeOrder.status === 'preparing' ? 'text-white' : 'text-primary'}`}>Preparing Food</h3>
                <p className="text-sm text-white/60">Your food is being prepared.</p>
              </div>
            </div>

            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ${activeOrder.status === 'delivered' ? 'bg-primary text-white' : 'bg-zinc-800 text-white/40'}`}>
                {activeOrder.status === 'delivered' ? <CheckCircle2 size={20} /> : (activeOrder.status === 'on_the_way' ? <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" /> : <div className="w-2.5 h-2.5 rounded-full bg-white/20" />)}
              </div>
              <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border ${activeOrder.status === 'on_the_way' ? 'bg-white/10 border-primary/30 shadow-[0_0_15px_rgba(242,125,38,0.1)]' : 'bg-white/5 border-white/10'}`}>
                <h3 className={`font-bold ${activeOrder.status === 'on_the_way' ? 'text-white' : (activeOrder.status === 'delivered' ? 'text-primary' : 'text-white/40')}`}>On the Way</h3>
                <p className="text-sm text-white/60">Driver is heading to your location.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {orders.length > 1 && (
        <div className="mt-12 space-y-4">
          <h2 className="text-2xl font-bold">Past Orders</h2>
          <div className="space-y-4">
            {orders.slice(1).map(order => (
              <div key={order.id} className="bg-surface p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                <div>
                  <h3 className="font-bold">{order.restaurantName}</h3>
                  <p className="text-sm text-white/50">{new Date(order.createdAt?.toDate?.() || Date.now()).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">${order.total.toFixed(2)}</p>
                  <p className="text-xs text-white/50 capitalize">{order.status.replace('_', ' ')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
