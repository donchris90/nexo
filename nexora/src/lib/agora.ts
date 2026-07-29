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

export class AgoraManager {
  private client: IAgoraRTCClient | null = null;
  private localVideoTrack: ICameraVideoTrack | null = null;
  private localAudioTrack: IMicrophoneAudioTrack | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
      } catch (e) {
        console.warn('AgoraRTC.createClient warning:', e);
      }
    }
  }

  public async joinChannel(channelName: string, role: 'host' | 'audience' = 'audience', uid?: string | number) {
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
   * Wires up remote user video/audio playback for viewers (audience role).
   * Plays incoming host video into `container` and unmutes remote audio.
   * Returns an unsubscribe function to call on cleanup.
   */
  public onRemoteVideo(container: HTMLElement, onActiveChange?: (active: boolean) => void) {
    if (!this.client) return () => {};

    const handlePublished = async (remoteUser: any, mediaType: 'video' | 'audio') => {
      try {
        await this.client!.subscribe(remoteUser, mediaType);
        if (mediaType === 'video' && remoteUser.videoTrack) {
          remoteUser.videoTrack.play(container);
          onActiveChange?.(true);
        }
        if (mediaType === 'audio' && remoteUser.audioTrack) {
          remoteUser.audioTrack.play();
        }
      } catch (err) {
        console.warn('Failed to subscribe to remote user media:', err);
      }
    };

    const handleUnpublished = (_remoteUser: any, mediaType: 'video' | 'audio') => {
      if (mediaType === 'video') onActiveChange?.(false);
    };

    this.client.on('user-published', handlePublished);
    this.client.on('user-unpublished', handleUnpublished);

    return () => {
      this.client?.off('user-published', handlePublished);
      this.client?.off('user-unpublished', handleUnpublished);
    };
  }
}

export const agoraEngine = new AgoraManager();
