import React, { useState } from 'react';
import { TicketedEvent } from '../types';
import { MOCK_EVENTS } from '../data/mockData';
import { useEconomy } from '../context/EconomyContext';
import { 
  Ticket, 
  Calendar, 
  Clock, 
  Users, 
  QrCode, 
  CheckCircle2, 
  Crown,
  Sparkles
} from 'lucide-react';

export const TicketedEventsView: React.FC = () => {
  const { purchaseTicket } = useEconomy();
  const [selectedTicket, setSelectedTicket] = useState<{ event: TicketedEvent; isVip: boolean } | null>(null);

  const handleBuy = (event: TicketedEvent, isVip: boolean) => {
    const ok = purchaseTicket(event, isVip);
    if (ok) {
      setSelectedTicket({ event, isVip });
    } else {
      alert('Insufficient Coins! Please recharge in Wallet.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 bg-amber-500/20 text-amber-300 font-black text-xs rounded-full border border-amber-500/30 uppercase tracking-widest flex items-center gap-1">
            <Ticket className="w-4 h-4 text-amber-400" /> Premium Ticketed Events
          </span>
          <h2 className="text-2xl font-black text-slate-100 mt-2">
            Exclusive Concerts, World Cups & Masterclasses
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Book VIP event passes with QR code check-in, early stream access, and live audience Q&A.
          </p>
        </div>
      </div>

      {/* EVENT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {MOCK_EVENTS.map(ev => (
          <div key={ev.id} className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden p-5 space-y-4 hover:border-amber-400/50 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="relative aspect-video rounded-2xl overflow-hidden">
                <img
                  src={ev.image}
                  alt={ev.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute top-3 left-3 px-3 py-1 bg-purple-600 text-white font-black text-[10px] rounded-full uppercase tracking-wider">
                  {ev.category}
                </span>
              </div>

              <h3 className="font-extrabold text-base text-slate-100">{ev.title}</h3>
              <p className="text-xs text-slate-400">Organized by {ev.organizerName}</p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 font-medium pt-2 border-t border-slate-800">
                <span className="flex items-center gap-1 text-amber-300">
                  <Calendar className="w-3.5 h-3.5" /> {ev.date}
                </span>
                <span className="flex items-center gap-1 text-cyan-300">
                  <Clock className="w-3.5 h-3.5" /> {ev.time}
                </span>
                <span className="flex items-center gap-1 text-slate-400">
                  <Users className="w-3.5 h-3.5" /> {ev.ticketsSold} / {ev.totalCapacity} Booked
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-3">
              <button
                onClick={() => handleBuy(ev, false)}
                className="py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs rounded-xl text-center"
              >
                Standard Pass (🪙 {ev.priceCoins})
              </button>
              <button
                onClick={() => handleBuy(ev, true)}
                className="py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-95 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 text-center flex items-center justify-center gap-1"
              >
                <Crown className="w-3.5 h-3.5" /> VIP Pass (🪙 {ev.vipTicketCoins})
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* TICKET PASS QR MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-xl font-black">
              ✓
            </div>
            <h3 className="font-extrabold text-base text-slate-100">Ticket Pass Confirmed!</h3>
            <p className="text-xs text-amber-300 font-bold">
              {selectedTicket.isVip ? 'VIP PASS UNLOCKED' : 'STANDARD PASS'}
            </p>
            <h4 className="font-black text-sm text-slate-200">{selectedTicket.event.title}</h4>

            {/* GENERATED QR CODE SIMULATION */}
            <div className="p-4 bg-white rounded-2xl w-48 h-48 mx-auto flex flex-col items-center justify-center space-y-2 shadow-inner">
              <QrCode className="w-36 h-36 text-slate-950" />
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              PASS-ID: NEX-{Math.random().toString(36).substring(2, 9).toUpperCase()}
            </p>

            <button
              onClick={() => setSelectedTicket(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl"
            >
              Close Pass
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
