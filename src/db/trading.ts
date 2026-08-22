import { db } from './index.ts';
import { 
  deposits, 
  withdrawals, 
  tradingPositions, 
  closedTrades, 
  timedTrades,
  invoices
} from './schema.ts';
import { eq, desc } from 'drizzle-orm';

export async function getUserDeposits(userId: string) {
  try {
    return await db.select().from(deposits).where(eq(deposits.userId, userId)).orderBy(desc(deposits.createdAt));
  } catch (error) {
    console.error('getUserDeposits error:', error);
    throw new Error('Failed to fetch deposits.', { cause: error });
  }
}

export async function createDeposit(data: typeof deposits.$inferInsert) {
  try {
    const result = await db.insert(deposits).values(data).returning();
    return result[0];
  } catch (error) {
    console.error('createDeposit error:', error);
    throw new Error('Failed to record deposit.', { cause: error });
  }
}

export async function getUserWithdrawals(userId: string) {
  try {
    return await db.select().from(withdrawals).where(eq(withdrawals.userId, userId)).orderBy(desc(withdrawals.createdAt));
  } catch (error) {
    console.error('getUserWithdrawals error:', error);
    throw new Error('Failed to fetch withdrawals.', { cause: error });
  }
}

export async function createWithdrawal(data: typeof withdrawals.$inferInsert) {
  try {
    const result = await db.insert(withdrawals).values(data).returning();
    return result[0];
  } catch (error) {
    console.error('createWithdrawal error:', error);
    throw new Error('Failed to record withdrawal.', { cause: error });
  }
}

export async function getUserPositions(userId: string) {
  try {
    return await db.select().from(tradingPositions).where(eq(tradingPositions.userId, userId));
  } catch (error) {
    console.error('getUserPositions error:', error);
    throw new Error('Failed to fetch positions.', { cause: error });
  }
}

export async function getUserClosedTrades(userId: string) {
  try {
    return await db.select().from(closedTrades).where(eq(closedTrades.userId, userId)).orderBy(desc(closedTrades.closedAt));
  } catch (error) {
    console.error('getUserClosedTrades error:', error);
    throw new Error('Failed to fetch closed trades.', { cause: error });
  }
}

export async function getUserTimedTrades(userId: string) {
  try {
    return await db.select().from(timedTrades).where(eq(timedTrades.userId, userId)).orderBy(desc(timedTrades.startedAt));
  } catch (error) {
    console.error('getUserTimedTrades error:', error);
    throw new Error('Failed to fetch timed trades.', { cause: error });
  }
}

export async function getUserInvoices(userId: string) {
  try {
    return await db.select().from(invoices).where(eq(invoices.userId, userId)).orderBy(desc(invoices.createdAt));
  } catch (error) {
    console.error('getUserInvoices error:', error);
    throw new Error('Failed to fetch invoices.', { cause: error });
  }
}
