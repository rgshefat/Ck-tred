import React, { useState, useEffect } from 'react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Copy, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  ArrowRight, 
  RefreshCw, 
  Smartphone, 
  Building2, 
  ExternalLink,
  Info,
  Clock,
  Zap,
  Lock,
  X,
  ServerOff,
  Timer,
  AlertCircle,
  HelpCircle,
  Hash,
  Wallet
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DepositPaymentMethod, DepositTransaction, UserTradingWallet, WithdrawTransaction } from '../types';

interface DepositShopViewProps {
  wallet: UserTradingWallet;
  deposits: DepositTransaction[];
  onDepositConfirmed: (transaction: DepositTransaction) => void;
  onWithdrawFunds: (amountUSD: number, method: DepositPaymentMethod, receiverNo: string) => boolean;
  baseCurrency: string;
  onOpenTrading: () => void;
  initialSubTab?: 'deposit' | 'withdraw' | 'history';
}

const METHODS_LIST = [
  {
    id: 'bkash' as DepositPaymentMethod,
    name: 'bKash (বিকাশ)',
    number: '01883308311',
    type: 'Personal Send Money',
    color: 'bg-pink-50 border-pink-200 text-pink-700',
    iconBg: 'bg-pink-600',
    accountHolder: 'Official bKash Personal Wallet',
  },
  {
    id: 'nagad' as DepositPaymentMethod,
    name: 'Nagad (নগদ)',
    number: '01883308311',
    type: 'Personal Send Money',
    color: 'bg-amber-50 border-amber-200 text-amber-700',
    iconBg: 'bg-amber-600',
    accountHolder: 'Official Nagad Personal Wallet',
  },
  {
    id: 'bank_transfer' as DepositPaymentMethod,
    name: 'Bank Wire (ব্যাংক ট্রান্সফার)',
    number: '205.120.987654',
    type: 'City Bank / Islami Bank / DBBL',
    color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    iconBg: 'bg-emerald-600',
    accountHolder: 'GLOBAL LEDGER TRADING LTD',
  },
  {
    id: 'rocket' as DepositPaymentMethod,
    name: 'Rocket (রকেট)',
    number: '01883308311',
    type: 'DBBL Rocket Send Money',
    color: 'bg-purple-50 border-purple-200 text-purple-700',
    iconBg: 'bg-purple-600',
    accountHolder: 'Official Rocket Personal Wallet',
  },
];

