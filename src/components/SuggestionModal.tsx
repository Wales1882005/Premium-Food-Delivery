import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Send, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { toast } from 'sonner';

interface SuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SuggestionModal({ isOpen, onClose }: SuggestionModalProps) {
  const { user, authType } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newSuggestion, setNewSuggestion] = useState({
    foodType: '',
    restaurantName: '',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSuggestion.foodType || !newSuggestion.restaurantName || !newSuggestion.description) {
      toast.error('Please fill in all details');
      return;
    }

    if (!user || authType !== 'firebase') {
      toast.error('Please sign in with Google to submit suggestions');
      return;
    }

    setIsSubmitting(true);
    try {
      const suggestionData = {
        userId: (user as FirebaseUser).uid,
        userName: (user as FirebaseUser).displayName || 'Anonymous',
        foodType: newSuggestion.foodType,
        restaurantName: newSuggestion.restaurantName,
        description: newSuggestion.description,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'suggestions'), suggestionData);
      toast.success('Suggestion submitted! Thank you for your feedback.');
      setNewSuggestion({ foodType: '', restaurantName: '', description: '' });
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'suggestions');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-surface rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden"
          >
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-500/20 rounded-2xl text-emerald-400">
                    <Plus size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">New Suggestion</h2>
                    <p className="text-sm text-white/50">Help us grow our community</p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-white/40 uppercase font-bold mb-2 block tracking-widest">Food Type</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Authentic Ramen, Vegan Burgers"
                      value={newSuggestion.foodType}
                      onChange={e => setNewSuggestion({...newSuggestion, foodType: e.target.value})}
                      className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 focus:border-emerald-500 outline-none transition-all"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs text-white/40 uppercase font-bold mb-2 block tracking-widest">Restaurant Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Ichiraku Ramen, Green Garden"
                      value={newSuggestion.restaurantName}
                      onChange={e => setNewSuggestion({...newSuggestion, restaurantName: e.target.value})}
                      className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 focus:border-emerald-500 outline-none transition-all"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs text-white/40 uppercase font-bold mb-2 block tracking-widest">Description</label>
                    <textarea 
                      placeholder="Tell us why you love it and where it's located..."
                      value={newSuggestion.description}
                      onChange={e => setNewSuggestion({...newSuggestion, description: e.target.value})}
                      className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 focus:border-emerald-500 outline-none transition-all h-32 resize-none"
                      required
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send size={20} />
                        Submit Suggestion
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white/5 p-6 flex items-center gap-4 border-t border-white/5">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                <MessageSquare size={16} />
              </div>
              <p className="text-xs text-white/40 leading-relaxed">
                Your suggestions help us partner with the best local spots. We review every submission!
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
