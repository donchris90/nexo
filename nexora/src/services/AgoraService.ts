import AgoraRTC, { 
  IAgoraRTCClient, 
  ILocalAudioTrack, 
  ILocalVideoTrack, 
  IAgoraRTCRemoteUser, 
  UID, 
  ClientRole
} from 'agora-rtc-sdk-ng';
import { db } from '../lib/firebase';
import { 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc, 
  onSnapshot, 
  increment, 
  serverTimestamp,
  DocumentSnapshot,
  DocumentData,
  FirestoreError 
} from 'firebase/firestore';

export type RemoteMediaType = 'audio' | 'video' | 'datachannel';

export interface AgoraStreamCallbacks {
  onUserPublished?: (user: IAgoraRTCRemoteUser, mediaType: RemoteMediaType) => void;
  onUserUnpublished?: (user: IAgoraRTCRemoteUser, mediaType: RemoteMediaType) => void;
  onUserJoined?: (user: IAgoraRTCRemoteUser) => void;
  onUserLeft?: (user: IAgoraRTCRemoteUser, reason: string) => void;
  onConnectionStateChange?: (curState: string, revState: string, reason?: string) => void;
  onError?: (error: Error) => void;
  onTokenWillExpire?: () => void;
}

export interface StreamMetadata {
  id?: string;
  channelName: string;
  hostUid: UID;
  hostName?: string;
  title?: string;
  status: 'LIVE' | 'ENDED';
  viewerCount: number;
  startedAt?: any;
  endedAt?: any;
  updatedAt?: any;
}

export class AgoraService {
  private client: IAgoraRTCClient | null = null;
  private localAudioTrack: ILocalAudioTrack | null = null;
  private localVideoTrack: ILocalVideoTrack | null = null;
  private remoteUsersMap: Map<UID, IAgoraRTCRemoteUser> = new Map();
  private callbacks: AgoraStreamCallbacks = {};
  private currentAppId: string = '';
  private currentChannel: string = '';
  private currentUid: UID | null = null;
  private isJoined: boolean = false;
  private role: ClientRole = 'host';
  private currentToken: string | null = null;

  constructor() {
    // Set log level (2: WARNING, 1: INFO, 0: DEBUG)
    AgoraRTC.setLogLevel(2);
  }

  /**
   * Request dynamic RTC token from backend server
   */
  public async fetchToken(channelName: string, uid: UID | null, role: ClientRole): Promise<{ token: string | null; appId: string | null }> {
    try {
      const roleParam = role === 'host' ? 'publisher' : 'subscriber';
      const numericUid = uid ? Number(uid) : 0;
      const res = await fetch(`/api/agora/token?channelName=${encodeURIComponent(channelName)}&uid=${numericUid}&role=${roleParam}`);
      
      if (!res.ok) {
        throw new Error(`Token endpoint HTTP status ${res.status}`);
      }

      const data = await res.json();
      return {
        token: data.token || null,
        appId: data.appId || null
      };
    } catch (err) {
      console.warn('[AgoraService] Unable to fetch token from backend server endpoint:', err);
      return { token: null, appId: null };
    }
  }

