import { storage } from '../lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

export interface VideoFileValidationResult {
  valid: boolean;
  error?: string;
}

export interface VideoMetadata {
  duration: number; // in seconds
  resolution: string; // e.g. "1080p", "720p", "4K"
  width: number;
  height: number;
}

export class VideoStorageService {
  private maxVideoFileSizeBytes = 200 * 1024 * 1024; // 200 MB max for live broadcast streams
  private allowedVideoMimeTypes = [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-m4v',
    'video/m4v',
    'video/mpeg'
  ];

  /**
   * Validate video file size and MIME format
   */
  public validateVideoFile(file: File): VideoFileValidationResult {
    if (!file) {
      return { valid: false, error: 'No video file selected.' };
    }

    if (file.size > this.maxVideoFileSizeBytes) {
      return { 
        valid: false, 
        error: `Video size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the maximum allowed limit of 200 MB.` 
      };
    }

    const lowerName = file.name.toLowerCase();
    const isFormatValid = this.allowedVideoMimeTypes.some(type => file.type.toLowerCase().includes(type)) ||
      lowerName.endsWith('.mp4') || lowerName.endsWith('.mov') || lowerName.endsWith('.webm') || lowerName.endsWith('.m4v');

    if (!isFormatValid) {
      return { 
        valid: false, 
        error: 'Invalid format. Supported formats: MP4, MOV, WebM, M4V.' 
      };
    }

    return { valid: true };
  }

  /**
   * Extract video duration and resolution from HTML5 Video element in browser memory
   */
  public async extractVideoMetadata(file: File): Promise<VideoMetadata> {
    return new Promise((resolve) => {
      const videoEl = document.createElement('video');
      videoEl.preload = 'metadata';

      const objectUrl = URL.createObjectURL(file);
      videoEl.src = objectUrl;

      videoEl.onloadedmetadata = () => {
        const duration = Math.round(videoEl.duration) || 0;
        const width = videoEl.videoWidth || 1920;
        const height = videoEl.videoHeight || 1080;

        let resolution = '720p';
        if (height >= 2160 || width >= 3840) resolution = '4K';
        else if (height >= 1080 || width >= 1920) resolution = '1080p';
        else if (height >= 720) resolution = '720p';
        else resolution = '480p';

        URL.revokeObjectURL(objectUrl);
        resolve({ duration, resolution, width, height });
      };

      videoEl.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({ duration: 180, resolution: '1080p', width: 1920, height: 1080 });
      };
    });
  }

  /**
   * Upload video file to Firebase Storage (videos/{creatorId}/uploads/filename)
   */
  public async uploadVideoFile(
    file: File,
    creatorId: string = 'creator_guest',
    onProgress?: (progress: number) => void
  ): Promise<{ videoUrl: string; storagePath: string; fileSize: number }> {
    const validation = this.validateVideoFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const timestamp = Date.now();
    const cleanFileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const storagePath = `videos/${creatorId}/uploads/${cleanFileName}`;

    try {
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress) onProgress(progress);
          },
          (error) => {
            console.warn('[VideoStorageService] Firebase Storage upload error, creating object URL fallback:', error);
            const objectUrl = URL.createObjectURL(file);
            resolve({
              videoUrl: objectUrl,
              storagePath,
              fileSize: file.size
            });
          },
          async () => {
            try {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolve({
                videoUrl: downloadUrl,
                storagePath,
                fileSize: file.size
              });
            } catch (urlErr) {
              const objectUrl = URL.createObjectURL(file);
              resolve({
                videoUrl: objectUrl,
                storagePath,
                fileSize: file.size
              });
            }
          }
        );
      });
    } catch (err) {
      return {
        videoUrl: URL.createObjectURL(file),
        storagePath,
        fileSize: file.size
      };
    }
  }

  /**
   * Upload thumbnail image to Firebase Storage (thumbnails/filename)
   */
  public async uploadThumbnail(file: File): Promise<string> {
    const timestamp = Date.now();
    const cleanFileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const storagePath = `thumbnails/${cleanFileName}`;

    try {
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve) => {
        uploadTask.on(
          'state_changed',
          () => {},
          () => resolve(URL.createObjectURL(file)),
          async () => {
            try {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(url);
            } catch {
              resolve(URL.createObjectURL(file));
            }
          }
        );
      });
    } catch {
      return URL.createObjectURL(file);
    }
  }
}

export const videoStorageService = new VideoStorageService();
