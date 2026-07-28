import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Mic, 
  MicOff, 
  Lock, 
  Unlock, 
  UserPlus, 
  UserMinus, 
  Pin, 
  Megaphone, 
  Clock, 
  Filter, 
  AlertOctagon, 
  X, 
  Check, 
  UserX, 
  MessageSquareOff, 
  Radio, 
  Users, 
  Flag 
} from 'lucide-react';
import { moderationService, RoomModerationState, ReportItem } from '../services/ModerationService';

interface LiveModerationPanelProps {
  streamId: string;
  hostId: string;
  currentUserId: string;
  currentUserName: string;
  isHostOrMod: boolean;
  onClose?: () => void;
}

export const LiveModerationPanel: React.FC<LiveModerationPanelProps> = ({
  streamId,
  hostId,
  currentUserId,
  currentUserName,
  isHostOrMod,
  onClose
}) => {
  const [modState, setModState] = useState<RoomModerationState | null>(null);
  const [activeTab, setActiveTab] = useState<'CONTROLS' | 'MIC_QUEUE' | 'COHOSTS' | 'MEMBERS' | 'REPORTS'>('CONTROLS');

  // Input states
  const [lockPinInput, setLockPinInput] = useState('');
  const [pinnedCommentText, setPinnedCommentText] = useState('');
  const [announcementText, setAnnouncementText] = useState('');
  const [cohostTargetId, setCohostTargetId] = useState('');
  const [cohostTargetName, setCohostTargetName] = useState('');

  // Report modal state
  const [reportTargetId, setReportTargetId] = useState('');
  const [reportTargetName, setReportTargetName] = useState('');
  const [reportCategory, setReportCategory] = useState<ReportItem['category']>('HARASSMENT');
  const [reportReason, setReportReason] = useState('');
  const [reportSuccessMsg, setReportSuccessMsg] = useState('');

  useEffect(() => {
    // Initial fetch
    moderationService.getModerationSettings(streamId, hostId).then(state => setModState(state));

    // Real-time subscription
    const unsubscribe = moderationService.subscribeToModeration(streamId, (state) => {
      if (state) setModState(state);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [streamId, hostId]);

  if (!modState) return null;

  const isAudienceMuted = modState.isAudienceMuted || false;
  const isRoomLocked = modState.isRoomLocked || false;
  const isSlowMode = modState.isSlowMode || false;
  const subscribersOnly = modState.subscribersOnly || false;
  const followersOnly = modState.followersOnly || false;
  const mutedUsers = modState.mutedUsers || [];
  const bannedUsers = modState.bannedUsers || [];
  const micRequests = modState.micRequests || [];
  const coHosts = modState.coHosts || [];

  const handleAudienceMuteToggle = () => {
    moderationService.toggleAudienceMute(streamId, !isAudienceMuted, currentUserId);
  };

  const handleRoomLockToggle = () => {
    moderationService.setRoomLock(streamId, !isRoomLocked, lockPinInput || '1234', currentUserId);
  };

  const handleSlowModeToggle = () => {
    moderationService.updateModerationState(streamId, { isSlowMode: !isSlowMode }, currentUserId, !isSlowMode ? 'ENABLE_SLOW_MODE' : 'DISABLE_SLOW_MODE');
  };

  const handleSubscribersOnlyToggle = () => {
    moderationService.updateModerationState(streamId, { subscribersOnly: !subscribersOnly }, currentUserId, 'TOGGLE_SUBS_ONLY');
  };

  const handleFollowersOnlyToggle = () => {
    moderationService.updateModerationState(streamId, { followersOnly: !followersOnly }, currentUserId, 'TOGGLE_FOLLOWERS_ONLY');
  };

  const handlePinCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinnedCommentText.trim()) return;
    moderationService.pinComment(streamId, pinnedCommentText, currentUserName, currentUserId);
    setPinnedCommentText('');
  };

  const handlePinAnnouncementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementText.trim()) return;
    moderationService.pinAnnouncement(streamId, announcementText, currentUserId);
    setAnnouncementText('');
  };

  const handleMicRequestAction = (targetUserId: string, approve: boolean) => {
    moderationService.handleMicRequest(streamId, micRequests, targetUserId, approve, currentUserId);
  };

  const handleInviteCohost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cohostTargetId.trim()) return;
    moderationService.inviteCoHost(streamId, coHosts, cohostTargetId, cohostTargetName || 'Guest User', '', 'VIDEO', currentUserId);
    setCohostTargetId('');
    setCohostTargetName('');
  };

  const handleRemoveCohost = (targetUserId: string) => {
    moderationService.removeCoHost(streamId, coHosts, targetUserId, currentUserId);
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason.trim() || !reportTargetId.trim()) return;

    await moderationService.submitReport({
      reporterId: currentUserId,
      reporterName: currentUserName,
      targetId: reportTargetId,
      targetName: reportTargetName || reportTargetId,
      streamId,
      category: reportCategory,
      reason: reportReason,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    });

    setReportSuccessMsg('Report submitted successfully to the moderation system.');
    setTimeout(() => {
      setReportSuccessMsg('');
      setReportReason('');
      setReportTargetId('');
      setReportTargetName('');
    }, 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl text-slate-100 max-w-xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow font-black">
            <ShieldCheck className="w-5 h-5" />
          </span>
          <div>
            <h3 className="font-black text-sm text-slate-100 flex items-center gap-1.5">
              Live Room Moderation & Host Center
            </h3>
            <p className="text-[11px] text-slate-400">Manage audience permissions, mic requests, co-hosts, & safety filters</p>
          </div>
        </div>

        {onClose && (
          <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* SUB TABS */}
      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs overflow-x-auto">
        {[
          { id: 'CONTROLS', label: '🎛️ Controls' },
          { id: 'MIC_QUEUE', label: `🎤 Mic Queue (${micRequests.filter(m => m.status === 'PENDING').length})` },
          { id: 'COHOSTS', label: `👥 Co-Hosts (${coHosts.length})` },
          { id: 'MEMBERS', label: '🚫 Muted/Banned' },
          { id: 'REPORTS', label: '🚩 Submit Report' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-xl font-extrabold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* CONTROLS TAB */}
      {activeTab === 'CONTROLS' && isHostOrMod && (
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-2">
            {/* AUDIENCE MUTE */}
            <button
              onClick={handleAudienceMuteToggle}
              className={`p-3 rounded-2xl border flex items-center justify-between font-extrabold transition-all ${
                isAudienceMuted 
                  ? 'bg-red-500/20 border-red-500/50 text-red-300' 
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2">
                {isAudienceMuted ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4 text-cyan-400" />}
                <span>Mute Audience</span>
              </div>
              <span className="text-[10px] font-black uppercase">{isAudienceMuted ? 'ON' : 'OFF'}</span>
            </button>

            {/* ROOM LOCK */}
            <button
              onClick={handleRoomLockToggle}
              className={`p-3 rounded-2xl border flex items-center justify-between font-extrabold transition-all ${
                isRoomLocked 
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' 
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2">
                {isRoomLocked ? <Lock className="w-4 h-4 text-amber-400" /> : <Unlock className="w-4 h-4 text-emerald-400" />}
                <span>Lock Room</span>
              </div>
              <span className="text-[10px] font-black uppercase">{isRoomLocked ? 'LOCKED' : 'OPEN'}</span>
            </button>

            {/* SLOW MODE */}
            <button
              onClick={handleSlowModeToggle}
              className={`p-3 rounded-2xl border flex items-center justify-between font-extrabold transition-all ${
                isSlowMode 
                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' 
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <span>Slow Mode (5s)</span>
              </div>
              <span className="text-[10px] font-black uppercase">{isSlowMode ? 'ON' : 'OFF'}</span>
            </button>

            {/* SUBSCRIBERS ONLY */}
            <button
              onClick={handleSubscribersOnlyToggle}
              className={`p-3 rounded-2xl border flex items-center justify-between font-extrabold transition-all ${
                subscribersOnly 
                  ? 'bg-pink-500/20 border-pink-500/50 text-pink-300' 
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-pink-400" />
                <span>Subscribers Chat</span>
              </div>
              <span className="text-[10px] font-black uppercase">{subscribersOnly ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {/* PIN COMMENT FORM */}
          <form onSubmit={handlePinCommentSubmit} className="space-y-1.5 pt-2 border-t border-slate-800">
            <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <Pin className="w-3 h-3 text-cyan-400" /> Pin Highlight Comment
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type comment to pin at top of chat..."
                value={pinnedCommentText}
                onChange={(e) => setPinnedCommentText(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-cyan-500"
              />
              <button type="submit" className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-xl">
                Pin
              </button>
            </div>
          </form>

          {/* PIN ANNOUNCEMENT FORM */}
          <form onSubmit={handlePinAnnouncementSubmit} className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <Megaphone className="w-3 h-3 text-amber-400" /> Pin Official Room Announcement Banner
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type broadcast banner notice..."
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-amber-500"
              />
              <button type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl">
                Broadcast
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MIC REQUEST QUEUE TAB */}
      {activeTab === 'MIC_QUEUE' && (
        <div className="space-y-3 text-xs">
          <h4 className="font-extrabold text-slate-200">Pending Microphone Requests (Raise Hand)</h4>
          {micRequests.length === 0 ? (
            <p className="text-slate-500 italic">No pending microphone requests.</p>
          ) : (
            <div className="space-y-2 max-h-[220px] overflow-y-auto">
              {micRequests.map((req) => (
                <div key={req.userId} className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-slate-100 block">{req.userName}</span>
                    <span className="text-[10px] text-slate-500 font-mono">Status: {req.status}</span>
                  </div>

                  {req.status === 'PENDING' && isHostOrMod && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleMicRequestAction(req.userId, true)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Approve
                      </button>
                      <button
                        onClick={() => handleMicRequestAction(req.userId, false)}
                        className="px-3 py-1 bg-red-600/30 hover:bg-red-600/50 text-red-300 font-bold rounded-xl"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CO-HOSTS MANAGEMENT TAB */}
      {activeTab === 'COHOSTS' && (
        <div className="space-y-4 text-xs">
          {isHostOrMod && (
            <form onSubmit={handleInviteCohost} className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <span className="font-extrabold text-slate-200 block">Invite Co-Host / Streamer</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="User ID..."
                  value={cohostTargetId}
                  onChange={(e) => setCohostTargetId(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100"
                />
                <input
                  type="text"
                  placeholder="User Handle..."
                  value={cohostTargetName}
                  onChange={(e) => setCohostTargetName(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100"
                />
              </div>
              <button type="submit" className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black rounded-xl">
                + Send Co-Host Invitation
              </button>
            </form>
          )}

          <div className="space-y-2">
            <span className="font-extrabold text-slate-200 block">Active Co-Hosts</span>
            {coHosts.length === 0 ? (
              <p className="text-slate-500 italic">No co-hosts joined.</p>
            ) : (
              coHosts.map((ch) => (
                <div key={ch.userId} className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-slate-100 block">{ch.userName}</span>
                    <span className="text-[10px] text-purple-300 uppercase font-mono">{ch.type} CO-HOST • {ch.status}</span>
                  </div>
                  {isHostOrMod && (
                    <button
                      onClick={() => handleRemoveCohost(ch.userId)}
                      className="px-3 py-1 bg-red-600/30 hover:bg-red-600 text-red-200 font-bold rounded-xl text-[10px]"
                    >
                      Remove Co-Host
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MUTED / BANNED USERS TAB */}
      {activeTab === 'MEMBERS' && (
        <div className="space-y-3 text-xs">
          <div>
            <h4 className="font-extrabold text-slate-200 mb-1">Muted Users ({mutedUsers.length})</h4>
            {mutedUsers.length === 0 ? (
              <p className="text-slate-500 italic text-[11px]">No users currently muted.</p>
            ) : (
              <div className="space-y-1.5">
                {mutedUsers.map((uid) => (
                  <div key={uid} className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                    <span className="font-mono text-slate-300">{uid}</span>
                    <button
                      onClick={() => moderationService.toggleMuteUser(streamId, mutedUsers, uid, uid, currentUserId)}
                      className="px-2 py-0.5 bg-slate-800 text-slate-200 text-[10px] font-bold rounded-lg"
                    >
                      Unmute
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800">
            <h4 className="font-extrabold text-slate-200 mb-1">Room Banned Users ({bannedUsers.length})</h4>
            {bannedUsers.length === 0 ? (
              <p className="text-slate-500 italic text-[11px]">No users room-banned.</p>
            ) : (
              <div className="space-y-1.5">
                {bannedUsers.map((uid) => (
                  <div key={uid} className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                    <span className="font-mono text-red-300">{uid}</span>
                    <span className="text-[10px] text-red-400 font-bold uppercase">BANNED</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* REPORT SUBMISSION TAB */}
      {activeTab === 'REPORTS' && (
        <form onSubmit={handleReportSubmit} className="space-y-3 text-xs">
          <h4 className="font-extrabold text-slate-200 flex items-center gap-1.5">
            <Flag className="w-4 h-4 text-red-400" /> Submit Abuse / Violations Report
          </h4>

          <div className="space-y-1">
            <label className="font-bold text-slate-400">Target User ID or Handle</label>
            <input
              type="text"
              placeholder="e.g. GamerGod99 or user_123..."
              value={reportTargetId}
              onChange={(e) => {
                setReportTargetId(e.target.value);
                setReportTargetName(e.target.value);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-400">Violation Category</label>
            <select
              value={reportCategory}
              onChange={(e) => setReportCategory(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
            >
              <option value="SPAM">Spam / Bot Behavior</option>
              <option value="HARASSMENT">Harassment & Toxic Speech</option>
              <option value="COPYRIGHT">Copyright Audio / DMCA Strike</option>
              <option value="INAPPROPRIATE_CONTENT">Inappropriate / Nudity Visuals</option>
              <option value="FRAUD">Fraud / Gift Laundering</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-400">Details & Reason</label>
            <textarea
              rows={3}
              placeholder="Describe the violation for compliance admins..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100"
            />
          </div>

          {reportSuccessMsg && (
            <p className="p-2 bg-emerald-950 text-emerald-300 font-extrabold border border-emerald-500 rounded-xl text-center">
              {reportSuccessMsg}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-gradient-to-r from-red-600 to-pink-600 text-white font-black text-xs rounded-xl shadow-lg"
          >
            Submit Report to Compliance Team
          </button>
        </form>
      )}
    </div>
  );
};
