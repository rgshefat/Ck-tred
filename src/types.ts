export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'partially_paid' | 'cancelled';

export type PaymentMethod = 'bank_transfer' | 'stripe' | 'paypal' | 'wise' | 'credit_card' | 'ach' | 'sepa' | 'crypto';

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  rateToBaseUSD: number; // e.g. 1 USD = rateToBaseUSD
  decimals: number;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRatePercent: number;
  discountPercent?: number;
  category?: string;
  total: number;
}

export interface Client {
  id: string;
  name: string;
  companyName: string;
  email: string;
  phone?: string;
  address: string;
  city: string;
  stateOrRegion?: string;
  postalCode: string;
  country: string;
  taxId?: string; // VAT ID, GSTIN, EIN
  preferredCurrency: string;
  paymentTermsDays: number;
  notes?: string;
}

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  amount: number;
  currency: string;
  amountInBaseUSD: number;
  date: string;
  method: PaymentMethod;
  transactionReference?: string;
  notes?: string;
}

export interface InvoiceAuditLog {
  id: string;
  timestamp: string;
  action: 'created' | 'updated' | 'sent' | 'viewed' | 'reminder_sent' | 'payment_received' | 'reconciled' | 'status_changed';
  actor: string;
  details: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  client: Client;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  currency: string;
  exchangeRateToBase: number; // Rate at time of invoice
  items: LineItem[];
  subtotal: number;
  totalTax: number;
  totalDiscount: number;
  totalAmount: number;
  totalPaid: number;
  balanceDue: number;
  notes?: string;
  paymentTerms: string; // e.g., 'Net 30', 'Due on Receipt'
  paymentTermsDays: number;
  taxType: 'vat' | 'gst' | 'sales_tax' | 'reverse_charge' | 'exempt' | 'standard';
  taxRegistrationNumber?: string; // Business VAT/GST ID shown on invoice
  bankDetailsOverride?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    routingNumber?: string;
    swiftBic?: string;
    iban?: string;
  };
  attachments?: string[];
  signatureName?: string;
  signatureDate?: string;
  createdAt: string;
  updatedAt: string;
  lastReminderSentAt?: string;
  reminderCount: number;
  auditTrail: InvoiceAuditLog[];
}

export interface PaymentReminderRule {
  id: string;
  name: string;
  triggerCondition: 'before_due' | 'on_due_date' | 'after_due';
  daysOffset: number; // e.g. -3 for 3 days before, 0 for on due date, 7 for 7 days after
  isEnabled: boolean;
  channel: 'email' | 'sms' | 'both';
  tone: 'friendly' | 'professional' | 'firm' | 'urgent' | 'incentive_discount';
  subjectTemplate: string;
  bodyTemplate: string;
  includePaymentLink: boolean;
  attachPdf: boolean;
  autoSend: boolean;
}

export interface ReminderQueueItem {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  ruleId: string;
  ruleName: string;
  scheduledFor: string;
  status: 'pending' | 'sent' | 'skipped' | 'cancelled';
  sentAt?: string;
  tone: string;
  subject: string;
  previewBody: string;
}

export interface BusinessProfile {
  name: string;
  legalEntityName: string;
  tagline: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  taxId: string; // VAT/GST/EIN
  baseCurrency: string;
  logoUrl: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  routingNumber: string;
  swiftBic: string;
  iban: string;
  stripeAccountId?: string;
  paypalEmail?: string;
  wiseTag?: string;
  defaultPaymentTermsDays: number;
  defaultNotes: string;
  defaultTaxRatePercent: number;
}

export interface BankFeedTransaction {
  id: string;
  date: string;
  description: string;
  rawPayerName: string;
  amount: number;
  currency: string;
  type: 'credit' | 'debit';
  accountName: string;
  matchedInvoiceId?: string;
  matchConfidence?: number; // 0 to 100
  reconciled: boolean;
  reconciledAt?: string;
}

