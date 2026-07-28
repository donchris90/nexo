import React, { useState } from 'react';
import { 
  Music, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Shuffle, 
  Repeat, 
  Plus, 
  Upload, 
  Heart, 
  ListMusic, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  ShieldAlert, 
  Clock, 
  Disc, 
  Sparkles, 
  BarChart3, 
  FolderPlus,
  Radio,
  FileAudio
} from 'lucide-react';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { MusicTrack } from '../types';
import { musicStorageService } from '../services/MusicStorageService';
import { musicService } from '../services/MusicService';
import { useAuth } from '../hooks/useAuth';

export const MusicAndPodcastsView: React.FC = () => {
  const { user } = useAuth();
  const {
    tracks,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    micVolume,
    queue,
    favorites,
    playlists,
    repeatMode,
    isShuffle,
    isHostLiveSync,
    playTrack,
    pauseTrack,
    resumeTrack,
    nextTrack,
    prevTrack,
    seekTo,
    setMusicVolume,
    setMicrophoneVolume,
    toggleShuffle,
    toggleRepeat,
    addToQueue,
    toggleFavorite,
    refreshTracks
  } = useMusicPlayer();

  // Navigation Sub-Tabs
  const [activeTab, setActiveTab] = useState<'EXPLORE' | 'MY_PLAYLISTS' | 'FAVORITES' | 'RECENT' | 'ADMIN_MODERATION'>('EXPLORE');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [uploadTitle, setUploadTitle] = useState<string>('');
  const [uploadArtist, setUploadArtist] = useState<string>('');
  const [uploadAlbum, setUploadAlbum] = useState<string>('');
  const [uploadGenre, setUploadGenre] = useState<string>('EDM / Live');
  const [uploadIsPublic, setUploadIsPublic] = useState<boolean>(true);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);

  // New Playlist State
  const [isNewPlaylistModalOpen, setIsNewPlaylistModalOpen] = useState<boolean>(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState<string>('');

  // Report Modal State
  const [reportTrackId, setReportTrackId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<string>('');

  // Format time (mm:ss)
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Filtered tracks
  const genres = ['All', 'Synthwave', 'EDM / Live', 'Chillhop', 'Ambient', 'Pop', 'Hip Hop'];
  const filteredTracks = tracks.filter(t => {
    if (selectedGenre !== 'All' && t.genre?.toLowerCase() !== selectedGenre.toLowerCase()) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q) || t.album?.toLowerCase().includes(q);
    }
    return true;
  });

  // Handle Audio File Selection
  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validation = musicStorageService.validateAudioFile(file);
      if (!validation.valid) {
        setUploadError(validation.error || 'Invalid audio file.');
        setAudioFile(null);
      } else {
        setUploadError(null);
        setAudioFile(file);
      }
    }
  };

  // Upload Submit Handler
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile) {
      setUploadError('Please select a valid audio file (MP3/WAV max 25MB).');
      return;
    }
    if (!uploadTitle.trim() || !uploadArtist.trim()) {
      setUploadError('Track Title and Artist name are required.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(10);

    try {
      // 1. Upload Audio File
      const audioResult = await musicStorageService.uploadAudioFile(
        audioFile, 
        uploadArtist, 
        uploadAlbum || 'single',
        (progress) => setUploadProgress(Math.floor(progress * 0.7))
      );

      // 2. Upload Cover Image if selected
      let coverUrl = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80';
      if (coverFile) {
        coverUrl = await musicStorageService.uploadCoverImage(coverFile);
      }
      setUploadProgress(85);

      // 3. Create Track Metadata in Firestore
      await musicService.createTrack({
        title: uploadTitle.trim(),
        artist: uploadArtist.trim(),
        album: uploadAlbum.trim() || 'Single',
        genre: uploadGenre,
        duration: 180, // Default duration placeholder until loaded
        coverImage: coverUrl,
        audioUrl: audioResult.audioUrl,
        uploadedBy: user?.uid || 'guest_creator',
        uploadedByName: user?.displayName || uploadArtist.trim(),
        isPublic: uploadIsPublic,
        status: 'APPROVED',
        fileSizeBytes: audioResult.fileSizeBytes
      });

      setUploadProgress(100);
      setUploadSuccess(true);
      await refreshTracks();

      setTimeout(() => {
        setIsUploadModalOpen(false);
        setUploadSuccess(false);
        setIsUploading(false);
        setAudioFile(null);
        setCoverFile(null);
        setUploadTitle('');
        setUploadArtist('');
      }, 1200);

    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload music track.');
      setIsUploading(false);
    }
  };

  // Create Playlist Handler
  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistTitle.trim() || !user) return;
    await musicService.createPlaylist(newPlaylistTitle.trim(), user.uid, user.displayName || 'Creator');
    setNewPlaylistTitle('');
    setIsNewPlaylistModalOpen(false);
  };

  // Report Track Handler
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTrackId || !reportReason.trim() || !user) return;
    await musicService.reportTrack(reportTrackId, user.uid, reportReason.trim());
    setReportTrackId(null);
    setReportReason('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 pb-28">
      {/* HEADER BAR */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 bg-purple-500/20 text-purple-300 font-black text-xs rounded-full border border-purple-500/30 uppercase tracking-widest flex items-center gap-1.5 inline-flex">
            <Radio className="w-4 h-4 text-purple-400 animate-pulse" /> Internal Music & Broadcasting Studio
          </span>
          <h2 className="text-2xl font-black text-slate-100 mt-2">
            Internal Live Music & Audio Mixing System
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Store, mix, and broadcast high-fidelity tracks directly into your live streams. Real-time audience audio sync!
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs rounded-2xl shadow-lg shadow-purple-500/20 flex items-center gap-2 transition-all"
          >
            <Upload className="w-4 h-4" /> Upload Track
          </button>
        </div>
      </div>

      {/* PERSISTENT FULL-FEATURED MUSIC PLAYER BAR */}
      <div className="bg-slate-900/90 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Track Info */}
          <div className="flex items-center gap-4 w-full md:w-1/3">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0 flex items-center justify-center group">
              {currentTrack?.coverImage ? (
                <img src={currentTrack.coverImage} alt={currentTrack.title} className="w-full h-full object-cover" />
              ) : (
                <Disc className="w-8 h-8 text-purple-400 animate-spin" />
              )}
              {isPlaying && (
                <div className="absolute inset-0 bg-purple-900/40 backdrop-blur-xs flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-extrabold text-slate-100 truncate">
                {currentTrack?.title || 'No Track Playing'}
              </h4>
              <p className="text-xs text-slate-400 truncate">
                {currentTrack?.artist || 'Select a song from library'}
              </p>
              {isHostLiveSync && (
                <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 mt-1">
                  <Radio className="w-3 h-3 animate-pulse" /> Live Broadcast Synced
                </span>
              )}
            </div>
          </div>

          {/* Player Center Controls */}
          <div className="flex flex-col items-center gap-2 w-full md:w-1/3">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleShuffle}
                className={`p-2 rounded-xl transition-all ${isShuffle ? 'text-purple-400 bg-purple-500/20' : 'text-slate-400 hover:text-slate-200'}`}
                title="Shuffle"
              >
                <Shuffle className="w-4 h-4" />
              </button>

              <button
                onClick={prevTrack}
                className="p-2 text-slate-300 hover:text-white transition-all"
                title="Previous"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={() => {
                  if (isPlaying) pauseTrack();
                  else if (currentTrack) resumeTrack();
                  else if (tracks.length > 0) playTrack(tracks[0]);
                }}
                className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/30 hover:scale-105 transition-all"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
              </button>

              <button
                onClick={nextTrack}
                className="p-2 text-slate-300 hover:text-white transition-all"
                title="Next"
              >
                <SkipForward className="w-5 h-5" />
              </button>

              <button
                onClick={toggleRepeat}
                className={`p-2 rounded-xl transition-all ${repeatMode !== 'none' ? 'text-purple-400 bg-purple-500/20' : 'text-slate-400 hover:text-slate-200'}`}
                title={`Repeat (${repeatMode})`}
              >
                <Repeat className="w-4 h-4" />
              </button>
            </div>

            {/* Time Seek Slider */}
            <div className="w-full flex items-center gap-2 text-[11px] font-mono text-slate-400">
              <span>{formatTime(currentTime)}</span>
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(e) => seekTo(Number(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Volume Control */}
          <div className="flex items-center justify-end gap-3 w-full md:w-1/3">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setMusicVolume(volume === 0 ? 0.8 : 0)}
                className="text-slate-400 hover:text-slate-200"
              >
                {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-purple-400" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(e) => setMusicVolume(Number(e.target.value))}
                className="w-20 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SUB-NAVIGATION TABS */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('EXPLORE')}
            className={`px-4 py-2 rounded-2xl font-black text-xs transition-all flex items-center gap-1.5 ${
              activeTab === 'EXPLORE' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Music className="w-4 h-4" /> Explore Library
          </button>
          <button
            onClick={() => setActiveTab('MY_PLAYLISTS')}
            className={`px-4 py-2 rounded-2xl font-black text-xs transition-all flex items-center gap-1.5 ${
              activeTab === 'MY_PLAYLISTS' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            <ListMusic className="w-4 h-4" /> My Playlists
          </button>
          <button
            onClick={() => setActiveTab('FAVORITES')}
            className={`px-4 py-2 rounded-2xl font-black text-xs transition-all flex items-center gap-1.5 ${
              activeTab === 'FAVORITES' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Heart className="w-4 h-4" /> Liked Tracks
          </button>
          <button
            onClick={() => setActiveTab('ADMIN_MODERATION')}
            className={`px-4 py-2 rounded-2xl font-black text-xs transition-all flex items-center gap-1.5 ${
              activeTab === 'ADMIN_MODERATION' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-400" /> Admin & Moderation
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title or artist..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-9 pr-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* EXPLORE MUSIC TAB */}
      {activeTab === 'EXPLORE' && (
        <div className="space-y-6">
          {/* Genre Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {genres.map(genre => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedGenre === genre
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>

          {/* Track Grid / Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-2">
            {filteredTracks.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <FileAudio className="w-10 h-10 mx-auto text-slate-600 animate-bounce" />
                <p className="text-sm font-bold">No tracks match your query.</p>
              </div>
            ) : (
              filteredTracks.map((track, idx) => {
                const isSelected = currentTrack?.id === track.id;
                const isFav = favorites.includes(track.id);

                return (
                  <div
                    key={track.id}
                    className={`flex items-center justify-between p-3 rounded-2xl transition-all border ${
                      isSelected
                        ? 'bg-purple-900/30 border-purple-500/50 shadow-md'
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-mono font-bold text-slate-500 w-6 text-center">
                        {idx + 1}
                      </span>
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-900 shrink-0">
                        <img src={track.coverImage} alt={track.title} className="w-full h-full object-cover" />
                        <button
                          onClick={() => {
                            if (isSelected && isPlaying) pauseTrack();
                            else playTrack(track, filteredTracks);
                          }}
                          className="absolute inset-0 bg-slate-950/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-all text-white"
                        >
                          {isSelected && isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                        </button>
                      </div>

                      <div className="min-w-0">
                        <h5 className="text-sm font-bold text-slate-100 truncate flex items-center gap-2">
                          {track.title}
                          {track.status === 'APPROVED' && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline" />
                          )}
                        </h5>
                        <p className="text-xs text-slate-400 truncate">
                          {track.artist} {track.album ? `• ${track.album}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="hidden sm:inline-block px-2.5 py-1 bg-slate-800/80 text-[10px] font-bold text-slate-300 rounded-lg">
                        {track.genre || 'Music'}
                      </span>

                      <button
                        onClick={() => toggleFavorite(track.id)}
                        className={`p-2 rounded-xl transition-all ${
                          isFav ? 'text-pink-500 bg-pink-500/10' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Heart className="w-4 h-4 fill-current" />
                      </button>

                      <button
                        onClick={() => addToQueue(track)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1"
                        title="Add to Queue"
                      >
                        <Plus className="w-3.5 h-3.5" /> Queue
                      </button>

                      <button
                        onClick={() => setReportTrackId(track.id)}
                        className="p-2 text-slate-500 hover:text-amber-400 transition-all"
                        title="Report Copyright or Abuse"
                      >
                        <AlertTriangle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MY PLAYLISTS TAB */}
      {activeTab === 'MY_PLAYLISTS' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-100 flex items-center gap-2">
              <ListMusic className="w-5 h-5 text-purple-400" /> Custom Playlists
            </h3>
            <button
              onClick={() => setIsNewPlaylistModalOpen(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
            >
              <FolderPlus className="w-4 h-4" /> Create Playlist
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {playlists.map(pl => (
              <div key={pl.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
                <div className="w-full aspect-square rounded-2xl bg-slate-950 flex items-center justify-center overflow-hidden">
                  <Disc className="w-12 h-12 text-purple-400 animate-spin" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-100">{pl.title}</h4>
                  <p className="text-xs text-slate-400">{pl.trackIds.length} Tracks • Created by {pl.createdByName || 'You'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LIKED TRACKS TAB */}
      {activeTab === 'FAVORITES' && (
        <div className="space-y-4">
          <h3 className="text-lg font-black text-slate-100 flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" /> Liked Tracks
          </h3>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4">
            {tracks.filter(t => favorites.includes(t.id)).map(track => (
              <div key={track.id} className="flex items-center justify-between p-3 bg-slate-950 rounded-2xl my-2 border border-slate-800">
                <div className="flex items-center gap-3">
                  <img src={track.coverImage} className="w-10 h-10 rounded-lg object-cover" />
                  <div>
                    <h5 className="text-sm font-bold text-slate-100">{track.title}</h5>
                    <p className="text-xs text-slate-400">{track.artist}</p>
                  </div>
                </div>
                <button
                  onClick={() => playTrack(track)}
                  className="px-4 py-2 bg-purple-600 text-white font-bold text-xs rounded-xl flex items-center gap-1"
                >
                  <Play className="w-4 h-4" /> Play
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADMIN & MODERATION TAB */}
      {activeTab === 'ADMIN_MODERATION' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-100 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" /> Music Moderation & Storage Analytics
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Approve uploaded content, enforce copyright rules, monitor track play counts & Firebase Storage metrics.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400">Total Approved Songs</span>
              <p className="text-2xl font-black text-purple-400">{tracks.length}</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400">Total Stream Play Count</span>
              <p className="text-2xl font-black text-emerald-400">
                {tracks.reduce((acc, t) => acc + (t.playCount || 0), 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400">Estimated Firebase Storage</span>
              <p className="text-2xl font-black text-amber-400">~14.2 MB</p>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD MUSIC MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-100 flex items-center gap-2">
                <Upload className="w-5 h-5 text-purple-400" /> Upload Music Track
              </h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-slate-100 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {uploadError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-400 font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {uploadError}
              </div>
            )}

            {uploadSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-400 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> Track successfully uploaded & stored!
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Track Title *</label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Neon Horizon Remix"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Artist Name *</label>
                <input
                  type="text"
                  required
                  value={uploadArtist}
                  onChange={(e) => setUploadArtist(e.target.value)}
                  placeholder="e.g. DJ Pulse"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Album</label>
                  <input
                    type="text"
                    value={uploadAlbum}
                    onChange={(e) => setUploadAlbum(e.target.value)}
                    placeholder="Single"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Genre</label>
                  <select
                    value={uploadGenre}
                    onChange={(e) => setUploadGenre(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                  >
                    <option value="EDM / Live">EDM / Live</option>
                    <option value="Synthwave">Synthwave</option>
                    <option value="Chillhop">Chillhop</option>
                    <option value="Ambient">Ambient</option>
                    <option value="Pop">Pop</option>
                    <option value="Hip Hop">Hip Hop</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Select Audio File (MP3 / WAV max 25MB) *</label>
                <input
                  type="file"
                  accept="audio/mp3,audio/wav,audio/m4a,audio/aac"
                  onChange={handleAudioFileChange}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-600 file:text-white hover:file:bg-purple-500 cursor-pointer"
                />
              </div>

              {isUploading && (
                <div className="space-y-1">
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Uploading to Firebase Storage: {uploadProgress}%</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isUploading}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs rounded-2xl shadow-lg shadow-purple-500/20"
              >
                {isUploading ? 'Uploading & Processing...' : 'Confirm Upload Track'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
