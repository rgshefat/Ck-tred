import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(
  uid: string, 
  email: string, 
  displayName?: string, 
  photoUrl?: string
) {
  try {
    const result = await db.insert(users)
      .values({
        uid,
        email,
        displayName: displayName || email.split('@')[0] || 'User',
        photoUrl: photoUrl || '',
        usdBalance: 0.00,
        bdtBalance: 0.00,
        totalDepositedUsd: 0.00,
        totalWithdrawnUsd: 0.00,
        totalRealizedPnl: 0.00,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          displayName: displayName || email.split('@')[0] || 'User',
          photoUrl: photoUrl || '',
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('getOrCreateUser error:', error);
    throw new Error('Failed to retrieve or create user in database.', { cause: error });
  }
}

export async function getUserProfile(uid: string) {
  try {
    const result = await db.select().from(users).where(eq(users.uid, uid));
    return result[0] || null;
  } catch (error) {
    console.error('getUserProfile error:', error);
    throw new Error('Failed to fetch user profile.', { cause: error });
  }
}

export async function updateUserBalance(
  uid: string, 
  updates: {
    usdBalance?: number;
    bdtBalance?: number;
    totalDepositedUsd?: number;
    totalWithdrawnUsd?: number;
    totalRealizedPnl?: number;
  }
) {
  try {
    const result = await db.update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.uid, uid))
      .returning();
    return result[0];
  } catch (error) {
    console.error('updateUserBalance error:', error);
    throw new Error('Failed to update user balance.', { cause: error });
  }
}
