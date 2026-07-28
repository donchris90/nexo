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
  limit, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';

export interface SocialPost {
  id?: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorVerified?: boolean;
  content: string;
  mediaType?: 'IMAGE' | 'VIDEO' | 'STORY';
  mediaUrl?: string;
  hashtags: string[];
  mentions: string[];
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewCount: number;
  likedBy: string[];
  bookmarkedBy: string[];
  isTrending?: boolean;
  createdAt: string;
}

export interface PostComment {
  id?: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  replyToCommentId?: string;
  likeCount: number;
  createdAt: string;
}

export interface SocialStory {
  id?: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  mediaUrl: string;
  type: 'IMAGE' | 'VIDEO';
  createdAt: string;
  expiresAt: string;
}

class SocialFeedService {
  private postsCollection = 'social_posts';
  private commentsCollection = 'social_comments';
  private storiesCollection = 'social_stories';
  private followsCollection = 'user_follows';

  /**
   * Create a new post with hashtags & mentions parsing
   */
  public async createPost(params: {
    authorId: string;
    authorName: string;
    authorAvatar: string;
    content: string;
    mediaType?: 'IMAGE' | 'VIDEO' | 'STORY';
    mediaUrl?: string;
  }): Promise<string> {
    const hashtags = (params.content.match(/#[a-zA-Z0-9_]+/g) || []).map(h => h.toLowerCase());
    const mentions = (params.content.match(/@[a-zA-Z0-9_]+/g) || []).map(m => m.toLowerCase());

    const newPost: SocialPost = {
      authorId: params.authorId,
      authorName: params.authorName,
      authorAvatar: params.authorAvatar,
      authorVerified: true,
      content: params.content,
      mediaType: params.mediaType || 'IMAGE',
      mediaUrl: params.mediaUrl || '',
      hashtags,
      mentions,
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      viewCount: 1,
      likedBy: [],
      bookmarkedBy: [],
      isTrending: hashtags.includes('#trending') || hashtags.includes('#viral'),
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, this.postsCollection), {
      ...newPost,
      timestamp: serverTimestamp()
    });

    return docRef.id;
  }

  /**
   * Subscribe to real-time feed posts
   */
  public subscribeToFeed(callback: (posts: SocialPost[]) => void, postLimit = 30) {
    const q = query(
      collection(db, this.postsCollection),
      limit(postLimit)
    );

    return onSnapshot(q, (snapshot) => {
      const posts: SocialPost[] = [];
      snapshot.forEach((docSnap) => {
        posts.push({ id: docSnap.id, ...docSnap.data() } as SocialPost);
      });
      posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(posts);
    }, (err) => console.warn('Feed subscription warning:', err));
  }

  /**
   * Toggle Like Post
   */
  public async toggleLikePost(postId: string, userId: string, currentLikedBy: string[] = []): Promise<void> {
    const isLiked = currentLikedBy.includes(userId);
    const updated = isLiked 
      ? currentLikedBy.filter(id => id !== userId)
      : [...currentLikedBy, userId];

    const docRef = doc(db, this.postsCollection, postId);
    await updateDoc(docRef, {
      likedBy: updated,
      likeCount: updated.length
    });
  }

  /**
   * Toggle Bookmark Post
   */
  public async toggleBookmarkPost(postId: string, userId: string, currentBookmarkedBy: string[] = []): Promise<void> {
    const isBookmarked = currentBookmarkedBy.includes(userId);
    const updated = isBookmarked 
      ? currentBookmarkedBy.filter(id => id !== userId)
      : [...currentBookmarkedBy, userId];

    const docRef = doc(db, this.postsCollection, postId);
    await updateDoc(docRef, { bookmarkedBy: updated });
  }

  /**
   * Add Comment to Post
   */
  public async addComment(postId: string, authorId: string, authorName: string, authorAvatar: string, text: string, replyToCommentId?: string): Promise<string> {
    const commentData: PostComment = {
      postId,
      authorId,
      authorName,
      authorAvatar,
      text,
      replyToCommentId: replyToCommentId || '',
      likeCount: 0,
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, this.commentsCollection), {
      ...commentData,
      timestamp: serverTimestamp()
    });

    // Increment post comment count
    const postRef = doc(db, this.postsCollection, postId);
    const postSnap = await getDoc(postRef);
    if (postSnap.exists()) {
      const currentCount = postSnap.data().commentCount || 0;
      await updateDoc(postRef, { commentCount: currentCount + 1 });
    }

    return docRef.id;
  }

  /**
   * Create Story
   */
  public async createStory(authorId: string, authorName: string, authorAvatar: string, mediaUrl: string, type: 'IMAGE' | 'VIDEO' = 'IMAGE'): Promise<string> {
    const expires = new Date();
    expires.setHours(expires.getHours() + 24);

    const story: SocialStory = {
      authorId,
      authorName,
      authorAvatar,
      mediaUrl,
      type,
      createdAt: new Date().toISOString(),
      expiresAt: expires.toISOString()
    };

    const docRef = await addDoc(collection(db, this.storiesCollection), {
      ...story,
      timestamp: serverTimestamp()
    });
    return docRef.id;
  }

  /**
   * Follow User
   */
  public async followUser(followerId: string, targetUserId: string): Promise<void> {
    const followRef = doc(db, this.followsCollection, `${followerId}_${targetUserId}`);
    await setDoc(followRef, {
      followerId,
      targetUserId,
      createdAt: new Date().toISOString()
    });
  }

  public async unfollowUser(followerId: string, targetUserId: string): Promise<void> {
    const followRef = doc(db, this.followsCollection, `${followerId}_${targetUserId}`);
    await updateDoc(followRef, { unfollowedAt: new Date().toISOString() });
  }
}

export const socialFeedService = new SocialFeedService();
