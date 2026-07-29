/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider } from './services/AuthService';
import { useAuth } from './hooks/useAuth';
import { liveStreamService } from './services/LiveStreamService';
import { LiveStream } from './types';
import { EconomyProvider, useEconomy } from './context/EconomyContext';
import { MusicPlayerProvider } from './context/MusicPlayerContext';
import { VideoPlayerProvider } from './context/VideoPlayerContext';
import { ErrorBoundary } from './components/ErrorBoundary';
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
  const { activeARGift, clearARGift, userLevel } = useEconomy();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('live');
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [isWealthModalOpen, setIsWealthModalOpen] = useState(false);
  const [isGoLiveModalOpen, setIsGoLiveModalOpen] = useState(false);
  const [focusStreamId, setFocusStreamId] = useState<string | undefined>(undefined);
  const [goLiveError, setGoLiveError] = useState<string | null>(null);

  // Sub-tab states for BIGO style top navigation
  const [liveSubTab, setLiveSubTab] = useState<'NEARBY' | 'POPULAR' | 'FEATURED' | 'EXPLORE'>('POPULAR');
  const [partyCategory, setPartyCategory] = useState<string>('9SEAT');

  const handleSelectStreamType = async (
    type: 'VIDEO' | 'PARTY_9SEAT' | 'PK_BATTLE' | 'REEL',
    details: { title: string; tag: string }
  ) => {
    if (type === 'REEL') {
      setActiveTab('social');
      return;
    }

    const creatorId = user?.uid || 'guest_local';
    const creatorName = user?.displayName || 'Guest';
    const creatorAvatar = user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${creatorId}`;
    const title = details.title.trim() || 'Untitled Stream';

    const newStream: Omit<LiveStream, 'id'> = {
      creatorId,
      creatorName,
      creatorAvatar,
      creatorVerified: false,
      creatorLevel: userLevel.currentLevel,
      title,
      category: type === 'PARTY_9SEAT' ? 'PARTY_ROOM' : type === 'PK_BATTLE' ? 'PK_BATTLE' : 'TALK_SHOW',
      viewersCount: 0,
      likesCount: 0,
      thumbnailUrl: creatorAvatar,
      tags: details.tag ? [details.tag] : [],
      isLive: true,
      aiCohostEnabled: false,
      ...(type === 'PARTY_9SEAT'
        ? {
            isPartyRoom: true,
            seatGridSize: 9 as const,
            seats: Array.from({ length: 9 }, (_, i) => ({
              seatNumber: i + 1,
              ...(i === 0
                ? {
                    userName: `${creatorName} (Host)`,
                    userAvatar: creatorAvatar,
                    userLevel: userLevel.currentLevel,
                    isMuted: false,
                    isCameraOn: true,
                    seatGiftsCoins: 0,
                    isHost: true
                  }
                : {})
            }))
          }
        : {})
    };

    try {
      setGoLiveError(null);
      const newId = await liveStreamService.createStream(newStream);
      setFocusStreamId(newId);
      setActiveTab(type === 'PARTY_9SEAT' ? 'party' : 'live');
    } catch (err) {
      console.error('Failed to start stream:', err);
      setGoLiveError('Could not start the stream. Please try again.');
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

      {goLiveError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] bg-red-950 border border-red-500/40 text-red-300 text-xs font-bold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2">
          {goLiveError}
          <button onClick={() => setGoLiveError(null)} className="text-red-400 hover:text-red-200 ml-1">✕</button>
        </div>
      )}

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

      {/* MAIN VIEW SWITCHER WITH ERROR BOUNDARY */}
      <main className="pb-12">
        <ErrorBoundary fallbackTitle="Stream View Recovered">
          {(activeTab === 'live' || activeTab === 'streams') && (
            <LiveStreamView
              mode="LIVE"
              onOpenGoLiveModal={() => setIsGoLiveModalOpen(true)}
              focusStreamId={focusStreamId}
            />
          )}
          {activeTab === 'party' && (
            <LiveStreamView
              mode="PARTY"
              onOpenGoLiveModal={() => setIsGoLiveModalOpen(true)}
              focusStreamId={focusStreamId}
            />
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
        </ErrorBoundary>
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
            <span>© 2026 Nexora Live & Social Platform</span>
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
