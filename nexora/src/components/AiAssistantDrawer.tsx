import React, { useState } from 'react';
import { useEconomy } from '../context/EconomyContext';
import { 
  Bot, 
  Sparkles, 
  Send, 
  X, 
  Languages, 
  Tv, 
  Gamepad2, 
  ShieldCheck, 
  MessageSquare,
  Zap,
  ChevronUp,
  Volume2
} from 'lucide-react';

export const AiAssistantDrawer: React.FC = () => {
  const { aiMessages, sendAiAssistantQuery } = useEconomy();
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendAiAssistantQuery(inputText);
    setInputText('');
  };

  const handleQuickPrompt = (prompt: string) => {
    sendAiAssistantQuery(prompt);
  };

  return (
    <>
      {/* FLOATING TRIGGER BUTTON */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 z-40 p-3.5 bg-gradient-to-r from-pink-500 via-purple-600 to-amber-400 hover:scale-105 transition-all text-white rounded-full shadow-2xl border-2 border-slate-900 flex items-center gap-2 group animate-pulse"
      >
        <Bot className="w-6 h-6 text-amber-300" />
        <span className="text-xs font-black hidden sm:inline text-slate-950 bg-amber-300 px-2 py-0.5 rounded-full">
          AI Assistant
        </span>
      </button>

      {/* DRAWER / MODAL CHAT */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 w-[92vw] sm:w-[420px] max-h-[580px] bg-slate-950 border-2 border-purple-500/40 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5">
          {/* HEADER */}
          <div className="p-4 bg-gradient-to-r from-purple-900 via-slate-900 to-pink-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 text-pink-400 rounded-2xl border border-purple-500/30">
                <Bot className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-1.5">
                  Nexora AI Personal Assistant
                  <span className="px-2 py-0.2 bg-emerald-500/20 text-emerald-400 text-[9px] font-black rounded-full border border-emerald-500/30">
                    ONLINE
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400">Live Recommendations • Auto Translator • Co-Host AI</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* QUICK PROMPTS CHIPS */}
          <div className="px-3 py-2 bg-slate-900/80 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { label: '📺 Top Streams', prompt: 'Recommend the best live party rooms right now' },
              { label: '🎲 Ludo Matches', prompt: 'Find active Ludo gaming tables' },
              { label: '🌐 Translate Chat', prompt: 'Translate live stream comments to English' },
              { label: '👑 Wealth Tips', prompt: 'How do I level up my Wealth Level?' }
            ].map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickPrompt(chip.prompt)}
                className="px-2.5 py-1 bg-slate-950 hover:bg-purple-950/80 text-purple-300 border border-purple-500/30 rounded-xl text-[10px] font-bold whitespace-nowrap"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* CHAT MESSAGES CONTAINER */}
          <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[360px] text-xs">
            {aiMessages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'AI' && (
                  <div className="w-7 h-7 rounded-full bg-purple-600/30 border border-purple-500/40 text-pink-300 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div className={`p-3 rounded-2xl max-w-[80%] leading-relaxed ${
                  msg.sender === 'USER'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-tr-none shadow-md'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow'
                }`}>
                  <p>{msg.text}</p>
                  <span className="text-[9px] text-slate-400 block text-right mt-1 font-mono">{msg.timestamp}</span>
                </div>
              </div>
            ))}
          </div>

          {/* INPUT FORM */}
          <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask your AI companion anything..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              className="p-2.5 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-2xl shadow hover:opacity-90 transition-opacity"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
