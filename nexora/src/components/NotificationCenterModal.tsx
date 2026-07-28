import React, { useState } from 'react';
import { useEconomy } from '../context/EconomyContext';
import { 
  Bell, 
  Gift, 
  Users, 
  Radio, 
  MessageSquare, 
  Award, 
  Gamepad2, 
  Calendar, 
  ShieldCheck, 
  X, 
  CheckCheck,
  Trash2
} from 'lucide-react';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({ isOpen, onClose }) => {
  const { notifications, markNotificationRead, clearAllNotifications } = useEconomy();
  const [activeTab, setActiveTab] = useState<'ALL' | 'GIFTS' | 'FOLLOWERS' | 'LIVE_ALERTS' | 'MESSAGES' | 'REWARDS' | 'GAMES' | 'EVENTS' | 'SECURITY'>('ALL');

  if (!isOpen) return null;

  const filtered = activeTab === 'ALL' 
    ? notifications 
    : notifications.filter(n => n.category === activeTab);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        {/* HEADER */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 text-white shadow-lg">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-100 flex items-center gap-2">
                Notification Center
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-pink-600 text-white text-[10px] font-black rounded-full">
                    {unreadCount} Unread
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">Live gift alerts, follower updates, rewards & security alerts</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={clearAllNotifications}
              className="p-2 bg-slate-800 text-slate-400 hover:text-red-400 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
              title="Clear All"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-xl"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CATEGORY TABS */}
        <div className="flex items-center gap-1 p-2 bg-slate-950 border-b border-slate-800 overflow-x-auto no-scrollbar">
          {[
            { id: 'ALL', label: '🔔 All' },
            { id: 'GIFTS', label: '🎁 Gifts' },
            { id: 'FOLLOWERS', label: '👥 Followers' },
            { id: 'LIVE_ALERTS', label: '🔴 Live' },
            { id: 'MESSAGES', label: '💬 Chat' },
            { id: 'REWARDS', label: '👑 Rewards' },
            { id: 'GAMES', label: '🎲 Games' },
            { id: 'SECURITY', label: '🛡️ Security' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* NOTIFICATION LIST */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <Bell className="w-10 h-10 mx-auto text-slate-700 opacity-50" />
              <p className="text-xs font-bold">No notifications in this tab.</p>
            </div>
          ) : (
            filtered.map(notif => (
              <div
                key={notif.id}
                onClick={() => markNotificationRead(notif.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                  notif.read
                    ? 'bg-slate-950/60 border-slate-800/60 text-slate-400'
                    : 'bg-slate-900 border-purple-500/40 text-slate-100 shadow-md ring-1 ring-purple-500/20'
                }`}
              >
                <div className="p-2.5 rounded-xl bg-purple-950 border border-purple-500/30 text-pink-400 shrink-0">
                  {notif.category === 'GIFTS' && <Gift className="w-4 h-4" />}
                  {notif.category === 'LIVE_ALERTS' && <Radio className="w-4 h-4 text-red-400" />}
                  {notif.category === 'GAMES' && <Gamepad2 className="w-4 h-4 text-amber-400" />}
                  {notif.category === 'REWARDS' && <Award className="w-4 h-4 text-emerald-400" />}
                  {notif.category === 'SECURITY' && <ShieldCheck className="w-4 h-4 text-cyan-400" />}
                  {notif.category === 'FOLLOWERS' && <Users className="w-4 h-4 text-purple-400" />}
                  {notif.category === 'MESSAGES' && <MessageSquare className="w-4 h-4 text-indigo-400" />}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-xs text-slate-100">{notif.title}</h4>
                    <span className="text-[10px] text-slate-500 font-mono">{notif.timestamp}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-300">{notif.body}</p>
                </div>

                {!notif.read && (
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shrink-0 mt-1" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