  /**
   * Initialize and join an Agora RTC streaming channel
   */
  public async joinChannel(
    appId: string | null, 
    channelName: string, 
    token: string | null = null, 
    uid: UID | null = null, 
    role: ClientRole = 'host',
    callbacks?: AgoraStreamCallbacks
  ): Promise<UID> {
    if (callbacks) {
      this.callbacks = { ...this.callbacks, ...callbacks };
    }

    this.currentChannel = channelName;
    this.role = role;

    // Fetch dynamic token and appId from backend if missing
    let tokenToUse = token;
    let appIdToUse = appId || (import.meta as any).env?.VITE_AGORA_APP_ID;

    if (!tokenToUse || !appIdToUse) {
      const fetched = await this.fetchToken(channelName, uid, role);
      if (fetched.token) tokenToUse = fetched.token;
      if (fetched.appId) appIdToUse = fetched.appId;
    }

    this.currentAppId = appIdToUse || '';
    this.currentToken = tokenToUse;

    if (!this.currentAppId) {
      const errorMsg = 'Agora App ID is not configured. Please set AGORA_APP_ID in server environment.';
      console.warn('[AgoraService]', errorMsg);
    }

    // Create client instance if not already initialized
    if (!this.client) {
      this.client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
      this.registerEventListeners();
    }

    try {
      await this.client.setClientRole(this.role);
      
      const assignedUid = await this.client.join(
        this.currentAppId || 'unconfigured_app_id', 
        this.currentChannel, 
        tokenToUse, 
        uid
      );

      this.currentUid = assignedUid;
      this.isJoined = true;

      // If host, create local camera/microphone tracks and publish
      if (this.role === 'host') {
        await this.startLocalTracks();
        await this.publishLocalTracks();
        await this.syncFirestoreStreamStarted(assignedUid);
      } else {
        await this.syncFirestoreViewerJoined();
      }

      return assignedUid;
    } catch (error: any) {
      console.error('[AgoraService] joinChannel error:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
      throw error;
    }
  }

  /**
   * Create local microphone and camera media tracks
   */
  public async startLocalTracks(): Promise<{ audioTrack: ILocalAudioTrack | null; videoTrack: ILocalVideoTrack | null }> {
    try {
      if (!this.localAudioTrack && !this.localVideoTrack) {
        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
          { encoderConfig: 'speech_standard' },
          { encoderConfig: '720p_1' }
        );
        this.localAudioTrack = audioTrack;
        this.localVideoTrack = videoTrack;
      }
      return { audioTrack: this.localAudioTrack, videoTrack: this.localVideoTrack };
    } catch (err: any) {
      console.warn('[AgoraService] Camera/Mic hardware fallback:', err);
      try {
        if (!this.localAudioTrack) {
          this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        }
      } catch (audioErr) {
        console.warn('[AgoraService] Microphone access denied:', audioErr);
      }
      return { audioTrack: this.localAudioTrack, videoTrack: this.localVideoTrack };
    }
  }

  /**
   * Publish local audio and video tracks to channel
   */
  public async publishLocalTracks(): Promise<void> {
    if (!this.client || !this.isJoined) return;

    const tracksToPublish: (ILocalAudioTrack | ILocalVideoTrack)[] = [];
    if (this.localAudioTrack) tracksToPublish.push(this.localAudioTrack);
    if (this.localVideoTrack) tracksToPublish.push(this.localVideoTrack);

    if (tracksToPublish.length > 0) {
      try {
        await this.client.publish(tracksToPublish);
      } catch (err) {
        console.warn('[AgoraService] publishLocalTracks error:', err);
      }
    }
  }

  /**
   * Unpublish local tracks from channel
   */
  public async unpublishLocalTracks(): Promise<void> {
    if (!this.client || !this.isJoined) return;

    const tracksToUnpublish: (ILocalAudioTrack | ILocalVideoTrack)[] = [];
    if (this.localAudioTrack) tracksToUnpublish.push(this.localAudioTrack);
    if (this.localVideoTrack) tracksToUnpublish.push(this.localVideoTrack);

    if (tracksToUnpublish.length > 0) {
      try {
        await this.client.unpublish(tracksToUnpublish);
      } catch (err) {
        console.warn('[AgoraService] unpublishLocalTracks warning:', err);
      }
    }
  }

  /**
   * Leave channel, release tracks and clean up Firestore metadata
   */
  public async leaveChannel(): Promise<void> {
    try {
      if (this.localAudioTrack) {
        this.localAudioTrack.stop();
        this.localAudioTrack.close();
        this.localAudioTrack = null;
      }

      if (this.localVideoTrack) {
        this.localVideoTrack.stop();
        this.localVideoTrack.close();
        this.localVideoTrack = null;
      }

      if (this.role === 'host') {
        await this.syncFirestoreStreamEnded();
      } else {
        await this.syncFirestoreViewerLeft();
      }

      if (this.client && this.isJoined) {
        await this.client.leave();
      }
    } catch (err) {
      console.warn('[AgoraService] leaveChannel error:', err);
    } finally {
      this.isJoined = false;
      this.remoteUsersMap.clear();
      this.currentUid = null;
    }
  }

