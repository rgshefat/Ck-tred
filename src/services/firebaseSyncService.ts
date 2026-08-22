import { 
  db, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  deleteDoc,
  updateDoc,
  handleFirestoreError,
  OperationType
} from '../firebase';
import { 
  UserTradingWallet, 
  DepositTransaction, 
  TradingPosition, 
  TimedTrade, 
  ClosedTrade, 
  Invoice, 
  Client, 
  BusinessProfile 
} from '../types';

export class FirebaseSyncService {
  /**
   * Listen to user wallet document in Firestore
   */
  static subscribeToWallet(
    userId: string, 
    onUpdate: (wallet: UserTradingWallet) => void
  ): () => void {
    const userDocRef = doc(db, 'users', userId);
    return onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          onUpdate({
            usdBalance: Number(data.usdBalance ?? 0),
            bdtBalance: Number(data.bdtBalance ?? 0),
            totalDepositedUSD: Number(data.totalDepositedUSD ?? 0),
            totalWithdrawnUSD: Number(data.totalWithdrawnUSD ?? 0),
            totalRealizedPnL: Number(data.totalRealizedPnL ?? 0),
          });
        }
      },
      (error) => {
        console.warn('Wallet listener error:', error);
      }
    );
  }

  /**
   * Update user wallet in Firestore
   */
  static async updateWallet(userId: string, wallet: UserTradingWallet): Promise<void> {
    const userDocRef = doc(db, 'users', userId);
    try {
      await setDoc(userDocRef, {
        userId,
        usdBalance: wallet.usdBalance,
        bdtBalance: wallet.bdtBalance,
        totalDepositedUSD: wallet.totalDepositedUSD,
        totalWithdrawnUSD: wallet.totalWithdrawnUSD,
        totalRealizedPnL: wallet.totalRealizedPnL,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (error) {
      console.warn('Wallet update warning:', error);
    }
  }

  /**
   * Listen to user deposits in Firestore
   */
  static subscribeToDeposits(
    userId: string,
    onUpdate: (deposits: DepositTransaction[]) => void
  ): () => void {
    const depositsColl = collection(db, 'users', userId, 'deposits');
    return onSnapshot(
      depositsColl,
      (snapshot) => {
        const list: DepositTransaction[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as DepositTransaction);
        });
        // Sort newest first
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        onUpdate(list);
      },
      (error) => {
        console.warn('Deposits listener warning:', error);
      }
    );
  }

  /**
   * Save a new deposit transaction to Firestore
   */
  static async saveDeposit(userId: string, deposit: DepositTransaction): Promise<void> {
    const depDocRef = doc(db, 'users', userId, 'deposits', deposit.id);
    try {
      await setDoc(depDocRef, {
        ...deposit,
        userId,
      });
    } catch (error) {
      console.warn('Save deposit error:', error);
    }
  }

  /**
   * Listen to Timed Trades in Firestore
   */
  static subscribeToTimedTrades(
    userId: string,
    onUpdate: (trades: TimedTrade[]) => void
  ): () => void {
    const tradesColl = collection(db, 'users', userId, 'timedTrades');
    return onSnapshot(
      tradesColl,
      (snapshot) => {
        const list: TimedTrade[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as TimedTrade);
        });
        list.sort((a, b) => b.startedAt - a.startedAt);
        onUpdate(list);
      },
      (error) => {
        console.warn('Timed trades listener warning:', error);
      }
    );
  }

  /**
   * Save or update Timed Trade in Firestore
   */
  static async saveTimedTrade(userId: string, trade: TimedTrade): Promise<void> {
    const tradeDocRef = doc(db, 'users', userId, 'timedTrades', trade.id);
    try {
      await setDoc(tradeDocRef, {
        ...trade,
        userId,
      }, { merge: true });
    } catch (error) {
      console.warn('Save timed trade error:', error);
    }
  }

  /**
   * Listen to Trading Positions in Firestore
   */
  static subscribeToPositions(
    userId: string,
    onUpdate: (positions: TradingPosition[]) => void
  ): () => void {
    const posColl = collection(db, 'users', userId, 'positions');
    return onSnapshot(
      posColl,
      (snapshot) => {
        const list: TradingPosition[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as TradingPosition);
        });
        onUpdate(list);
      },
      (error) => {
        console.warn('Positions listener warning:', error);
      }
    );
  }

  /**
   * Save or update Trading Position in Firestore
   */
  static async savePosition(userId: string, position: TradingPosition): Promise<void> {
    const posDocRef = doc(db, 'users', userId, 'positions', position.id);
    try {
      await setDoc(posDocRef, {
        ...position,
        userId,
      }, { merge: true });
    } catch (error) {
      console.warn('Save position error:', error);
    }
  }

  /**
   * Delete Trading Position in Firestore
   */
  static async deletePosition(userId: string, positionId: string): Promise<void> {
    const posDocRef = doc(db, 'users', userId, 'positions', positionId);
    try {
      await deleteDoc(posDocRef);
    } catch (error) {
      console.warn('Delete position error:', error);
    }
  }

  /**
   * Listen to Invoices in Firestore
   */
  static subscribeToInvoices(
    userId: string,
    onUpdate: (invoices: Invoice[]) => void
  ): () => void {
    const invColl = collection(db, 'users', userId, 'invoices');
    return onSnapshot(
      invColl,
      (snapshot) => {
        const list: Invoice[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as Invoice);
        });
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        onUpdate(list);
      },
      (error) => {
        console.warn('Invoices listener warning:', error);
      }
    );
  }

  /**
   * Save or update Invoice in Firestore
   */
  static async saveInvoice(userId: string, invoice: Invoice): Promise<void> {
    const invDocRef = doc(db, 'users', userId, 'invoices', invoice.id);
    try {
      await setDoc(invDocRef, {
        ...invoice,
        userId,
      }, { merge: true });
    } catch (error) {
      console.warn('Save invoice error:', error);
    }
  }

  /**
   * Delete Invoice in Firestore
   */
  static async deleteInvoice(userId: string, invoiceId: string): Promise<void> {
    const invDocRef = doc(db, 'users', userId, 'invoices', invoiceId);
    try {
      await deleteDoc(invDocRef);
    } catch (error) {
      console.warn('Delete invoice error:', error);
    }
  }

  /**
   * Listen to Clients in Firestore
   */
  static subscribeToClients(
    userId: string,
    onUpdate: (clients: Client[]) => void
  ): () => void {
    const clientsColl = collection(db, 'users', userId, 'clients');
    return onSnapshot(
      clientsColl,
      (snapshot) => {
        const list: Client[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as Client);
        });
        onUpdate(list);
      },
      (error) => {
        console.warn('Clients listener warning:', error);
      }
    );
  }

  /**
   * Save or update Client in Firestore
   */
  static async saveClient(userId: string, client: Client): Promise<void> {
    const clientDocRef = doc(db, 'users', userId, 'clients', client.id);
    try {
      await setDoc(clientDocRef, {
        ...client,
        userId,
      }, { merge: true });
    } catch (error) {
      console.warn('Save client error:', error);
    }
  }

  /**
   * Delete Client in Firestore
   */
  static async deleteClient(userId: string, clientId: string): Promise<void> {
    const clientDocRef = doc(db, 'users', userId, 'clients', clientId);
    try {
      await deleteDoc(clientDocRef);
    } catch (error) {
      console.warn('Delete client error:', error);
    }
  }
}
