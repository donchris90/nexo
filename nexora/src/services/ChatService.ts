import { db } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';

export interface ChatMessage {
  id?: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  type?: 'TEXT' | 'IMAGE' | 'VOICE_NOTE' | 'VIDEO' | 'GIFT_NOTIFICATION';
  mediaUrl?: string;
  durationSeconds?: number;
  timestamp: string;
  readBy?: string[];
}

export class ChatService {
  private messagesCollection = 'messages';
  private chatsCollection = 'chats';

  /**
   * Send a message to a stream room or direct chat
   */
  public async sendMessage(params: {
    chatId: string;
    senderId: string;
    senderName: string;
    senderAvatar?: string;
    text: string;
    type?: 'TEXT' | 'IMAGE' | 'VOICE_NOTE' | 'VIDEO' | 'GIFT_NOTIFICATION';
    mediaUrl?: string;
    durationSeconds?: number;
  }): Promise<string> {
    const msgData: ChatMessage = {
      chatId: params.chatId,
      senderId: params.senderId,
      senderName: params.senderName,
      senderAvatar: params.senderAvatar || '',
      text: params.text,
      type: params.type || 'TEXT',
      mediaUrl: params.mediaUrl || '',
      durationSeconds: params.durationSeconds || 0,
      timestamp: new Date().toISOString(),
      readBy: [params.senderId]
    };

    const docRef = await addDoc(collection(db, this.messagesCollection), {
      ...msgData,
      createdAt: serverTimestamp()
    });

    // Update conversation last message snippet
    const chatRef = doc(db, this.chatsCollection, params.chatId);
    await setDoc(chatRef, {
      lastMessage: params.text,
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
   * Send typing indicator state
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
}

export const chatService = new ChatService();
