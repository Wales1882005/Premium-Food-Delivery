import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Navigation, Clock, CheckCircle2, Package, MessageSquare, X, ChevronDown, ChevronUp, RefreshCw, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { supabase } from '../lib/supabase';
import { User as FirebaseUser } from 'firebase/auth';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface OrderData {
  id: string;
  restaurantName: string;
  restaurantId?: string;
  total: number;
  status: string;
  createdAt: any;
  items: string; // JSON string of OrderItem[]
  userId?: string;
  deliveryAddress?: string;
}

export function Orders() {
  const { user, authType } = useAuth();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{sender: 'user' | 'driver', text: string}[]>([
    { sender: 'driver', text: 'Hi! I have picked up your order and I am on my way.' }
  ]);

  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);

  const handleCancelOrder = async (orderId: string) => {
    if (!user) return;
    
    try {
      if (authType === 'firebase') {
        const orderRef = doc(db, 'users', (user as FirebaseUser).uid, 'orders', orderId);
        await updateDoc(orderRef, { status: 'cancelled' });
      } else {
        await supabase
          .from('orders')
          .update({ status: 'cancelled' })
          .eq('id', orderId);
      }
      toast.success('Order cancelled successfully');
      setOrderToCancel(null);
    } catch (error) {
      console.error('Error cancelling order:', error);
      if (authType === 'firebase') {
        handleFirestoreError(error, OperationType.UPDATE, `users/${(user as FirebaseUser).uid}/orders/${orderId}`);
      } else {
        toast.error('Failed to cancel order');
      }
    }
  };

  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = async () => {
    setIsRefreshing(true);
    // The onSnapshot will handle the update if it's still active, 
    // but we can manually trigger a reload if needed by re-setting user or similar.
    // For now, just a visual feedback.
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleReorder = async (order: OrderData) => {
    if (!user) return;
    
    try {
      const newOrder: any = {
        restaurantName: order.restaurantName,
        total: order.total,
        status: 'confirmed',
        items: order.items,
        createdAt: serverTimestamp()
      };

      if (authType === 'firebase') {
        const uid = (user as FirebaseUser).uid;
        newOrder.userId = uid;
        if (order.restaurantId) newOrder.restaurantId = order.restaurantId;
        if (order.deliveryAddress) newOrder.deliveryAddress = order.deliveryAddress;
        
        await addDoc(collection(db, 'users', uid, 'orders'), newOrder);
      } else {
        await supabase.from('orders').insert({
          user_id: (user as SupabaseUser).id,
          restaurant_name: order.restaurantName,
          total: order.total,
          status: 'confirmed',
          items: JSON.parse(order.items),
          created_at: new Date().toISOString()
        });
      }
      toast.success('Reordered successfully!');
    } catch (error) {
      console.error('Error reordering:', error);
      toast.error('Failed to reorder');
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    
    setChatHistory([...chatHistory, { sender: 'user', text: chatMessage }]);
    setChatMessage('');
    
    // Mock driver response
    setTimeout(() => {
      setChatHistory(prev => [...prev, { sender: 'driver', text: 'Got it! I will be there as soon as possible.' }]);
    }, 1500);
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let unsubscribeFirebase: (() => void) | undefined;
    let unsubscribeSupabase: (() => void) | undefined;

    if (authType === 'firebase') {
      const q = query(
        collection(db, 'users', (user as FirebaseUser).uid, 'orders'),
        orderBy('createdAt', 'desc')
      );

      unsubscribeFirebase = onSnapshot(q, (snapshot) => {
        const fetchedOrders = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as OrderData[];
        setOrders(fetchedOrders);
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${(user as FirebaseUser).uid}/orders`);
        setLoading(false);
      });
    } else if (authType === 'supabase') {
      const fetchSupabaseOrders = async () => {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', (user as SupabaseUser).id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching Supabase orders:', error);
        } else {
          setOrders(data.map(o => ({
            id: o.id,
            restaurantName: o.restaurant_name,
            total: o.total,
            status: o.status,
            createdAt: { toDate: () => new Date(o.created_at) },
            items: JSON.stringify(o.items)
          })) as OrderData[]);
        }
        setLoading(false);
      };

      fetchSupabaseOrders();

      const channel = supabase
        .channel('orders-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${(user as SupabaseUser).id}` }, () => {
          fetchSupabaseOrders();
        })
        .subscribe();
      
      unsubscribeSupabase = () => {
        supabase.removeChannel(channel);
      };
    }

    return () => {
      if (unsubscribeFirebase) unsubscribeFirebase();
      if (unsubscribeSupabase) unsubscribeSupabase();
    };
  }, [user, authType]);

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

  const activeOrder = orders.find(o => o.status !== 'delivered' && o.status !== 'cancelled') || orders[0];
  const isOrderActive = activeOrder && activeOrder.status !== 'delivered' && activeOrder.status !== 'cancelled';

  const parseItems = (itemsStr: string): OrderItem[] => {
    try {
      return JSON.parse(itemsStr);
    } catch {
      return [];
    }
  };

  return (
    <div className="pb-24 pt-8 px-6 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <h1 className="text-3xl font-bold">{isOrderActive ? 'Active Order' : 'Recent Order'}</h1>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            className={`p-2 bg-white/5 rounded-full hover:bg-white/10 transition-all ${isRefreshing ? 'animate-spin text-primary' : 'text-white/60'}`}
            title="Refresh Orders"
          >
            <RefreshCw size={20} />
          </button>
          {isOrderActive && (
            <button 
              onClick={() => setShowChat(true)}
              className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full font-medium hover:bg-primary/20 transition-colors"
            >
              <MessageSquare size={18} />
              Chat with Driver
            </button>
          )}
        </div>
      </div>
      
      <div className="bg-surface rounded-3xl overflow-hidden border border-white/5 shadow-xl">
        {/* Map View - Only show for active orders */}
        {isOrderActive && (
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
        )}

        {/* Order Details */}
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">
                  {activeOrder.status === 'delivered' ? 'Delivered' : 
                   activeOrder.status === 'cancelled' ? 'Order Cancelled' :
                   activeOrder.status === 'on_the_way' ? 'Driver is on the way' :
                   activeOrder.status === 'preparing' ? 'Preparing your food' :
                   'Order Confirmed'}
                </h2>
                {activeOrder.status === 'delivered' && <CheckCircle2 className="text-green-500" size={20} />}
              </div>
              <p className="text-white/60 text-sm">Your order from {activeOrder.restaurantName}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="bg-primary/20 text-primary p-3 rounded-2xl">
                <Clock size={24} />
              </div>
              {isOrderActive && (activeOrder.status === 'confirmed' || activeOrder.status === 'preparing') && (
                <div className="flex flex-col items-end gap-2">
                  {orderToCancel === activeOrder.id ? (
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Are you sure?</span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleCancelOrder(activeOrder.id)}
                          className="text-xs bg-red-500 text-white px-4 py-1.5 rounded-xl font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                        >
                          Yes, Cancel
                        </button>
                        <button 
                          onClick={() => setOrderToCancel(null)}
                          className="text-xs bg-white/10 text-white px-4 py-1.5 rounded-xl font-bold hover:bg-white/20 transition-colors"
                        >
                          No, Keep it
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setOrderToCancel(activeOrder.id)}
                      className="text-xs text-red-400 hover:text-red-300 transition-all font-bold py-2 px-4 bg-red-400/5 hover:bg-red-400/10 rounded-xl border border-red-400/20"
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {isOrderActive && (
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
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-background text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ${activeOrder.status !== 'confirmed' ? 'bg-primary' : 'bg-zinc-800 text-white/40'}`}>
                  {activeOrder.status !== 'confirmed' ? <CheckCircle2 size={20} /> : <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />}
                </div>
                <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border ${activeOrder.status === 'preparing' ? 'bg-white/10 border-primary/30 shadow-[0_0_15px_rgba(242,125,38,0.1)]' : 'bg-white/5 border-white/10'}`}>
                  <h3 className={`font-bold ${activeOrder.status === 'preparing' ? 'text-white' : (activeOrder.status === 'confirmed' ? 'text-white/40' : 'text-primary')}`}>Preparing Food</h3>
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
          )}

          {/* Order Summary Toggle */}
          <div className="pt-4 border-t border-white/5">
            <button 
              onClick={() => setExpandedOrderId(expandedOrderId === activeOrder.id ? null : activeOrder.id)}
              className="flex items-center justify-between w-full text-sm font-medium text-white/60 hover:text-white transition-colors"
            >
              <span>Order Summary</span>
              {expandedOrderId === activeOrder.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            <AnimatePresence>
              {expandedOrderId === activeOrder.id && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 space-y-3">
                    {parseItems(activeOrder.items).map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-white/80">{item.quantity}x {item.name}</span>
                        <span className="text-white/60">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="pt-3 border-t border-white/5 flex justify-between font-bold">
                      <span>Total</span>
                      <span className="text-primary">${activeOrder.total.toFixed(2)}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      {orders.length > 1 && (
        <div className="mt-12 space-y-4">
          <h2 className="text-2xl font-bold">Order History</h2>
          <div className="space-y-4">
            {orders.slice(1).map(order => (
              <div key={order.id} className="bg-surface p-5 rounded-3xl border border-white/5 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                      <Package size={24} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{order.restaurantName}</h3>
                      <p className="text-sm text-white/40">{new Date(order.createdAt?.toDate?.() || Date.now()).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-primary">${order.total.toFixed(2)}</p>
                    <p className={`text-xs font-bold px-2 py-1 rounded-full inline-block mt-1 ${
                      order.status === 'delivered' ? 'bg-green-500/10 text-green-500' : 
                      order.status === 'cancelled' ? 'bg-red-500/10 text-red-500' : 
                      'bg-primary/10 text-primary'
                    }`}>
                      {order.status.replace('_', ' ').toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => handleReorder(order)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 border border-white/10"
                  >
                    <RefreshCw size={16} />
                    Reorder
                  </button>
                  {order.status === 'delivered' && (
                    <button className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 border border-primary/20">
                      <Star size={16} />
                      Rate
                    </button>
                  )}
                  <button 
                    onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                    className="w-12 bg-white/5 hover:bg-white/10 text-white rounded-xl flex items-center justify-center transition-all border border-white/10"
                  >
                    {expandedOrderId === order.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>

                <AnimatePresence>
                  {expandedOrderId === order.id && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-2 space-y-2 border-t border-white/5 mt-2">
                        {parseItems(order.items).map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm py-1">
                            <span className="text-white/60">{item.quantity}x {item.name}</span>
                            <span className="text-white/40">${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat Modal */}
      <AnimatePresence>
        {showChat && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-zinc-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-white/10 overflow-hidden flex flex-col h-[80vh] sm:h-[600px]"
            >
              {/* Chat Header */}
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-zinc-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                    D
                  </div>
                  <div>
                    <h3 className="font-bold">Driver (David)</h3>
                    <p className="text-xs text-green-500">Online</p>
                  </div>
                </div>
                <button onClick={() => setShowChat(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                      msg.sender === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-white/10 text-white rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-zinc-800/50 flex gap-2">
                <input 
                  type="text" 
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary/50"
                />
                <button 
                  type="submit"
                  className="bg-primary text-white p-2 rounded-xl hover:bg-primary/90 transition-colors"
                >
                  <Navigation size={20} className="rotate-90" />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
