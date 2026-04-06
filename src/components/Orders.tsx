import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Navigation, Clock, CheckCircle2, Package, MessageSquare, X, ChevronDown, ChevronUp, RefreshCw, Star, Camera, Send, Map as MapIcon, AlertCircle, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc, deleteDoc, serverTimestamp, where, limit } from 'firebase/firestore';
import { supabase } from '../lib/supabase';
import { User as FirebaseUser } from 'firebase/auth';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { OrderData, OrderItem, OrderStatus } from '../types';
import { ChatModal } from './ChatModal';
import { toast } from 'sonner';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'restaurant';
  text: string;
  createdAt: any;
}

interface OrdersProps {
  demoOrders?: OrderData[];
}

export function Orders({ demoOrders = [] }: OrdersProps) {
  const { user, authType, isAuthReady } = useAuth();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const [reviewOrder, setReviewOrder] = useState<OrderData | null>(null);
  const [showMap, setShowMap] = useState<string | null>(null);

  const allOrders = useMemo(() => {
    // Combine fetched orders and demo orders, removing duplicates by ID
    const combined = [...orders, ...demoOrders];
    const unique = Array.from(new Map(combined.map(o => [o.id, o])).values());
    
    return unique.sort((a, b) => {
      // Robust time extraction
      const getTime = (order: OrderData) => {
        if (!order.createdAt) return Date.now() + 10000; // Future for pending
        if (order.createdAt.toMillis) return order.createdAt.toMillis();
        if (order.createdAt.toDate) return order.createdAt.toDate().getTime();
        if (typeof order.createdAt === 'string') return new Date(order.createdAt).getTime();
        if (typeof order.createdAt === 'number') return order.createdAt;
        return 0;
      };

      const timeA = getTime(a);
      const timeB = getTime(b);
      
      // If times are equal (or both 0), sort by ID to be stable
      if (timeA === timeB) return b.id.localeCompare(a.id);
      return timeB - timeA;
    });
  }, [orders, demoOrders]);

  // Helper to check if a restaurant is a sample one
  const isSampleRestaurant = (restaurantId?: string, restaurantName?: string, ownerId?: string) => {
    // If no ownerId, it's definitely a sample/system restaurant
    if (!ownerId) return true;
    
    // Check by ID pattern (r1, r2, etc.)
    const isSampleId = restaurantId && /^r\d+$/.test(restaurantId);
    
    // Fallback: Check by known sample names just in case ID is missing
    const sampleNames = [
      'Sakura Sushi House', 'Firewood Pizza Co.', 'The Halal Grill', 
      'Green Bowl Vegan', 'Smash & Grab Burgers', 'Midnight Cravings Desserts',
      'Sip & Chill Beverages', 'The Juice Lab', 'Boba Bliss', 'Pizza Hut Pavilion KL',
      'Midnight Cravings', 'The Burger Joint', 'Taco Bell', 'KFC', 'McDonald\'s',
      'Starbucks', 'Subway', 'Domino\'s', 'Pizza Hut'
    ];
    const isSampleName = restaurantName && sampleNames.some(name => 
      restaurantName.toLowerCase().includes(name.toLowerCase())
    );
    
    // If it's a demo order ID
    const isDemoId = restaurantId?.startsWith('demo_') || restaurantId?.startsWith('ord_') || restaurantId?.startsWith('order_');
    
    return isSampleId || isSampleName || isDemoId;
  };

  // Performance tracking
  useEffect(() => {
    console.time('OrdersFetch');
    return () => console.timeEnd('OrdersFetch');
  }, []);

  const handleCancelOrder = async (orderId: string) => {
    if (!user) return;
    
    const order = orders.find(o => o.id === orderId);
    if (order && order.status !== 'pending' && order.status !== 'confirmed') {
      toast.error('Cannot cancel order once it is being prepared. Please contact the restaurant.');
      setOrderToCancel(null);
      return;
    }
    
    try {
      if (authType === 'firebase') {
        const orderRef = doc(db, 'orders', orderId);
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
        handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
      } else {
        toast.error('Failed to cancel order');
      }
    }
  };

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshTrigger(prev => prev + 1);
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
        if ((order as any).restaurantOwnerId) newOrder.restaurantOwnerId = (order as any).restaurantOwnerId;
        if (order.deliveryAddress) newOrder.deliveryAddress = order.deliveryAddress;
        
        await addDoc(collection(db, 'orders'), newOrder);
      } else {
        const newOrderSupabase: any = {
          user_id: (user as SupabaseUser).id,
          restaurant_name: order.restaurantName,
          total: order.total,
          status: 'confirmed',
          items: JSON.parse(order.items),
          created_at: new Date().toISOString()
        };
        if (order.restaurantId) newOrderSupabase.restaurant_id = order.restaurantId;
        if ((order as any).restaurantOwnerId) newOrderSupabase.restaurant_owner_id = (order as any).restaurantOwnerId;
        if ((order as any).restaurant_owner_id) newOrderSupabase.restaurant_owner_id = (order as any).restaurant_owner_id;
        if (order.deliveryAddress) newOrderSupabase.delivery_address = order.deliveryAddress;
        if ((order as any).delivery_address) newOrderSupabase.delivery_address = (order as any).delivery_address;

        await supabase.from('orders').insert(newOrderSupabase);
      }
      toast.success('Reordered successfully!');
    } catch (error) {
      console.error('Error reordering:', error);
      toast.error('Failed to reorder');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!user) return;
    try {
      if (authType === 'firebase') {
        await deleteDoc(doc(db, 'orders', orderId));
      } else {
        await supabase.from('orders').delete().eq('id', orderId);
      }
      toast.success('Order removed from history');
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to remove order');
    }
  };

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const activeOrder = useMemo(() => {
    if (selectedOrderId) {
      const found = allOrders.find(o => o.id === selectedOrderId);
      if (found) return found;
    }
    return allOrders.find(o => o.status !== 'delivered' && o.status !== 'cancelled') || allOrders[0];
  }, [allOrders, selectedOrderId]);
  
  const isOrderActive = useMemo(() => activeOrder && activeOrder.status !== 'delivered' && activeOrder.status !== 'cancelled', [activeOrder]);

  // Real-time Chat Listener
  useEffect(() => {
    if (!user || !activeOrder || !showChat) return;

    if (authType === 'firebase') {
      const q = query(
        collection(db, 'orders', activeOrder.id, 'messages'),
        orderBy('createdAt', 'asc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ChatMessage[];
        setChatHistory(messages);
      });

      return () => unsubscribe();
    } else if (authType === 'supabase') {
      const fetchMessages = async () => {
        const { data, error } = await supabase
          .from('order_messages')
          .select('*')
          .eq('order_id', activeOrder.id)
          .order('created_at', { ascending: true });
        
        if (!error && data) {
          setChatHistory(data.map(m => ({
            id: m.id,
            sender: m.sender,
            text: m.text,
            createdAt: { toDate: () => new Date(m.created_at) }
          })));
        }
      };

      fetchMessages();

      const channel = supabase
        .channel(`order-chat-${activeOrder.id}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'order_messages', 
          filter: `order_id=eq.${activeOrder.id}` 
        }, () => {
          fetchMessages();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, activeOrder?.id, showChat, authType]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !user || !activeOrder) return;
    
    const text = chatMessage;
    setChatMessage('');

    try {
      if (authType === 'firebase') {
        await addDoc(collection(db, 'orders', activeOrder.id, 'messages'), {
          sender: 'user',
          text,
          createdAt: serverTimestamp()
        });

        // Mock restaurant response after a delay
        setTimeout(async () => {
          await addDoc(collection(db, 'orders', activeOrder.id, 'messages'), {
            sender: 'restaurant',
            text: 'Got it! We are preparing your order.',
            createdAt: serverTimestamp()
          });
        }, 2000);
      } else {
        // Supabase chat logic
        const { error } = await supabase
          .from('order_messages')
          .insert({
            order_id: activeOrder.id,
            sender: 'user',
            text,
            created_at: new Date().toISOString()
          });

        if (error) {
          console.error('Supabase chat error:', error);
          // Fallback if table doesn't exist
          if (error.code === 'PGRST116' || error.message.includes('relation "order_messages" does not exist')) {
            toast.info('Chat is currently only available for Firebase users');
            return;
          }
          throw error;
        }

        // Mock restaurant response for Supabase
        setTimeout(async () => {
          await supabase
            .from('order_messages')
            .insert({
              order_id: activeOrder.id,
              sender: 'restaurant',
              text: 'Got it! We are preparing your order.',
              created_at: new Date().toISOString()
            });
        }, 2000);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const simulateOrderProgress = async () => {
    if (!user || !activeOrder || authType !== 'firebase') return;
    setIsSimulating(true);
    toast.info('Starting real-time order simulation...');

    const orderRef = doc(db, 'orders', activeOrder.id);
    
    const statuses = [
      'preparing',
      'ready_for_pickup',
      'picked_up',
      'on_the_way',
      'delivered'
    ];

    for (let i = 0; i < statuses.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      try {
        await updateDoc(orderRef, {
          status: statuses[i],
          estimatedDeliveryTime: i < statuses.length - 1 ? new Date(Date.now() + (statuses.length - i) * 60000) : null
        });
      } catch (err) {
        console.error('Simulation error:', err);
        break;
      }
    }
    setIsSimulating(false);
    toast.success('Simulation complete!');
  };

  // Auto-progress for sample restaurants
  useEffect(() => {
    if (!user || !activeOrder || isSimulating) return;
    
    const isSample = isSampleRestaurant(activeOrder.restaurantId, activeOrder.restaurantName, activeOrder.restaurantOwnerId);
    
    if (!isSample) {
      console.log('Not a sample restaurant, skipping auto-progression', activeOrder.restaurantName);
      return;
    }

    const statusOrder = ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'picked_up', 'on_the_way', 'delivered'];
    const currentIndex = statusOrder.indexOf(activeOrder.status);
    
    if (currentIndex === -1 || activeOrder.status === 'delivered' || activeOrder.status === 'cancelled') return;

    const nextStatus = statusOrder[currentIndex + 1];
    if (!nextStatus) return;

    // Fast progression for sample restaurants to keep user engaged
    // 3s for pending -> confirmed, 5s for others
    const delay = activeOrder.status === 'pending' ? 3000 : 5000;

    console.log(`Setting timer for auto-progression: ${activeOrder.status} -> ${nextStatus} in ${delay}ms`);

    const timer = setTimeout(async () => {
      try {
        console.log(`Auto-progressing order ${activeOrder.id} from ${activeOrder.status} to ${nextStatus}`);
        
        const updateData: any = {
          status: nextStatus,
          estimatedDeliveryTime: nextStatus !== 'delivered' ? new Date(Date.now() + 15 * 60000) : null
        };

        if (authType === 'firebase') {
          const orderRef = doc(db, 'orders', activeOrder.id);
          await updateDoc(orderRef, updateData);
        } else {
          await supabase
            .from('orders')
            .update({ 
              status: nextStatus,
              estimated_delivery_time: updateData.estimatedDeliveryTime
            })
            .eq('id', activeOrder.id);
        }
      } catch (err) {
        console.error('Auto-progress error:', err);
      }
    }, delay);

    // Visibility change listener to handle mobile backgrounding
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('App became visible, checking order status...');
        // The effect will naturally re-run if needed
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, activeOrder?.id, activeOrder?.status, authType, isSimulating]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    let unsubscribeFirebase: (() => void) | undefined;
    let unsubscribeSupabase: (() => void) | undefined;
    
    // Safety timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      setLoading(false);
      console.warn("Orders fetch timed out, forcing loading to false");
    }, 60000);

    const clearAndSetLoadingFalse = () => {
      setLoading(false);
      clearTimeout(loadingTimeout);
    };

    if (authType === 'firebase') {
      try {
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', (user as FirebaseUser).uid),
          limit(20)
        );

        unsubscribeFirebase = onSnapshot(q, (snapshot) => {
          const fetchedOrders = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as OrderData[];
          
          // Sort client-side to avoid requiring a composite index
          fetchedOrders.sort((a, b) => {
            const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return timeB - timeA;
          });
          
          setOrders(fetchedOrders);
          clearAndSetLoadingFalse();
        }, (error) => {
          console.error("Error fetching orders:", error);
          clearAndSetLoadingFalse();
          try {
            handleFirestoreError(error, OperationType.LIST, 'orders');
          } catch (e) {
            // Error is already logged, prevent crash
          }
        });
      } catch (error) {
        console.error("Error setting up Firebase listener:", error);
        clearAndSetLoadingFalse();
      }
    } else if (authType === 'supabase') {
      const fetchSupabaseOrders = async () => {
        try {
          const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', (user as SupabaseUser).id)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Error fetching Supabase orders:', error);
            toast.error('Failed to load orders');
          } else if (data) {
            setOrders(data.map(o => ({
              id: o.id,
              restaurantName: o.restaurant_name,
              restaurantId: o.restaurant_id,
              restaurantOwnerId: o.restaurant_owner_id,
              total: o.total,
              status: o.status,
              deliveryAddress: o.delivery_address,
              estimatedDeliveryTime: o.estimated_delivery_time,
              createdAt: { 
                toDate: () => new Date(o.created_at),
                toMillis: () => new Date(o.created_at).getTime()
              },
              items: typeof o.items === 'string' ? o.items : JSON.stringify(o.items)
            })) as OrderData[]);
          }
        } catch (err) {
          console.error('Supabase orders fetch error:', err);
        } finally {
          clearAndSetLoadingFalse();
        }
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
    } else {
      setLoading(false);
    }

    return () => {
      clearTimeout(loadingTimeout);
      if (unsubscribeFirebase) unsubscribeFirebase();
      if (unsubscribeSupabase) unsubscribeSupabase();
    };
  }, [user, authType, refreshTrigger]);

  // Removed local simulation useEffect as we now use real DB updates

  const getMapPosition = (status: string) => {
    switch (status) {
      case 'confirmed': return { top: '20%', left: '80%' };
      case 'preparing': return { top: '25%', left: '75%' };
      case 'ready_for_pickup': return { top: '30%', left: '70%' };
      case 'picked_up': return { top: '35%', left: '65%' };
      case 'on_the_way': return { top: '55%', left: '45%' };
      case 'delivered': return { top: '80%', left: '20%' };
      default: return { top: '20%', left: '80%' };
    }
  };

  if (!isAuthReady || loading) {
    return (
      <div className="pb-[calc(6rem+env(safe-area-inset-bottom))] pt-8 px-6 max-w-5xl mx-auto flex justify-center items-center h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  console.log('Orders component state:', { user: !!user, authType, ordersCount: orders.length });

  if (allOrders.length === 0) {
    return (
      <div className="pb-[calc(6rem+env(safe-area-inset-bottom))] pt-8 px-6 max-w-5xl mx-auto space-y-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center mb-4 border border-white/10">
          <Package size={40} className="text-white/40" />
        </div>
        <h1 className="text-3xl font-bold text-center">No Orders Yet</h1>
        <p className="text-white/60 text-center max-w-md">
          {user ? "You haven't placed any orders yet. Time to explore some delicious food!" : "Sign in to view your active and past orders, or place a demo order to see it here."}
        </p>
        {!user && (
          <button 
            onClick={() => window.location.href = '#profile'}
            className="mt-4 px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-colors"
          >
            Sign In Now
          </button>
        )}
      </div>
    );
  }

  const parseItems = (itemsStr: string): OrderItem[] => {
    try {
      return JSON.parse(itemsStr);
    } catch {
      return [];
    }
  };

  const getStatusProgress = (status: string) => {
    switch (status) {
      case 'pending': return 10;
      case 'confirmed': return 25;
      case 'preparing': return 50;
      case 'ready_for_pickup': return 75;
      case 'picked_up': return 85;
      case 'on_the_way': return 90;
      case 'delivered': return 100;
      default: return 0;
    }
  };

  return (
    <div className="pb-[calc(6rem+env(safe-area-inset-bottom))] pt-8 px-6 max-w-5xl mx-auto space-y-8">
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
              Chat
            </button>
          )}
        </div>
      </div>
      
      <div className="bg-surface rounded-3xl overflow-hidden border border-white/5 shadow-xl">
        {/* Order Details */}
        <div className="p-6 space-y-6">
          {isOrderActive && (
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                <span className={['pending', 'confirmed'].includes(activeOrder.status) ? 'text-primary' : ''}>Confirmed</span>
                <span className={['preparing', 'ready_for_pickup'].includes(activeOrder.status) ? 'text-primary' : ''}>Preparing</span>
                <span className={['picked_up', 'on_the_way'].includes(activeOrder.status) ? 'text-primary' : ''}>On Way</span>
                <span className={activeOrder.status === 'delivered' ? 'text-emerald-400' : ''}>Delivered</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${getStatusProgress(activeOrder.status)}%` }}
                  className="h-full bg-gradient-to-r from-primary/50 to-primary shadow-[0_0_10px_rgba(242,125,38,0.5)]"
                />
              </div>
            </div>
          )}

          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">
                  {activeOrder.status === 'delivered' ? 'Delivered' : 
                   activeOrder.status === 'cancelled' ? 'Order Cancelled' :
                   activeOrder.status === 'on_the_way' ? 'Order is on the way' :
                   activeOrder.status === 'picked_up' ? 'Order picked up' :
                   activeOrder.status === 'ready_for_pickup' ? 'Food is ready for pickup' :
                   activeOrder.status === 'preparing' ? 'Preparing your food' :
                   activeOrder.status === 'confirmed' ? 'Order Confirmed' :
                   'Pending Restaurant Acceptance'}
                </h2>
                {activeOrder.status === 'delivered' && <CheckCircle2 className="text-green-500" size={20} />}
              </div>
              <p className="text-white/60 text-sm">Your order from {activeOrder.restaurantName}</p>
              {activeOrder.status === 'pending' && !isSampleRestaurant(activeOrder.restaurantId, activeOrder.restaurantName, activeOrder.restaurantOwnerId) && (
                <p className="text-amber-400 text-[10px] font-bold uppercase tracking-wider mt-1 flex items-center gap-1">
                  <AlertCircle size={10} />
                  Waiting for Manual Approval
                </p>
              )}
              {activeOrder.estimatedDeliveryTime && (
                <p className="text-primary text-xs font-bold flex items-center gap-1 mt-1">
                  <Clock size={12} />
                  Estimated Arrival: {new Date(activeOrder.estimatedDeliveryTime?.toDate?.() || activeOrder.estimatedDeliveryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="bg-primary/20 text-primary p-3 rounded-2xl">
                <Clock size={24} />
              </div>
              {isOrderActive && (['confirmed', 'preparing', 'ready_for_pickup', 'picked_up', 'on_the_way'].includes(activeOrder.status)) && (
                <button 
                  onClick={() => setShowMap(showMap === activeOrder.id ? null : activeOrder.id)}
                  className="text-xs bg-primary/10 text-primary px-4 py-2 rounded-xl font-bold hover:bg-primary hover:text-white transition-all flex items-center gap-2 border border-primary/20"
                >
                  <MapIcon size={14} /> {showMap === activeOrder.id ? 'Hide Map' : 'Track Order'}
                </button>
              )}
              {isOrderActive && (activeOrder.status === 'pending' || activeOrder.status === 'confirmed' || activeOrder.status === 'preparing') && (
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

          {isOrderActive && showMap === activeOrder.id && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 bg-black/40 rounded-3xl overflow-hidden border border-white/5"
            >
              <div className="h-[300px] relative p-4">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                
                <div className="absolute top-[20%] left-[80%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <div className="p-2 bg-primary rounded-full shadow-lg shadow-primary/20">
                    <MapPin size={20} className="text-white" />
                  </div>
                  <span className="text-[10px] font-bold mt-1 text-white/60">Restaurant</span>
                </div>

                <div className="absolute top-[80%] left-[20%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <div className="p-2 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/20">
                    <MapPin size={20} className="text-white" />
                  </div>
                  <span className="text-[10px] font-bold mt-1 text-white/60">You</span>
                </div>

                <motion.div 
                  animate={getMapPosition(activeOrder.status)}
                  transition={{ duration: 2, ease: "easeInOut" }}
                  className="absolute z-10 flex flex-col items-center"
                >
                  <div className="p-2 bg-blue-500 rounded-full shadow-lg shadow-blue-500/20 animate-bounce">
                    <Navigation size={20} className="text-white transform rotate-45" />
                  </div>
                  <span className="text-[10px] font-bold mt-1 text-blue-400">Order</span>
                </motion.div>

                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                  <line x1="20%" y1="80%" x2="80%" y2="20%" stroke="white" strokeWidth="2" strokeDasharray="5,5" />
                </svg>
              </div>
              <div className="p-4 bg-white/5 border-t border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Navigation size={20} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Order is on the way</p>
                    <p className="text-xs text-white/40">Estimated arrival: 12 mins</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowChat(true)}
                  className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
                >
                  <MessageSquare size={20} className="text-primary" />
                </button>
              </div>
            </motion.div>
          )}

          {isOrderActive && (
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
              {/* Status Steps */}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-background text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ${['pending', 'confirmed'].includes(activeOrder.status) || ['preparing', 'ready_for_pickup', 'picked_up', 'on_the_way', 'delivered'].includes(activeOrder.status) ? 'bg-primary' : 'bg-zinc-800 text-white/40'}`}>
                  {activeOrder.status === 'pending' ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                  ) : (
                    <CheckCircle2 size={20} />
                  )}
                </div>
                <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border ${activeOrder.status === 'pending' ? 'bg-white/10 border-primary/30 shadow-[0_0_15px_rgba(242,125,38,0.1)]' : (activeOrder.status === 'confirmed' ? 'bg-white/10 border-primary/30' : 'bg-white/5 border-white/10')}`}>
                  <h3 className={`font-bold ${activeOrder.status === 'pending' ? 'text-white' : (activeOrder.status === 'confirmed' ? 'text-primary' : 'text-primary/60')}`}>
                    {activeOrder.status === 'pending' ? 'Order Placed' : 'Order Confirmed'}
                  </h3>
                  <p className="text-sm text-white/60">
                    {activeOrder.status === 'pending' ? 'Waiting for the restaurant to accept your order.' : 'The restaurant has accepted your order.'}
                  </p>
                </div>
              </div>

              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-background text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ${['preparing', 'ready_for_pickup', 'picked_up', 'on_the_way', 'delivered'].includes(activeOrder.status) ? 'bg-primary' : (activeOrder.status === 'confirmed' ? 'bg-primary' : 'bg-zinc-800 text-white/40')}`}>
                  {activeOrder.status === 'confirmed' ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                  ) : (
                    ['preparing', 'ready_for_pickup', 'picked_up', 'on_the_way', 'delivered'].includes(activeOrder.status) ? <CheckCircle2 size={20} /> : <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                  )}
                </div>
                <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border ${activeOrder.status === 'confirmed' ? 'bg-white/10 border-primary/30 shadow-[0_0_15px_rgba(242,125,38,0.1)]' : 'bg-white/5 border-white/10'}`}>
                  <h3 className={`font-bold ${activeOrder.status === 'confirmed' ? 'text-white' : (['preparing', 'ready_for_pickup', 'picked_up', 'on_the_way', 'delivered'].includes(activeOrder.status) ? 'text-primary' : 'text-white/40')}`}>Preparing Food</h3>
                  <p className="text-sm text-white/60">Your food is being prepared.</p>
                </div>
              </div>

              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ${['picked_up', 'on_the_way'].includes(activeOrder.status) || activeOrder.status === 'delivered' ? 'bg-primary text-white' : 'bg-zinc-800 text-white/40'}`}>
                  {activeOrder.status === 'delivered' ? <CheckCircle2 size={20} /> : (['picked_up', 'on_the_way'].includes(activeOrder.status) ? <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" /> : <div className="w-2.5 h-2.5 rounded-full bg-white/20" />)}
                </div>
                <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border ${['picked_up', 'on_the_way'].includes(activeOrder.status) ? 'bg-white/10 border-primary/30 shadow-[0_0_15px_rgba(242,125,38,0.1)]' : 'bg-white/5 border-white/10'}`}>
                  <h3 className={`font-bold ${['picked_up', 'on_the_way'].includes(activeOrder.status) ? 'text-white' : (activeOrder.status === 'delivered' ? 'text-primary/60' : 'text-white/40')}`}>On the Way</h3>
                  <p className="text-sm text-white/60">Order is heading to your location.</p>
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
      
      {allOrders.length > 1 && (
        <div className="mt-12 space-y-4">
          <h2 className="text-2xl font-bold">Order History</h2>
          <div className="space-y-4">
            {allOrders.filter(o => o.id !== activeOrder?.id).map(order => (
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
                  {order.status !== 'delivered' && order.status !== 'cancelled' && (
                    <button 
                      onClick={() => {
                        setSelectedOrderId(order.id);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 border border-primary/20"
                    >
                      <MapIcon size={16} />
                      Track
                    </button>
                  )}
                  {order.status === 'delivered' && (
                    <button 
                      onClick={() => setReviewOrder(order)}
                      className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 border border-emerald-500/20"
                    >
                      <Star size={16} />
                      Review
                    </button>
                  )}
                  <button 
                    onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                    className="w-12 bg-white/5 hover:bg-white/10 text-white rounded-xl flex items-center justify-center transition-all border border-white/10"
                  >
                    {expandedOrderId === order.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  <button 
                    onClick={() => handleDeleteOrder(order.id)}
                    className="w-12 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl flex items-center justify-center transition-all border border-red-500/20"
                    title="Delete Order"
                  >
                    <Trash2 size={18} />
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

      {/* Review Modal */}
      <AnimatePresence>
        {reviewOrder && (
          <ReviewModal 
            order={reviewOrder} 
            onClose={() => setReviewOrder(null)} 
          />
        )}
      </AnimatePresence>

      {/* Chat Modal */}
      <ChatModal 
        showChat={showChat}
        setShowChat={setShowChat}
        chatHistory={chatHistory}
        chatMessage={chatMessage}
        setChatMessage={setChatMessage}
        handleSendMessage={handleSendMessage}
      />
    </div>
  );
}

function ReviewModal({ order, onClose }: { order: OrderData; onClose: () => void }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, authType } = useAuth();

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      const reviewData = {
        orderId: order.id,
        restaurantId: order.restaurantId,
        restaurantName: order.restaurantName,
        userId: (user as any).uid || (user as any).id,
        userName: (user as any).displayName || (user as any).email?.split('@')[0] || 'Anonymous',
        rating,
        comment,
        photo,
        createdAt: serverTimestamp(),
      };

      if (authType === 'firebase') {
        await addDoc(collection(db, 'reviews'), reviewData);
      } else {
        await supabase.from('reviews').insert([reviewData]);
      }

      toast.success('Review submitted successfully!');
      onClose();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-zinc-900 w-full max-w-lg rounded-[2.5rem] border border-white/10 overflow-hidden"
      >
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold">Review Your Meal</h2>
              <p className="text-white/40 text-sm">{order.restaurantName}</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6">
            {/* Rating */}
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`p-2 transition-all ${rating >= star ? 'text-primary scale-110' : 'text-white/10'}`}
                >
                  <Star size={32} fill={rating >= star ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-bold text-white/60 mb-2">Your Feedback</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="How was the food? Any special mentions?"
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 min-h-[120px] resize-none"
              />
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-bold text-white/60 mb-2">Add a Photo</label>
              <div className="flex gap-4">
                {photo ? (
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-white/10">
                    <img src={photo} alt="Review" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setPhoto(null)}
                      className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-black/80"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-all group">
                    <Camera size={24} className="text-white/20 group-hover:text-primary transition-colors" />
                    <span className="text-[10px] font-bold text-white/20 mt-1">Add Photo</span>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                )}
                <div className="flex-1 flex items-center">
                  <p className="text-xs text-white/40 italic">"Photos help other foodies make better choices!"</p>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !comment}
              className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <RefreshCw className="animate-spin" size={20} /> : <Send size={20} />}
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
