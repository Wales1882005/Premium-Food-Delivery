import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Navigation, Clock, CheckCircle2, Package, ArrowLeft, DollarSign, Star, Power, List, Play } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, where, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { Order, OrderStatus } from '../types';

interface DriverDashboardProps {
  onBack: () => void;
}

export function DriverDashboard({ onBack }: DriverDashboardProps) {
  const { user, authType, driverEarnings, updateDriverEarnings } = useAuth();
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalOrders, setTotalOrders] = useState(0);

  // Fetch Available Orders
  useEffect(() => {
    if (!user || !isOnline || activeOrder) {
      setAvailableOrders([]);
      return;
    }

    const q = query(
      collection(db, 'orders'),
      where('status', 'in', ['confirmed', 'preparing', 'ready_for_pickup']),
      where('driverId', '==', null), // Only orders without a driver
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        items: typeof doc.data().items === 'string' ? JSON.parse(doc.data().items) : doc.data().items
      })) as Order[];
      setAvailableOrders(orders);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, isOnline, activeOrder]);

  // Fetch Active Order
  useEffect(() => {
    if (!user) return;
    const uid = (user as any).uid || (user as any).id;

    const q = query(
      collection(db, 'orders'),
      where('driverId', '==', uid),
      where('status', 'in', ['driver_assigned', 'driver_arrived_at_restaurant', 'picked_up', 'on_the_way', 'driver_arrived_at_customer'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const orderDoc = snapshot.docs[0];
        setActiveOrder({
          id: orderDoc.id,
          ...orderDoc.data(),
          items: typeof orderDoc.data().items === 'string' ? JSON.parse(orderDoc.data().items) : orderDoc.data().items
        } as Order);
      } else {
        setActiveOrder(null);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch Total Delivered Orders
  useEffect(() => {
    if (!user) return;
    const uid = (user as any).uid || (user as any).id;

    const q = query(
      collection(db, 'orders'),
      where('driverId', '==', uid),
      where('status', '==', 'delivered')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTotalOrders(snapshot.size);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAcceptOrder = async (orderId: string) => {
    if (!user) return;
    const uid = (user as any).uid || (user as any).id;
    const name = (user as any).displayName || (user as any).user_metadata?.full_name || 'Driver';

    try {
      const orderToAccept = availableOrders.find(o => o.id === orderId);
      const newStatus = 'driver_assigned';

      await updateDoc(doc(db, 'orders', orderId), {
        driverId: uid,
        driverName: name,
        status: newStatus,
        driverLat: 40,
        driverLng: 390
      });
      toast.success('Order accepted!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
      if (status === 'delivered') {
        toast.success('Order delivered! Great job.');
        
        // Calculate driver payout (e.g., 25% of the order total)
        const order = activeOrder || availableOrders.find(o => o.id === orderId);
        const payout = order ? order.total * 0.25 : 5.00;
        await updateDriverEarnings(payout); 
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const simulateMovement = async () => {
    if (!activeOrder) return;
    
    // Simulate movement towards home (50, 200)
    const steps = 5;
    const startLat = activeOrder.driverLat || 40;
    const startLng = activeOrder.driverLng || 390;
    const endLat = 200;
    const endLng = 50;

    for (let i = 1; i <= steps; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const currentLat = startLat + (endLat - startLat) * (i / steps);
      const currentLng = startLng + (endLng - startLng) * (i / steps);
      
      try {
        await updateDoc(doc(db, 'orders', activeOrder.id), {
          driverLat: currentLat,
          driverLng: currentLng
        });
      } catch (err) {
        console.error('Movement simulation error:', err);
        break;
      }
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24 pt-8 px-6 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 bg-surface rounded-full hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold">Driver Dashboard</h1>
        </div>
        <button 
          onClick={() => setIsOnline(!isOnline)}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold transition-all ${
            isOnline 
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
              : 'bg-white/5 text-white/40 border border-white/10'
          }`}
        >
          <Power size={18} />
          {isOnline ? 'Online' : 'Offline'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface p-4 rounded-3xl border border-white/5">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Total Earnings</p>
          <p className="text-2xl font-bold text-emerald-400">${driverEarnings.toFixed(2)}</p>
        </div>
        <div className="bg-surface p-4 rounded-3xl border border-white/5">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Orders Completed</p>
          <p className="text-2xl font-bold text-white">{totalOrders}</p>
        </div>
        <div className="bg-surface p-4 rounded-3xl border border-white/5">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Rating</p>
          <div className="flex items-center gap-1">
            <Star size={18} className="text-yellow-400 fill-yellow-400" />
            <p className="text-2xl font-bold text-white">4.9</p>
          </div>
        </div>
        <div className="bg-surface p-4 rounded-3xl border border-white/5">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Status</p>
          <p className={`text-sm font-bold ${isOnline ? 'text-emerald-400' : 'text-white/40'}`}>
            {isOnline ? (activeOrder ? 'Delivering' : 'Waiting for Orders') : 'Offline'}
          </p>
        </div>
      </div>

      {/* Active Order Section */}
      <AnimatePresence>
        {activeOrder && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Navigation className="text-primary" /> Active Delivery
            </h2>
            <div className="bg-surface rounded-[2.5rem] border border-primary/30 overflow-hidden shadow-2xl shadow-primary/10">
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-bold">{activeOrder.restaurantName}</h3>
                    <p className="text-white/60 flex items-center gap-1 mt-1">
                      <MapPin size={14} /> {activeOrder.deliveryAddress}
                    </p>
                  </div>
                  <div className="bg-primary/20 text-primary px-4 py-2 rounded-2xl font-bold">
                    ${activeOrder.total.toFixed(2)}
                  </div>
                </div>

                <div className="space-y-3">
                  {activeOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-white/80">{item.quantity}x {item.name}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-white/5 flex flex-col gap-3">
                  {activeOrder.status === 'driver_assigned' && (
                    <button 
                      onClick={() => handleUpdateStatus(activeOrder.id, 'driver_arrived_at_restaurant')}
                      className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      <MapPin size={18} />
                      Arrived at Restaurant
                    </button>
                  )}
                  
                  {activeOrder.status === 'driver_arrived_at_restaurant' && (
                    <div className="py-4 bg-white/5 rounded-2xl font-bold text-center text-white/40 border border-white/5 flex items-center justify-center gap-2">
                      <Clock size={18} className="animate-pulse" />
                      Waiting for Restaurant to Handover...
                    </div>
                  )}

                  {activeOrder.status === 'picked_up' && (
                    <button 
                      onClick={() => handleUpdateStatus(activeOrder.id, 'on_the_way')}
                      className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                    >
                      <Navigation size={18} />
                      Start Delivery
                    </button>
                  )}

                  {activeOrder.status === 'on_the_way' && (
                    <>
                      <button 
                        onClick={simulateMovement}
                        className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                      >
                        <Play size={18} /> Simulate Movement
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(activeOrder.id, 'driver_arrived_at_customer')}
                        className="w-full py-4 bg-purple-500 hover:bg-purple-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
                      >
                        <MapPin size={18} />
                        Arrived at Customer
                      </button>
                    </>
                  )}

                  {activeOrder.status === 'driver_arrived_at_customer' && (
                    <button 
                      onClick={() => handleUpdateStatus(activeOrder.id, 'delivered')}
                      className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/20"
                    >
                      Complete Delivery {activeOrder.paymentMethod === 'cod' ? '(Collect Cash)' : ''}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Available Orders List */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <List className="text-white/40" /> Available Orders
        </h2>
        
        {!isOnline ? (
          <div className="bg-surface rounded-3xl p-12 text-center border border-white/5">
            <p className="text-white/40">Go online to start receiving orders.</p>
          </div>
        ) : activeOrder ? (
          <div className="bg-surface rounded-3xl p-12 text-center border border-white/5">
            <p className="text-white/40">Complete your active delivery to see more orders.</p>
          </div>
        ) : availableOrders.length === 0 ? (
          <div className="bg-surface rounded-3xl p-12 text-center border border-white/5">
            <p className="text-white/40">No orders available right now. Stay tuned!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableOrders.map(order => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-surface p-6 rounded-3xl border border-white/5 hover:border-primary/30 transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{order.restaurantName}</h3>
                    <p className="text-xs text-white/40 mt-1 flex items-center gap-1">
                      <Clock size={12} /> {new Date(order.createdAt?.toDate?.() || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-400">${order.total.toFixed(2)}</p>
                    <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Est. Payout: ${(order.total * 0.25).toFixed(2)}</p>
                  </div>
                </div>
                
                <div className="space-y-2 mb-6">
                  <p className="text-sm text-white/60 line-clamp-1 flex items-center gap-1">
                    <MapPin size={14} /> {order.deliveryAddress}
                  </p>
                  <p className="text-xs text-white/40">
                    {order.items.length} items • {order.items.map(i => i.name).join(', ')}
                  </p>
                </div>

                <button 
                  onClick={() => handleAcceptOrder(order.id)}
                  className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Accept Order
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