  /**
   * Toggle Audio Mute State
   */
  public async toggleMuteAudio(mute?: boolean): Promise<boolean> {
    if (!this.localAudioTrack) return false;
    const shouldMute = mute !== undefined ? mute : this.localAudioTrack.enabled;
    await this.localAudioTrack.setEnabled(!shouldMute);
    return !this.localAudioTrack.enabled;
  }

  /**
   * Toggle Video Mute / Camera Off State
   */
  public async toggleMuteVideo(mute?: boolean): Promise<boolean> {
    if (!this.localVideoTrack) return false;
    const shouldMute = mute !== undefined ? mute : this.localVideoTrack.enabled;
    await this.localVideoTrack.setEnabled(!shouldMute);
    return !this.localVideoTrack.enabled;
  }

  /**
   * Attach video player to a specific HTML DOM element
   */
  public playLocalVideo(element: HTMLElement | string): void {
    if (this.localVideoTrack) {
      this.localVideoTrack.play(element);
    }
  }

  /**
   * Play remote user video/audio stream in DOM element
   */
  public async playRemoteStream(user: IAgoraRTCRemoteUser, videoElement?: HTMLElement | string): Promise<void> {
    if (!this.client) return;

    if (user.hasVideo && user.videoTrack && videoElement) {
      user.videoTrack.play(videoElement);
    }
    if (user.hasAudio && user.audioTrack) {
      user.audioTrack.play();
    }
  }

  /**
   * Register event listeners on Agora RTC client instance including Token Renewal & Auto-Reconnection
   */
  private registerEventListeners(): void {
    if (!this.client) return;

    // Remote user published stream track (video or audio)
    this.client.on('user-published', async (user, mediaType) => {
      try {
        await this.client?.subscribe(user, mediaType);
        this.remoteUsersMap.set(user.uid, user);

        if (this.callbacks.onUserPublished) {
          this.callbacks.onUserPublished(user, mediaType);
        }
      } catch (err: any) {
        console.error('[AgoraService] Error subscribing to remote user track:', err);
      }
    });

    // Remote user unpublished stream track
    this.client.on('user-unpublished', (user, mediaType) => {
      if (this.callbacks.onUserUnpublished) {
        this.callbacks.onUserUnpublished(user, mediaType);
      }
    });

    // Remote user joined channel
    this.client.on('user-joined', (user) => {
      this.remoteUsersMap.set(user.uid, user);
      if (this.callbacks.onUserJoined) {
        this.callbacks.onUserJoined(user);
      }
    });

    // Remote user left channel
    this.client.on('user-left', (user, reason) => {
      this.remoteUsersMap.delete(user.uid);
      if (this.callbacks.onUserLeft) {
        this.callbacks.onUserLeft(user, reason);
      }
    });

    // Connection state change & Auto Reconnection handling
    this.client.on('connection-state-change', (curState, revState, reason) => {
      console.log(`[AgoraService] Connection State: ${revState} -> ${curState} (${reason || 'N/A'})`);
      
      if (this.callbacks.onConnectionStateChange) {
        this.callbacks.onConnectionStateChange(curState, revState, reason);
      }
    });

    // Token Renewal Strategy before expiration
    this.client.on('token-privilege-will-expire', async () => {
      console.warn('[AgoraService] Token privilege will expire soon. Requesting token renewal...');
      if (this.callbacks.onTokenWillExpire) {
        this.callbacks.onTokenWillExpire();
      }
      await this.renewCurrentToken();
    });

    this.client.on('token-privilege-did-expire', async () => {
      console.error('[AgoraService] Token privilege expired. Renewing immediately...');
      await this.renewCurrentToken();
    });
  }

