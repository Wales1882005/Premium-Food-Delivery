import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';
import { MOCK_RESTAURANTS } from '../data/mockData';
import { Restaurant, MenuItem } from '../types';

interface AIMatchmakerProps {
  onClose: () => void;
  onSelectRestaurant: (restaurant: Restaurant, item?: MenuItem) => void;
}

export function AIMatchmaker({ onClose, onSelectRestaurant }: AIMatchmakerProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMatch = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Gemini API key is missing. If you deployed to Vercel, go to your Vercel Project Settings -> Environment Variables, add 'GEMINI_API_KEY' with your Google Gemini API key, and redeploy.");
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const systemInstruction = `You are an AI Food Matchmaker. The user will tell you what they are craving. 
You must pick the SINGLE best menu item from the provided list of restaurants that matches their craving.
Return a JSON object with exactly two keys: "restaurantId" and "menuItemId".
If nothing perfectly matches, pick the closest option.

Here is the available restaurant data:
${JSON.stringify(MOCK_RESTAURANTS.map(r => ({
  id: r.id,
  name: r.name,
  categories: r.categories,
  menu: r.menu.map(m => ({ id: m.id, name: m.name, description: m.description, tags: m.tags }))
})))}
`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              restaurantId: { type: Type.STRING },
              menuItemId: { type: Type.STRING }
            },
            required: ["restaurantId", "menuItemId"]
          }
        }
      });

      const resultText = response.text;
      if (!resultText) throw new Error("No response from AI");

      const cleanText = resultText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const result = JSON.parse(cleanText);
      
      const restaurant = MOCK_RESTAURANTS.find(r => r.id === result.restaurantId);
      const menuItem = restaurant?.menu.find(m => m.id === result.menuItemId);

      if (restaurant) {
        onSelectRestaurant(restaurant, menuItem);
        onClose();
      } else {
        throw new Error("AI returned an invalid restaurant ID.");
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to find a match. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-surface w-full max-w-lg rounded-3xl overflow-hidden border border-purple-500/30 shadow-[0_0_40px_rgba(168,85,247,0.15)]"
      >
        <div className="p-6 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
          
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-4 border border-purple-500/30">
            <Sparkles className="text-purple-400" size={24} />
          </div>
          
          <h2 className="text-2xl font-bold mb-2">AI Food Matchmaker</h2>
          <p className="text-white/70 text-sm">
            Describe what you're craving in your own words, and our AI will find the perfect dish for you.
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., 'I want something spicy and crunchy but not too heavy' or 'I need comfort food with lots of cheese'"
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none h-32"
            />
            {error && (
              <p className="text-red-400 text-sm mt-2">{error}</p>
            )}
          </div>

          <button
            onClick={handleMatch}
            disabled={isLoading || !prompt.trim()}
            className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Finding your perfect meal...
              </>
            ) : (
              <>
                Find My Match <ArrowRight size={20} />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
