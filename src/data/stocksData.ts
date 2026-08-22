import { Stock, StockPricePoint, UserTradingWallet, DepositTransaction, TradingPosition, ClosedTrade } from '../types';

export const INITIAL_WALLET: UserTradingWallet = {
  usdBalance: 0.00,
  bdtBalance: 0.00,
  totalDepositedUSD: 0.00,
  totalWithdrawnUSD: 0.00,
  totalRealizedPnL: 0.00,
};

export const INITIAL_DEPOSIT_TRANSACTIONS: DepositTransaction[] = [];

export const INITIAL_OPEN_POSITIONS: TradingPosition[] = [];

export const INITIAL_CLOSED_TRADES: ClosedTrade[] = [];

// Helper to generate realistic candle history
function generateCandleHistory(basePrice: number, volatility: number = 0.015, count: number = 30): StockPricePoint[] {
  const points: StockPricePoint[] = [];
  let current = basePrice * 0.94;
  const now = Date.now();
  const intervalMs = 15 * 60 * 1000; // 15 min candles

  for (let i = count; i >= 0; i--) {
    const timeStr = new Date(now - i * intervalMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const change = (Math.random() - 0.48) * (current * volatility);
    const open = Number(current.toFixed(2));
    const close = Number(Math.max(1, current + change).toFixed(2));
    const high = Number((Math.max(open, close) + Math.random() * (current * volatility * 0.7)).toFixed(2));
    const low = Number((Math.min(open, close) - Math.random() * (current * volatility * 0.7)).toFixed(2));
    const volume = Math.floor(15000 + Math.random() * 85000);

    points.push({
      time: timeStr,
      price: close,
      open,
      high,
      low,
      close,
      volume,
    });
    current = close;
  }
  return points;
}

export const POPULAR_STOCKS: Stock[] = [
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    sector: 'Semiconductors & AI',
    category: 'us_tech',
    price: 128.80,
    previousClose: 124.60,
    change: 4.20,
    changePercent: 3.37,
    dayHigh: 130.40,
    dayLow: 124.10,
    volume: '54.2M',
    marketCap: '$3.16T',
    peRatio: 72.4,
    history: generateCandleHistory(128.80, 0.022),
    description: 'Pioneer of GPU-accelerated computing and the global backbone of generative AI workloads and data center infrastructure.',
  },
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    sector: 'Consumer Electronics',
    category: 'bluechip',
    price: 224.50,
    previousClose: 221.80,
    change: 2.70,
    changePercent: 1.22,
    dayHigh: 226.10,
    dayLow: 220.90,
    volume: '48.9M',
    marketCap: '$3.44T',
    peRatio: 33.8,
    history: generateCandleHistory(224.50, 0.012),
    description: 'Designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and services including Apple Intelligence.',
  },
  {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    sector: 'Automotive & Clean Energy',
    category: 'us_tech',
    price: 218.40,
    previousClose: 225.10,
    change: -6.70,
    changePercent: -2.98,
    dayHigh: 227.50,
    dayLow: 216.30,
    volume: '62.1M',
    marketCap: '$695B',
    peRatio: 61.2,
    history: generateCandleHistory(218.40, 0.035),
    description: 'Electric vehicle manufacturing, solar roofs, battery energy storage systems, and autonomous Full Self-Driving AI neural networks.',
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    sector: 'Software & Cloud Infrastructure',
    category: 'bluechip',
    price: 445.60,
    previousClose: 441.20,
    change: 4.40,
    changePercent: 1.00,
    dayHigh: 447.80,
    dayLow: 439.50,
    volume: '22.4M',
    marketCap: '$3.31T',
    peRatio: 35.6,
    history: generateCandleHistory(445.60, 0.011),
    description: 'Global technology giant developing Azure cloud computing, Windows OS, Microsoft 365, and enterprise OpenAI integrations.',
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc. (Google)',
    sector: 'Internet & Online Advertising',
    category: 'us_tech',
    price: 178.20,
    previousClose: 175.90,
    change: 2.30,
    changePercent: 1.31,
    dayHigh: 179.90,
    dayLow: 174.80,
    volume: '28.1M',
    marketCap: '$2.23T',
    peRatio: 24.1,
    history: generateCandleHistory(178.20, 0.016),
    description: 'Operator of Google Search, YouTube, Android, Google Cloud Platform, and Gemini multimodal AI development.',
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com, Inc.',
    sector: 'E-Commerce & AWS Cloud',
    category: 'us_tech',
    price: 186.40,
    previousClose: 184.10,
    change: 2.30,
    changePercent: 1.25,
    dayHigh: 188.00,
    dayLow: 183.50,
    volume: '34.5M',
    marketCap: '$1.94T',
    peRatio: 41.5,
    history: generateCandleHistory(186.40, 0.014),
    description: 'Leader in e-commerce retail, cloud computing infrastructure (AWS), digital streaming, and automated logistics networks.',
  },
  {
    symbol: 'META',
    name: 'Meta Platforms, Inc.',
    sector: 'Social Media & VR',
    category: 'us_tech',
    price: 512.30,
    previousClose: 504.80,
    change: 7.50,
    changePercent: 1.49,
    dayHigh: 516.40,
    dayLow: 502.10,
    volume: '16.7M',
    marketCap: '$1.29T',
    peRatio: 26.8,
    history: generateCandleHistory(512.30, 0.019),
    description: 'Builds technologies that help people connect, find communities, and grow businesses across Facebook, Instagram, WhatsApp, and Llama AI.',
  },
  {
    symbol: 'BTC/USD',
    name: 'Bitcoin USD',
    sector: 'Digital Currency & Store of Value',
    category: 'crypto',
    price: 64250.00,
    previousClose: 62800.00,
    change: 1450.00,
    changePercent: 2.31,
    dayHigh: 65100.00,
    dayLow: 62400.00,
    volume: '$28.4B',
    marketCap: '$1.26T',
    peRatio: 0,
    history: generateCandleHistory(64250.00, 0.028),
    description: 'Decentralized digital cryptocurrency operating on a proof-of-work peer-to-peer cryptographic ledger without central bank intermediaries.',
  },
  {
    symbol: 'ETH/USD',
    name: 'Ethereum USD',
    sector: 'Smart Contracts & DeFi',
    category: 'crypto',
    price: 3480.00,
    previousClose: 3390.00,
    change: 90.00,
    changePercent: 2.65,
    dayHigh: 3540.00,
    dayLow: 3360.00,
    volume: '$14.2B',
    marketCap: '$418B',
    peRatio: 0,
    history: generateCandleHistory(3480.00, 0.031),
    description: 'Open-source, decentralized blockchain featuring smart contract functionality powering decentralized finance (DeFi) protocols and NFTs.',
  },
  {
    symbol: 'SPY',
    name: 'SPDR S&P 500 ETF Trust',
    sector: 'Broad Market Index ETF',
    category: 'index',
    price: 552.10,
    previousClose: 549.30,
    change: 2.80,
    changePercent: 0.51,
    dayHigh: 553.80,
    dayLow: 548.90,
    volume: '45.8M',
    marketCap: '$540B',
    peRatio: 28.2,
    history: generateCandleHistory(552.10, 0.008),
    description: 'Exchange-traded fund tracking the investment results of the S&P 500 Index composed of 500 large-cap United States public companies.',
  },
];
