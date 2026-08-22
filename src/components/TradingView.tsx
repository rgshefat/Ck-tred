import React, { useState, useEffect } from 'react';
import { 
  Stock, 
  TradingPosition, 
  ClosedTrade, 
  UserTradingWallet,
  TimedTrade,
  TimedTradeDuration 
} from '../types';
import { StockChart } from './StockChart';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ArrowRight, 
  Plus, 
  X, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  Wallet, 
  Check, 
  AlertCircle,
  Activity,
  Layers,
  ChevronRight,
  CreditCard,
  Building2,
  RefreshCw,
  Search,
  Filter,
  Flame,
  Timer,
  Award,
  ArrowUp,
  ArrowDown,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FXService } from '../services/fxService';

interface TradingViewProps {
  stocks: Stock[];
  setStocks: React.Dispatch<React.SetStateAction<Stock[]>>;
  wallet: UserTradingWallet;
  setWallet: React.Dispatch<React.SetStateAction<UserTradingWallet>>;
  positions: TradingPosition[];
  setPositions: React.Dispatch<React.SetStateAction<TradingPosition[]>>;
  timedTrades: TimedTrade[];
  setTimedTrades: React.Dispatch<React.SetStateAction<TimedTrade[]>>;
  closedTrades: ClosedTrade[];
  setClosedTrades: React.Dispatch<React.SetStateAction<ClosedTrade[]>>;
  onOpenDepositShop: () => void;
  onOpenWithdraw?: () => void;
  baseCurrency: string;
}

const TIMED_DURATIONS: { label: TimedTradeDuration; seconds: number; titleBn: string }[] = [
  { label: '1m', seconds: 60, titleBn: '১ মিনিট' },
  { label: '2m', seconds: 120, titleBn: '২ মিনিট' },
  { label: '3m', seconds: 180, titleBn: '৩ মিনিট' },
  { label: '5m', seconds: 300, titleBn: '৫ মিনিট' },
  { label: '10m', seconds: 600, titleBn: '১০ মিনিট' },
  { label: '15m', seconds: 900, titleBn: '১৫ মিনিট' },
  { label: '30m', seconds: 1800, titleBn: '৩০ মিনিট' },
];

const PRESET_AMOUNTS_USD = [10, 25, 50, 100, 250, 500];