export interface BankingPlatform {
  id: string;
  name: string;
  icon: string;
  category: 'payment_gateway' | 'bank_feed' | 'accounting_sync';
  status: 'connected' | 'disconnected' | 'syncing';
  accountDetails: string;
  lastSyncedAt: string;
  autoReconcile: boolean;
}

export interface TaxJurisdictionReport {
  jurisdiction: string;
  taxType: string;
  taxableSales: number;
  taxCollected: number;
  effectiveRate: number;
  invoiceCount: number;
  currency: string;
}

// ----------------------------------------------------
// Stock Trading & Wallet Systems
// ----------------------------------------------------

export interface StockPricePoint {
  time: string;
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Stock {
  symbol: string;
  name: string;
  sector: string;
  category: 'us_tech' | 'bluechip' | 'crypto' | 'index' | 'dividend';
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  volume: string;
  marketCap: string;
  peRatio: number;
  history: StockPricePoint[];
  description: string;
}

export interface TradingPosition {
  id: string;
  symbol: string;
  stockName: string;
  type: 'BUY' | 'SELL';
  shares: number;
  entryPrice: number;
  currentPrice: number;
  investedAmount: number; // in USD
  currentValue: number;   // in USD
  pnl: number;            // in USD
  pnlPercent: number;
  stopLoss?: number;
  takeProfit?: number;
  openedAt: string;
}

export interface ClosedTrade {
  id: string;
  symbol: string;
  stockName: string;
  type: 'BUY' | 'SELL';
  shares: number;
  entryPrice: number;
  exitPrice: number;
  investedAmount: number;
  returnedAmount: number;
  pnl: number;
  pnlPercent: number;
  openedAt: string;
  closedAt: string;
  isTimedTrade?: boolean;
  direction?: 'CALL' | 'PUT';
  duration?: TimedTradeDuration;
  outcome?: 'WON' | 'LOST';
}

export type TimedTradeDuration = '1m' | '2m' | '3m' | '5m' | '10m' | '15m' | '30m';

export interface TimedTrade {
  id: string;
  symbol: string;
  stockName: string;
  direction: 'CALL' | 'PUT'; // CALL (Up / সবুজ) | PUT (Down / লাল)
  duration: TimedTradeDuration;
  durationSeconds: number; // 60, 120, 180, 300, 600, 900, 1800
  entryPrice: number;
  strikePrice: number;
  currentPrice: number;
  investedAmount: number;
  payoutPercent: number; // e.g. 85%
  startedAt: number; // timestamp
  expiresAt: number; // timestamp
  status: 'active' | 'won' | 'lost';
  pnl?: number;
  pnlPercent?: number;
  settledPrice?: number;
  resolvedAt?: string;
  winProbability: number; // 0.20 (20%)
  lossProbability: number; // 0.80 (80%)
}

export interface UserTradingWallet {
  usdBalance: number;
  bdtBalance: number;
  totalDepositedUSD: number;
  totalWithdrawnUSD: number;
  totalRealizedPnL: number;
}

export type DepositPaymentMethod = 'bkash' | 'nagad' | 'bank_transfer' | 'rocket' | 'upay';

export interface DepositTransaction {
  id: string;
  method: DepositPaymentMethod;
  bdtAmount: number;
  usdAmount: number;
  exchangeRate: number; // e.g. 122 BDT = 1 USD
  senderNumber: string;
  destinationNumber: string;
  transactionId: string; // TrxID
  status: 'completed' | 'pending' | 'rejected';
  createdAt: string;
  confirmedAt: string;
  methodTitle: string;
  notes?: string;
}

export interface WithdrawTransaction {
  id: string;
  method: DepositPaymentMethod;
  usdAmount: number;
  bdtAmount: number;
  exchangeRate: number;
  receiverNumber: string;
  bankName?: string;
  accountName?: string;
  status: 'completed' | 'processing' | 'rejected';
  createdAt: string;
}

