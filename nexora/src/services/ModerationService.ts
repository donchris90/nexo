import { db } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp,
  DocumentSnapshot,
  DocumentData,
  FirestoreError
} from 'firebase/firestore';

export interface RoomModerationState {
  streamId: string;
  hostId: string;
  isAudienceMuted?: boolean;
  isRoomLocked?: boolean;
  lockPin?: string;
  isSlowMode?: boolean;
  slowModeDelaySeconds?: number;
  subscribersOnly?: boolean;
  followersOnly?: boolean;
  pinnedComment?: {
    text: string;
    senderName: string;
    timestamp: string;
  } | null;
  pinnedAnnouncement?: string | null;
  mutedUsers?: string[]; // userIds
  blockedUsers?: string[]; // userIds
  bannedUsers?: string[]; // userIds
  moderators?: string[]; // userIds
  coHosts?: Array<{
    userId: string;
    userName: string;
    userAvatar?: string;
    type: 'AUDIO' | 'VIDEO';
    seatNumber?: number;
    status: 'INVITED' | 'ACTIVE';
  }>;
  micRequests?: Array<{
    userId: string;
    userName: string;
    userAvatar?: string;
    requestedAt: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
  }>;
}

export interface ReportItem {
  id?: string;
  reporterId: string;
  reporterName: string;
  targetId: string;
  targetName: string;
  streamId?: string;
  category: 'SPAM' | 'HARASSMENT' | 'COPYRIGHT' | 'INAPPROPRIATE_CONTENT' | 'FRAUD';
  reason: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
}

export interface ModeratorLog {
  id?: string;
  streamId: string;
  moderatorId: string;
  moderatorName?: string;
  action: string;
  targetUserId?: string;
  targetUserName?: string;
  details?: string;
  timestamp: string;
}

class ModerationService {
  private moderationCollection = 'moderation_settings';
  private reportsCollection = 'reports';
  private logsCollection = 'moderator_logs';
  private userBansCollection = 'account_bans';

  // In-memory message velocity tracker for spam detection
  private userMessageTimestamps: Map<string, number[]> = new Map();

  // Standard profanity list
  private profanityList = [
    'fuck', 'shit', 'bitch', 'asshole', 'cunt', 'dick', 'pussy', 'scam', 'crypto_hack', 'telegram_bot'
  ];

