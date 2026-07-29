import AgoraRTC, { 
  IAgoraRTCClient, 
  ICameraVideoTrack, 
  IMicrophoneAudioTrack, 
  IRemoteVideoTrack, 
  IRemoteAudioTrack 
} from 'agora-rtc-sdk-ng';

// Retrieve App ID from environment variable without hardcoded fallback
export const AGORA_APP_ID = ((import.meta as any).env?.VITE_AGORA_APP_ID as string) || '';

export function isValidAgoraAppId(appId: string | null | undefined): boolean {
  if (!appId || typeof appId !== 'string') return false;
  const trimmed = appId.trim();
  if (trimmed.length !== 32) return false;
  if (trimmed === 'a0000000000000000000000000000000') return false;
  if (trimmed.startsWith('unconfigured') || trimmed.startsWith('AIza')) return false;
  return /^[0-9a-fA-F]{32}$/.test(trimmed);
}

export interface AgoraStreamState {
  client: IAgoraRTCClient | null;
  localVideoTrack: ICameraVideoTrack | null;
  localAudioTrack: IMicrophoneAudioTrack | null;
  remoteUsers: Array<{
    uid: string | number;
    videoTrack?: IRemoteVideoTrack;
    audioTrack?: IRemoteAudioTrack;
  }>;
  isJoined: boolean;
  isPublishing: boolean;
  micMuted: boolean;
  cameraMuted: boolean;
}

const DEFAULT_CONTAINER_KEY = '__default__';

export class AgoraManager {
  private client: IAgoraRTCClient | null = null;
  private localVideoTrack: ICameraVideoTrack | null = null;
  private localAudioTrack: IMicrophoneAudioTrack | null = null;

  // Multi-guest rendering: each remote participant's video can be bound to its own
  // DOM element (e.g. one per seat tile) instead of a single shared preview container.
  private remoteVideoElements: Map<string, HTMLElement> = new Map();
  private remoteActiveCallbacks: Map<string, (active: boolean) => void> = new Map();
  private remoteTracks: Map<string, { videoTrack?: IRemoteVideoTrack; audioTrack?: IRemoteAudioTrack }> = new Map();
  private listenersRegistered = false;

