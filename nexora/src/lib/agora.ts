import AgoraRTC, { 
  IAgoraRTCClient, 
  ICameraVideoTrack, 
  IMicrophoneAudioTrack, 
  IRemoteVideoTrack, 
  IRemoteAudioTrack 
} from 'agora-rtc-sdk-ng';

// Retrieve App ID from environment variable without hardcoded fallback
export const AGORA_APP_ID = ((import.meta as any).env?.VITE_AGORA_APP_ID as string) || '';

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
      this.client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
    }
  }

  public async joinChannel(channelName: string, role: 'host' | 'audience' = 'audience', uid?: string | number) {
    if (!this.client) return;

    await this.client.setClientRole(role === 'host' ? 'host' : 'audience');
    
    let token: string | null = null;
    let appIdToUse = AGORA_APP_ID;

    try {
      const response = await fetch(`/api/agora/token?channelName=${encodeURIComponent(channelName)}&uid=${uid || 0}&role=${role === 'host' ? 'publisher' : 'subscriber'}`);
      const data = await response.json();
      if (data.token) {
        token = data.token;
      }
      if (data.appId) {
        appIdToUse = data.appId;
      }
    } catch (err) {
      console.warn('Failed to fetch RTC token from server endpoint:', err);
    }

    if (!appIdToUse) {
      console.warn('Agora App ID not available. Please configure AGORA_APP_ID environment variable.');
      return null;
    }

    // Join channel with dynamic token
    const assignedUid = await this.client.join(appIdToUse, channelName, token, uid || null);
    
    if (role === 'host') {
      try {
        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        this.localAudioTrack = audioTrack;
        this.localVideoTrack = videoTrack;
        await this.client.publish([audioTrack, videoTrack]);
      } catch (err) {
        console.warn('Camera/Microphone media permission warning (using canvas fallback):', err);
      }
    }

    return assignedUid;
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
      await this.client.leave();
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
