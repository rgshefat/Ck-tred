import { BusinessProfile, Client, Invoice, PaymentReminderRule, BankingPlatform, BankFeedTransaction, ReminderQueueItem, UserTradingWallet, DepositTransaction, TradingPosition, ClosedTrade, Stock, TimedTrade } from '../types';
import { INITIAL_BUSINESS_PROFILE, INITIAL_CLIENTS, INITIAL_INVOICES, INITIAL_REMINDER_RULES, INITIAL_BANKING_PLATFORMS, INITIAL_BANK_FEED_TRANSACTIONS } from '../data/initialData';
import { INITIAL_WALLET, INITIAL_DEPOSIT_TRANSACTIONS, INITIAL_OPEN_POSITIONS, INITIAL_CLOSED_TRADES, POPULAR_STOCKS } from '../data/stocksData';

const KEYS = {
  BUSINESS_PROFILE: 'gl_business_profile_v2',
  CLIENTS: 'gl_clients_v2',
  INVOICES: 'gl_invoices_v2',
  RULES: 'gl_reminder_rules_v2',
  BANKING: 'gl_banking_platforms_v2',
  BANK_FEED: 'gl_bank_feed_v2',
  BASE_CURRENCY: 'gl_base_currency_v2',
  REMINDER_QUEUE: 'gl_reminder_queue_v2',
  WALLET: 'gl_trading_wallet_v2',
  POSITIONS: 'gl_trading_positions_v2',
  TIMED_TRADES: 'gl_timed_trades_v2',
  CLOSED_TRADES: 'gl_closed_trades_v2',
  DEPOSITS: 'gl_deposit_transactions_v2',
  STOCKS: 'gl_stocks_cache_v2',
};

export class StorageService {
  public static getWallet(): UserTradingWallet {
    try {
      // Clear any legacy v1 mock wallet
      localStorage.removeItem('gl_trading_wallet_v1');
      
      const data = localStorage.getItem(KEYS.WALLET);
      const depositsData = localStorage.getItem(KEYS.DEPOSITS);
      const deposits = depositsData ? JSON.parse(depositsData) : [];

      if (data) {
        const parsed = JSON.parse(data);
        // If user has zero deposits and zero trades, enforce strict 0 balance
        if (deposits.length === 0 && (!parsed.totalDepositedUSD || parsed.totalDepositedUSD === 0)) {
          return {
            usdBalance: 0.00,
            bdtBalance: 0.00,
            totalDepositedUSD: 0.00,
            totalWithdrawnUSD: 0.00,
            totalRealizedPnL: 0.00,
          };
        }
        return {
          usdBalance: Number(parsed.usdBalance ?? 0),
          bdtBalance: Number(parsed.bdtBalance ?? 0),
          totalDepositedUSD: Number(parsed.totalDepositedUSD ?? 0),
          totalWithdrawnUSD: Number(parsed.totalWithdrawnUSD ?? 0),
          totalRealizedPnL: Number(parsed.totalRealizedPnL ?? 0),
        };
      }
      return {
        usdBalance: 0.00,
        bdtBalance: 0.00,
        totalDepositedUSD: 0.00,
        totalWithdrawnUSD: 0.00,
        totalRealizedPnL: 0.00,
      };
    } catch {
      return {
        usdBalance: 0.00,
        bdtBalance: 0.00,
        totalDepositedUSD: 0.00,
        totalWithdrawnUSD: 0.00,
        totalRealizedPnL: 0.00,
      };
    }
  }

  public static saveWallet(wallet: UserTradingWallet) {
    try {
      localStorage.setItem(KEYS.WALLET, JSON.stringify(wallet));
    } catch (e) {
      console.error('Failed to save wallet', e);
    }
  }

