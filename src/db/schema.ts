import { pgTable, serial, text, doublePrecision, integer, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';

// Users table (maps Firebase Auth UID)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  photoUrl: text('photo_url'),
  usdBalance: doublePrecision('usd_balance').default(0.00).notNull(),
  bdtBalance: doublePrecision('bdt_balance').default(0.00).notNull(),
  totalDepositedUsd: doublePrecision('total_deposited_usd').default(0.00).notNull(),
  totalWithdrawnUsd: doublePrecision('total_withdrawn_usd').default(0.00).notNull(),
  totalRealizedPnl: doublePrecision('total_realized_pnl').default(0.00).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Deposits & Wallet transactions
export const deposits = pgTable('deposits', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.uid).notNull(),
  method: text('method').notNull(),
  bdtAmount: doublePrecision('bdt_amount').notNull(),
  usdAmount: doublePrecision('usd_amount').notNull(),
  exchangeRate: doublePrecision('exchange_rate').notNull(),
  senderNumber: text('sender_number').notNull(),
  destinationNumber: text('destination_number').notNull(),
  transactionId: text('transaction_id').notNull(),
  status: text('status').notNull(), // 'completed' | 'pending' | 'rejected'
  createdAt: text('created_at').notNull(),
  confirmedAt: text('confirmed_at').notNull(),
  methodTitle: text('method_title').notNull(),
  notes: text('notes'),
});

// Withdrawals
export const withdrawals = pgTable('withdrawals', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.uid).notNull(),
  method: text('method').notNull(),
  usdAmount: doublePrecision('usd_amount').notNull(),
  bdtAmount: doublePrecision('bdt_amount').notNull(),
  exchangeRate: doublePrecision('exchange_rate').notNull(),
  receiverNumber: text('receiver_number').notNull(),
  bankName: text('bank_name'),
  accountName: text('account_name'),
  status: text('status').notNull(),
  createdAt: text('created_at').notNull(),
});

// Trading Positions & History
export const tradingPositions = pgTable('trading_positions', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.uid).notNull(),
  symbol: text('symbol').notNull(),
  stockName: text('stock_name').notNull(),
  type: text('type').notNull(), // 'BUY' | 'SELL'
  shares: doublePrecision('shares').notNull(),
  entryPrice: doublePrecision('entry_price').notNull(),
  currentPrice: doublePrecision('current_price').notNull(),
  investedAmount: doublePrecision('invested_amount').notNull(),
  currentValue: doublePrecision('current_value').notNull(),
  pnl: doublePrecision('pnl').notNull(),
  pnlPercent: doublePrecision('pnl_percent').notNull(),
  stopLoss: doublePrecision('stop_loss'),
  takeProfit: doublePrecision('take_profit'),
  openedAt: text('opened_at').notNull(),
});

// Closed Trades
export const closedTrades = pgTable('closed_trades', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.uid).notNull(),
  symbol: text('symbol').notNull(),
  stockName: text('stock_name').notNull(),
  type: text('type').notNull(),
  shares: doublePrecision('shares').notNull(),
  entryPrice: doublePrecision('entry_price').notNull(),
  exitPrice: doublePrecision('exit_price').notNull(),
  investedAmount: doublePrecision('invested_amount').notNull(),
  returnedAmount: doublePrecision('returned_amount').notNull(),
  pnl: doublePrecision('pnl').notNull(),
  pnlPercent: doublePrecision('pnl_percent').notNull(),
  openedAt: text('opened_at').notNull(),
  closedAt: text('closed_at').notNull(),
  isTimedTrade: boolean('is_timed_trade').default(false),
  direction: text('direction'),
  duration: text('duration'),
  outcome: text('outcome'),
});

// Timed Trades
export const timedTrades = pgTable('timed_trades', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.uid).notNull(),
  symbol: text('symbol').notNull(),
  stockName: text('stock_name').notNull(),
  direction: text('direction').notNull(),
  duration: text('duration').notNull(),
  durationSeconds: integer('duration_seconds').notNull(),
  entryPrice: doublePrecision('entry_price').notNull(),
  strikePrice: doublePrecision('strike_price').notNull(),
  currentPrice: doublePrecision('current_price').notNull(),
  investedAmount: doublePrecision('invested_amount').notNull(),
  payoutPercent: doublePrecision('payout_percent').notNull(),
  startedAt: doublePrecision('started_at').notNull(),
  expiresAt: doublePrecision('expires_at').notNull(),
  status: text('status').notNull(),
  pnl: doublePrecision('pnl'),
  pnlPercent: doublePrecision('pnl_percent'),
  settledPrice: doublePrecision('settled_price'),
  resolvedAt: text('resolved_at'),
  winProbability: doublePrecision('win_probability').notNull(),
  lossProbability: doublePrecision('loss_probability').notNull(),
});

// Invoices table
export const invoices = pgTable('invoices', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.uid).notNull(),
  invoiceNumber: text('invoice_number').notNull(),
  clientId: text('client_id').notNull(),
  status: text('status').notNull(),
  issueDate: text('issue_date').notNull(),
  dueDate: text('due_date').notNull(),
  currency: text('currency').notNull(),
  exchangeRateToBase: doublePrecision('exchange_rate_to_base').notNull(),
  subtotal: doublePrecision('subtotal').notNull(),
  totalTax: doublePrecision('total_tax').notNull(),
  totalDiscount: doublePrecision('total_discount').notNull(),
  totalAmount: doublePrecision('total_amount').notNull(),
  totalPaid: doublePrecision('total_paid').notNull(),
  balanceDue: doublePrecision('balance_due').notNull(),
  paymentTerms: text('payment_terms').notNull(),
  paymentTermsDays: integer('payment_terms_days').notNull(),
  taxType: text('tax_type').notNull(),
  taxRegistrationNumber: text('tax_registration_number'),
  notes: text('notes'),
  signatureName: text('signature_name'),
  signatureDate: text('signature_date'),
  dataJson: jsonb('data_json'), // stores full client snapshot, items, audit trail
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});
