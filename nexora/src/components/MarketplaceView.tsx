import React, { useState, useEffect } from 'react';
import { ShoppingProduct, DigitalProduct, CreatorService } from '../types';
import { MOCK_SHOPPING_PRODUCTS, MOCK_DIGITAL_PRODUCTS, MOCK_SERVICES } from '../data/mockData';
import { useEconomy } from '../context/EconomyContext';
import { marketplaceService } from '../services/MarketplaceService';
import { 
  Store, 
  ShoppingBag, 
  Download, 
  Briefcase, 
  Star, 
  Check, 
  ShieldCheck, 
  Sparkles,
  PackageCheck,
  Truck,
  Ticket,
  Percent,
  PlusCircle,
  MessageSquare
} from 'lucide-react';

export const MarketplaceView: React.FC = () => {
  const { wallet, purchaseProduct, purchaseDigitalGood } = useEconomy();
  const [activeTab, setActiveTab] = useState<'DIGITAL' | 'PHYSICAL' | 'SERVICES' | 'ORDERS' | 'SELLER_HUB'>('DIGITAL');

  const [shoppingProducts, setShoppingProducts] = useState<ShoppingProduct[]>(MOCK_SHOPPING_PRODUCTS);
  const [digitalProducts, setDigitalProducts] = useState<DigitalProduct[]>(MOCK_DIGITAL_PRODUCTS);
  const [creatorServices, setCreatorServices] = useState<CreatorService[]>(MOCK_SERVICES);

  // Real-time Firestore subscriptions: replace placeholder listings with live data as soon as it arrives
  useEffect(() => {
    const unsubShopping = marketplaceService.subscribeToShoppingProducts((live) => {
      if (live && live.length > 0) setShoppingProducts(live);
    });
    const unsubDigital = marketplaceService.subscribeToDigitalProducts((live) => {
      if (live && live.length > 0) setDigitalProducts(live);
    });
    const unsubServices = marketplaceService.subscribeToCreatorServices((live) => {
      if (live && live.length > 0) setCreatorServices(live);
    });
    return () => {
      unsubShopping();
      unsubDigital();
      unsubServices();
    };
  }, []);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);

  // Orders State
  const [orders] = useState([
    {
      id: 'ORD-9021',
      productName: 'Nexora Creator Pro Studio RGB Light',
      priceCoins: 12000,
      status: 'IN_TRANSIT',
      courier: 'DHL Express (Tracking: #DH-908212)',
      deliveryEst: 'July 30, 2026',
      reviewRating: 5
    },
    {
      id: 'ORD-8810',
      productName: 'VIP Fan Club Hoodie (Black Edition)',
      priceCoins: 8500,
      status: 'DELIVERED',
      courier: 'FedEx (Tracking: #FX-110293)',
      deliveryEst: 'Delivered July 26, 2026',
      reviewRating: 5
    }
  ]);

  const handleApplyCoupon = () => {
    if (couponCode.toUpperCase() === 'NEXORA20') {
      setAppliedDiscount(20);
      alert('Coupon NEXORA20 applied! 20% discount activated on all marketplace orders.');
    } else {
      alert('Invalid coupon code. Try "NEXORA20"');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 bg-amber-500/20 text-amber-300 font-black text-xs rounded-full border border-amber-500/30 uppercase tracking-widest flex items-center gap-1">
            <Store className="w-4 h-4 text-amber-400" /> E-Commerce & Live Shopping Hub
          </span>
          <h2 className="text-2xl font-black text-slate-100 mt-2">
            Creator Marketplace & Storefront
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Shop digital courses, live gear, order tracking, seller inventory, and escrow protection.
          </p>
        </div>

        {/* TABS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'DIGITAL', label: 'Digital Goods', icon: Download },
            { id: 'PHYSICAL', label: 'Live Gear & Goods', icon: ShoppingBag },
            { id: 'SERVICES', label: 'Creator Services', icon: Briefcase },
            { id: 'ORDERS', label: 'My Orders & Shipping', icon: Truck },
            { id: 'SELLER_HUB', label: 'Seller Inventory', icon: Store }
          ].map(tab => {
            const Icon = tab.icon;
            const isAct = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  isAct
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* DISCOUNT COUPON PROMO BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Ticket className="w-5 h-5 text-amber-400" />
          <div>
            <p className="text-xs font-bold text-slate-200">Have a Creator Promo Coupon?</p>
            <p className="text-[10px] text-slate-400">Use coupon code <span className="text-amber-300 font-mono font-bold">NEXORA20</span> for 20% off!</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Enter coupon code..."
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-mono focus:border-amber-400"
          />
          <button
            onClick={handleApplyCoupon}
            className="px-4 py-1.5 bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md hover:bg-amber-400"
          >
            Apply Code
          </button>
        </div>
      </div>

      {/* DIGITAL GOODS GRID */}
      {activeTab === 'DIGITAL' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {digitalProducts.map(dp => {
            const finalPrice = appliedDiscount > 0 ? Math.floor(dp.priceCoins * (1 - appliedDiscount / 100)) : dp.priceCoins;
            return (
              <div key={dp.id} className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden p-4 space-y-3 hover:border-amber-400/50 transition-all flex flex-col justify-between">
                <div className="space-y-3">
                  <img
                    src={dp.image}
                    alt={dp.title}
                    className="w-full h-40 object-cover rounded-2xl"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-black rounded-full uppercase">
                      {dp.category}
                    </span>
                    <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400" /> {dp.rating} ({dp.downloadsCount} downloads)
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-100 line-clamp-2">{dp.title}</h4>
                  <p className="text-[11px] text-slate-400">By {dp.creatorName} • Size: {dp.fileSize}</p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-black text-amber-300 text-sm">🪙 {finalPrice.toLocaleString()} Coins</span>
                    {appliedDiscount > 0 && <span className="text-[10px] text-slate-500 line-through block">🪙 {dp.priceCoins}</span>}
                  </div>
                  <button
                    onClick={() => {
                      const ok = purchaseDigitalGood({ ...dp, priceCoins: finalPrice });
                      if (ok) {
                        alert(`Asset "${dp.title}" unlocked! Download link generated.`);
                        marketplaceService.purchaseDigitalProduct(dp.id).catch(err => console.warn('Digital purchase sync warning:', err));
                      } else alert('Insufficient Coins! Please recharge.');
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Unlock
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PHYSICAL & LIVE GEAR GRID */}
      {activeTab === 'PHYSICAL' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {shoppingProducts.map(sp => (
            <div key={sp.id} className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden p-4 space-y-3 hover:border-purple-500/50 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <img
                  src={sp.image}
                  alt={sp.title}
                  className="w-full h-40 object-cover rounded-2xl"
                  referrerPolicy="no-referrer"
                />
                <h4 className="font-extrabold text-sm text-slate-100 line-clamp-2">{sp.title}</h4>
                <p className="text-xs text-slate-400 line-clamp-2">{sp.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-black text-amber-300 text-sm">🪙 {sp.priceCoins.toLocaleString()} Coins</div>
                  <div className="text-[10px] text-slate-500">(${sp.priceUsd.toFixed(2)} USD)</div>
                </div>
                <button
                  onClick={() => {
                    const ok = purchaseProduct(sp);
                    if (ok) {
                      alert(`Order placed for "${sp.title}"! Shipping tracking ID generated.`);
                      marketplaceService.purchaseShoppingProduct(sp.id).catch(err => console.warn('Product purchase sync warning:', err));
                    } else alert('Insufficient Coins! Please recharge.');
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-500/20"
                >
                  Buy Gear
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SERVICES MARKETPLACE */}
      {activeTab === 'SERVICES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {creatorServices.map(s => (
            <div key={s.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 hover:border-cyan-500/50 transition-all">
              <div className="flex items-center gap-3">
                <img
                  src={s.creatorAvatar}
                  alt={s.creatorName}
                  className="w-10 h-10 rounded-full object-cover ring-1 ring-cyan-400"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="font-extrabold text-sm text-slate-100">{s.creatorName}</h4>
                  <span className="text-[10px] text-cyan-400 font-bold uppercase">{s.category}</span>
                </div>
              </div>

              <div className="space-y-1">
                <h5 className="font-black text-sm text-slate-200">{s.serviceTitle}</h5>
                <p className="text-xs text-slate-400">{s.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Delivery: {s.deliveryDays} Days</span>
                <span className="font-black text-amber-400">🪙 {s.priceCoins.toLocaleString()} Coins</span>
              </div>

              <button
                onClick={() => {
                  alert(`Booking requested for ${s.serviceTitle}! Escrow protection activated.`);
                }}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-black text-xs rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-cyan-300" /> Book Service with Escrow
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ORDERS & SHIPPING */}
      {activeTab === 'ORDERS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <h3 className="font-extrabold text-base text-slate-100 flex items-center gap-2">
            <Truck className="w-5 h-5 text-indigo-400" /> Customer Orders & Logistics Tracking
          </h3>

          <div className="space-y-3">
            {orders.map((ord) => (
              <div key={ord.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-200">{ord.productName}</span>
                    <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold rounded">
                      {ord.id}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{ord.courier}</p>
                  <p className="text-[10px] text-emerald-400 mt-0.5">{ord.deliveryEst}</p>
                </div>
                <div className="text-right">
                  <span className="font-black text-amber-300 text-sm block">🪙 {ord.priceCoins.toLocaleString()}</span>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase">{ord.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SELLER INVENTORY */}
      {activeTab === 'SELLER_HUB' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-slate-100 flex items-center gap-2">
              <Store className="w-5 h-5 text-purple-400" /> Seller Inventory & Storefront Management
            </h3>
            <button
              onClick={() => alert('Opening product listing creation modal...')}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" /> Add Product Listing
            </button>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 text-xs">
            <div className="flex items-center justify-between font-bold text-slate-200">
              <span>Commission Split Structure</span>
              <span className="text-emerald-400 font-mono">80% Seller / 10% Streamer / 10% Platform</span>
            </div>
            <p className="text-[11px] text-slate-400">
              When live streamers pin your product in their streams, they earn a 10% affiliate commission on every sale!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