  public static getPositions(): TradingPosition[] {
    try {
      localStorage.removeItem('gl_trading_positions_v1');
      const data = localStorage.getItem(KEYS.POSITIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static savePositions(positions: TradingPosition[]) {
    try {
      localStorage.setItem(KEYS.POSITIONS, JSON.stringify(positions));
    } catch (e) {
      console.error('Failed to save positions', e);
    }
  }

  public static getTimedTrades(): TimedTrade[] {
    try {
      localStorage.removeItem('gl_timed_trades_v1');
      const data = localStorage.getItem(KEYS.TIMED_TRADES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static saveTimedTrades(trades: TimedTrade[]) {
    try {
      localStorage.setItem(KEYS.TIMED_TRADES, JSON.stringify(trades));
    } catch (e) {
      console.error('Failed to save timed trades', e);
    }
  }

  public static getClosedTrades(): ClosedTrade[] {
    try {
      localStorage.removeItem('gl_closed_trades_v1');
      const data = localStorage.getItem(KEYS.CLOSED_TRADES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static saveClosedTrades(trades: ClosedTrade[]) {
    try {
      localStorage.setItem(KEYS.CLOSED_TRADES, JSON.stringify(trades));
    } catch (e) {
      console.error('Failed to save closed trades', e);
    }
  }

  public static getDeposits(): DepositTransaction[] {
    try {
      localStorage.removeItem('gl_deposit_transactions_v1');
      const data = localStorage.getItem(KEYS.DEPOSITS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static saveDeposits(deposits: DepositTransaction[]) {
    try {
      localStorage.setItem(KEYS.DEPOSITS, JSON.stringify(deposits));
    } catch (e) {
      console.error('Failed to save deposits', e);
    }
  }

  public static getStocks(): Stock[] {
    try {
      const data = localStorage.getItem(KEYS.STOCKS);
      return data ? JSON.parse(data) : POPULAR_STOCKS;
    } catch {
      return POPULAR_STOCKS;
    }
  }

  public static saveStocks(stocks: Stock[]) {
    try {
      localStorage.setItem(KEYS.STOCKS, JSON.stringify(stocks));
    } catch (e) {
      console.error('Failed to save stocks', e);
    }
  }

  public static getBusinessProfile(): BusinessProfile {
    try {
      const data = localStorage.getItem(KEYS.BUSINESS_PROFILE);
      return data ? JSON.parse(data) : INITIAL_BUSINESS_PROFILE;
    } catch {
      return INITIAL_BUSINESS_PROFILE;
    }
  }

  public static saveBusinessProfile(profile: BusinessProfile) {
    try {
      localStorage.setItem(KEYS.BUSINESS_PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save business profile', e);
    }
  }

  public static getClients(): Client[] {
    try {
      const data = localStorage.getItem(KEYS.CLIENTS);
      return data ? JSON.parse(data) : INITIAL_CLIENTS;
    } catch {
      return INITIAL_CLIENTS;
    }
  }

  public static saveClients(clients: Client[]) {
    try {
      localStorage.setItem(KEYS.CLIENTS, JSON.stringify(clients));
    } catch (e) {
      console.error('Failed to save clients', e);
    }
  }

  public static getInvoices(): Invoice[] {
    try {
      const data = localStorage.getItem(KEYS.INVOICES);
      return data ? JSON.parse(data) : INITIAL_INVOICES;
    } catch {
      return INITIAL_INVOICES;
    }
  }

  public static saveInvoices(invoices: Invoice[]) {
    try {
      localStorage.setItem(KEYS.INVOICES, JSON.stringify(invoices));
    } catch (e) {
      console.error('Failed to save invoices', e);
    }
  }

  public static getReminderRules(): PaymentReminderRule[] {
    try {
      const data = localStorage.getItem(KEYS.RULES);
      return data ? JSON.parse(data) : INITIAL_REMINDER_RULES;
    } catch {
      return INITIAL_REMINDER_RULES;
    }
  }

  public static saveReminderRules(rules: PaymentReminderRule[]) {
    try {
      localStorage.setItem(KEYS.RULES, JSON.stringify(rules));
    } catch (e) {
      console.error('Failed to save rules', e);
    }
  }

  public static getBankingPlatforms(): BankingPlatform[] {
    try {
      const data = localStorage.getItem(KEYS.BANKING);
      return data ? JSON.parse(data) : INITIAL_BANKING_PLATFORMS;
    } catch {
      return INITIAL_BANKING_PLATFORMS;
    }
  }

  public static saveBankingPlatforms(platforms: BankingPlatform[]) {
    try {
      localStorage.setItem(KEYS.BANKING, JSON.stringify(platforms));
    } catch (e) {
      console.error('Failed to save banking platforms', e);
    }
  }

  public static getBankFeed(): BankFeedTransaction[] {
    try {
      const data = localStorage.getItem(KEYS.BANK_FEED);
      return data ? JSON.parse(data) : INITIAL_BANK_FEED_TRANSACTIONS;
    } catch {
      return INITIAL_BANK_FEED_TRANSACTIONS;
    }
  }

  public static saveBankFeed(feed: BankFeedTransaction[]) {
    try {
      localStorage.setItem(KEYS.BANK_FEED, JSON.stringify(feed));
    } catch (e) {
      console.error('Failed to save bank feed', e);
    }
  }

  public static getBaseCurrency(): string {
    try {
      return localStorage.getItem(KEYS.BASE_CURRENCY) || 'USD';
    } catch {
      return 'USD';
    }
  }

  public static saveBaseCurrency(currency: string) {
    try {
      localStorage.setItem(KEYS.BASE_CURRENCY, currency);
    } catch (e) {
      console.error('Failed to save base currency', e);
    }
  }
}
