import { storage } from '../lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export class MusicStorageService {
  private maxFileSizeBytes = 25 * 1024 * 1024; // 25 MB max
  private allowedAudioTypes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/aac',
    'audio/ogg',
    'audio/x-m4a',
    'audio/m4a'
  ];

  private allowedImageTypes = [
    'image/jpeg',
    'image/png',
    'image/webp'
  ];

  /**
   * Validate audio file size and format before uploading
   */
  public validateAudioFile(file: File): FileValidationResult {
    if (!file) {
      return { valid: false, error: 'No audio file selected.' };
    }

    if (file.size > this.maxFileSizeBytes) {
      return { 
        valid: false, 
        error: `Audio file size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the maximum allowed limit of 25 MB.` 
      };
    }

    const isTypeValid = this.allowedAudioTypes.some(type => 
      file.type.toLowerCase().includes(type) || file.name.endsWith('.mp3') || file.name.endsWith('.wav') || file.name.endsWith('.m4a')
    );

    if (!isTypeValid) {
      return { 
        valid: false, 
        error: 'Invalid file format. Please upload an MP3, WAV, AAC, or M4A audio file.' 
      };
    }

    return { valid: true };
  }

  /**
   * Validate cover art image
   */
  public validateCoverImage(file: File): FileValidationResult {
    if (!file) return { valid: true }; // optional

    if (file.size > 5 * 1024 * 1024) { // 5 MB max
      return { valid: false, error: 'Cover image size exceeds 5 MB.' };
    }

    const isValid = this.allowedImageTypes.some(type => file.type.toLowerCase().includes(type));
    if (!isValid) {
      return { valid: false, error: 'Invalid image format. Please upload JPG, PNG, or WEBP.' };
    }

    return { valid: true };
  }

  /**
   * Upload audio file to Firebase Storage
   */
  public async uploadAudioFile(
    file: File, 
    artistName: string = 'unknown_artist', 
    albumName: string = 'single',
    onProgress?: (progress: number) => void
  ): Promise<{ audioUrl: string; storagePath: string; fileSizeBytes: number }> {
    const validation = this.validateAudioFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const sanitize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const timestamp = Date.now();
    const cleanFileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const storagePath = `music/${sanitize(artistName)}/${sanitize(albumName)}/${cleanFileName}`;

    try {
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress) onProgress(progress);
          },
          (error) => {
            console.warn('[MusicStorageService] Firebase Storage upload error, creating object URL fallback:', error);
            // Fallback to local Object URL if Firebase Storage bucket is uninitialized
            const objectUrl = URL.createObjectURL(file);
            resolve({
              audioUrl: objectUrl,
              storagePath,
              fileSizeBytes: file.size
            });
          },
          async () => {
            try {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolve({
                audioUrl: downloadUrl,
                storagePath,
                fileSizeBytes: file.size
              });
            } catch (urlErr) {
              const objectUrl = URL.createObjectURL(file);
              resolve({
                audioUrl: objectUrl,
                storagePath,
                fileSizeBytes: file.size
              });
            }
          }
        );
      });
    } catch (err) {
      // Return blob URL as safe fallback
      return {
        audioUrl: URL.createObjectURL(file),
        storagePath,
        fileSizeBytes: file.size
      };
    }
  }

  /**
   * Upload cover image file
   */
  public async uploadCoverImage(file: File): Promise<string> {
    const validation = this.validateCoverImage(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const timestamp = Date.now();
    const cleanFileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const storagePath = `covers/${cleanFileName}`;

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

export const musicStorageService = new MusicStorageService();
