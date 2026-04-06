import { motion } from 'motion/react';
import { X, Navigation } from 'lucide-react';
import { ChatMessage } from './Orders';

interface ChatModalProps {
  showChat: boolean;
  setShowChat: (show: boolean) => void;
  chatHistory: ChatMessage[];
  chatMessage: string;
  setChatMessage: (msg: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
}

export function ChatModal({ showChat, setShowChat, chatHistory, chatMessage, setChatMessage, handleSendMessage }: ChatModalProps) {
  if (!showChat) return null;
  return (
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
              <h3 className="font-bold">Restaurant</h3>
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
        <form onSubmit={handleSendMessage} className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4 border-t border-white/10 bg-zinc-800/50 flex gap-2">
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
  );
}
