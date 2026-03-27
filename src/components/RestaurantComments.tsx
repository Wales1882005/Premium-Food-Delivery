import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, MessageSquare, Send, User } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

interface RestaurantCommentsProps {
  restaurantId: string;
  restaurantName: string;
}

export function RestaurantComments({ restaurantId, restaurantName }: RestaurantCommentsProps) {
  const { user, authType } = useAuth();
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'comments'),
      where('restaurantId', '==', restaurantId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setComments(fetchedComments);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'comments');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [restaurantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    if (!user || authType !== 'firebase') {
      toast.error('Please sign in with Google to write a review');
      return;
    }

    setIsSubmitting(true);
    try {
      const commentData = {
        userId: (user as any).uid,
        userName: (user as any).displayName || 'Anonymous',
        userPhoto: (user as any).photoURL || '',
        restaurantId,
        text: newComment,
        rating,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'comments'), commentData);
      toast.success('Review submitted! Thank you.');
      setNewComment('');
      setRating(5);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'comments');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Review Summary */}
      <div className="bg-surface p-6 rounded-3xl border border-white/5 flex flex-col md:flex-row items-center gap-8">
        <div className="text-center md:text-left">
          <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-2">Overall Rating</h3>
          <div className="flex items-center gap-4">
            <span className="text-6xl font-black text-primary">
              {comments.length > 0 
                ? (comments.reduce((acc, c) => acc + c.rating, 0) / comments.length).toFixed(1)
                : '0.0'}
            </span>
            <div>
              <div className="flex gap-1 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={20} 
                    className={i < Math.round(comments.length > 0 ? comments.reduce((acc, c) => acc + c.rating, 0) / comments.length : 0) ? "text-yellow-400 fill-yellow-400" : "text-white/10"} 
                  />
                ))}
              </div>
              <p className="text-white/40 text-sm">{comments.length} reviews</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 w-full space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = comments.filter(c => c.rating === star).length;
            const percentage = comments.length > 0 ? (count / comments.length) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-3">
                <span className="text-xs font-bold text-white/40 w-4">{star}</span>
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    className="h-full bg-primary"
                  />
                </div>
                <span className="text-xs font-bold text-white/40 w-8 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Write a Review */}
      <div className="bg-surface p-6 rounded-3xl border border-white/5">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <MessageSquare size={20} className="text-primary" />
          Write a Review
        </h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-white/60">Your Rating:</span>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star 
                    size={32} 
                    className={star <= rating ? "text-yellow-400 fill-yellow-400" : "text-white/10"} 
                  />
                </button>
              ))}
            </div>
          </div>
          
          <div className="relative">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={`Tell us what you loved about ${restaurantName}...`}
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 pr-16 text-white placeholder:text-white/30 focus:border-primary outline-none transition-all min-h-[150px] resize-none shadow-inner"
            />
            <button 
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="absolute bottom-6 right-6 p-3 bg-primary text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
            >
              <Send size={24} />
            </button>
          </div>
        </form>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          Recent Reviews
          <span className="text-sm font-normal text-white/40 ml-2">({comments.length})</span>
        </h3>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : comments.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {comments.map((comment, i) => (
              <motion.div 
                key={comment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-surface/50 p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    {comment.userPhoto ? (
                      <img src={comment.userPhoto} alt={comment.userName} className="w-10 h-10 rounded-full object-cover border border-white/10" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                        <User size={20} className="text-white/40" />
                      </div>
                    )}
                    <div>
                      <div className="font-bold">{comment.userName}</div>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={12} className={i < comment.rating ? "text-yellow-400 fill-yellow-400" : "text-white/10"} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-white/30 text-xs font-medium">
                    {comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleDateString() : 'Recently'}
                  </span>
                </div>
                <p className="text-white/70 text-sm leading-relaxed italic">"{comment.text}"</p>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-surface/30 rounded-3xl border border-dashed border-white/10">
            <MessageSquare size={48} className="mx-auto text-white/5 mb-4" />
            <p className="text-white/30">No reviews yet. Be the first to share your experience!</p>
          </div>
        )}
      </div>
    </div>
  );
}
