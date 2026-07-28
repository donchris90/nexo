/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider } from './services/AuthService';
import { EconomyProvider, useEconomy } from './context/EconomyContext';
import { MusicPlayerProvider } from './context/MusicPlayerContext';
import { VideoPlayerProvider } from './context/VideoPlayerContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { GoLiveModal } from './components/GoLiveModal';
import { ChatMenuView } from './components/ChatMenuView';
import { MeView } from './components/MeView';

import { ARGiftOverlay } from './components/ARGiftOverlay';
import { LiveStreamView } from './components/LiveStreamView';
import { SocialFeedView } from './components/SocialFeedView';
import { AgenciesView } from './components/AgenciesView';
import { FamiliesView } from './components/FamiliesView';
import { MissionsAndRewardsView } from './components/MissionsAndRewardsView';
import { GamingCenter } from './components/GamingCenter';
import { WalletView } from './components/WalletView';
import { CreatorStudioView } from './components/CreatorStudioView';
import { MarketplaceView } from './components/MarketplaceView';
import { MusicAndPodcastsView } from './components/MusicAndPodcastsView';
import { SecurityCenter } from './components/SecurityCenter';
import { AdminDashboardView } from './components/AdminDashboardView';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { WealthAndCharmModal } from './components/WealthAndCharmModal';
import { AiAssistantDrawer } from './components/AiAssistantDrawer';

function MainAppContent() {
  const { activeARGift, clearARGift } = useEconomy();
  const [activeTab, setActiveTab] = useState<string>('live');
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [isWealthModalOpen, setIsWealthModalOpen] = useState(false);
  const [isGoLiveModalOpen, setIsGoLiveModalOpen] = useState(false);

  // Sub-tab states for BIGO style top navigation
  const [liveSubTab, setLiveSubTab] = useState<'NEARBY' | 'POPULAR' | 'FEATURED' | 'EXPLORE'>('POPULAR');
  const [partyCategory, setPartyCategory] = useState<string>('9SEAT');

  const handleSelectStreamType = (type: 'VIDEO' | 'PARTY_9SEAT' | 'PK_BATTLE' | 'REEL') => {
    if (type === 'VIDEO' || type === 'PK_BATTLE') {
      setActiveTab('live');
    } else if (type === 'PARTY_9SEAT') {
      setActiveTab('party');
    } else if (type === 'REEL') {
      setActiveTab('social');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950 relative pb-20">
      {/* FULL SCREEN 3D/CANVAS AR GIFT CELEBRATION OVERLAY */}
      <ARGiftOverlay gift={activeARGift} onComplete={clearARGift} />

      {/* NOTIFICATION CENTER MODAL */}
      <NotificationCenterModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
      />

      {/* WEALTH & CHARM LEVELS MODAL */}
      <WealthAndCharmModal
        isOpen={isWealthModalOpen}
        onClose={() => setIsWealthModalOpen(false)}
      />

      {/* GO LIVE & HOST PARTY LAUNCH MODAL */}
      <GoLiveModal
        isOpen={isGoLiveModalOpen}
        onClose={() => setIsGoLiveModalOpen(false)}
        onSelectStreamType={handleSelectStreamType}
      />

      {/* AI PERSONAL ASSISTANT FLOATING DRAWER */}
      <AiAssistantDrawer />

      {/* TOP HEADER & DUAL-CURRENCY NAVBAR */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenRechargeModal={() => setActiveTab('wallet')}
        onOpenExchangeModal={() => setActiveTab('wallet')}
        onOpenWithdrawalModal={() => setActiveTab('wallet')}
        onOpenNotifications={() => setIsNotifModalOpen(true)}
        onOpenWealthModal={() => setIsWealthModalOpen(true)}
      />

      {/* MAIN VIEW SWITCHER */}
      <main className="pb-12">
        {(activeTab === 'live' || activeTab === 'streams') && (
          <LiveStreamView mode="LIVE" />
        )}
        {activeTab === 'party' && (
          <LiveStreamView mode="PARTY" />
        )}
        {activeTab === 'chat' && (
          <ChatMenuView />
        )}
        {(activeTab === 'me' || activeTab === 'profile') && (
          <MeView
            setActiveTab={setActiveTab}
            onOpenRechargeModal={() => setActiveTab('wallet')}
            onOpenExchangeModal={() => setActiveTab('wallet')}
            onOpenWithdrawalModal={() => setActiveTab('wallet')}
            onOpenWealthModal={() => setIsWealthModalOpen(true)}
          />
        )}
        {activeTab === 'social' && <SocialFeedView />}
        {activeTab === 'families' && <FamiliesView />}
        {activeTab === 'agencies' && <AgenciesView />}
        {activeTab === 'missions' && <MissionsAndRewardsView />}
        {activeTab === 'games' && <GamingCenter />}
        {activeTab === 'wallet' && <WalletView />}
        {activeTab === 'creator' && <CreatorStudioView />}
        {activeTab === 'shopping' && <MarketplaceView />}
        {activeTab === 'music' && <MusicAndPodcastsView />}
        {activeTab === 'security' && <SecurityCenter />}
        {activeTab === 'admin' && <AdminDashboardView />}
      </main>

      {/* BIGO STYLE BOTTOM FIXED NAVIGATION MENU */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        liveSubTab={liveSubTab}
        setLiveSubTab={setLiveSubTab}
        partyCategory={partyCategory}
        setPartyCategory={setPartyCategory}
        onOpenGoLiveModal={() => setIsGoLiveModalOpen(true)}
      />

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 bg-slate-900/60 py-6 text-center text-xs text-slate-500 mb-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-black text-pink-400 text-sm">Nexora</span>
            <span>© 2026 Poppo & BIGO Style Live Streaming Platform</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Coins (Premium Gifts) • Points (Gaming Arena) • Diamonds (Creator Earnings) • Agencies & Guilds
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <EconomyProvider>
        <MusicPlayerProvider>
          <VideoPlayerProvider>
            <MainAppContent />
          </VideoPlayerProvider>
        </MusicPlayerProvider>
      </EconomyProvider>
    </AuthProvider>
  );
}