  // Idempotency guard: a channel/uid/role tuple that is already joined (or currently
  // joining) must not be re-joined by a duplicate effect run / rapid double-tap, which
  // would otherwise create duplicate/ghost participants in the channel.
  private joinedChannel: string | null = null;
  private joinedUid: string | number | null = null;
  private joinedRole: 'host' | 'audience' | null = null;
  private joinInFlight: Promise<string | number | null> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
        this.registerRemoteTrackListeners();
      } catch (e) {
        console.warn('AgoraRTC.createClient warning:', e);
      }
    }
  }

  private registerRemoteTrackListeners() {
    if (!this.client || this.listenersRegistered) return;
    this.listenersRegistered = true;

    this.client.on('user-published', async (remoteUser: any, mediaType: 'video' | 'audio') => {
      try {
        await this.client!.subscribe(remoteUser, mediaType);
        const key = String(remoteUser.uid);
        const entry = this.remoteTracks.get(key) || {};

        if (mediaType === 'video' && remoteUser.videoTrack) {
          entry.videoTrack = remoteUser.videoTrack;
          const container = this.remoteVideoElements.get(key) || this.remoteVideoElements.get(DEFAULT_CONTAINER_KEY);
          if (container) {
            remoteUser.videoTrack.play(container);
          }
          const onActive = this.remoteActiveCallbacks.get(key) || this.remoteActiveCallbacks.get(DEFAULT_CONTAINER_KEY);
          onActive?.(true);
        }
        if (mediaType === 'audio' && remoteUser.audioTrack) {
          entry.audioTrack = remoteUser.audioTrack;
          remoteUser.audioTrack.play();
        }

        this.remoteTracks.set(key, entry);
      } catch (err) {
        console.warn('Failed to subscribe to remote user media:', err);
      }
    });

    this.client.on('user-unpublished', (remoteUser: any, mediaType: 'video' | 'audio') => {
      const key = String(remoteUser.uid);
      if (mediaType === 'video') {
        const onActive = this.remoteActiveCallbacks.get(key) || this.remoteActiveCallbacks.get(DEFAULT_CONTAINER_KEY);
        onActive?.(false);
        const entry = this.remoteTracks.get(key);
        if (entry) entry.videoTrack = undefined;
      }
    });

    this.client.on('user-left', (remoteUser: any) => {
      const key = String(remoteUser.uid);
      this.remoteTracks.delete(key);
      const onActive = this.remoteActiveCallbacks.get(key) || this.remoteActiveCallbacks.get(DEFAULT_CONTAINER_KEY);
      onActive?.(false);
    });
  }

  /**
   * Bind a specific remote participant's video to a DOM element (e.g. a seat tile).
   * If that participant's video track has already arrived, it plays immediately.
   * Pass `element: null` to unbind (e.g. on seat/tile unmount).
   */
  public bindRemoteVideoElement(uid: string | number, element: HTMLElement | null, onActiveChange?: (active: boolean) => void) {
    const key = String(uid);
    if (!element) {
      this.remoteVideoElements.delete(key);
      this.remoteActiveCallbacks.delete(key);
      return;
    }
    this.remoteVideoElements.set(key, element);
    if (onActiveChange) this.remoteActiveCallbacks.set(key, onActiveChange);

    const existing = this.remoteTracks.get(key);
    if (existing?.videoTrack) {
      existing.videoTrack.play(element);
      onActiveChange?.(true);
    }
  }

  public async joinChannel(channelName: string, role: 'host' | 'audience' = 'audience', uid?: string | number) {
    if (!this.client) return null;

    // Idempotency: skip a duplicate join for the exact same channel/uid/role while one
    // is already in flight or already joined, so double-invoked effects (React strict
    // mode, rapid re-renders) never spawn duplicate/ghost participants.
    if (this.joinedChannel === channelName && this.joinedUid === (uid ?? this.joinedUid) && this.joinedRole === role) {
      if (this.joinInFlight) return this.joinInFlight;
      return this.joinedUid;
    }
    if (this.joinInFlight) {
      await this.joinInFlight.catch(() => {});
    }

    const joinPromise = this.doJoinChannel(channelName, role, uid);
    this.joinInFlight = joinPromise;
    try {
      const result = await joinPromise;
      this.joinedChannel = channelName;
      this.joinedRole = role;
      this.joinedUid = result;
      return result;
    } finally {
      this.joinInFlight = null;
    }
  }

  private async doJoinChannel(channelName: string, role: 'host' | 'audience' = 'audience', uid?: string | number) {
    if (!this.client) return null;

    try {
      await this.client.setClientRole(role === 'host' ? 'host' : 'audience');
    } catch (e) {
      console.warn('Agora setClientRole notice:', e);
    }

    let token: string | null = null;
    let appIdToUse = AGORA_APP_ID;

    try {
      const response = await fetch(`/api/agora/token?channelName=${encodeURIComponent(channelName)}&uid=${uid || 0}&role=${role === 'host' ? 'publisher' : 'subscriber'}`);
      if (response.ok) {
        const data = await response.json();
        if (data.token) token = data.token;
        if (data.appId) appIdToUse = data.appId;
      }
    } catch (err) {
      console.warn('Failed to fetch RTC token from server endpoint:', err);
    }

    if (!isValidAgoraAppId(appIdToUse)) {
      console.warn('[AgoraManager] AGORA_APP_ID is unconfigured or invalid. Running in local media simulation mode.');
      if (role === 'host') {
        try {
          if (!this.localAudioTrack || !this.localVideoTrack) {
            const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
            this.localAudioTrack = audioTrack;
            this.localVideoTrack = videoTrack;
          }
        } catch (err) {
          console.warn('[AgoraManager] Camera/Microphone preview warning:', err);
        }
      }
      return uid || 100001;
    }

    // Join channel with dynamic token
    try {
      const assignedUid = await this.client.join(appIdToUse, channelName, token, uid || null);

      if (role === 'host') {
        try {
          if (!this.localAudioTrack || !this.localVideoTrack) {
            const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
            this.localAudioTrack = audioTrack;
            this.localVideoTrack = videoTrack;
          }
          await this.client.publish([this.localAudioTrack, this.localVideoTrack]);
        } catch (err) {
          console.warn('Camera/Microphone media permission warning (using fallback):', err);
        }
      }

      return assignedUid;
    } catch (err: any) {
      console.warn('[AgoraManager] Gateway server join notice (using local media mode):', err?.message || err);
      if (role === 'host') {
        try {
          if (!this.localAudioTrack || !this.localVideoTrack) {
            const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
            this.localAudioTrack = audioTrack;
            this.localVideoTrack = videoTrack;
          }
        } catch (micErr) {
          console.warn('[AgoraManager] Media track creation warning:', micErr);
        }
      }
      return uid || 100001;
    }
  }

  public async leaveChannel() {
    if (this.localAudioTrack) {
      this.localAudioTrack.close();
      this.localAudioTrack = null;
    }
    if (this.localVideoTrack) {
      this.localVideoTrack.close();
      this.localVideoTrack = null;
    }
    if (this.client) {
      try {
        await this.client.leave();
      } catch (err) {
        // ignore leave errors when not connected
      }
    }
    this.joinedChannel = null;
    this.joinedUid = null;
    this.joinedRole = null;
    this.remoteTracks.clear();
  }

  public toggleMuteMic(): boolean {
    if (this.localAudioTrack) {
      const isMuted = !this.localAudioTrack.muted;
      this.localAudioTrack.setMuted(isMuted);
      return isMuted;
    }
    return false;
  }

  public toggleMuteCamera(): boolean {
    if (this.localVideoTrack) {
      const isMuted = !this.localVideoTrack.muted;
      this.localVideoTrack.setMuted(isMuted);
      return isMuted;
    }
    return false;
  }

  public getClient() {
    return this.client;
  }

  public getLocalVideoTrack() {
    return this.localVideoTrack;
  }

  /**
   * Wires up remote user video/audio playback for plain viewers (audience role) who
   * only ever watch a single primary stream. Internally this is just the "default"
   * remote video binding — any participant without a more specific per-seat binding
   * (see `bindRemoteVideoElement`) renders here. Returns an unsubscribe function.
   */
  public onRemoteVideo(container: HTMLElement, onActiveChange?: (active: boolean) => void) {
    if (!this.client) return () => {};

    this.remoteVideoElements.set(DEFAULT_CONTAINER_KEY, container);
    if (onActiveChange) this.remoteActiveCallbacks.set(DEFAULT_CONTAINER_KEY, onActiveChange);

    // In case media already arrived before this container mounted (e.g. re-render).
    for (const [key, track] of this.remoteTracks.entries()) {
      if (track.videoTrack && !this.remoteVideoElements.has(key)) {
        track.videoTrack.play(container);
        onActiveChange?.(true);
        break;
      }
    }

    return () => {
      this.remoteVideoElements.delete(DEFAULT_CONTAINER_KEY);
      this.remoteActiveCallbacks.delete(DEFAULT_CONTAINER_KEY);
    };
  }
}

export const agoraEngine = new AgoraManager();
