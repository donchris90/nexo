import React, { useState } from 'react';
import { useEconomy } from '../context/EconomyContext';
import { useVideoPlayer } from '../context/VideoPlayerContext';
import { 
  Clapperboard, 
  TrendingUp, 
  Globe2, 
  Users, 
  Award, 
  Download,
  DollarSign,
  Video,
  ShoppingBag,
  Ticket,
  Bot,
  Receipt,
  PlusCircle,
  PlayCircle,
  Briefcase,
  Crown,
  Heart,
  CheckCircle2,
  XCircle,
  Send,
  MessageSquare
} from 'lucide-react';

interface BrandDeal {
  id: string;
  brandName: string;
  campaignTitle: string;
  payoutUsd: number;
  status: 'PENDING' | 'ACCEPTED' | 'COMPLETED';
  deadline: string;
}

interface FanSubscriber {
  id: string;
  name: string;
  tier: 'GOLD_VIP' | 'DIAMOND_VIP' | 'LEGEND';
  monthlyCoins: number;
  monthsActive: number;
  avatar: string;
}

export const CreatorStudioView: React.FC = () => {
  const { wallet, userLevel, authUser } = useEconomy();
  const { videos: videoLibrary, playVideo } = useVideoPlayer();
  const [activeTab, setActiveTab] = useState<'ANALYTICS' | 'CRM_SUBSCRIBERS' | 'BRAND_DEALS' | 'REEL_VIDEOS' | 'EVENTS' | 'AI_CONFIG' | 'TAXES_LEDGER'>('ANALYTICS');

  // Brand Collaboration Deals
  const [brandDeals, setBrandDeals] = useState<BrandDeal[]>([
    { id: 'b1', brandName: 'Razer Gaming Gear', campaignTitle: 'Live Stream Headset Showcase & Giveaway', payoutUsd: 2500, status: 'PENDING', deadline: 'Aug 10, 2026' },
    { id: 'b2', brandName: 'Monster Energy', campaignTitle: 'On-Screen Banner & 15-min Live Spotlight', payoutUsd: 1800, status: 'ACCEPTED', deadline: 'Aug 02, 2026' },
    { id: 'b3', brandName: 'Logitech G', campaignTitle: 'Keyboard Unboxing & Multi-Seat Guest Stream', payoutUsd: 3200, status: 'COMPLETED', deadline: 'Jul 20, 2026' }
  ]);

  // Fan Club CRM
  const [subscribers] = useState<FanSubscriber[]>([
    { id: 'sub1', name: 'GamerGod99', tier: 'LEGEND', monthlyCoins: 5000, monthsActive: 14, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80' },
    { id: 'sub2', name: 'AriaFanatic', tier: 'DIAMOND_VIP', monthlyCoins: 2000, monthsActive: 8, avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&q=80' },
    { id: 'sub3', name: 'CyberKnight', tier: 'GOLD_VIP', monthlyCoins: 1000, monthsActive: 5, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80' }
  ]);

  // Video Reels State
  const [videoReels] = useState([
    { id: 'v1', title: 'Top 10 Live PK Moments Season 8', views: '42.5K', likes: '8.2K', earningsCoins: 28000 },
    { id: 'v2', title: 'Acoustic Guitar Cover Session', views: '18.9K', likes: '3.4K', earningsCoins: 12500 },
    { id: 'v3', title: 'Virtual Avatar Setup Tutorial', views: '9.2K', likes: '1.8K', earningsCoins: 5100 }
  ]);

  const handleBrandAction = (id: string, action: 'ACCEPTED' | 'REJECTED') => {
    setBrandDeals(prev => prev.map(deal => {
      if (deal.id === id) {
        return { ...deal, status: action === 'ACCEPTED' ? 'ACCEPTED' : deal.status };
      }
      return deal;
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 bg-purple-500/20 text-purple-300 font-black text-xs rounded-full border border-purple-500/30 uppercase tracking-widest flex items-center gap-1">
            <Clapperboard className="w-4 h-4 text-purple-400" /> Creator CRM & Business Hub
          </span>
          <h2 className="text-2xl font-black text-slate-100 mt-2">
            Creator Studio & Revenue Dashboard
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage your fan subscribers, brand collaboration deals, video reels, AI stream assistant, and tax reports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              alert('Generating official 2026 Nexora Creator Tax & Earnings Statement PDF...');
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-slate-700 shadow-md transition-all"
          >
            <Download className="w-4 h-4 text-amber-400" /> Download Tax Report (1099 / W8)
          </button>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {[
          { id: 'ANALYTICS', label: 'Revenue & Followers', icon: TrendingUp },
          { id: 'CRM_SUBSCRIBERS', label: 'Fan Club CRM', icon: Heart },
          { id: 'BRAND_DEALS', label: 'Brand Collaborations', icon: Briefcase },
          { id: 'REEL_VIDEOS', label: 'Video Reels & Clips', icon: Video },
          { id: 'EVENTS', label: 'Ticketed Events', icon: Ticket },
          { id: 'AI_CONFIG', label: 'AI Co-Host Config', icon: Bot },
          { id: 'TAXES_LEDGER', label: 'Taxes & Ledger Payouts', icon: Receipt }
        ].map((tab) => {
          const Icon = tab.icon;
          const isAct = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black tracking-wide flex items-center gap-2 transition-all whitespace-nowrap ${
                isAct
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20 border border-purple-400/40'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4 text-amber-300" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: REVENUE & ANALYTICS */}
      {activeTab === 'ANALYTICS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { title: "Today's Earnings", val: '💎 3,400', sub: '~$170.00 USD', icon: '📈' },
              { title: 'Active VIP Fans', val: `${subscribers.length} Subscribers`, sub: '+$840/mo Recurring', icon: '👑' },
              { title: 'This Month Total', val: '💎 64,500', sub: '~$3,225.00 USD', icon: '💰' },
              { title: 'Followers Growth', val: `${userLevel.followersCount} Followers`, sub: '+420 New Followers', icon: '👥' }
            ].map((card, idx) => (
              <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-400">{card.title}</span>
                  <span className="text-xl">{card.icon}</span>
                </div>
                <div className="text-xl font-black text-slate-100">{card.val}</div>
                <p className="text-[10px] font-bold text-cyan-400">{card.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-cyan-400" /> Audience Demographics & Country Share
              </h3>
              <div className="space-y-3">
                {[
                  { country: 'United States', share: '42%', revenue: '💎 27,090' },
                  { country: 'Germany / EU', share: '24%', revenue: '💎 15,480' },
                  { country: 'United Kingdom', share: '18%', revenue: '💎 11,610' },
                  { country: 'Japan & S. Korea', share: '16%', revenue: '💎 10,320' }
                ].map((item, i) => (
                  <div key={i} className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200">{item.country}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-400 font-mono">{item.share}</span>
                      <span className="font-black text-cyan-300">{item.revenue}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" /> Top Gift Supporters
              </h3>
              <div className="space-y-3">
                {[
                  { name: 'GamerGod99', gifts: '24 Gifts Sent', totalCoins: '120,000 Coins' },
                  { name: 'AriaFanatic', gifts: '18 Gifts Sent', totalCoins: '85,000 Coins' },
                  { name: 'CyberKnight', gifts: '12 Gifts Sent', totalCoins: '50,000 Coins' }
                ].map((sup, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-black text-slate-200">{sup.name}</p>
                      <p className="text-[10px] text-slate-500">{sup.gifts}</p>
                    </div>
                    <span className="font-black text-amber-400">🪙 {sup.totalCoins}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FAN CLUB CRM */}
      {activeTab === 'CRM_SUBSCRIBERS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-100 flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-500" /> Fan Club Subscriber Management
              </h3>
              <p className="text-xs text-slate-400">Track recurring VIP subscribers, custom badges, and fan perks.</p>
            </div>
            <span className="px-3 py-1.5 bg-pink-500/20 text-pink-300 border border-pink-500/30 font-bold text-xs rounded-xl">
              Total MRR: ~$840.00 USD
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {subscribers.map((sub) => (
              <div key={sub.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <img src={sub.avatar} alt={sub.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-pink-500/50" />
                  <div>
                    <h4 className="font-black text-xs text-slate-100 flex items-center gap-1">
                      {sub.name} <Crown className="w-3.5 h-3.5 text-amber-400" />
                    </h4>
                    <span className="text-[10px] text-purple-300 font-bold">{sub.tier}</span>
                  </div>
                </div>
                <div className="text-xs space-y-1 text-slate-400 border-t border-slate-800 pt-2">
                  <div className="flex justify-between"><span>Monthly Coins:</span> <span className="font-bold text-amber-400">🪙 {sub.monthlyCoins}</span></div>
                  <div className="flex justify-between"><span>Active Tenure:</span> <span className="font-bold text-slate-200">{sub.monthsActive} months</span></div>
                </div>
                <button
                  onClick={() => alert(`Sent direct VIP message to ${sub.name}`)}
                  className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Message Fan
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: BRAND DEALS */}
      {activeTab === 'BRAND_DEALS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-100 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-cyan-400" /> Brand Sponsorships & Creator Marketplace
              </h3>
              <p className="text-xs text-slate-400">Review incoming campaign requests, contractual payouts, and deadlines.</p>
            </div>
          </div>

          <div className="space-y-3">
            {brandDeals.map((deal) => (
              <div key={deal.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase font-black tracking-wider text-cyan-400">{deal.brandName}</span>
                  <h4 className="font-bold text-sm text-slate-100">{deal.campaignTitle}</h4>
                  <p className="text-[10px] text-slate-500">Deadline: {deal.deadline}</p>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-black text-emerald-400 text-sm">${deal.payoutUsd.toLocaleString()} USD</span>
                  {deal.status === 'PENDING' ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleBrandAction(deal.id, 'ACCEPTED')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Accept
                      </button>
                    </div>
                  ) : (
                    <span className="px-3 py-1.5 bg-cyan-500/20 text-cyan-300 font-bold text-xs rounded-xl border border-cyan-500/30">
                      {deal.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: REEL VIDEOS */}
      {activeTab === 'REEL_VIDEOS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="font-extrabold text-base text-slate-100 flex items-center gap-2">
              <Video className="w-5 h-5 text-purple-400" /> Published Video Library & Stream Broadcasts
            </h3>
            <span className="px-3 py-1 bg-purple-500/20 text-purple-300 font-bold text-xs rounded-xl border border-purple-500/30">
              {videoLibrary.length} Active Videos
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {videoLibrary.map((video) => (
              <div key={video.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden relative border border-slate-800 group">
                  <img src={video.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => playVideo(video)}
                      className="p-3 bg-cyan-600 text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                    >
                      <PlayCircle className="w-6 h-6" />
                    </button>
                  </div>
                  <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-slate-950/80 text-[10px] font-mono font-bold text-slate-200 rounded">
                    {Math.floor(video.duration / 60)}:{('0' + Math.floor(video.duration % 60)).slice(-2)}
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-100 line-clamp-1">{video.title}</h4>
                  <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{video.description}</p>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800 pt-2">
                  <span>👁️ {(video.views || 0).toLocaleString()} views</span>
                  <span className="font-black text-cyan-400">{video.resolution || '1080p'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: EVENTS */}
      {activeTab === 'EVENTS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="font-extrabold text-base text-slate-100 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-amber-400" /> Creator Ticketed Concerts & Masterclasses
          </h3>
          <p className="text-xs text-slate-400">Host private, ticketed streams with custom coin entry passes.</p>
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
            <div>
              <p className="font-black text-slate-100">VIP Acoustic Piano Session & Q&A</p>
              <p className="text-[10px] text-slate-500">Date: July 30, 2026 • Ticket: 500 Coins</p>
            </div>
            <span className="font-black text-purple-300">142 Tickets Sold</span>
          </div>
        </div>
      )}

      {/* TAB 6: AI CONFIG */}
      {activeTab === 'AI_CONFIG' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="font-extrabold text-base text-slate-100 flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-400" /> AI Stream Co-Host Assistant Personality
          </h3>
          <p className="text-xs text-slate-400">Configure your personal AI assistant to greet viewers and answer live Q&A.</p>
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
              <span>Auto Chat Greeting Mode</span>
              <span className="font-extrabold text-emerald-400">Active ✓</span>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
              <span>Live Speech & Chat Translator</span>
              <span className="font-extrabold text-purple-400">English / German / Japanese</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: TAXES & LEDGER PAYOUTS */}
      {activeTab === 'TAXES_LEDGER' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <h3 className="font-extrabold text-base text-slate-100 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400" /> Taxes, Invoices & Ledger Withdrawals
          </h3>
          <p className="text-xs text-slate-400">
            Every withdrawal is validated via Nexora Immutable Ledger with automated tax withholding calculations.
          </p>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Withdrawable Balance</div>
              <div className="text-xl font-black text-emerald-300">💎 {wallet.diamonds.toLocaleString()} Diamonds</div>
              <p className="text-[10px] text-slate-500">Value: ~${(wallet.diamonds * 0.05).toFixed(2)} USD</p>
            </div>
            <button
              onClick={() => alert('Withdrawal request submitted to PayPal / Bank Wire!')}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs rounded-xl shadow-lg hover:opacity-90"
            >
              Request Withdrawal
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
