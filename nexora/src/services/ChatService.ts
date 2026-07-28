import { db } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  doc, 
  setDoc, 
  getDoc,
  getDocs, 
  updateDoc,
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';

export type MessageType = 'TEXT' | 'IMAGE' | 'VOICE_NOTE' | 'VIDEO' | 'DOCUMENT' | 'GIF' | 'GIFT_NOTIFICATION';

export interface ChatMessage {
  id?: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  type?: MessageType;
  mediaUrl?: string;
  fileName?: string;
  fileSize?: string;
  durationSeconds?: number;
  timestamp: string;
  readBy?: string[];
  replyToId?: string;
  replySnippet?: string;
  reactions?: Record<string, string[]>; // { '❤️': ['user1', 'user2'] }
  isEdited?: boolean;
  editedAt?: string;
  isDeleted?: boolean;
}

export interface ChatConversation {
  id: string;
  isGroup?: boolean;
  groupName?: string;
  groupAvatar?: string;
  participants: string[]; // userIds
  participantProfiles?: Record<string, { name: string; avatar: string }>;
  lastMessage: string;
  lastUpdated: string;
  lastSenderId: string;
  pinnedBy?: string[];
  archivedBy?: string[];
  mutedBy?: string[];
  unreadCounts?: Record<string, number>;
}

export interface UserPresence {
  userId: string;
  isOnline: boolean;
  lastSeen: string;
}

export class ChatService {
  private messagesCollection = 'messages';
  private chatsCollection = 'chats';
  private presenceCollection = 'user_presence';
  private blocksCollection = 'user_blocks';

  /**
   * Send a message to a stream room, direct chat, or group chat
   */
  public async sendMessage(params: {
    chatId: string;
    senderId: string;
    senderName: string;
    senderAvatar?: string;
    text: string;
    type?: MessageType;
    mediaUrl?: string;
    fileName?: string;
    fileSize?: string;
    durationSeconds?: number;
    replyToId?: string;
    replySnippet?: string;
  }): Promise<string> {
    const msgData: ChatMessage = {
      chatId: params.chatId,
      senderId: params.senderId,
      senderName: params.senderName,
      senderAvatar: params.senderAvatar || '',
      text: params.text,
      type: params.type || 'TEXT',
      mediaUrl: params.mediaUrl || '',
      fileName: params.fileName || '',
      fileSize: params.fileSize || '',
      durationSeconds: params.durationSeconds || 0,
      timestamp: new Date().toISOString(),
      readBy: [params.senderId],
      replyToId: params.replyToId || '',
      replySnippet: params.replySnippet || '',
      reactions: {}
    };

    const docRef = await addDoc(collection(db, this.messagesCollection), {
      ...msgData,
      createdAt: serverTimestamp()
    });

    // Update conversation snippet and timestamps
    const chatRef = doc(db, this.chatsCollection, params.chatId);
    await setDoc(chatRef, {
      lastMessage: params.type === 'VOICE_NOTE' ? '🎤 Voice Note' : params.type === 'IMAGE' ? '📷 Photo' : params.text,
      lastUpdated: new Date().toISOString(),
      lastSenderId: params.senderId
    }, { merge: true });

    return docRef.id;
  }

  /**
   * Subscribe to real-time chat messages
   */
  public subscribeToMessages(chatId: string, callback: (messages: ChatMessage[]) => void, messageLimit = 50) {
    const q = query(
      collection(db, this.messagesCollection),
      where('chatId', '==', chatId),
      limit(messageLimit)
    );

    return onSnapshot(q, (snapshot) => {
      const messages: ChatMessage[] = [];
      snapshot.forEach((docSnap) => {
        messages.push({ id: docSnap.id, ...docSnap.data() } as ChatMessage);
      });
      // Sort chronologically
      messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      callback(messages);
    });
  }

  /**
   * Mark message as read (Read Receipts)
   */
  public async markMessageAsRead(messageId: string, userId: string, currentReadBy: string[] = []): Promise<void> {
    if (currentReadBy.includes(userId)) return;
    const msgRef = doc(db, this.messagesCollection, messageId);
    await updateDoc(msgRef, {
      readBy: Array.from(new Set([...currentReadBy, userId]))
    });
  }

  /**
   * Add or toggle message reaction
   */
  public async toggleReaction(messageId: string, userId: string, emoji: string, currentReactions: Record<string, string[]> = {}): Promise<void> {
    const reactions = { ...currentReactions };
    const usersForEmoji = reactions[emoji] || [];

    if (usersForEmoji.includes(userId)) {
      reactions[emoji] = usersForEmoji.filter(u => u !== userId);
      if (reactions[emoji].length === 0) delete reactions[emoji];
    } else {
      reactions[emoji] = [...usersForEmoji, userId];
    }

    const msgRef = doc(db, this.messagesCollection, messageId);
    await updateDoc(msgRef, { reactions });
  }

  /**
   * Edit message
   */
  public async editMessage(messageId: string, newText: string): Promise<void> {
    const msgRef = doc(db, this.messagesCollection, messageId);
    await updateDoc(msgRef, {
      text: newText,
      isEdited: true,
      editedAt: new Date().toISOString()
    });
  }

  /**
   * Delete message
   */
  public async deleteMessage(messageId: string): Promise<void> {
    const msgRef = doc(db, this.messagesCollection, messageId);
    await updateDoc(msgRef, {
      text: 'This message was deleted.',
      isDeleted: true
    });
  }

  /**
   * Create Group Chat
   */
  public async createGroupChat(
    groupName: string,
    groupAvatar: string,
    participantIds: string[],
    creatorId: string
  ): Promise<string> {
    const allParticipants = Array.from(new Set([creatorId, ...participantIds]));
    const chatData: Omit<ChatConversation, 'id'> = {
      isGroup: true,
      groupName,
      groupAvatar,
      participants: allParticipants,
      lastMessage: `Group "${groupName}" created`,
      lastUpdated: new Date().toISOString(),
      lastSenderId: creatorId,
      pinnedBy: [],
      archivedBy: [],
      mutedBy: []
    };

    const docRef = await addDoc(collection(db, this.chatsCollection), {
      ...chatData,
      createdAt: serverTimestamp()
    });

    return docRef.id;
  }

  /**
   * Typing indicator
   */
  public async setTypingStatus(chatId: string, userId: string, isTyping: boolean): Promise<void> {
    const typingRef = doc(db, 'typing_indicators', `${chatId}_${userId}`);
    await setDoc(typingRef, {
      chatId,
      userId,
      isTyping,
      updatedAt: serverTimestamp()
    });
  }

  /**
   * User Presence & Online Status
   */
  public async setUserPresence(userId: string, isOnline: boolean): Promise<void> {
    const presenceRef = doc(db, this.presenceCollection, userId);
    await setDoc(presenceRef, {
      userId,
      isOnline,
      lastSeen: new Date().toISOString()
    }, { merge: true });
  }

  /**
   * Block & Unblock User
   */
  public async blockUser(userId: string, targetUserId: string): Promise<void> {
    const blockRef = doc(db, this.blocksCollection, `${userId}_${targetUserId}`);
    await setDoc(blockRef, {
      userId,
      targetUserId,
      createdAt: new Date().toISOString()
    });
  }

  public async unblockUser(userId: string, targetUserId: string): Promise<void> {
    const blockRef = doc(db, this.blocksCollection, `${userId}_${targetUserId}`);
    await deleteDoc(blockRef);
  }
}

export const chatService = new ChatService();
