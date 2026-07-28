import AgoraRTC, { ILocalAudioTrack } from 'agora-rtc-sdk-ng';

export class AudioMixingService {
  private audioContext: AudioContext | null = null;
  private musicSourceNode: MediaElementAudioSourceNode | null = null;
  private micSourceNode: MediaStreamAudioSourceNode | null = null;
  
  private musicGainNode: GainNode | null = null;
  private micGainNode: GainNode | null = null;
  private sfxGainNode: GainNode | null = null;
  
  private mixedDestination: MediaStreamAudioDestinationNode | null = null;
  private customAgoraAudioTrack: ILocalAudioTrack | null = null;

  private micVolume = 1.0;
  private musicVolume = 0.8;
  private sfxVolume = 1.0;

  /**
   * Initialize Web Audio API Mixer Context
   */
  public getAudioContext(): AudioContext {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(err => console.warn('AudioContext resume notice:', err));
    }
    return this.audioContext;
  }

  /**
   * Connect HTML5 Audio Element (Internal Music Player) to Web Audio Mixer
   */
  public attachMusicElement(audioElement: HTMLAudioElement): void {
    const ctx = this.getAudioContext();

    if (!this.musicGainNode) {
      this.musicGainNode = ctx.createGain();
      this.musicGainNode.gain.value = this.musicVolume;
    }

    if (!this.mixedDestination) {
      this.mixedDestination = ctx.createMediaStreamDestination();
    }

    try {
      if (!this.musicSourceNode) {
        // Cross-origin audio attribute for CDN audio streaming
        audioElement.crossOrigin = 'anonymous';
        this.musicSourceNode = ctx.createMediaElementSource(audioElement);
        this.musicSourceNode.connect(this.musicGainNode);
        
        // Connect to local speakers and to mixed destination
        this.musicGainNode.connect(ctx.destination);
        this.musicGainNode.connect(this.mixedDestination);
      }
    } catch (err) {
      console.warn('[AudioMixingService] MediaElementSource connection note:', err);
    }
  }

  /**
   * Connect Microphone Stream to Web Audio Mixer
   */
  public async attachMicrophoneStream(micMediaStream: MediaStream): Promise<void> {
    const ctx = this.getAudioContext();

    if (!this.micGainNode) {
      this.micGainNode = ctx.createGain();
      this.micGainNode.gain.value = this.micVolume;
    }

    if (!this.mixedDestination) {
      this.mixedDestination = ctx.createMediaStreamDestination();
    }

    try {
      if (this.micSourceNode) {
        this.micSourceNode.disconnect();
      }
      this.micSourceNode = ctx.createMediaStreamSource(micMediaStream);
      this.micSourceNode.connect(this.micGainNode);
      this.micGainNode.connect(this.mixedDestination);
      // Note: do not connect mic to ctx.destination locally to avoid echo in host speakers!
    } catch (err) {
      console.warn('[AudioMixingService] Microphone stream connection note:', err);
    }
  }

  /**
   * Create mixed Agora Audio Track combining Mic + Internal Music + Sound FX
   */
  public async createMixedAgoraAudioTrack(): Promise<ILocalAudioTrack | null> {
    const ctx = this.getAudioContext();
    if (!this.mixedDestination) {
      this.mixedDestination = ctx.createMediaStreamDestination();
    }

    const mixedAudioStreamTrack = this.mixedDestination.stream.getAudioTracks()[0];
    if (!mixedAudioStreamTrack) return null;

    try {
      this.customAgoraAudioTrack = await AgoraRTC.createCustomAudioTrack({
        mediaStreamTrack: mixedAudioStreamTrack,
        encoderConfig: 'high_quality_stereo'
      });
      return this.customAgoraAudioTrack;
    } catch (err) {
      console.warn('[AudioMixingService] Custom Agora audio track creation warning:', err);
      return null;
    }
  }

  /**
   * Play Gift Sound Effect into the Mixed Stream
   */
  public playGiftSoundEffect(soundUrl: string): void {
    const ctx = this.getAudioContext();
    if (!this.sfxGainNode) {
      this.sfxGainNode = ctx.createGain();
      this.sfxGainNode.gain.value = this.sfxVolume;
      if (!this.mixedDestination) {
        this.mixedDestination = ctx.createMediaStreamDestination();
      }
      this.sfxGainNode.connect(ctx.destination);
      this.sfxGainNode.connect(this.mixedDestination);
    }

    fetch(soundUrl)
      .then(res => res.arrayBuffer())
      .then(buffer => ctx.decodeAudioData(buffer))
      .then(audioBuffer => {
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.sfxGainNode!);
        source.start(0);
      })
      .catch(err => console.warn('[AudioMixingService] SFX playback note:', err));
  }

  /**
   * Adjust Music Volume (0.0 to 1.0)
   */
  public setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.musicGainNode) {
      this.musicGainNode.gain.value = this.musicVolume;
    }
  }

  /**
   * Adjust Microphone Volume (0.0 to 1.0)
   */
  public setMicVolume(volume: number): void {
    this.micVolume = Math.max(0, Math.min(1, volume));
    if (this.micGainNode) {
      this.micGainNode.gain.value = this.micVolume;
    }
  }

  public getMusicVolume(): number {
    return this.musicVolume;
  }

  public getMicVolume(): number {
    return this.micVolume;
  }

  /**
   * Clean up audio mixer context and nodes
   */
  public destroy(): void {
    if (this.customAgoraAudioTrack) {
      this.customAgoraAudioTrack.stop();
      this.customAgoraAudioTrack.close();
      this.customAgoraAudioTrack = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
  }
}

export const audioMixingService = new AudioMixingService();
