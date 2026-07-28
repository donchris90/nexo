import React, { useState } from 'react';
import { useEconomy } from '../context/EconomyContext';
import { 
  MessageSquare, 
  Send, 
  Search, 
  Bell, 
  Users, 
  Bot, 
  Crown, 
  Sparkles, 
  CheckCheck, 
  UserPlus, 
  ShieldCheck, 
  Gift, 
  Phone, 
  Video, 
  MoreVertical,
  Volume2
} from 'lucide-react';

export const ChatMenuView: React.FC = () => {
  const { notifications, markNotificationRead, userLevel, addXp } = useEconomy();
  const [activeSubTab, setActiveSubTab] = useState<'MESSAGES' | 'SYSTEM' | 'FRIENDS' | 'FAMILY_CHAT'>('MESSAGES');
  const [selectedChatId, setSelectedChatId] = useState<string>('c1');
  const [inputMsg, setInputMsg] = useState('');

  // Mock Conversations List
  const [conversations, setConversations] = useState([
    {
      id: 'c1',
      name: 'Aria Nova',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      badge: 'TOP STREAMER',
      lastMessage: 'Hey Alex! Thanks for sending the 520x Cyber Sports Car gift in the party room! 🚗💨',
      timestamp: '18:42',
      unreadCount: 2,
      isOnline: true,
      countryFlag: '🇩🇪'
    },
    {
      id: 'c2',
      name: 'Nexora AI Co-Host Assistant',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80',
      badge: 'OFFICIAL AI',
      lastMessage: 'Your daily check-in bonus of +500 Coins is ready to claim in your Wallet!',
      timestamp: '17:15',
      unreadCount: 0,
      isOnline: true,
      countryFlag: '🤖'
    },
    {
      id: 'c3',
      name: 'CyberKnight',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
      badge: 'PK CHAMPION',
      lastMessage: 'Are you ready for tonight 9-Seat Ludo PvP Guild Tournament at 8 PM?',
      timestamp: '15:30',
      unreadCount: 1,
      isOnline: true,
      countryFlag: '🇺🇸'
    },
    {
      id: 'c4',
      name: 'StarLight Guild Chat [Official]',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
      badge: 'GUILD #1',
      lastMessage: 'DJ Kairos: Family PK Battle starting in 10 minutes! Join seat #3 now!',
      timestamp: '12:05',
      unreadCount: 5,
      isOnline: true,
      countryFlag: '🏆'
    }
  ]);

  // Active Chat Message Thread
  const [chatThreads, setChatThreads] = useState<Record<string, Array<{ id: string; sender: 'me' | 'them'; text: string; time: string; giftCoins?: number }>>>({
    c1: [
      { id: 't1', sender: 'them', text: 'Hi Alex! Welcome to my stream session earlier!', time: '18:30' },
      { id: 't2', sender: 'me', text: 'Hey Aria! Your song performance was amazing!', time: '18:35' },
      { id: 't3', sender: 'them', text: 'Hey Alex! Thanks for sending the 520x Cyber Sports Car gift in the party room! 🚗💨', time: '18:42', giftCoins: 52000 }
    ],
    c2: [
      { id: 't1', sender: 'them', text: 'Hello Alex! I am your personal Nexora AI Co-Host. Need stream tips, coin conversion advice, or agency help?', time: '17:10' },
      { id: 't2', sender: 'them', text: 'Your daily check-in bonus of +500 Coins is ready to claim in your Wallet!', time: '17:15' }
    ],
    c3: [
      { id: 't1', sender: 'them', text: 'Are you ready for tonight 9-Seat Ludo PvP Guild Tournament at 8 PM?', time: '15:30' }
    ],
    c4: [
      { id: 't1', sender: 'them', text: 'StarLight Guild Chat: Family PK Battle starting in 10 minutes! Join seat #3 now!', time: '12:05' }
    ]
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const newMsg = {
      id: `m_${Date.now()}`,
      sender: 'me' as const,
      text: inputMsg,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatThreads(prev => ({
      ...prev,
      [selectedChatId]: [...(prev[selectedChatId] || []), newMsg]
    }));

    setInputMsg('');
    addXp(10);

    // AI Bot automated reply
    if (selectedChatId === 'c2') {
      setTimeout(() => {
        const botReply = {
          id: `bot_${Date.now()}`,
          sender: 'them' as const,
          text: `🤖 [AI Assistant]: I received your message "${newMsg.text}". All systems green! Wealth level ${userLevel.wealthLevel} features unlocked!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatThreads(prev => ({
          ...prev,
          c2: [...(prev['c2'] || []), botReply]
        }));
      }, 1000);
    }
  };

  const currentConv = conversations.find(c => c.id === selectedChatId) || conversations[0];
  const currentThread = chatThreads[selectedChatId] || [];

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 space-y-4">
      {/* HEADER BAR */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white font-black shadow-lg">
            <MessageSquare className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-xl font-black bg-gradient-to-r from-cyan-300 via-pink-300 to-amber-300 bg-clip-text text-transparent">
              Live Messages & Notification Center
            </h2>
            <p className="text-[11px] text-slate-400">Direct Messages, System Alerts, Guild Chats & AI Co-Host</p>
          </div>
        </div>

        {/* SUB TABS */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
          {[
            { id: 'MESSAGES', label: '💬 Direct Chats' },
            { id: 'SYSTEM', label: '🔔 System Alerts' },
            { id: 'FRIENDS', label: '👥 Friends' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl font-extrabold transition-all ${
                activeSubTab === tab.id
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeSubTab === 'MESSAGES' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[620px]">
          {/* CONVERSATION LIST */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-3 space-y-2 overflow-y-auto">
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-2xl border border-slate-800 mb-2">
              <Search className="w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search chats or friends..."
                className="bg-transparent text-xs text-slate-200 focus:outline-none w-full"
              />
            </div>

            {conversations.map((conv) => {
              const isSelected = selectedChatId === conv.id;
              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedChatId(conv.id)}
                  className={`p-3 rounded-2xl cursor-pointer transition-all border flex items-center gap-3 ${
                    isSelected
                      ? 'bg-slate-800/90 border-cyan-500/50 shadow-md'
                      : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="relative">
                    <img
                      src={conv.avatar}
                      alt={conv.name}
                      className="w-11 h-11 rounded-full object-cover ring-2 ring-purple-500/50"
                      referrerPolicy="no-referrer"
                    />
                    {conv.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-slate-100 truncate flex items-center gap-1">
                        {conv.name} {conv.countryFlag}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{conv.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{conv.lastMessage}</p>
                  </div>

                  {conv.unreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-pink-500 text-white font-black text-[10px] rounded-full">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* ACTIVE CHAT THREAD VIEW */}
          <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col justify-between shadow-2xl relative overflow-hidden">
            {/* THREAD HEADER */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <img
                  src={currentConv.avatar}
                  alt={currentConv.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-cyan-500/50"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h3 className="font-black text-xs text-slate-100 flex items-center gap-1.5">
                    {currentConv.name} {currentConv.countryFlag}
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-[9px] font-extrabold rounded-full border border-purple-500/30">
                      {currentConv.badge}
                    </span>
                  </h3>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Active Now
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => alert('Starting Voice Call session...')}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                  title="Voice Call"
                >
                  <Phone className="w-4 h-4 text-cyan-400" />
                </button>
                <button
                  onClick={() => alert('Starting 1-on-1 Live Video Call...')}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                  title="Video Call"
                >
                  <Video className="w-4 h-4 text-pink-400" />
                </button>
              </div>
            </div>

            {/* MESSAGES BUBBLE BODY */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3 px-1">
              {currentThread.map((msg) => {
                const isMe = msg.sender === 'me';
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl p-3 space-y-1 shadow-md text-xs ${
                      isMe
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-none'
                        : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none'
                    }`}>
                      <p className="leading-relaxed font-medium">{msg.text}</p>
                      {msg.giftCoins && (
                        <div className="p-2 bg-amber-500/20 border border-amber-500/40 rounded-xl flex items-center gap-2 text-amber-300 font-extrabold text-[11px] mt-1">
                          <Gift className="w-4 h-4 text-amber-400" /> Gift Sent: 🪙 {msg.giftCoins.toLocaleString()} Coins!
                        </div>
                      )}
                      <span className={`text-[9px] block text-right font-mono ${isMe ? 'text-purple-200' : 'text-slate-500'}`}>
                        {msg.time}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* MESSAGE INPUT BOX */}
            <form onSubmit={handleSend} className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const voiceMsg = {
                    id: `m_vn_${Date.now()}`,
                    sender: 'me' as const,
                    text: '🎤 Voice Note (0:14)',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  };
                  setChatThreads(prev => ({
                    ...prev,
                    [selectedChatId]: [...(prev[selectedChatId] || []), voiceMsg]
                  }));
                }}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-2xl border border-slate-700"
                title="Send Voice Note"
              >
                🎤
              </button>
              <button
                type="button"
                onClick={() => {
                  const imgMsg = {
                    id: `m_img_${Date.now()}`,
                    sender: 'me' as const,
                    text: '📷 Shared photo',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  };
                  setChatThreads(prev => ({
                    ...prev,
                    [selectedChatId]: [...(prev[selectedChatId] || []), imgMsg]
                  }));
                }}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-2xl border border-slate-700"
                title="Send Image / Document"
              >
                📷
              </button>
              <input
                type="text"
                placeholder={`Message ${currentConv.name}...`}
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-100 focus:border-cyan-500"
              />
              <button
                type="submit"
                className="p-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black rounded-2xl shadow-lg hover:scale-105 transition-transform"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SYSTEM ALERTS & NOTIFICATIONS */}
      {activeSubTab === 'SYSTEM' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" /> Official System Alerts & Rewards
          </h3>

          <div className="space-y-2.5">
            {notifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => markNotificationRead(notif.id)}
                className={`p-4 rounded-2xl border flex items-start justify-between gap-3 text-xs cursor-pointer ${
                  notif.read
                    ? 'bg-slate-950/60 border-slate-800/80 opacity-70'
                    : 'bg-slate-950 border-pink-500/40 shadow-md'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-200">{notif.title}</span>
                    {!notif.read && (
                      <span className="px-2 py-0.2 bg-pink-500 text-white text-[9px] font-black rounded-full uppercase">NEW</span>
                    )}
                  </div>
                  <p className="text-slate-400">{notif.body}</p>
                  <span className="text-[10px] text-slate-500 font-mono block">{notif.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
