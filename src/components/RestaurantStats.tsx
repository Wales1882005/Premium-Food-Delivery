import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, Users, DollarSign, Star, Calendar, ArrowUpRight, ArrowDownRight, Package, Utensils, MessageSquare, Award, Sparkles, Loader2, ChevronRight, Lightbulb } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Restaurant, Order, MenuItem } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { GoogleGenAI } from "@google/genai";

interface RestaurantStatsProps {
  restaurant: Restaurant;
}

export function RestaurantStats({ restaurant }: RestaurantStatsProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  useEffect(() => {
    setLoading(true);
    
    // Fetch Orders
    const ordersQuery = query(
      collection(db, 'orders'),
      where('restaurantId', '==', restaurant.id)
    );

    // Fetch Comments
    const commentsQuery = query(
      collection(db, 'comments'),
      where('restaurantId', '==', restaurant.id)
    );

    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        items: typeof doc.data().items === 'string' ? JSON.parse(doc.data().items) : doc.data().items
      })) as Order[];
      
      fetchedOrders.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      
      setOrders(fetchedOrders.slice(0, 100)); // Apply limit client-side
      setLoading(false);
    }, (error) => {
      console.error("Error fetching stats orders:", error);
      setLoading(false);
      try {
        handleFirestoreError(error, OperationType.LIST, 'orders');
      } catch (e) {}
    });

    const unsubscribeComments = onSnapshot(commentsQuery, (snapshot) => {
      const fetchedComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      fetchedComments.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      
      setComments(fetchedComments);
    }, (error) => {
      console.error("Error fetching stats comments:", error);
      try {
        handleFirestoreError(error, OperationType.LIST, 'comments');
      } catch (e) {}
    });

    return () => {
      unsubscribeOrders();
      unsubscribeComments();
    };
  }, [restaurant.id, restaurant.name]);

  const stats = useMemo(() => {
    const validOrders = orders.filter(order => order.status !== 'cancelled');
    const totalRevenue = validOrders.reduce((sum, order) => sum + order.total, 0);
    const avgOrderValue = validOrders.length > 0 ? totalRevenue / validOrders.length : 0;
    
    // Popular Items
    const itemCounts: Record<string, { count: number, revenue: number }> = {};
    validOrders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          if (!itemCounts[item.name]) {
            itemCounts[item.name] = { count: 0, revenue: 0 };
          }
          itemCounts[item.name].count += item.quantity;
          itemCounts[item.name].revenue += (item.price * item.quantity);
        });
      }
    });

    const popularItems = Object.entries(itemCounts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Revenue by Day (last 7 days)
    const dailyRevenue: Record<string, number> = {};
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    validOrders.forEach(order => {
      const date = order.createdAt?.toDate?.() || new Date();
      const dayName = days[date.getDay()];
      dailyRevenue[dayName] = (dailyRevenue[dayName] || 0) + order.total;
    });

    const revenueData = days.map(day => ({
      name: day,
      revenue: dailyRevenue[day] || 0
    }));

    // Rating Breakdown
    const ratingCounts = [0, 0, 0, 0, 0]; // 1 to 5 stars
    comments.forEach(c => {
      if (c.rating >= 1 && c.rating <= 5) {
        ratingCounts[c.rating - 1]++;
      }
    });

    const ratingBreakdown = [5, 4, 3, 2, 1].map(star => ({
      stars: star,
      count: ratingCounts[star - 1],
      percentage: comments.length > 0 ? (ratingCounts[star - 1] / comments.length) * 100 : 0
    }));

    return {
      totalRevenue,
      avgOrderValue,
      popularItems,
      revenueData,
      totalOrders: validOrders.length,
      ratingBreakdown,
      totalReviews: comments.length,
      avgRating: comments.length > 0 
        ? (comments.reduce((acc, c) => acc + c.rating, 0) / comments.length)
        : restaurant.rating
    };
  }, [orders, comments, restaurant.rating]);

  const generateAIInsights = async () => {
    if (isGeneratingInsights) return;
    setIsGeneratingInsights(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = "gemini-3-flash-preview";
      
      const statsSummary = {
        restaurantName: restaurant.name,
        totalRevenue: stats.totalRevenue,
        totalOrders: stats.totalOrders,
        avgOrderValue: stats.avgOrderValue,
        avgRating: stats.avgRating,
        popularItems: stats.popularItems.map(i => `${i.name} (${i.count} orders)`),
        revenueTrend: stats.revenueData.map(d => `${d.name}: $${d.revenue}`)
      };

      const prompt = `As a restaurant business consultant, analyze the following performance data for "${restaurant.name}" and provide 3-4 concise, actionable business insights or recommendations to improve revenue, customer satisfaction, or operational efficiency.
      
      Data Summary:
      - Total Revenue: $${statsSummary.totalRevenue.toFixed(2)}
      - Total Orders: ${statsSummary.totalOrders}
      - Avg Order Value: $${statsSummary.avgOrderValue.toFixed(2)}
      - Avg Rating: ${statsSummary.avgRating.toFixed(1)}/5.0
      - Top Items: ${statsSummary.popularItems.join(', ')}
      - Revenue Trend: ${statsSummary.revenueTrend.join(', ')}
      
      Note: The platform supports "Crave Points" (loyalty program) and "Promotions" (BOGO, discounts). Suggest how to use these specifically if relevant.
      
      Format your response as a bulleted list of insights. Keep it professional and encouraging.`;

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });

      setAiInsights(response.text || "Unable to generate insights at this time.");
    } catch (error) {
      console.error("Error generating AI insights:", error);
      setAiInsights("Failed to connect to AI consultant. Please try again later.");
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats || (stats.totalOrders === 0 && stats.totalReviews === 0)) {
    return (
      <div className="bg-surface rounded-3xl p-12 text-center border border-white/5">
        <TrendingUp className="text-white/20 mx-auto mb-4" size={40} />
        <h3 className="text-xl font-bold mb-2">No Data Yet</h3>
        <p className="text-white/60">Start receiving orders or reviews to see your restaurant's performance.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Insights Banner */}
      <div className="bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-3xl p-6 border border-primary/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full blur-2xl" />
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <Sparkles size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold">AI Business Insights</h3>
                <p className="text-white/60 text-sm">Get personalized recommendations powered by Gemini AI</p>
              </div>
            </div>
            <button 
              onClick={generateAIInsights}
              disabled={isGeneratingInsights}
              className="px-6 py-3 bg-white text-black font-bold rounded-2xl hover:bg-white/90 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isGeneratingInsights ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  Generate Insights
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </div>

          <AnimatePresence>
            {aiInsights && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-6 pt-6 border-t border-white/10"
              >
                <div className="bg-black/20 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-2 text-primary font-bold">
                    <Lightbulb size={18} />
                    <span>Recommendations</span>
                  </div>
                  <div className="text-white/80 text-sm leading-relaxed whitespace-pre-line">
                    {aiInsights}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface p-6 rounded-3xl border border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
              <DollarSign size={20} />
            </div>
            <span className="text-xs font-bold text-white/40 uppercase tracking-wider">Total Revenue</span>
          </div>
          <p className="text-2xl font-bold text-white">${stats.totalRevenue.toFixed(2)}</p>
          <div className="flex items-center gap-1 mt-2 text-emerald-400 text-xs">
            <ArrowUpRight size={14} />
            <span>Live updates</span>
          </div>
        </div>

        <div className="bg-surface p-6 rounded-3xl border border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400">
              <Package size={20} />
            </div>
            <span className="text-xs font-bold text-white/40 uppercase tracking-wider">Total Orders</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalOrders}</p>
          <div className="flex items-center gap-1 mt-2 text-blue-400 text-xs">
            <TrendingUp size={14} />
            <span>{stats.totalOrders > 0 ? 'Active sales' : 'Waiting for orders'}</span>
          </div>
        </div>

        <div className="bg-surface p-6 rounded-3xl border border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-500/20 rounded-xl text-purple-400">
              <TrendingUp size={20} />
            </div>
            <span className="text-xs font-bold text-white/40 uppercase tracking-wider">Avg. Order</span>
          </div>
          <p className="text-2xl font-bold text-white">${stats.avgOrderValue.toFixed(2)}</p>
          <div className="flex items-center gap-1 mt-2 text-purple-400 text-xs">
            <Award size={14} />
            <span>Value per customer</span>
          </div>
        </div>

        <div className="bg-surface p-6 rounded-3xl border border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-yellow-500/20 rounded-xl text-yellow-400">
              <Star size={20} />
            </div>
            <span className="text-xs font-bold text-white/40 uppercase tracking-wider">Rating</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.avgRating.toFixed(1)}</p>
          <div className="flex items-center gap-1 mt-2 text-yellow-400 text-xs">
            <MessageSquare size={14} />
            <span>{stats.totalReviews} reviews</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-surface p-6 rounded-3xl border border-white/5">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Calendar size={20} className="text-primary" /> Revenue Trend (Last 7 Days)
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6321" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FF6321" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #ffffff10', borderRadius: '12px' }}
                  itemStyle={{ color: '#FF6321' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#FF6321" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Popular Items */}
        <div className="bg-surface p-6 rounded-3xl border border-white/5">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Utensils size={20} className="text-primary" /> Top Selling Items
          </h3>
          {stats.popularItems.length > 0 ? (
            <div className="space-y-4">
              {stats.popularItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-xs font-bold text-white/40 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-white/40">{item.count} orders</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-400">${item.revenue.toFixed(2)}</p>
                    <div className="w-24 h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.revenue / stats.totalRevenue) * 100}%` }}
                        className="h-full bg-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-white/20">
              <Utensils size={40} className="mb-2" />
              <p className="text-sm">No item data available</p>
            </div>
          )}
        </div>

        {/* Rating Summary */}
        <div className="bg-surface p-6 rounded-3xl border border-white/5 lg:col-span-2">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Star size={20} className="text-primary" /> Customer Rating Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="text-center md:text-left">
              <p className="text-sm font-bold text-white/40 uppercase tracking-widest mb-2">Average Score</p>
              <div className="flex items-center justify-center md:justify-start gap-4">
                <span className="text-6xl font-black text-primary">{stats.avgRating.toFixed(1)}</span>
                <div>
                  <div className="flex gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={20} 
                        className={i < Math.round(stats.avgRating) ? "text-yellow-400 fill-yellow-400" : "text-white/10"} 
                      />
                    ))}
                  </div>
                  <p className="text-white/40 text-sm">{stats.totalReviews} total reviews</p>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 space-y-3">
              {stats.ratingBreakdown.map((item) => (
                <div key={item.stars} className="flex items-center gap-4">
                  <div className="flex items-center gap-1 w-12">
                    <span className="text-xs font-bold text-white/40">{item.stars}</span>
                    <Star size={12} className="text-white/20" />
                  </div>
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percentage}%` }}
                      className="h-full bg-primary"
                    />
                  </div>
                  <span className="text-xs font-bold text-white/40 w-10 text-right">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