  /**
   * Initialize or fetch moderation settings for a live stream
   */
  public async getModerationSettings(streamId: string, hostId: string): Promise<RoomModerationState> {
    try {
      const docRef = doc(db, this.moderationCollection, streamId);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        return snap.data() as RoomModerationState;
      } else {
        const defaultState: RoomModerationState = {
          streamId,
          hostId,
          isAudienceMuted: false,
          isRoomLocked: false,
          isSlowMode: false,
          slowModeDelaySeconds: 5,
          subscribersOnly: false,
          followersOnly: false,
          pinnedComment: null,
          pinnedAnnouncement: null,
          mutedUsers: [],
          blockedUsers: [],
          bannedUsers: [],
          moderators: [hostId],
          coHosts: [],
          micRequests: []
        };
        await setDoc(docRef, defaultState);
        return defaultState;
      }
    } catch (err) {
      console.warn('ModerationService.getModerationSettings fallback:', err);
      return {
        streamId,
        hostId,
        mutedUsers: [],
        blockedUsers: [],
        bannedUsers: [],
        moderators: [hostId],
        coHosts: [],
        micRequests: []
      };
    }
  }

  /**
   * Subscribe to real-time room moderation state changes
   */
  public subscribeToModeration(streamId: string, callback: (state: RoomModerationState | null) => void) {
    const docRef = doc(db, this.moderationCollection, streamId);
    return onSnapshot(docRef, (snapshot: DocumentSnapshot<DocumentData>) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as RoomModerationState);
      } else {
        callback(null);
      }
    }, (err: FirestoreError) => {
      console.warn('Moderation subscription warning:', err);
    });
  }

  /**
   * Update moderation state fields
   */
  public async updateModerationState(streamId: string, updates: Partial<RoomModerationState>, moderatorId?: string, actionName?: string): Promise<void> {
    const docRef = doc(db, this.moderationCollection, streamId);
    await setDoc(docRef, { ...updates, updatedAt: serverTimestamp() }, { merge: true });

    if (moderatorId && actionName) {
      this.logModeratorAction({
        streamId,
        moderatorId,
        action: actionName,
        timestamp: new Date().toISOString()
      }).catch(e => console.warn('Mod log error:', e));
    }
  }

  /**
   * Toggle Audience Mute
   */
  public async toggleAudienceMute(streamId: string, isMuted: boolean, moderatorId: string) {
    await this.updateModerationState(streamId, { isAudienceMuted: isMuted }, moderatorId, isMuted ? 'MUTE_AUDIENCE' : 'UNMUTE_AUDIENCE');
  }

  /**
   * Mute / Unmute Specific User
   */
  public async toggleMuteUser(streamId: string, currentMutedList: string[], targetUserId: string, targetName: string, moderatorId: string) {
    const isMuted = currentMutedList.includes(targetUserId);
    const updated = isMuted 
      ? currentMutedList.filter(id => id !== targetUserId)
      : [...currentMutedList, targetUserId];

    await this.updateModerationState(streamId, { mutedUsers: updated }, moderatorId, isMuted ? `UNMUTE_USER:${targetName}` : `MUTE_USER:${targetName}`);
  }

  /**
   * Ban User from Room
   */
  public async banUserFromRoom(streamId: string, currentBannedList: string[], targetUserId: string, targetName: string, moderatorId: string) {
    const updated = Array.from(new Set([...currentBannedList, targetUserId]));
    await this.updateModerationState(streamId, { bannedUsers: updated }, moderatorId, `BAN_ROOM_USER:${targetName}`);
  }

  /**
   * Lock / Unlock Room
   */
  public async setRoomLock(streamId: string, isLocked: boolean, lockPin: string, moderatorId: string) {
    await this.updateModerationState(streamId, { isRoomLocked: isLocked, lockPin }, moderatorId, isLocked ? 'LOCK_ROOM' : 'UNLOCK_ROOM');
  }

  /**
   * Pin / Unpin Comment or Announcement
   */
  public async pinComment(streamId: string, text: string, senderName: string, moderatorId: string) {
    await this.updateModerationState(streamId, { 
      pinnedComment: { text, senderName, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } 
    }, moderatorId, 'PIN_COMMENT');
  }

  public async pinAnnouncement(streamId: string, text: string, moderatorId: string) {
    await this.updateModerationState(streamId, { pinnedAnnouncement: text }, moderatorId, 'PIN_ANNOUNCEMENT');
  }

  /**
   * Mic Request Queue Handlers
   */
  public async submitMicRequest(streamId: string, currentQueue: any[], userId: string, userName: string, userAvatar?: string) {
    const existing = currentQueue.find(q => q.userId === userId);
    if (existing) return;

    const newRequest = {
      userId,
      userName,
      userAvatar: userAvatar || '',
      requestedAt: new Date().toISOString(),
      status: 'PENDING'
    };

    const updated = [...currentQueue, newRequest];
    await this.updateModerationState(streamId, { micRequests: updated });
  }

  public async handleMicRequest(streamId: string, currentQueue: any[], targetUserId: string, approve: boolean, moderatorId: string) {
    const updated = currentQueue.map(q => {
      if (q.userId === targetUserId) {
        return { ...q, status: approve ? 'APPROVED' : 'REJECTED' };
      }
      return q;
    });

    await this.updateModerationState(streamId, { micRequests: updated }, moderatorId, approve ? `APPROVE_MIC:${targetUserId}` : `REJECT_MIC:${targetUserId}`);
  }

  /**
   * Co-Host Management
   */
  public async inviteCoHost(streamId: string, currentCoHosts: any[], userId: string, userName: string, userAvatar: string, type: 'AUDIO' | 'VIDEO', moderatorId: string) {
    const updated = [...currentCoHosts.filter(c => c.userId !== userId), {
      userId,
      userName,
      userAvatar,
      type,
      status: 'INVITED'
    }];
    await this.updateModerationState(streamId, { coHosts: updated }, moderatorId, `INVITE_COHOST:${userName}`);
  }

  public async removeCoHost(streamId: string, currentCoHosts: any[], userId: string, moderatorId: string) {
    const updated = currentCoHosts.filter(c => c.userId !== userId);
    await this.updateModerationState(streamId, { coHosts: updated }, moderatorId, `REMOVE_COHOST:${userId}`);
  }

  /**
   * Marks a guest as an ACTIVE co-host once they have actually joined and are
   * publishing (called by the guest's own client after a successful Agora join), and
   * removes their now-consumed mic request so it doesn't get re-processed.
   */
  public async activateCoHost(
    streamId: string,
    currentCoHosts: any[],
    currentMicRequests: any[],
    userId: string,
    userName: string,
    userAvatar: string,
    seatNumber: number
  ) {
    const updatedCoHosts = [...currentCoHosts.filter(c => c.userId !== userId), {
      userId,
      userName,
      userAvatar,
      type: 'VIDEO' as const,
      seatNumber,
      status: 'ACTIVE' as const
    }];
    const updatedMicRequests = currentMicRequests.filter(r => r.userId !== userId);
    await this.updateModerationState(streamId, { coHosts: updatedCoHosts, micRequests: updatedMicRequests }, userId, `ACTIVATE_COHOST:${userName}`);
  }

  /**
   * Automated Message Moderation (Spam, Profanity, URL, Emoji)
   */
  public filterChatMessage(text: string, userId: string, customBlockedWords: string[] = []): { allowed: boolean; filteredText: string; reason?: string } {
    const now = Date.now();

    // 1. Rate Limiting / Spam Detection (>5 messages within 3 seconds)
    const userTimes = this.userMessageTimestamps.get(userId) || [];
    const recentTimes = userTimes.filter(t => now - t < 3000);
    recentTimes.push(now);
    this.userMessageTimestamps.set(userId, recentTimes);

    if (recentTimes.length > 5) {
      return { allowed: false, filteredText: '', reason: 'Rate limit exceeded. Slow down messaging.' };
    }

    // 2. URL Filtering
    const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;
    if (urlPattern.test(text)) {
      return { allowed: false, filteredText: '', reason: 'External links are forbidden in live stream chat.' };
    }

    // 3. Emoji Spam Detection (>8 consecutive emojis)
    const emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g;
    const emojiMatches = text.match(emojiRegex);
    if (emojiMatches && emojiMatches.length > 8) {
      return { allowed: false, filteredText: '', reason: 'Excessive emoji spam detected.' };
    }

    // 4. Profanity & Custom Blocked Words Filter
    let cleanedText = text;
    const allBlocked = [...this.profanityList, ...customBlockedWords];

    for (const word of allBlocked) {
      const reg = new RegExp(`\\b${word}\\b`, 'gi');
      if (reg.test(cleanedText)) {
        cleanedText = cleanedText.replace(reg, '****');
      }
    }

    return { allowed: true, filteredText: cleanedText };
  }

  /**
   * Submit Report
   */
  public async submitReport(report: ReportItem): Promise<string> {
    const docRef = await addDoc(collection(db, this.reportsCollection), {
      ...report,
      createdAt: new Date().toISOString(),
      timestamp: serverTimestamp()
    });
    return docRef.id;
  }

  /**
   * Get Reports for Admin Review
   */
  public async getReports(status = 'PENDING'): Promise<ReportItem[]> {
    try {
      const q = query(
        collection(db, this.reportsCollection),
        where('status', '==', status),
        limit(50)
      );
      const snap = await getDocs(q);
      const results: ReportItem[] = [];
      snap.forEach(d => {
        results.push({ id: d.id, ...d.data() } as ReportItem);
      });
      return results;
    } catch (e) {
      console.warn('getReports fallback:', e);
      return [];
    }
  }

  /**
   * Resolve Report (Admin Action)
   */
  public async resolveReport(reportId: string, action: 'DISMISS' | 'BAN_USER' | 'TERMINATE_STREAM', targetId?: string): Promise<void> {
    const docRef = doc(db, this.reportsCollection, reportId);
    await updateDoc(docRef, { status: action === 'DISMISS' ? 'DISMISSED' : 'RESOLVED', resolvedAt: new Date().toISOString() });

    if (action === 'BAN_USER' && targetId) {
      await this.banAccount(targetId, 'Resolved via abuse report review');
    }
  }

  /**
   * Admin Stream Termination
   */
  public async terminateStream(streamId: string, reason: string, adminId: string): Promise<void> {
    const streamRef = doc(db, 'streams', streamId);
    await updateDoc(streamRef, { status: 'TERMINATED', terminationReason: reason, endedAt: serverTimestamp() });
    this.logModeratorAction({
      streamId,
      moderatorId: adminId,
      action: 'ADMIN_TERMINATE_STREAM',
      details: reason,
      timestamp: new Date().toISOString()
    }).catch(e => console.warn(e));
  }

  /**
   * Admin Account Ban
   */
  public async banAccount(userId: string, reason: string): Promise<void> {
    const banRef = doc(db, this.userBansCollection, userId);
    await setDoc(banRef, {
      userId,
      reason,
      status: 'BANNED',
      bannedAt: new Date().toISOString()
    });

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { isBanned: true });
  }

  /**
   * Audit Log Recording
   */
  public async logModeratorAction(log: ModeratorLog): Promise<void> {
    await addDoc(collection(db, this.logsCollection), {
      ...log,
      createdAt: serverTimestamp()
    });
  }

  public async getModeratorLogs(limitCount = 50): Promise<ModeratorLog[]> {
    try {
      const q = query(collection(db, this.logsCollection), limit(limitCount));
      const snap = await getDocs(q);
      const results: ModeratorLog[] = [];
      snap.forEach(d => {
        results.push({ id: d.id, ...d.data() } as ModeratorLog);
      });
      return results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (e) {
      console.warn('getModeratorLogs fallback:', e);
      return [];
    }
  }
}

export const moderationService = new ModerationService();