  /**
   * Renew Agora Token dynamically
   */
  public async renewCurrentToken(): Promise<boolean> {
    if (!this.client || !this.currentChannel) return false;

    try {
      const { token } = await this.fetchToken(this.currentChannel, this.currentUid, this.role);
      if (token) {
        await this.client.renewToken(token);
        this.currentToken = token;
        console.log('[AgoraService] RTC Token successfully renewed.');
        return true;
      }
    } catch (err) {
      console.error('[AgoraService] Token renewal failed:', err);
    }
    return false;
  }

  /**
   * Firestore Stream Sync Helpers
   */
  private async syncFirestoreStreamStarted(hostUid: UID): Promise<void> {
    if (!this.currentChannel) return;
    try {
      const streamRef = doc(db, 'streams', this.currentChannel);
      await setDoc(streamRef, {
        channelName: this.currentChannel,
        hostUid,
        status: 'LIVE',
        viewerCount: 1,
        startedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.warn('[AgoraService] syncFirestoreStreamStarted warning:', err);
    }
  }

  private async syncFirestoreStreamEnded(): Promise<void> {
    if (!this.currentChannel) return;
    try {
      const streamRef = doc(db, 'streams', this.currentChannel);
      await updateDoc(streamRef, {
        status: 'ENDED',
        viewerCount: 0,
        endedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.warn('[AgoraService] syncFirestoreStreamEnded warning:', err);
    }
  }

  private async syncFirestoreViewerJoined(): Promise<void> {
    if (!this.currentChannel) return;
    try {
      const streamRef = doc(db, 'streams', this.currentChannel);
      const snap = await getDoc(streamRef);
      if (snap.exists()) {
        await updateDoc(streamRef, {
          viewerCount: increment(1),
          updatedAt: serverTimestamp()
        });
      } else {
        await setDoc(streamRef, {
          channelName: this.currentChannel,
          status: 'LIVE',
          viewerCount: 1,
          startedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.warn('[AgoraService] syncFirestoreViewerJoined warning:', err);
    }
  }

  private async syncFirestoreViewerLeft(): Promise<void> {
    if (!this.currentChannel) return;
    try {
      const streamRef = doc(db, 'streams', this.currentChannel);
      const snap = await getDoc(streamRef);
      if (snap.exists()) {
        const currentCount = snap.data().viewerCount || 0;
        await updateDoc(streamRef, {
          viewerCount: Math.max(0, currentCount - 1),
          updatedAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.warn('[AgoraService] syncFirestoreViewerLeft warning:', err);
    }
  }

  /**
   * Subscribe to real-time Firestore stream metadata
   */
  public subscribeToStreamMetadata(channelName: string, callback: (metadata: StreamMetadata | null) => void) {
    const streamRef = doc(db, 'streams', channelName);
    return onSnapshot(streamRef, (snapshot: DocumentSnapshot<DocumentData>) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.id, ...snapshot.data() } as StreamMetadata);
      } else {
        callback(null);
      }
    }, (err: FirestoreError) => {
      console.warn('[AgoraService] Stream metadata subscription warning:', err);
    });
  }

  /**
   * Subscribe to stream callbacks
   */
  public setCallbacks(callbacks: AgoraStreamCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Get list of currently connected remote users
   */
  public getRemoteUsers(): IAgoraRTCRemoteUser[] {
    return Array.from(this.remoteUsersMap.values());
  }

  /**
   * Get active local tracks
   */
  public getLocalTracks() {
    return {
      audioTrack: this.localAudioTrack,
      videoTrack: this.localVideoTrack
    };
  }

  public getIsJoined(): boolean {
    return this.isJoined;
  }

  public getCurrentUid(): UID | null {
    return this.currentUid;
  }

  public getCurrentChannel(): string {
    return this.currentChannel;
  }
}

export const agoraService = new AgoraService();

