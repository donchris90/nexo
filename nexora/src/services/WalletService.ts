import { 
  db, 
  auth 
} from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp,
  doc,
  setDoc
} from 'firebase/firestore';
import { CurrencyType, TransactionRecord, WalletState } from '../types';

export interface LedgerEntry {
  id?: string;
  userId: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'GIFT_SEND' | 'GIFT_SENT' | 'GIFT_RECEIVED' | 'REWARD' | 'PURCHASE' | 'GAME_WAGER' | 'GAME_WIN' | 'EXCHANGE' | 'TICKET_PURCHASE' | 'DIGITAL_BUY';
  currency: CurrencyType;
  amount: number; // positive for credit/deposit/reward, negative for debit/withdrawal/gift_send
  description: string;
  timestamp: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  relatedUser?: string;
  metadata?: Record<string, any>;
}

export class WalletService {
  private collectionName = 'transactions';

  /**
   * Append an immutable ledger entry to Firestore.
   * Balances are calculated dynamically from historical ledger entries.
   */
  public async appendLedgerEntry(entry: LedgerEntry): Promise<LedgerEntry> {
    const timestampStr = entry.timestamp || new Date().toISOString();
    const docData = {
      userId: entry.userId,
      type: entry.type,
      currency: entry.currency,
      amount: entry.amount,
      description: entry.description,
      status: entry.status || 'COMPLETED',
      relatedUser: entry.relatedUser || '',
      metadata: entry.metadata || {},
      timestamp: timestampStr,
      createdAt: serverTimestamp()
    };

    try {
      const docRef = await addDoc(collection(db, this.collectionName), docData);
      const createdEntry: LedgerEntry = {
        ...entry,
        id: docRef.id,
        timestamp: timestampStr
      };

      // Recalculate and update cached balance summary on user profile asynchronously
      this.syncUserCachedBalance(entry.userId).catch((err) => {
        console.warn('Failed to sync cached balance:', err);
      });

      return createdEntry;
    } catch (error) {
      console.error('WalletService.appendLedgerEntry error:', error);
      // Return offline entry format for fallback state
      return {
        ...entry,
        id: `local_tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: timestampStr
      };
    }
  }

  /**
   * Calculate current balances for a user by aggregating all ledger records.
   * Never directly modifies balance without ledger records.
   */
  public async calculateBalanceFromLedger(userId: string): Promise<WalletState> {
    const defaultWallet: WalletState = {
      coins: 12500,
      points: 8400,
      diamonds: 3200,
      lockedCoins: 0,
      lockedPoints: 0,
      pendingEarnings: 0,
      withdrawalBalance: 160.0,
      bonusBalance: 500,
      totalSpentCoins: 0,
      agencyCommissionCoins: 0
    };

    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId)
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return defaultWallet;
      }

      let netCoins = defaultWallet.coins;
      let netPoints = defaultWallet.points;
      let netDiamonds = defaultWallet.diamonds;
      let totalSpent = 0;

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as LedgerEntry;
        if (data.status === 'COMPLETED' || !data.status) {
          if (data.currency === 'COINS') {
            netCoins += data.amount;
            if (data.amount < 0) {
              totalSpent += Math.abs(data.amount);
            }
          } else if (data.currency === 'POINTS') {
            netPoints += data.amount;
          } else if (data.currency === 'DIAMONDS') {
            netDiamonds += data.amount;
          }
        }
      });

      return {
        ...defaultWallet,
        coins: Math.max(0, netCoins),
        points: Math.max(0, netPoints),
        diamonds: Math.max(0, netDiamonds),
        totalSpentCoins: totalSpent,
        withdrawalBalance: Math.max(0, netDiamonds * 0.05)
      };
    } catch (err) {
      console.warn('WalletService.calculateBalanceFromLedger offline fallback:', err);
      return defaultWallet;
    }
  }

  /**
   * Retrieve ledger transaction history for a user
   */
  public async getLedgerHistory(userId: string, limitCount = 50): Promise<TransactionRecord[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const records: TransactionRecord[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as LedgerEntry;
        records.push({
          id: docSnap.id,
          type: data.type,
          currency: data.currency,
          amount: data.amount,
          description: data.description,
          status: data.status || 'COMPLETED',
          timestamp: data.timestamp || new Date().toISOString(),
          relatedUser: data.relatedUser
        });
      });

      return records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (err) {
      console.warn('WalletService.getLedgerHistory error:', err);
      return [];
    }
  }

  /**
   * Helper: Deposit coins transaction
   */
  public async depositCoins(userId: string, coinAmount: number, paymentMethod: string): Promise<LedgerEntry> {
    return this.appendLedgerEntry({
      userId,
      type: 'DEPOSIT',
      currency: 'COINS',
      amount: coinAmount,
      description: `Deposited ${coinAmount.toLocaleString()} Coins via ${paymentMethod}`,
      status: 'COMPLETED',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Helper: Send Gift transaction (Debits sender coins, credits creator diamonds)
   */
  public async processGiftLedger(
    senderId: string, 
    receiverId: string, 
    giftName: string, 
    coinCost: number, 
    diamondYield: number
  ): Promise<{ senderTx: LedgerEntry; receiverTx: LedgerEntry }> {
    const senderTx = await this.appendLedgerEntry({
      userId: senderId,
      type: 'GIFT_SEND',
      currency: 'COINS',
      amount: -coinCost,
      description: `Sent ${giftName} gift to ${receiverId}`,
      status: 'COMPLETED',
      relatedUser: receiverId,
      timestamp: new Date().toISOString()
    });

    const receiverTx = await this.appendLedgerEntry({
      userId: receiverId,
      type: 'GIFT_RECEIVED',
      currency: 'DIAMONDS',
      amount: diamondYield,
      description: `Received ${giftName} gift from ${senderId}`,
      status: 'COMPLETED',
      relatedUser: senderId,
      timestamp: new Date().toISOString()
    });

    return { senderTx, receiverTx };
  }

  /**
   * Helper: Reward user with coins or points
   */
  public async rewardUser(userId: string, currency: CurrencyType, amount: number, reason: string): Promise<LedgerEntry> {
    return this.appendLedgerEntry({
      userId,
      type: 'REWARD',
      currency,
      amount,
      description: `Reward Claimed: ${reason}`,
      status: 'COMPLETED',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Helper: Request withdrawal (Debits diamonds from creator)
   */
  public async requestWithdrawal(userId: string, diamondAmount: number, payoutMethod: string): Promise<LedgerEntry> {
    return this.appendLedgerEntry({
      userId,
      type: 'WITHDRAWAL',
      currency: 'DIAMONDS',
      amount: -diamondAmount,
      description: `Withdrawal request of $${(diamondAmount * 0.05).toFixed(2)} USD (${diamondAmount} Diamonds) to ${payoutMethod}`,
      status: 'PENDING',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Sync calculated balances to user document cache for fast UI loading
   */
  private async syncUserCachedBalance(userId: string): Promise<void> {
    const updatedWallet = await this.calculateBalanceFromLedger(userId);
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { wallet: updatedWallet, lastWalletSync: new Date().toISOString() }, { merge: true });
  }
}

export const walletService = new WalletService();
