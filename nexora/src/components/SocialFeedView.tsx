import React, { useState, useEffect } from 'react';
import { useEconomy } from '../context/EconomyContext';
import { SocialPost, SocialStory, FriendRequest } from '../types';
import { socialFeedService } from '../services/SocialFeedService';
import { 
  Heart, 
  MessageCircle, 
  Gift, 
  Share2, 
  Mic, 
  Image as ImageIcon, 
  Send, 
  UserPlus, 
  Users, 
  Flame, 
  MapPin, 
  Video, 
  Sparkles, 
  Radio, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Volume2, 
  Music,
  Check,
  X,
  Bookmark
} from 'lucide-react';

export const SocialFeedView: React.FC = () => {
  const { wallet, sendGift, addXp } = useEconomy();
  const [activeTab, setActiveTab] = useState<'FOR_YOU' | 'FOLLOWING' | 'TRENDING' | 'NEARBY' | 'REELS' | 'VOICE_NOTES' | 'FRIENDS'>('FOR_YOU');

  // Stories List
  const [stories, setStories] = useState<SocialStory[]>([
    {
      id: 'st_1',
      authorName: 'Aria Nova',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      mediaUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80',
      isLiveNow: true,
      timestamp: '10m ago',
      viewed: false
    },
    {
      id: 'st_2',
      authorName: 'DJ Kairos',
      authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      mediaUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80',
      timestamp: '1h ago',
      viewed: false
    }
  ]);

  // Social Feed Posts
  const [posts, setPosts] = useState<SocialPost[]>([
    {
      id: 'post_1',
      authorName: 'Aria Nova',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      authorLevel: 58,
      authorBadge: 'TOP HOST',
      location: '🇺🇸 Los Angeles',
      content: 'Who is joining our 9-Seat Party Room tonight? Sending 10x Dragons to the top seat gifter! 🔥✨ #PoppoVibes #NexoraLive @alex_rivers',
      mediaUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
      likesCount: 1420,
      commentsCount: 238,
      giftsCoinsCount: 48500,
      timestamp: '15 mins ago',
      category: 'FOR_YOU'
    }
  ]);

  // Real-time Firestore subscription
  useEffect(() => {
    const unsub = socialFeedService.subscribeToFeed((livePosts) => {
      if (livePosts && livePosts.length > 0) {
        // Map Firestore posts to SocialPost interface
        const mapped: SocialPost[] = livePosts.map(lp => ({
          id: lp.id!,
          authorName: lp.authorName,
          authorAvatar: lp.authorAvatar,
          authorLevel: 18,
          authorBadge: 'CREATOR',
          location: '🌐 Global Feed',
          content: lp.content,
          mediaUrl: lp.mediaUrl,
          likesCount: lp.likeCount,
          commentsCount: lp.commentCount,
          giftsCoinsCount: 0,
          timestamp: lp.createdAt ? new Date(lp.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
          category: 'FOR_YOU',
          isLiked: lp.likedBy?.includes('me')
        }));
        setPosts(mapped);
      }
    });

    return () => {
      if (unsub) unsub();
    };
  }, []);

  // Friend Requests
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([
    {
      id: 'fr_1',
      userName: 'DragonKing_99',
      userAvatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=150&q=80',
      userLevel: 39,
      mutualFriends: 14,
      status: 'PENDING'
    }
  ]);

  // Post Creator State
  const [newPostText, setNewPostText] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [hasVoiceNote, setHasVoiceNote] = useState(false);

  // Post Like Handler
  const handleLike = (postId: string) => {
    socialFeedService.toggleLikePost(postId, 'me');
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const isLiked = !p.isLiked;
        return {
          ...p,
          isLiked,
          likesCount: isLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1)
        };
      }
      return p;
    }));
  };

  // Gift to Post Creator
  const handleGiftPost = (p: SocialPost) => {
    const giftPrice = 100;
    if (wallet.coins < giftPrice) {
      alert('Insufficient Coins to send gift to post! Please recharge.');
      return;
    }
    const success = sendGift(
      {
        id: 'g_post',
        name: 'Post Sparkle',
        icon: '💖',
        coinPrice: 100,
        diamondValue: 70,
        category: 'REGULAR',
        animationType: 'SPARKLES' as any,
        description: 'Post Appreciation Gift'
      },
      'Social Feed Post',
      p.authorName
    );

    if (success) {
      setPosts(prev => prev.map(item => item.id === p.id ? { ...item, giftsCoinsCount: item.giftsCoinsCount + 100 } : item));
      addXp(50);
    }
  };

  // Create Post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim() && !hasVoiceNote) return;

    await socialFeedService.createPost({
      authorId: 'me',
      authorName: 'Alex Rivers',
      authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      content: newPostText,
      mediaType: 'IMAGE',
      mediaUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80'
    });

    setNewPostText('');
    setHasVoiceNote(false);
    addXp(100);
  };

  // Friend Request Action
  const handleFriendAction = (id: string, action: 'ACCEPT' | 'REJECT') => {
    setFriendRequests(prev => prev.map(fr => fr.id === id ? { ...fr, status: action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED' } : fr));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* HEADER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-pink-600 to-purple-600 text-white font-black">
              <Sparkles className="w-5 h-5" />
            </span>
            <h2 className="text-2xl font-black bg-gradient-to-r from-pink-400 via-purple-300 to-cyan-300 bg-clip-text text-transparent">
              Nexora Social Feed & Reels
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Discover live moments, voice notes, reels, stories, and send gifts directly to creators!
          </p>
        </div>

        {/* FEED CATEGORY TAB SELECTOR */}
        <div className="flex items-center gap-1 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto no-scrollbar">
          {[
            { id: 'FOR_YOU', label: '🔥 For You' },
            { id: 'FOLLOWING', label: '👥 Following' },
            { id: 'TRENDING', label: '⚡ Trending' },
            { id: 'NEARBY', label: '📍 Nearby' },
            { id: 'REELS', label: '🎬 Reels/Shorts' },
            { id: 'VOICE_NOTES', label: '🎙️ Voice Notes' },
            { id: 'FRIENDS', label: `🤝 Requests (${friendRequests.filter(f => f.status === 'PENDING').length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* STORIES ROW */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3">
        <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Clock className="w-4 h-4 text-pink-400" />
          Live Stories & Moments (24h)
        </h3>

        <div className="flex items-center gap-4 overflow-x-auto pb-1 no-scrollbar">
          {/* ADD STORY BUTTON */}
          <div className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group">
            <div className="relative w-16 h-16 rounded-full bg-slate-950 border-2 border-dashed border-pink-500/60 flex items-center justify-center text-pink-400 group-hover:scale-105 transition-all">
              <Plus className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-extrabold text-slate-300">Your Story</span>
          </div>

          {/* STORIES */}
          {stories.map(st => (
            <div key={st.id} className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group">
              <div className={`relative p-0.5 rounded-full ${
                st.isLiveNow 
                  ? 'bg-gradient-to-tr from-red-600 via-pink-500 to-amber-400 animate-pulse ring-2 ring-red-500/50' 
                  : 'bg-gradient-to-tr from-purple-600 to-pink-500'
              }`}>
                <img
                  src={st.authorAvatar}
                  alt={st.authorName}
                  className="w-15 h-15 rounded-full object-cover ring-2 ring-slate-950 group-hover:scale-105 transition-transform"
                  referrerPolicy="no-referrer"
                />
                {st.isLiveNow && (
                  <span className="absolute bottom-0 right-0 px-1 py-0.2 bg-red-600 text-white text-[8px] font-black rounded-full uppercase">
                    LIVE
                  </span>
                )}
              </div>
              <span className="text-[11px] font-bold text-slate-200 truncate max-w-[70px]">{st.authorName}</span>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN LAYOUT: LEFT POST CREATOR & FEED / RIGHT SIDEBAR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2 COLS: POST CREATOR & SOCIAL POSTS */}
        <div className="lg:col-span-2 space-y-6">
          {/* CREATE POST CARD */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3 shadow-xl">
            <div className="flex items-center gap-3">
              <img
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"
                alt="Alex Rivers"
                className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-400"
                referrerPolicy="no-referrer"
              />
              <input
                type="text"
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                placeholder="Share a moment, voice note, or stream announcement..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-pink-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setHasVoiceNote(!hasVoiceNote)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    hasVoiceNote ? 'bg-pink-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5 text-pink-400" />
                  {hasVoiceNote ? 'Voice Note Attached (0:15)' : 'Record Voice'}
                </button>
                <button className="px-3 py-1.5 bg-slate-950 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-cyan-400" /> Photo/Video
                </button>
              </div>

              <button
                onClick={handleCreatePost}
                className="px-5 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:opacity-90 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Post Moment
              </button>
            </div>
          </div>

          {/* FRIEND REQUESTS TAB OVERLAY */}
          {activeTab === 'FRIENDS' ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
              <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-purple-400" /> Pending Friend Requests
              </h3>

              <div className="space-y-3">
                {friendRequests.map(fr => (
                  <div key={fr.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={fr.userAvatar}
                        alt={fr.userName}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-purple-500"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-extrabold text-xs text-slate-100">{fr.userName}</h4>
                          <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 text-[9px] font-black rounded">
                            Lv.{fr.userLevel}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">{fr.mutualFriends} mutual friends in Nexora</p>
                      </div>
                    </div>

                    {fr.status === 'PENDING' ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleFriendAction(fr.id, 'ACCEPT')}
                          className="p-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-500 transition-colors flex items-center gap-1"
                        >
                          <Check className="w-4 h-4" /> Accept
                        </button>
                        <button
                          onClick={() => handleFriendAction(fr.id, 'REJECT')}
                          className="p-2 bg-slate-800 text-slate-400 rounded-xl font-bold text-xs hover:bg-slate-700 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className={`text-xs font-bold ${fr.status === 'ACCEPTED' ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {fr.status === 'ACCEPTED' ? 'Friends Accepted ✓' : 'Rejected'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* POSTS LIST */
            <div className="space-y-5">
              {posts.map(p => (
                <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl transition-all hover:border-slate-700">
                  {/* POST HEADER */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.authorAvatar}
                        alt={p.authorName}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-500"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-extrabold text-xs text-slate-100">{p.authorName}</h4>
                          <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 text-[9px] font-black rounded">
                            Lv.{p.authorLevel}
                          </span>
                          {p.authorBadge && (
                            <span className="px-2 py-0.2 bg-purple-500/20 text-purple-300 text-[9px] font-extrabold rounded-full">
                              {p.authorBadge}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-pink-400" /> {p.location || 'Global'} • {p.timestamp}
                        </p>
                      </div>
                    </div>

                    <button className="px-3 py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-bold rounded-xl border border-purple-500/30">
                      + Follow
                    </button>
                  </div>

                  {/* POST TEXT */}
                  <p className="text-xs text-slate-200 leading-relaxed">{p.content}</p>

                  {/* VOICE NOTE PLAYER SIMULATOR */}
                  {p.voiceNoteUrl && (
                    <div className="bg-gradient-to-r from-purple-950/80 via-slate-950 to-pink-950/80 border border-pink-500/30 rounded-2xl p-3 flex items-center gap-3 shadow-inner">
                      <button className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 text-white flex items-center justify-center shadow-lg">
                        <Volume2 className="w-5 h-5 animate-pulse" />
                      </button>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-bold text-pink-300">
                          <span>🎙️ Voice Note Audio</span>
                          <span>{p.voiceNoteDuration}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex items-center">
                          <div className="w-1/2 h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MEDIA IMAGE */}
                  {p.mediaUrl && (
                    <div className="rounded-2xl overflow-hidden max-h-[380px] bg-slate-950 border border-slate-800">
                      <img
                        src={p.mediaUrl}
                        alt="Post media"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  {/* POST FOOTER ACTIONS */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleLike(p.id)}
                        className={`flex items-center gap-1.5 font-bold transition-all ${
                          p.isLiked ? 'text-pink-500 scale-110' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${p.isLiked ? 'fill-pink-500' : ''}`} />
                        <span>{p.likesCount.toLocaleString()}</span>
                      </button>

                      <button className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 font-bold">
                        <MessageCircle className="w-4 h-4 text-cyan-400" />
                        <span>{p.commentsCount.toLocaleString()}</span>
                      </button>

                      <button
                        onClick={() => handleGiftPost(p)}
                        className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-bold bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/30"
                      >
                        <Gift className="w-4 h-4" />
                        <span>🪙 {p.giftsCoinsCount.toLocaleString()} Gifts</span>
                      </button>
                    </div>

                    <button className="text-slate-400 hover:text-slate-200 p-1.5">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COL: TRENDING HASHTAGS & TOP CREATOR RANKINGS */}
        <div className="space-y-6">
          {/* TRENDING HASHTAGS */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" /> Trending Topics in Nexora
            </h3>

            <div className="space-y-2">
              {[
                { tag: '#PoppoGiftingWar', posts: '128.4K posts' },
                { tag: '#PKBattleChampionship', posts: '94.2K posts' },
                { tag: '#9SeatPartyRoom', posts: '62.8K posts' },
                { tag: '#LudoMasterPvP', posts: '41.5K posts' },
                { tag: '#CyberSynthDJ', posts: '28.1K posts' }
              ].map((item, idx) => (
                <div key={idx} className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs font-black text-pink-300">{item.tag}</span>
                  <span className="text-[10px] text-slate-500 font-bold">{item.posts}</span>
                </div>
              ))}
            </div>
          </div>

          {/* TOP GIFTERS / COUNTRY RANKINGS */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" /> Global Country Leaderboards
            </h3>

            <div className="space-y-3">
              {[
                { flag: '🇺🇸', country: 'United States', points: '12,450,000 Coins' },
                { flag: '🇩🇪', country: 'Germany', points: '8,920,000 Coins' },
                { flag: '🇯🇵', country: 'Japan', points: '7,410,000 Coins' },
                { flag: '🇬🇧', country: 'United Kingdom', points: '5,880,000 Coins' }
              ].map((c, i) => (
                <div key={i} className="flex items-center justify-between text-xs bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{c.flag}</span>
                    <span className="font-bold text-slate-200">{c.country}</span>
                  </div>
                  <span className="font-black text-amber-300">{c.points}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