export const TradingView: React.FC<TradingViewProps> = ({
  stocks,
  setStocks,
  wallet,
  setWallet,
  positions,
  setPositions,
  timedTrades,
  setTimedTrades,
  closedTrades,
  setClosedTrades,
  onOpenDepositShop,
  onOpenWithdraw,
  baseCurrency,
}) => {
  const [selectedStockSymbol, setSelectedStockSymbol] = useState<string>('NVDA');
  
  // Trading Mode: 'timed' (1m - 30m) or 'spot' (shares)
  const [terminalMode, setTerminalMode] = useState<'timed' | 'spot'>('timed');
  
  // Timed Trade Parameters
  const [selectedDuration, setSelectedDuration] = useState<TimedTradeDuration>('1m');
  const [timedAmount, setTimedAmount] = useState<number>(50);
  const [timedDirection, setTimedDirection] = useState<'CALL' | 'PUT'>('CALL');
  
  // Spot Trade Parameters
  const [spotTradeType, setSpotTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [spotOrderMode, setSpotOrderMode] = useState<'dollars' | 'shares'>('dollars');
  const [spotOrderAmount, setSpotOrderAmount] = useState<number>(200);

  // Search & Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Bottom Tab: 'timed' | 'positions' | 'history'
  const [activeBottomTab, setActiveBottomTab] = useState<'timed' | 'positions' | 'history'>('timed');
  
  // Feedbacks & Notification
  const [tradeFeedback, setTradeFeedback] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [recentSettlementModal, setRecentSettlementModal] = useState<{
    trade: TimedTrade;
    outcome: 'WON' | 'LOST';
    pnl: number;
  } | null>(null);

  // Current selected stock
  const currentStock = stocks.find((s) => s.symbol === selectedStockSymbol) || stocks[0] || {} as Stock;
  const currentDurationConfig = TIMED_DURATIONS.find((d) => d.label === selectedDuration) || TIMED_DURATIONS[0];

  // ----------------------------------------------------
  // 1. Real-time Market Tick Simulator (every 2.5s)
  // ----------------------------------------------------
  useEffect(() => {
    const interval = setInterval(() => {
      setStocks((prevStocks) => {
        return prevStocks.map((stock) => {
          // Dynamic market fluctuations
          const tickDeltaPercent = (Math.random() - 0.49) * 0.009;
          const newPrice = Number(Math.max(1, stock.price * (1 + tickDeltaPercent)).toFixed(2));
          const change = Number((newPrice - stock.previousClose).toFixed(2));
          const changePercent = Number(((change / stock.previousClose) * 100).toFixed(2));
          const dayHigh = Number(Math.max(stock.dayHigh, newPrice).toFixed(2));
          const dayLow = Number(Math.min(stock.dayLow, newPrice).toFixed(2));

          const updatedHistory = [...stock.history];
          if (updatedHistory.length > 0) {
            const lastPoint = { ...updatedHistory[updatedHistory.length - 1] };
            lastPoint.close = newPrice;
            lastPoint.price = newPrice;
            lastPoint.high = Math.max(lastPoint.high, newPrice);
            lastPoint.low = Math.min(lastPoint.low, newPrice);
            updatedHistory[updatedHistory.length - 1] = lastPoint;
          }

          return {
            ...stock,
            price: newPrice,
            change,
            changePercent,
            dayHigh,
            dayLow,
            history: updatedHistory,
          };
        });
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [setStocks]);

  // ----------------------------------------------------
  // 2. Timed Trades Countdown & Settlement Engine (every 1s)
  // ----------------------------------------------------
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      
      setTimedTrades((prevTimedTrades) => {
        if (prevTimedTrades.length === 0) return prevTimedTrades;

        const remainingActive: TimedTrade[] = [];
        const completed: TimedTrade[] = [];

        prevTimedTrades.forEach((trade) => {
          const liveStock = stocks.find((s) => s.symbol === trade.symbol);
          const currentPrice = liveStock ? liveStock.price : trade.currentPrice;

          if (now >= trade.expiresAt && trade.status === 'active') {
            completed.push({
              ...trade,
              currentPrice,
              settledPrice: currentPrice,
            });
          } else {
            remainingActive.push({
              ...trade,
              currentPrice,
            });
          }
        });

        // Resolve completed trades with 5% Win / 95% Loss chance
        if (completed.length > 0) {
          completed.forEach((trade) => {
            // PROBABILITY RULE: 5% WIN CHANCE, 95% LOSS CHANCE
            const isWin = Math.random() < 0.05; // 5% Win, 95% Loss
            
            const payoutRate = trade.payoutPercent / 100; // 0.85
            const profitAmount = isWin ? Number((trade.investedAmount * payoutRate).toFixed(2)) : -trade.investedAmount;
            const returnTotal = isWin ? Number((trade.investedAmount + profitAmount).toFixed(2)) : 0;
            const pnlPercent = isWin ? trade.payoutPercent : -100;

            // Update user wallet
            setWallet((prevWallet) => ({
              ...prevWallet,
              usdBalance: Number((prevWallet.usdBalance + returnTotal).toFixed(2)),
              totalRealizedPnL: Number((prevWallet.totalRealizedPnL + profitAmount).toFixed(2)),
            }));

            // Record into Closed Trades
            const closedEntry: ClosedTrade = {
              id: `closed_${trade.id}`,
              symbol: trade.symbol,
              stockName: trade.stockName,
              type: trade.direction === 'CALL' ? 'BUY' : 'SELL',
              shares: 1,
              entryPrice: trade.strikePrice,
              exitPrice: trade.settledPrice || trade.strikePrice,
              investedAmount: trade.investedAmount,
              returnedAmount: returnTotal,
              pnl: profitAmount,
              pnlPercent: pnlPercent,
              openedAt: new Date(trade.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              closedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isTimedTrade: true,
              direction: trade.direction,
              duration: trade.duration,
              outcome: isWin ? 'WON' : 'LOST',
            };

            setClosedTrades((prev) => [closedEntry, ...prev]);

            // Trigger visual feedback modal
            setRecentSettlementModal({
              trade: {
                ...trade,
                status: isWin ? 'won' : 'lost',
                pnl: profitAmount,
                pnlPercent: pnlPercent,
              },
              outcome: isWin ? 'WON' : 'LOST',
              pnl: profitAmount,
            });

            if (isWin) {
              confetti({
                particleCount: 130,
                spread: 80,
                origin: { y: 0.6 },
              });
            }
          });
        }

        return remainingActive;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [stocks, setTimedTrades, setWallet, setClosedTrades]);

  // ----------------------------------------------------
  // 3. Dynamic Update of Spot Positions PnL
  // ----------------------------------------------------
  useEffect(() => {
    setPositions((prevPositions) => {
      return prevPositions.map((pos) => {
        const liveStock = stocks.find((s) => s.symbol === pos.symbol);
        const curPrice = liveStock ? liveStock.price : pos.currentPrice;
        const curValue = Number((pos.shares * curPrice).toFixed(2));
        
        const pnl = pos.type === 'BUY'
          ? Number(((curPrice - pos.entryPrice) * pos.shares).toFixed(2))
          : Number(((pos.entryPrice - curPrice) * pos.shares).toFixed(2));
        const pnlPercent = Number(((pnl / pos.investedAmount) * 100).toFixed(2));

        return {
          ...pos,
          currentPrice: curPrice,
          currentValue: curValue,
          pnl,
          pnlPercent,
        };
      });
    });
  }, [stocks, setPositions]);

  // ----------------------------------------------------
  // 4. Timed Trade Execution Handler
  // ----------------------------------------------------
  const handleExecuteTimedTrade = (direction: 'CALL' | 'PUT') => {
    setTimedDirection(direction);

    if (timedAmount <= 0) {
      setTradeFeedback({ msg: 'অনুগ্রহ করে সঠিক ডলার পরিমাণ লিখুন (Minimum $1 USD)', type: 'error' });
      return;
    }

    if (wallet.usdBalance < timedAmount) {
      if (wallet.usdBalance === 0) {
        setTradeFeedback({ 
          msg: 'আপনার অ্যাকাউন্টে ব্যালেন্স $0.00 USD! ট্রেড করতে আগে বিকাশ বা নগদ দিয়ে ডিপোজিট করে ডলার অ্যাড করুন।', 
          type: 'error' 
        });
        if (onOpenDepositShop) onOpenDepositShop();
      } else {
        setTradeFeedback({ 
          msg: `পর্যাপ্ত ব্যালেন্স নেই! প্রয়োজন $${timedAmount.toFixed(2)}, আপনার আছে $${wallet.usdBalance.toFixed(2)}`, 
          type: 'error' 
        });
      }
      return;
    }

    const now = Date.now();
    const durationSeconds = currentDurationConfig.seconds;
    const expiresAt = now + durationSeconds * 1000;

    // Deduct invested amount from wallet immediately
    const updatedBalance = Number((wallet.usdBalance - timedAmount).toFixed(2));
    setWallet((prev) => ({
      ...prev,
      usdBalance: updatedBalance,
    }));

    const newTimedTrade: TimedTrade = {
      id: `tt_${Date.now()}`,
      symbol: currentStock.symbol,
      stockName: currentStock.name,
      direction: direction,
      duration: selectedDuration,
      durationSeconds: durationSeconds,
      entryPrice: currentStock.price,
      strikePrice: currentStock.price,
      currentPrice: currentStock.price,
      investedAmount: Number(timedAmount),
      payoutPercent: 85, // 85% payout
      startedAt: now,
      expiresAt: expiresAt,
      status: 'active',
      winProbability: 0.05,
      lossProbability: 0.95,
    };

    setTimedTrades((prev) => [newTimedTrade, ...prev]);
    setActiveBottomTab('timed');

    setTradeFeedback({
      msg: `${currentStock.symbol} এ ${currentDurationConfig.titleBn} (${selectedDuration}) ${direction === 'CALL' ? 'CALL 🟢 (UP)' : 'PUT 🔴 (DOWN)'} ট্রেড সফলভাবে শুরু হয়েছে!`,
      type: 'success',
    });

    setTimeout(() => setTradeFeedback(null), 4500);
  };

  // ----------------------------------------------------
  // 5. Spot Market Trade Handler
  // ----------------------------------------------------
  const calculatedShares = spotOrderMode === 'shares'
    ? spotOrderAmount
    : Number((spotOrderAmount / (currentStock.price || 1)).toFixed(4));

  const totalRequiredSpotUSD = spotOrderMode === 'dollars'
    ? spotOrderAmount
    : Number((spotOrderAmount * (currentStock.price || 1)).toFixed(2));

  const hasSufficientSpotBalance = wallet.usdBalance >= totalRequiredSpotUSD;

  const handleExecuteSpotTrade = (e: React.FormEvent) => {
    e.preventDefault();

    if (totalRequiredSpotUSD <= 0 || calculatedShares <= 0) {
      setTradeFeedback({ msg: 'অনুগ্রহ করে সঠিক শেয়ার বা ডলার পরিমাণ দিন', type: 'error' });
      return;
    }

    if (!hasSufficientSpotBalance) {
      setTradeFeedback({ msg: 'পর্যাপ্ত ব্যালেন্স নেই! বিকাশ বা নগদ দিয়ে ডলার যোগ করুন', type: 'error' });
      return;
    }

    const newBalance = Number((wallet.usdBalance - totalRequiredSpotUSD).toFixed(2));
    setWallet((prev) => ({
      ...prev,
      usdBalance: newBalance,
    }));

    const newPos: TradingPosition = {
      id: `pos_${Date.now()}`,
      symbol: currentStock.symbol,
      stockName: currentStock.name,
      type: spotTradeType,
      shares: calculatedShares,
      entryPrice: currentStock.price,
      currentPrice: currentStock.price,
      investedAmount: totalRequiredSpotUSD,
      currentValue: totalRequiredSpotUSD,
      pnl: 0,
      pnlPercent: 0,
      openedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setPositions((prev) => [newPos, ...prev]);
    setActiveBottomTab('positions');

    setTradeFeedback({
      msg: `সফলভাবে ${calculatedShares} ${currentStock.symbol} স্পট পজিশন ওপেন হয়েছে!`,
      type: 'success',
    });
    setTimeout(() => setTradeFeedback(null), 4000);
  };

  const handleCloseSpotPosition = (pos: TradingPosition) => {
    const returnAmount = Number((pos.investedAmount + pos.pnl).toFixed(2));
    const newBalance = Number((wallet.usdBalance + returnAmount).toFixed(2));
    const newRealizedPnL = Number((wallet.totalRealizedPnL + pos.pnl).toFixed(2));

    setWallet((prev) => ({
      ...prev,
      usdBalance: newBalance,
      totalRealizedPnL: newRealizedPnL,
    }));

    setPositions((prev) => prev.filter((p) => p.id !== pos.id));

    const closed: ClosedTrade = {
      id: `trade_${Date.now()}`,
      symbol: pos.symbol,
      stockName: pos.stockName,
      type: pos.type,
      shares: pos.shares,
      entryPrice: pos.entryPrice,
      exitPrice: pos.currentPrice,
      investedAmount: pos.investedAmount,
      returnedAmount: returnAmount,
      pnl: pos.pnl,
      pnlPercent: pos.pnlPercent,
      openedAt: pos.openedAt,
      closedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isTimedTrade: false,
    };

    setClosedTrades((prev) => [closed, ...prev]);

    if (pos.pnl > 0) {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
      });
    }
  };

  // Helper for quick percentage clicks
  const handleQuickPercentTimed = (pct: number) => {
    const calculated = Number(((wallet.usdBalance * pct) / 100).toFixed(0));
    setTimedAmount(Math.max(1, calculated));
  };

  // Stocks Search & Filters
  const filteredStocks = stocks.filter((st) => {
    const matchesCategory = selectedCategory === 'all' || st.category === selectedCategory;
    const matchesSearch = st.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate totals
  const totalSpotInvestedUSD = positions.reduce((acc, p) => acc + p.currentValue, 0);
  const totalTimedActiveUSD = timedTrades.reduce((acc, t) => acc + t.investedAmount, 0);
  const totalPortfolioUSD = wallet.usdBalance + totalSpotInvestedUSD + totalTimedActiveUSD;

  // Format seconds remaining helper
  const getRemainingTimeStr = (expiresAt: number) => {
    const diffSeconds = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
    const mins = Math.floor(diffSeconds / 60);
    const secs = diffSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* ---------------------------------------------------- */}
      {/* TOP STATS & BALANCE BAR */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Available Trading Cash */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">
              ট্রেডিং ব্যালেন্স (Cash)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              ${wallet.usdBalance.toFixed(2)}
            </div>
            <div className="text-xs text-slate-500 font-mono mt-0.5">
              ৳{(wallet.usdBalance * 122).toLocaleString()} BDT
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
            <button
              onClick={onOpenDepositShop}
              className="py-1.5 px-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ডিপোজিট</span>
            </button>
            <button
              onClick={onOpenWithdraw || onOpenDepositShop}
              className="py-1.5 px-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors border border-amber-200"
            >
              <ArrowDown className="w-3.5 h-3.5 rotate-180" />
              <span>উইথড্রয়াল</span>
            </button>
          </div>
        </div>

        {/* Card 2: Total Portfolio Net Worth */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">
              মোট পোর্টফোলিও মূল্য
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              ${totalPortfolioUSD.toFixed(2)}
            </div>
            <div className="text-xs text-slate-500 font-mono mt-0.5">
              ৳{(totalPortfolioUSD * 122).toLocaleString()} BDT
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>চলমান টাইমড ট্রেড:</span>
            <span className="font-bold text-indigo-600 font-mono">${totalTimedActiveUSD.toFixed(2)}</span>
          </div>
        </div>

        {/* Card 3: Realized P&L */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">
              মোট রিয়ালাইজড প্রফিট/লস
            </span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              wallet.totalRealizedPnL >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
            }`}>
              {wallet.totalRealizedPnL >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-2">
            <div className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${
              wallet.totalRealizedPnL >= 0 ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {wallet.totalRealizedPnL >= 0 ? '+' : ''}${wallet.totalRealizedPnL.toFixed(2)}
            </div>
            <div className="text-xs text-slate-500 font-mono mt-0.5">
              {wallet.totalRealizedPnL >= 0 ? '+' : ''}৳{(wallet.totalRealizedPnL * 122).toLocaleString()} BDT
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>মোট সম্পন্ন ট্রেড:</span>
            <span className="font-bold text-slate-800 font-mono">{closedTrades.length} টি</span>
          </div>
        </div>

        {/* Card 4: Official Deposit Cashier Hotline */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-sm border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">
                বিকাশ ও নগদ ক্যাশিয়ার
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                সক্রিয়
              </span>
            </div>
            <div className="text-xl font-mono font-black text-amber-300 tracking-wider mt-1">
              01883308311
            </div>
            <div className="text-[11px] text-slate-300 mt-1">
              Send Money করে TrxID দিয়ে সাথে সাথে ডলার অ্যাড করুন।
            </div>
          </div>
          <button
            onClick={onOpenDepositShop}
            className="mt-3 w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>টাকা পাঠান ও ডলার নিন</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* ZERO BALANCE NOTIFICATION BANNER */}
      {wallet.usdBalance === 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
              $0
            </div>
            <div>
              <div className="text-xs font-black text-amber-900 flex items-center gap-2">
                <span>আপনার বর্তমান ওয়ালেট ব্যালেন্স: $0.00 USD (নতুন অ্যাকাউন্ট)</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900">ডিপোজিট প্রয়োজন</span>
              </div>
              <p className="text-[11px] text-amber-800 mt-0.5">
                নতুন অ্যাকাউন্টের ব্যালেন্স $0.00। স্টক বা ক্রিপ্টোতে ট্রেড করতে বিকাশ অথবা নগদ দিয়ে ডিপোজিট করে ডলার অ্যাড করুন।
              </p>
            </div>
          </div>
          <button
            onClick={onOpenDepositShop}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>বিকাশ/নগদ দিয়ে ডিপোজিট করুন</span>
          </button>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MAIN TRADING WORKSPACE */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT 1 COL: STOCK SELECTOR & WATCHLIST */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <span>স্টক ও অ্যাসেট ওয়াচলিস্ট</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">লাইভ সিঙ্ক</span>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="স্টক খুঁজুন (NVDA, AAPL, BTC)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Category tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'all', label: 'সব অ্যাসেট' },
              { id: 'us_tech', label: 'ইউএস টেক' },
              { id: 'crypto', label: 'ক্রিপ্টো' },
              { id: 'bluechip', label: 'ব্লুচিপ' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap cursor-pointer transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Stocks List */}
          <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1">
            {filteredStocks.map((stock) => {
              const isSelected = stock.symbol === selectedStockSymbol;
              const isUp = stock.change >= 0;
              return (
                <button
                  key={stock.symbol}
                  onClick={() => setSelectedStockSymbol(stock.symbol)}
                  className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-indigo-50/80 border-indigo-600 shadow-xs ring-1 ring-indigo-500/20'
                      : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs font-mono ${
                      isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {stock.symbol.slice(0, 3)}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        <span>{stock.symbol}</span>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>}
                      </div>
                      <div className="text-[10px] text-slate-500 line-clamp-1">{stock.name}</div>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <div className="font-bold text-xs text-slate-900">${stock.price.toFixed(2)}</div>
                    <div className={`text-[10px] font-bold flex items-center justify-end gap-0.5 ${
                      isUp ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span>{isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

        </div>

        {/* RIGHT 2 COLS: CHART & ORDER EXECUTION PANEL */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* INTERACTIVE CANDLESTICK / LINE CHART */}
          <StockChart stock={currentStock} baseCurrency={baseCurrency} />

          {/* ORDER EXECUTION TERMINAL */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
            
            {/* TERMINAL HEADER & MODE SWITCHER */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-slate-900">
                    {currentStock.symbol} ট্রেডিং প্যানেল
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold">
                    লাইভ প্রাইজ: ${currentStock.price.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  সময় নির্বাচন করে ট্রেড করুন অথবা সাধারণ স্পট মার্কেট শেয়ার কিনুন
                </p>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 w-full sm:w-auto">
                <button
                  onClick={() => setTerminalMode('timed')}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    terminalMode === 'timed'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Timer className="w-3.5 h-3.5" />
                  <span>ফিক্সড টাইম ট্রেড (1m - 30m)</span>
                </button>
                
                <button
                  onClick={() => setTerminalMode('spot')}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    terminalMode === 'spot'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>স্পট মার্কেট (Shares)</span>
                </button>
              </div>
            </div>

            {/* ---------------------------------------------------- */}
            {/* MODE 1: TIMED OPTIONS TRADING (1m to 30m) */}
            {/* ---------------------------------------------------- */}
            {terminalMode === 'timed' && (
              <div className="space-y-5">
                
                {/* 1. Duration Selector (1m, 2m, 3m, 5m, 10m, 15m, 30m) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      <span>১. সময় সিলেক্ট করুন (Trade Duration: 1m to 30m)</span>
                    </label>
                    <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      রিটার্ন পে-আউট: +85% প্রফিট
                    </span>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {TIMED_DURATIONS.map((dur) => {
                      const isSelected = selectedDuration === dur.label;
                      return (
                        <button
                          key={dur.label}
                          type="button"
                          onClick={() => setSelectedDuration(dur.label)}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-500/20'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                          }`}
                        >
                          <div className="font-mono font-black text-sm">{dur.label}</div>
                          <div className={`text-[10px] ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                            {dur.titleBn}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Trade Amount ($ USD) & Presets */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      ২. ইনভেস্টের পরিমাণ ($ USD Amount)
                    </label>
                    <span className="text-xs text-slate-500">
                      ব্যালেন্স: <strong className="text-slate-900 font-mono">${wallet.usdBalance.toFixed(2)}</strong>
                    </span>
                  </div>

                  {/* Preset Amount buttons */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {PRESET_AMOUNTS_USD.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setTimedAmount(amt)}
                        className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                          timedAmount === amt
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:border-indigo-300'
                        }`}
                      >
                        ${amt}
                      </button>
                    ))}
                    
                    <div className="h-4 w-[1px] bg-slate-300 mx-1"></div>
                    
                    {/* Quick percentage buttons */}
                    {[25, 50, 75, 100].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => handleQuickPercentTimed(pct)}
                        className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-mono font-medium text-slate-600 cursor-pointer"
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>

                  {/* Amount Input & Estimated Payout */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400">$</span>
                      <input
                        type="number"
                        min={1}
                        max={wallet.usdBalance}
                        value={timedAmount || ''}
                        onChange={(e) => setTimedAmount(Number(e.target.value))}
                        placeholder="ইনভেস্টের পরিমাণ লিখুন..."
                        className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 flex items-center justify-between">
                      <span className="text-xs text-emerald-900 font-medium">সম্ভাব্য মোট রিটার্ন (+85%):</span>
                      <span className="text-sm font-bold font-mono text-emerald-700">
                        +${(timedAmount * 1.85).toFixed(2)} USD
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Win/Loss Chance Transparency Box */}
                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div>
                      <span className="font-bold text-indigo-950">ট্রেড অ্যালগরিদম রুল: </span>
                      <span className="text-slate-600">জিতার সুযোগ (Win Chance) <strong>5%</strong> | লস ঝুঁকি <strong>95%</strong></span>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200 text-[11px]">
                    5% Win / 95% Loss
                  </div>
                </div>

                {/* Zero balance alert banner */}
                {wallet.usdBalance <= 0 && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        আপনার অ্যাকাউন্টে ব্যালেন্স <strong>$0.00 USD</strong>। ট্রেড শুরু করতে বিকাশ বা নগদ থেকে ডিপোজিট করুন।
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={onOpenDepositShop}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 cursor-pointer transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>ডিপোজিট করুন</span>
                    </button>
                  </div>
                )}

                {/* Feedback message */}
                {tradeFeedback && (
                  <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    tradeFeedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    {tradeFeedback.type === 'success' ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
                    <span>{tradeFeedback.msg}</span>
                  </div>
                )}

                {/* 4. DUAL DIRECTION EXECUTION BUTTONS (CALL vs PUT) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  
                  {/* CALL BUTTON (UP) */}
                  <button
                    type="button"
                    onClick={() => handleExecuteTimedTrade('CALL')}
                    disabled={wallet.usdBalance < timedAmount || timedAmount <= 0}
                    className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white shadow-lg shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-between group active:scale-[0.99]"
                  >
                    <div className="text-left">
                      <div className="text-[11px] uppercase tracking-wider text-emerald-100 font-bold flex items-center gap-1">
                        <ArrowUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
                        <span>উপরে যাবে (CALL / UP)</span>
                      </div>
                      <div className="text-lg font-extrabold font-mono mt-0.5">
                        ${timedAmount.toFixed(2)} ইনভেস্ট
                      </div>
                      <div className="text-[11px] text-emerald-200">
                        {currentDurationConfig.titleBn} শেষে প্রাইজ বাড়বে
                      </div>
                    </div>

                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white font-bold text-sm font-mono">
                      +85%
                    </div>
                  </button>

                  {/* PUT BUTTON (DOWN) */}
                  <button
                    type="button"
                    onClick={() => handleExecuteTimedTrade('PUT')}
                    disabled={wallet.usdBalance < timedAmount || timedAmount <= 0}
                    className="p-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 disabled:opacity-50 text-white shadow-lg shadow-red-600/20 transition-all cursor-pointer flex items-center justify-between group active:scale-[0.99]"
                  >
                    <div className="text-left">
                      <div className="text-[11px] uppercase tracking-wider text-rose-100 font-bold flex items-center gap-1">
                        <ArrowDown className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
                        <span>নিচে যাবে (PUT / DOWN)</span>
                      </div>
                      <div className="text-lg font-extrabold font-mono mt-0.5">
                        ${timedAmount.toFixed(2)} ইনভেস্ট
                      </div>
                      <div className="text-[11px] text-rose-200">
                        {currentDurationConfig.titleBn} শেষে প্রাইজ কমবে
                      </div>
                    </div>

                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white font-bold text-sm font-mono">
                      +85%
                    </div>
                  </button>

                </div>

              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* MODE 2: SPOT MARKET TRADING (Shares) */}
            {/* ---------------------------------------------------- */}
            {terminalMode === 'spot' && (
              <form onSubmit={handleExecuteSpotTrade} className="space-y-4">
                
                {/* BUY / SELL Switcher */}
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setSpotTradeType('BUY')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      spotTradeType === 'BUY'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    বাই (BUY / LONG)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSpotTradeType('SELL')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      spotTradeType === 'SELL'
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    সেল (SELL / SHORT)
                  </button>
                </div>

                {/* Mode toggle */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSpotOrderMode('dollars')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                      spotOrderMode === 'dollars' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    ডলার ($ USD)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSpotOrderMode('shares')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                      spotOrderMode === 'shares' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    শেয়ার সংখ্যা (Shares)
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {spotOrderMode === 'dollars' ? 'ইনভেস্টের পরিমাণ ($ USD):' : 'শেয়ার সংখ্যা (Shares):'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400">
                        {spotOrderMode === 'dollars' ? '$' : '#'}
                      </span>
                      <input
                        type="number"
                        min={0.1}
                        step={spotOrderMode === 'dollars' ? 10 : 0.1}
                        value={spotOrderAmount || ''}
                        onChange={(e) => setSpotOrderAmount(Number(e.target.value))}
                        className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-500 block">
                        {spotOrderMode === 'dollars' ? 'শেয়ার পাবেন:' : 'মোট মূল্য (USD):'}
                      </span>
                      <span className="font-mono font-bold text-base text-slate-900">
                        {spotOrderMode === 'dollars' ? `${calculatedShares} Shares` : `$${totalRequiredSpotUSD.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-500 block">টাকায় সমতুল্য:</span>
                      <span className="font-mono font-bold text-xs text-indigo-600">
                        ৳{(totalRequiredSpotUSD * 122).toLocaleString()} BDT
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!hasSufficientSpotBalance}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    spotTradeType === 'BUY'
                      ? 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white'
                      : 'bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white'
                  }`}
                >
                  <span>
                    {spotTradeType === 'BUY' ? 'স্পট বাই অর্ডার এক্সিকিউট করুন' : 'স্পট সেল অর্ডার এক্সিকিউট করুন'} (${totalRequiredSpotUSD.toFixed(2)})
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

          </div>

        </div>

      </div>

      {/* ---------------------------------------------------- */}
      {/* BOTTOM SECTION: ACTIVE TIMED TRADES & TRADE JOURNAL */}
      {/* ---------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Tab Headers */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveBottomTab('timed')}
              className={`text-sm font-bold pb-1 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeBottomTab === 'timed'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Timer className="w-4 h-4" />
              <span>চলমান টাইমড ট্রেডস ({timedTrades.length})</span>
            </button>

            <button
              onClick={() => setActiveBottomTab('positions')}
              className={`text-sm font-bold pb-1 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeBottomTab === 'positions'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>ওপেন স্পট পজিশন ({positions.length})</span>
            </button>

            <button
              onClick={() => setActiveBottomTab('history')}
              className={`text-sm font-bold pb-1 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeBottomTab === 'history'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>সম্পন্ন ট্রেড হিস্টোরি ({closedTrades.length})</span>
            </button>
          </div>

          <span className="text-xs text-slate-500 font-mono hidden sm:inline-block">
            স্বয়ংক্রিয় সেটেলমেন্ট সিঙ্ক
          </span>
        </div>

        {/* TAB 1: ACTIVE TIMED TRADES */}
        {activeBottomTab === 'timed' && (
          <div className="p-5">
            {timedTrades.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs space-y-1">
                <Timer className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-600">কোনো চলমান টাইমড ট্রেড নেই।</p>
                <p>উপরের টার্মিনাল থেকে ১ মিনিট বা তার বেশি সময় সিলেক্ট করে CALL 🟢 বা PUT 🔴 ট্রেড ওপেন করুন।</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {timedTrades.map((trade) => {
                  const remainingSeconds = Math.max(0, Math.ceil((trade.expiresAt - Date.now()) / 1000));
                  const progressPct = Math.min(100, Math.max(0, ((trade.durationSeconds - remainingSeconds) / trade.durationSeconds) * 100));
                  const isCall = trade.direction === 'CALL';
                  const isPriceUp = trade.currentPrice >= trade.strikePrice;
                  const isInMoney = isCall ? isPriceUp : !isPriceUp;

                  return (
                    <div 
                      key={trade.id} 
                      className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${
                        isInMoney 
                          ? 'bg-emerald-50/40 border-emerald-200' 
                          : 'bg-rose-50/40 border-rose-200'
                      }`}
                    >
                      {/* Top Progress Bar */}
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100">
                        <div 
                          className={`h-full transition-all duration-1000 ${isCall ? 'bg-emerald-500' : 'bg-rose-500'}`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>

                      {/* Header */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold font-mono uppercase ${
                            isCall ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                          }`}>
                            {trade.duration} • {trade.direction}
                          </span>
                          <span className="font-mono font-black text-slate-900 text-sm">{trade.symbol}</span>
                        </div>

                        {/* Live Countdown Clock */}
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 text-white text-xs font-mono font-bold">
                          <Clock className="w-3 h-3 text-amber-400 animate-spin" />
                          <span>{getRemainingTimeStr(trade.expiresAt)}</span>
                        </div>
                      </div>

                      {/* Strike & Live Prices */}
                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200/60 font-mono text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block">স্ট্রাইক প্রাইজ:</span>
                          <span className="font-bold text-slate-800">${trade.strikePrice.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block">বর্তমান প্রাইজ:</span>
                          <span className={`font-bold ${isPriceUp ? 'text-emerald-600' : 'text-red-600'}`}>
                            ${trade.currentPrice.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Investment & Potential Payout */}
                      <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 block">ইনভেস্ট ফান্ড:</span>
                          <span className="font-mono font-bold text-slate-900">${trade.investedAmount.toFixed(2)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block">সম্ভাব্য লাভ (+85%):</span>
                          <span className="font-mono font-bold text-emerald-600">
                            +${(trade.investedAmount * 0.85).toFixed(2)} USD
                          </span>
                        </div>
                      </div>

                      {/* Status indicator */}
                      <div className="mt-3 text-center">
                        <span className={`inline-block w-full py-1 rounded-lg text-[11px] font-bold ${
                          isInMoney 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {isInMoney ? '🟢 ইন দ্য মানি (লাভজনক অবস্থানে)' : '🔴 আউট অব দ্য মানি'}
                        </span>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: OPEN SPOT POSITIONS */}
        {activeBottomTab === 'positions' && (
          <div className="overflow-x-auto">
            {positions.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                কোনো চলমান স্পট পজিশন নেই।
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="p-3.5">স্টক / ধরন</th>
                    <th className="p-3.5">শেয়ার</th>
                    <th className="p-3.5 font-mono">এন্ট্রি প্রাইজ</th>
                    <th className="p-3.5 font-mono">বর্তমান প্রাইজ</th>
                    <th className="p-3.5 font-mono">ইনভেস্ট ফান্ড</th>
                    <th className="p-3.5 font-mono text-right">লাভ / ক্ষতি (P&L)</th>
                    <th className="p-3.5 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {positions.map((pos) => {
                    const isProfit = pos.pnl >= 0;
                    return (
                      <tr key={pos.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              pos.type === 'BUY' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {pos.type}
                            </span>
                            <span className="font-mono font-bold text-slate-900">{pos.symbol}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">{pos.stockName}</div>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-slate-800">{pos.shares}</td>
                        <td className="p-3.5 font-mono text-slate-600">${pos.entryPrice.toFixed(2)}</td>
                        <td className="p-3.5 font-mono font-bold text-slate-900">${pos.currentPrice.toFixed(2)}</td>
                        <td className="p-3.5 font-mono text-slate-800">${pos.investedAmount.toFixed(2)}</td>
                        <td className="p-3.5 font-mono text-right">
                          <div className={`font-bold ${isProfit ? 'text-emerald-600' : 'text-red-600'}`}>
                            {isProfit ? '+' : ''}${pos.pnl.toFixed(2)} ({isProfit ? '+' : ''}{pos.pnlPercent.toFixed(2)}%)
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {isProfit ? '+' : ''}৳{(pos.pnl * 122).toFixed(0)} BDT
                          </div>
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => handleCloseSpotPosition(pos)}
                            className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white font-bold text-xs transition-all cursor-pointer shadow-2xs"
                          >
                            পজিশন ক্লোজ
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 3: CLOSED TRADES */}
        {activeBottomTab === 'history' && (
          <div className="overflow-x-auto">
            {closedTrades.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                কোনো সম্পন্ন ট্রেড হিস্টোরি নেই।
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="p-3.5">স্টক ও মোড</th>
                    <th className="p-3.5">টাইপ / ডিরেকশন</th>
                    <th className="p-3.5 font-mono">এন্ট্রি ➔ এক্সিট</th>
                    <th className="p-3.5 font-mono">ইনভেস্ট ফান্ড</th>
                    <th className="p-3.5 font-mono">ফেরত প্রাপ্ত</th>
                    <th className="p-3.5 font-mono text-right">রিয়েলাইজড P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {closedTrades.map((t) => {
                    const isProfit = t.pnl >= 0;
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/70">
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-900">{t.symbol}</span>
                            {t.isTimedTrade && (
                              <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[9px] font-bold font-mono">
                                {t.duration} TIMED
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400">{t.closedAt}</div>
                        </td>
                        <td className="p-3.5">
                          {t.outcome ? (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              t.outcome === 'WON' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {t.direction === 'CALL' ? '🟢 CALL' : '🔴 PUT'} ({t.outcome})
                            </span>
                          ) : (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              t.type === 'BUY' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {t.type}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 font-mono text-slate-700">
                          ${t.entryPrice.toFixed(2)} ➔ ${t.exitPrice.toFixed(2)}
                        </td>
                        <td className="p-3.5 font-mono text-slate-700">${t.investedAmount.toFixed(2)}</td>
                        <td className="p-3.5 font-mono font-bold text-slate-900">${t.returnedAmount.toFixed(2)}</td>
                        <td className="p-3.5 font-mono text-right">
                          <span className={`font-bold ${isProfit ? 'text-emerald-600' : 'text-red-600'}`}>
                            {isProfit ? '+' : ''}${t.pnl.toFixed(2)} ({isProfit ? '+' : ''}{t.pnlPercent.toFixed(2)}%)
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

      </div>

      {/* ---------------------------------------------------- */}
      {/* TRADE SETTLEMENT RESULT POPUP MODAL */}
      {/* ---------------------------------------------------- */}
      {recentSettlementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
            
            <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center shadow-inner ${
              recentSettlementModal.outcome === 'WON'
                ? 'bg-emerald-100 text-emerald-600'
                : 'bg-rose-100 text-rose-600'
            }`}>
              {recentSettlementModal.outcome === 'WON' ? (
                <Award className="w-9 h-9" />
              ) : (
                <AlertCircle className="w-9 h-9" />
              )}
            </div>

            <div>
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                recentSettlementModal.outcome === 'WON'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}>
                {recentSettlementModal.outcome === 'WON' ? '🎉 ট্রেড উইন হয়েছেন (Trade Won)' : 'ট্রেড লস হয়েছে (Trade Lost)'}
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-2 font-mono">
                {recentSettlementModal.outcome === 'WON' ? `+$${recentSettlementModal.pnl.toFixed(2)} USD লাভ` : `-$${Math.abs(recentSettlementModal.pnl).toFixed(2)} USD`}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {recentSettlementModal.trade.symbol} • {recentSettlementModal.trade.duration} {recentSettlementModal.trade.direction === 'CALL' ? 'CALL 🟢' : 'PUT 🔴'}
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5 text-left font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">ইনভেস্ট ফান্ড:</span>
                <span className="font-bold text-slate-900">${recentSettlementModal.trade.investedAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">স্ট্রাইক প্রাইজ:</span>
                <span className="text-slate-800">${recentSettlementModal.trade.strikePrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">সেটেলমেন্ট প্রাইজ:</span>
                <span className="text-slate-800">${(recentSettlementModal.trade.settledPrice || recentSettlementModal.trade.strikePrice).toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 text-indigo-700 font-bold">
                <span>বর্তমান ব্যালেন্স:</span>
                <span>${wallet.usdBalance.toFixed(2)} USD</span>
              </div>
            </div>

            <button
              onClick={() => setRecentSettlementModal(null)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              চালিয়ে যান (Continue Trading)
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