export const DepositShopView: React.FC<DepositShopViewProps> = ({
  wallet,
  deposits,
  onDepositConfirmed,
  onWithdrawFunds,
  baseCurrency,
  onOpenTrading,
  initialSubTab = 'deposit',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'deposit' | 'withdraw' | 'history'>(initialSubTab);
  const [selectedMethod, setSelectedMethod] = useState<DepositPaymentMethod>('bkash');
  const [bdtAmount, setBdtAmount] = useState<number>(6100);
  const [senderPhone, setSenderPhone] = useState<string>('');
  const [trxId, setTrxId] = useState<string>('');
  const [copiedNum, setCopiedNum] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Withdraw state
  const [withdrawAmountUSD, setWithdrawAmountUSD] = useState<number>(10);
  const [withdrawMethod, setWithdrawMethod] = useState<DepositPaymentMethod>('bkash');
  const [withdrawReceiver, setWithdrawReceiver] = useState<string>('');
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [showNoticeModal, setShowNoticeModal] = useState<boolean>(false);
  const [activeWithdrawalData, setActiveWithdrawalData] = useState<{
    refId: string;
    usdAmount: number;
    bdtAmount: number;
    methodTitle: string;
    receiver: string;
    submittedAt: string;
  } | null>(null);

  // Local storage based withdrawal history
  const [withdrawHistory, setWithdrawHistory] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('gl_withdraw_history_v2');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 24 Hour Countdown Timer (in seconds = 86400)
  const [countdownSeconds, setCountdownSeconds] = useState<number>(86340);

  useEffect(() => {
    let timer: any = null;
    if (showNoticeModal && countdownSeconds > 0) {
      timer = setInterval(() => {
        setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [showNoticeModal, countdownSeconds]);

  const format24hCountdown = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${String(hours).padStart(2, '0')}h : ${String(mins).padStart(2, '0')}m : ${String(secs).padStart(2, '0')}s`;
  };

  const exchangeRate = 122.0; // 1 USD = 122 BDT
  const calculatedUSD = Number((bdtAmount / exchangeRate).toFixed(2));
  const activeMethodObj = METHODS_LIST.find((m) => m.id === selectedMethod) || METHODS_LIST[0];

  const handleCopy = (num: string) => {
    navigator.clipboard.writeText(num.replace(/-/g, ''));
    setCopiedNum(true);
    setTimeout(() => setCopiedNum(false), 2500);
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!bdtAmount || bdtAmount < 100) {
      setErrorMsg('ন্যূনতম ১০০ টাকা সিলেক্ট করুন (Minimum deposit is 100 BDT)');
      return;
    }

    if (!senderPhone.trim()) {
      setErrorMsg('অনুগ্রহ করে আপনার প্রেরক বিকাশ/নগদ নাম্বার দিন (Enter sender phone)');
      return;
    }

    if (!trxId.trim()) {
      setErrorMsg('অনুগ্রহ করে SMS থেকে প্রাপ্ত TrxID লিখুন (Enter Transaction ID)');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      const newTx: DepositTransaction = {
        id: `dep_${Date.now()}`,
        method: selectedMethod,
        methodTitle: activeMethodObj.name,
        bdtAmount: Number(bdtAmount),
        usdAmount: calculatedUSD,
        exchangeRate: exchangeRate,
        senderNumber: senderPhone.trim(),
        destinationNumber: activeMethodObj.number,
        transactionId: trxId.trim().toUpperCase(),
        status: 'completed',
        createdAt: new Date().toLocaleString(),
        confirmedAt: new Date().toLocaleString(),
        notes: 'BDT to USD conversion instant credit',
      };

      onDepositConfirmed(newTx);
      setIsProcessing(false);
      setSenderPhone('');
      setTrxId('');

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }, 1100);
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError(null);

    if (!withdrawReceiver.trim() || withdrawReceiver.trim().length < 10) {
      setWithdrawError('অনুগ্রহ করে সঠিক ১১ ডিজিটের বিকাশ বা নগদ নাম্বার দিন (Enter valid 11-digit phone number)');
      return;
    }

    if (!withdrawAmountUSD || withdrawAmountUSD <= 0) {
      setWithdrawError('অনুগ্রহ করে উত্তোলনের পরিমাণ দিন (Enter valid amount in USD)');
      return;
    }

    if (withdrawAmountUSD > wallet.usdBalance) {
      setWithdrawError(`পর্যাপ্ত ব্যালেন্স নেই! আপনার ওয়ালেটে আছে $${wallet.usdBalance.toFixed(2)} USD, আপনি রিকোয়েস্ট করেছেন $${withdrawAmountUSD.toFixed(2)} USD.`);
      return;
    }

    // Process Withdrawal
    const success = onWithdrawFunds(withdrawAmountUSD, withdrawMethod, withdrawReceiver);
    if (!success) {
      setWithdrawError('উত্তোলন ব্যর্থ হয়েছে। অনুগ্রহ করে ব্যালেন্স চেক করুন।');
      return;
    }

    const refId = `WD-${Math.floor(100000 + Math.random() * 900000)}`;
    const bdtAmountToReceive = Number((withdrawAmountUSD * exchangeRate).toFixed(2));
    const selectedWithdrawObj = METHODS_LIST.find((m) => m.id === withdrawMethod) || METHODS_LIST[0];

    const newWithdrawRecord = {
      id: `wdr_${Date.now()}`,
      refId,
      usdAmount: withdrawAmountUSD,
      bdtAmount: bdtAmountToReceive,
      method: withdrawMethod,
      methodTitle: selectedWithdrawObj.name,
      receiver: withdrawReceiver.trim(),
      status: '24h_pending',
      statusCode: '404-GATEWAY-24H-PENDING',
      createdAt: new Date().toLocaleString(),
    };

    const updatedHistory = [newWithdrawRecord, ...withdrawHistory];
    setWithdrawHistory(updatedHistory);
    try {
      localStorage.setItem('gl_withdraw_history_v2', JSON.stringify(updatedHistory));
    } catch (err) {
      console.warn('Failed to save withdraw history', err);
    }

    setActiveWithdrawalData({
      refId,
      usdAmount: withdrawAmountUSD,
      bdtAmount: bdtAmountToReceive,
      methodTitle: selectedWithdrawObj.name,
      receiver: withdrawReceiver.trim(),
      submittedAt: new Date().toLocaleString(),
    });

    setShowNoticeModal(true);
    setWithdrawReceiver('');
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Top Banner & Wallet Balance Highlights */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>বিকাশ, নগদ ও ব্যাংক ক্যাশিয়ার ডেস্ক (BDT & USD Hub)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              টাকা ডিপোজিট ও ওয়ালেট উইথড্রয়াল হাব
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              বিকাশ বা নগদ থেকে টাকা পাঠিয়ে ওয়ালেটে ডলার ($ USD) ডিপোজিট করুন এবং যেকোনো সময় উপার্জিত অর্থ সরাসরি বিকাশ বা নগদে উইথড্রয়াল করে নিন।
            </p>
          </div>

          {/* Balance Widget */}
          <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15 min-w-[280px] space-y-2">
            <span className="text-xs uppercase font-bold text-slate-300 tracking-wider block">
              ট্রেডিং ব্যালেন্স (Available Cash):
            </span>
            <div className="text-3xl font-extrabold text-emerald-400 font-mono tracking-tight">
              ${wallet.usdBalance.toFixed(2)} <span className="text-sm font-sans text-white/80 font-normal">USD</span>
            </div>
            <div className="text-xs text-slate-300 font-mono flex items-center justify-between pt-1.5 border-t border-white/10">
              <span>টাকায় সমতুল্য:</span>
              <strong className="text-white">৳{(wallet.usdBalance * exchangeRate).toLocaleString()} BDT</strong>
            </div>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-white/10">
          <button
            onClick={() => setActiveSubTab('deposit')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'deposit'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
            <span>টাকা ডিপোজিট করুন (Deposit USD)</span>
          </button>
          
          <button
            onClick={() => setActiveSubTab('withdraw')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'withdraw'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            <ArrowUpRight className="w-4 h-4 text-amber-300" />
            <span>টাকা উত্তোলন (Withdraw to bKash/Nagad)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'history'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            <Clock className="w-4 h-4 text-slate-300" />
            <span>লেনদেন ও উইথড্রয়াল হিস্টোরি</span>
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: DEPOSIT MONEY */}
      {activeSubTab === 'deposit' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left: Step-by-step payment form (7 cols) */}
          <div className="lg:col-span-7 space-y-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
            
            <div>
              <h2 className="text-xl font-bold text-slate-900">ধাপ ১: পেমেন্ট মেথড নির্বাচন করুন</h2>
              <p className="text-xs text-slate-500 mt-1">নিচে দেওয়া বিকাশ বা নগদ নাম্বারে Send Money করুন</p>
            </div>

            {/* Method Select Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {METHODS_LIST.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMethod(m.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    selectedMethod === m.id
                      ? `${m.color} ring-2 ring-indigo-500 font-bold shadow-xs scale-[1.02]`
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-xs font-black">{m.name}</div>
                  <div className="text-[10px] text-slate-500 mt-1">{m.type}</div>
                </button>
              ))}
            </div>

            {/* Payment Number & Copy Box */}
            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-3">
              <div className="flex items-center justify-between text-xs text-indigo-900 font-bold">
                <div className="flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-indigo-600" />
                  <span>{activeMethodObj.name} অফিসিয়াল পার্সোনাল নাম্বার:</span>
                </div>
                <span className="text-[10px] font-normal text-indigo-700">Send Money Only</span>
              </div>

              <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-indigo-200 shadow-xs">
                <span className="font-mono text-lg sm:text-xl font-black text-slate-900 tracking-wider">
                  {activeMethodObj.number}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(activeMethodObj.number)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  {copiedNum ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>কপি হয়েছে!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>কপি করুন</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-[11px] text-slate-600 leading-relaxed">
                👉 বিকাশ বা নগদ অ্যাপ থেকে <strong>Send Money</strong> করে উপরে দেওয়া নাম্বারে টাকা পাঠান। এরপর নিচের ফর্মে আপনার মোবাইল নাম্বার এবং <strong>TrxID</strong> লিখে কনফার্ম করুন।
              </div>
            </div>

            {/* Step 2: Amount Selection */}
            <div>
              <h2 className="text-xl font-bold text-slate-900">ধাপ ২: টাকার পরিমাণ নির্বাচন করুন</h2>
              <p className="text-xs text-slate-500 mt-1">কত টাকা সেন্ড মানি করেছেন তা সিলেক্ট করুন বা লিখুন</p>
            </div>

            {/* Amount Chips */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { bdt: 610, usd: 5 },
                { bdt: 1220, usd: 10 },
                { bdt: 3050, usd: 25 },
                { bdt: 6100, usd: 50 },
                { bdt: 12200, usd: 100 },
                { bdt: 24400, usd: 200 },
              ].map((item) => (
                <button
                  key={item.bdt}
                  type="button"
                  onClick={() => setBdtAmount(item.bdt)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    bdtAmount === item.bdt
                      ? 'bg-indigo-600 text-white border-indigo-600 font-black shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100 font-semibold'
                  }`}
                >
                  <div className="text-xs font-mono">৳{item.bdt.toLocaleString()}</div>
                  <div className={`text-[10px] ${bdtAmount === item.bdt ? 'text-indigo-100' : 'text-slate-500'}`}>
                    ${item.usd} USD
                  </div>
                </button>
              ))}
            </div>

            {/* Custom amount input */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  টাকার পরিমাণ (BDT ৳):
                </label>
                <input
                  type="number"
                  min={100}
                  step={50}
                  value={bdtAmount}
                  onChange={(e) => setBdtAmount(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  অ্যাকাউন্টে যোগ হবে (USD $):
                </label>
                <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-mono font-bold text-emerald-600 flex items-center justify-between">
                  <span>${calculatedUSD.toFixed(2)} USD</span>
                  <span className="text-[10px] text-slate-500 font-sans font-normal">@ ৳122/$</span>
                </div>
              </div>
            </div>

            {/* Step 3: Transaction Info & Submit */}
            <form onSubmit={handleDepositSubmit} className="space-y-4 pt-2 border-t border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900">ধাপ ৩: লেনদেন বিবরণী দিয়ে কনফার্ম করুন</h2>
                <p className="text-xs text-slate-500 mt-1">যে নাম্বার থেকে টাকা পাঠিয়েছেন এবং প্রাপ্ত TrxID দিন</p>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    আপনার প্রেরক মোবাইল নাম্বার:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 017XXXXXXXX বা 018XXXXXXXX"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Transaction ID (TrxID):
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BL92K0X9 বা NGD8291"
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <span>ভেরিফিকেশন সম্পন্ন হচ্ছে...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>ডিপোজিট কনফার্ম করুন (+${calculatedUSD.toFixed(2)} USD)</span>
                  </>
                )}
              </button>
            </form>

          </div>

          {/* Right: Currency Exchange Rate & Direct Trading CTA (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Live Exchange Rate Box */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">রিয়েল-টাইম কনভার্সন রেট</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">লাইভ রেট</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 font-mono text-center space-y-1">
                <div className="text-xs text-slate-500">1 USD (মার্কিন ডলার) =</div>
                <div className="text-2xl font-black text-indigo-600">122.00 ৳ BDT</div>
                <div className="text-[11px] text-emerald-600 font-medium font-sans">০% কনভার্সন ফি (Zero Fee)</div>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                বাংলাদেশ ব্যাংক এবং ওপেন মার্কেট ইন্টারব্যাংক কারেন্সি রেট অনুযায়ী প্রতিদিন স্বয়ংক্রিয়ভাবে আপডেট হয়।
              </p>
            </div>

            {/* Direct Trade CTA Card */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-lg border border-slate-800 space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <h3 className="font-bold text-base">ব্যালেন্স দিয়ে ট্রেড করুন</h3>
                <p className="text-xs text-slate-300 mt-1">
                  Apple, NVIDIA, Tesla, Microsoft ও Bitcoin সহ যেকোনো জনপ্রিয় সম্পদে সরাসরি বাই/সেল করুন।
                </p>
              </div>
              <button
                onClick={onOpenTrading}
                className="w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>স্টক মার্কেট ও ট্রেডিং টার্মিনাল</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Trust & Guarantee */}
            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 text-xs space-y-2 text-slate-600">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>১০০% নিরাপদ ও সুরক্ষিত</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                আপনার প্রতিটি সেন্ড মানি লেনদেন স্বয়ংক্রিয় এআই ট্রানজেকশন ম্যাচিং ইঞ্জিনের মাধ্যমে ২ মিনিটের মধ্যে ওয়ালেটে ক্রেডিট করা হয়।
              </p>
            </div>

          </div>

        </div>
      )}

      {/* SUB-VIEW 2: WITHDRAW BDT (বিকাশ ও নগদ উইথড্রয়াল) */}
      {activeSubTab === 'withdraw' && (
        <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">টাকা উত্তোলন (Withdraw to bKash / Nagad)</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
                24h গেটওয়ে প্রটেকশন
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              আপনার ওয়ালেটে থাকা ডলার সরাসরি বিকাশ, নগদ বা ব্যাংক একাউন্টে টাকায় কনভার্ট করে তুলে নিন।
            </p>
          </div>

          {/* Current Available Balance Preview */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">উত্তোলনযোগ্য ব্যালেন্স:</span>
              <span className="text-2xl font-black font-mono text-emerald-400">${wallet.usdBalance.toFixed(2)} USD</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">টাকায় মোট:</span>
              <span className="font-mono font-bold text-slate-200">৳{(wallet.usdBalance * exchangeRate).toLocaleString()} BDT</span>
            </div>
          </div>

          {/* Error Alert */}
          {withdrawError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{withdrawError}</span>
            </div>
          )}

          <form onSubmit={handleWithdrawSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                উত্তোলনের মেথড (Withdraw Payment Method):
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: 'bkash', label: 'বিকাশ (bKash)', color: 'border-pink-300 text-pink-700 bg-pink-50' },
                  { id: 'nagad', label: 'নগদ (Nagad)', color: 'border-amber-300 text-amber-700 bg-amber-50' },
                  { id: 'bank_transfer', label: 'ব্যাংক (Bank)', color: 'border-emerald-300 text-emerald-700 bg-emerald-50' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setWithdrawMethod(m.id as DepositPaymentMethod)}
                    className={`p-3.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                      withdrawMethod === m.id
                        ? `${m.color} ring-2 ring-indigo-500 shadow-xs font-black`
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Amount Presets */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  উত্তোলনের পরিমাণ নির্বাচন করুন ($ USD):
                </label>
                {wallet.usdBalance > 0 && (
                  <button
                    type="button"
                    onClick={() => setWithdrawAmountUSD(wallet.usdBalance)}
                    className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    সম্পূর্ণ ব্যালেন্স (${wallet.usdBalance.toFixed(2)})
                  </button>
                )}
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[5, 10, 25, 50, 100].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setWithdrawAmountUSD(amt)}
                    className={`py-2 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                      withdrawAmountUSD === amt
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  কাস্টম পরিমাণ ($ USD):
                </label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={withdrawAmountUSD}
                  onChange={(e) => setWithdrawAmountUSD(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  পাবেন (BDT ৳):
                </label>
                <div className="p-2.5 bg-slate-100 rounded-xl font-mono font-bold text-slate-900 text-sm flex items-center justify-between">
                  <span>৳{(withdrawAmountUSD * exchangeRate).toLocaleString()} BDT</span>
                  <span className="text-[10px] text-slate-500 font-sans font-normal">@ ৳122</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                আপনার প্রাপক বিকাশ/নগদ নাম্বার (Receiver Account Number):
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 017XXXXXXXX বা 018XXXXXXXX (11 Digits)"
                value={withdrawReceiver}
                onChange={(e) => setWithdrawReceiver(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <ArrowUpRight className="w-4 h-4 text-amber-300" />
              <span>উইথড্রয়াল রিকোয়েস্ট পাঠান (Submit Withdrawal)</span>
            </button>
          </form>

        </div>
      )}

      {/* SUB-VIEW 3: DEPOSIT & WITHDRAW HISTORY */}
      {activeSubTab === 'history' && (
        <div className="space-y-6">
          
          {/* Withdrawal Requests Section */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-base text-slate-900">উইথড্রয়াল রিকোয়েস্ট ও স্ট্যাটাস (Withdrawals)</h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">মোট উইথড্র: {withdrawHistory.length} টি</span>
            </div>

            {withdrawHistory.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                এখনও কোনো উইথড্রয়াল রিকোয়েস্ট পাঠানো হয়নি।
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="p-3.5">রেফারেন্স ID / তারিখ</th>
                      <th className="p-3.5">পেমেন্ট মেথড</th>
                      <th className="p-3.5">প্রাপক নাম্বার</th>
                      <th className="p-3.5 text-right">ডলার ($ USD)</th>
                      <th className="p-3.5 text-right">পাবেন (BDT ৳)</th>
                      <th className="p-3.5 text-center">স্ট্যাটাস</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {withdrawHistory.map((w) => (
                      <tr key={w.id} className="hover:bg-slate-50/60">
                        <td className="p-3.5">
                          <div className="font-mono font-bold text-slate-900">{w.refId}</div>
                          <div className="text-[10px] text-slate-400">{w.createdAt}</div>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-700">{w.methodTitle}</td>
                        <td className="p-3.5 font-mono text-slate-600">{w.receiver}</td>
                        <td className="p-3.5 text-right font-mono font-bold text-rose-600">
                          -${Number(w.usdAmount).toFixed(2)} USD
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                          ৳{Number(w.bdtAmount).toLocaleString()}
                        </td>
                        <td className="p-3.5 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                            <Clock className="w-3 h-3 text-amber-600 animate-pulse" /> 24h Pending (যাচাই চলছে)
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Deposit Ledger */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900">ডিপোজিট হিস্টোরি (Deposits)</h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">মোট ডিপোজিট: {deposits.length} টি</span>
            </div>

            {deposits.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                এখনও কোনো ডিপোজিট করা হয়নি।
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="p-3.5">TrxID / তারিখ</th>
                      <th className="p-3.5">পেমেন্ট মেথড</th>
                      <th className="p-3.5">প্রেরক নাম্বার</th>
                      <th className="p-3.5 text-right">টাকার পরিমাণ (BDT)</th>
                      <th className="p-3.5 text-right">যোগকৃত ডলার (USD)</th>
                      <th className="p-3.5 text-center">স্ট্যাটাস</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {deposits.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/60">
                        <td className="p-3.5">
                          <div className="font-mono font-bold text-slate-900">{d.transactionId}</div>
                          <div className="text-[10px] text-slate-400">{d.createdAt}</div>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-700">{d.methodTitle}</td>
                        <td className="p-3.5 font-mono text-slate-600">{d.senderNumber}</td>
                        <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                          ৳{d.bdtAmount.toLocaleString()}
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-emerald-600">
                          +${d.usdAmount.toFixed(2)} USD
                        </td>
                        <td className="p-3.5 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            <Check className="w-3 h-3" /> সফল (Approved)
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* WITHDRAWAL 24H PENDING & 404 GATEWAY NOTICE MODAL */}
      {showNoticeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 relative space-y-5 animate-scaleUp">
            
            {/* Close button */}
            <button
              onClick={() => setShowNoticeModal(false)}
              className="absolute right-4 top-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Icon & Title */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shrink-0">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase tracking-wider">
                    24h Pending Queue
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-[10px] font-bold">
                    CODE: 404-GATEWAY-PENDING
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  উইথড্রয়াল স্ট্যাটাস ও গেটওয়ে অডিট নোটিশ
                </h3>
              </div>
            </div>

            {/* Main Highlighted Notice Box */}
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2.5">
              <div className="flex items-start gap-2.5 text-amber-950">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold leading-snug">
                    আপনার উইথড্রয়াল রিকোয়েস্টটি গ্রহণ করা হয়েছে এবং সেন্ট্রাল গেটওয়ে অডিট কিউতে (24 Hours Pending Queue) রয়েছে।
                  </p>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    অ্যান্টি-ফ্রড ও ট্রানজেকশন সিকিউরিটি যাচাই শেষে আগামী <strong>১২ থেকে ২৪ ঘণ্টার</strong> মধ্যে টাকা আপনার নির্দিষ্ট বিকাশ/নগদ নাম্বারে ট্রান্সফার করা হবে।
                  </p>
                </div>
              </div>
            </div>

            {/* Withdrawal Details Summary */}
            {activeWithdrawalData && (
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-600">
                  <span>রেফারেন্স ট্র্যাকিং ID:</span>
                  <span className="font-mono font-black text-indigo-600">{activeWithdrawalData.refId}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>পেমেন্ট মেথড ও প্রাপক:</span>
                  <span className="font-mono font-bold text-slate-900">{activeWithdrawalData.methodTitle} ({activeWithdrawalData.receiver})</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 pt-1.5 border-t border-slate-200">
                  <span>উত্তোলনের মোট পরিমাণ:</span>
                  <span className="font-mono font-black text-slate-900">
                    ${activeWithdrawalData.usdAmount.toFixed(2)} USD (৳{activeWithdrawalData.bdtAmount.toLocaleString()} BDT)
                  </span>
                </div>
              </div>
            )}

            {/* 24-Hour Live Countdown Timer */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between shadow-inner">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-amber-400">
                  <Timer className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-300">অডিট প্রসেসিং কাউন্টডাউন</div>
                  <div className="text-xs font-semibold text-amber-300">Status: 24h Queue Pending</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-base font-black text-amber-400 tracking-wider">
                  {format24hCountdown(countdownSeconds)}
                </div>
                <div className="text-[10px] text-slate-400">সর্বোচ্চ সময়সীমা: ২৪ ঘণ্টা</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => {
                  setShowNoticeModal(false);
                  setActiveSubTab('history');
                }}
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer text-center"
              >
                উইথড্রয়াল হিস্টোরি দেখুন
              </button>
              <button
                onClick={() => setShowNoticeModal(false)}
                className="px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all cursor-pointer"
              >
                ঠিক আছে (Close)
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
