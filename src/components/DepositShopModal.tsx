import React, { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  ArrowRight, 
  ArrowUpRight,
  ShieldCheck, 
  Sparkles, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Smartphone,
  Timer,
  AlertTriangle,
  Wallet
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DepositPaymentMethod, DepositTransaction, UserTradingWallet } from '../types';

interface DepositShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: UserTradingWallet;
  onDepositConfirmed: (transaction: DepositTransaction) => void;
  onWithdrawFunds?: (amountUSD: number, method: DepositPaymentMethod, receiverNo: string) => boolean;
  baseCurrency?: string;
  defaultTab?: 'deposit' | 'withdraw';
}

interface PaymentOptionConfig {
  id: DepositPaymentMethod;
  name: string;
  nameBn: string;
  number: string;
  type: string;
  color: string;
  badge: string;
  accountHolder?: string;
}

const PAYMENT_METHODS: PaymentOptionConfig[] = [
  {
    id: 'bkash',
    name: 'bKash',
    nameBn: 'বিকাশ (bKash)',
    number: '01883308311',
    type: 'Personal (Send Money)',
    color: 'from-pink-600 to-rose-600',
    badge: 'বিকাশ সেন্ড মানি',
    accountHolder: 'Official bKash Personal Wallet',
  },
  {
    id: 'nagad',
    name: 'Nagad',
    nameBn: 'নগদ (Nagad)',
    number: '01883308311',
    type: 'Personal (Send Money)',
    color: 'from-amber-600 to-orange-600',
    badge: 'নগদ সেন্ড মানি',
    accountHolder: 'Official Nagad Personal Wallet',
  },
  {
    id: 'bank_transfer',
    name: 'Bank Wire',
    nameBn: 'ব্যাংক ট্রান্সফার (Bank)',
    number: '205.120.987654',
    type: 'City Bank / Islami Bank',
    color: 'from-emerald-600 to-teal-700',
    badge: 'অনলাইন ব্যাংক ডিপোজিট',
    accountHolder: 'GLOBAL LEDGER TRADING LTD',
  },
  {
    id: 'rocket',
    name: 'Rocket',
    nameBn: 'রকেট (DBBL Rocket)',
    number: '01883308311',
    type: 'Personal Send Money',
    color: 'from-purple-600 to-indigo-700',
    badge: 'রকেট ডিপোজিট',
    accountHolder: 'Official Rocket Personal Wallet',
  },
];

export const DepositShopModal: React.FC<DepositShopModalProps> = ({
  isOpen,
  onClose,
  wallet,
  onDepositConfirmed,
  onWithdrawFunds,
  defaultTab = 'deposit',
}) => {
  const [modalTab, setModalTab] = useState<'deposit' | 'withdraw'>(defaultTab);
  const [selectedMethodId, setSelectedMethodId] = useState<DepositPaymentMethod>('bkash');
  const [bdtAmountInput, setBdtAmountInput] = useState<number>(6100); // 6100 BDT = $50 USD
  const [senderNumber, setSenderNumber] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successTx, setSuccessTx] = useState<DepositTransaction | null>(null);

  // Withdraw in modal
  const [withdrawUSD, setWithdrawUSD] = useState<number>(10);
  const [withdrawReceiver, setWithdrawReceiver] = useState<string>('');
  const [withdrawNoticeOpen, setWithdrawNoticeOpen] = useState<boolean>(false);
  const [withdrawActiveRef, setWithdrawActiveRef] = useState<string>('');
  const [countdownSeconds, setCountdownSeconds] = useState<number>(86340);

  useEffect(() => {
    let timer: any = null;
    if (withdrawNoticeOpen && countdownSeconds > 0) {
      timer = setInterval(() => {
        setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [withdrawNoticeOpen, countdownSeconds]);

  if (!isOpen) return null;

  const currentMethod = PAYMENT_METHODS.find((m) => m.id === selectedMethodId) || PAYMENT_METHODS[0];
  const exchangeRate = 122.0; // 1 USD = 122 BDT
  const calculatedUSD = Number((bdtAmountInput / exchangeRate).toFixed(2));

  const format24h = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2, '0')}h : ${String(m).padStart(2, '0')}m : ${String(s).padStart(2, '0')}s`;
  };

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(currentMethod.number.replace(/-/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleConfirmDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!bdtAmountInput || bdtAmountInput < 100) {
      setErrorMessage('অনুগ্রহ করে ন্যূনতম ১০০ টাকা ডিপোজিট সিলেক্ট করুন।');
      return;
    }

    if (!senderNumber.trim()) {
      setErrorMessage('অনুগ্রহ করে আপনার প্রেরক বিকাশ/নগদ/ব্যাংক নাম্বার লিখুন।');
      return;
    }

    if (!transactionId.trim() || transactionId.trim().length < 4) {
      setErrorMessage('অনুগ্রহ করে সঠিক Transaction ID (TrxID) লিখুন।');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const newTransaction: DepositTransaction = {
        id: `dep_${Date.now()}`,
        method: selectedMethodId,
        methodTitle: currentMethod.nameBn,
        bdtAmount: Number(bdtAmountInput),
        usdAmount: calculatedUSD,
        exchangeRate: exchangeRate,
        senderNumber: senderNumber.trim(),
        destinationNumber: currentMethod.number,
        transactionId: transactionId.trim().toUpperCase(),
        status: 'completed',
        createdAt: new Date().toLocaleString(),
        confirmedAt: new Date().toLocaleString(),
        notes: `Instant dollar credit via ${currentMethod.name} Send Money`,
      };

      onDepositConfirmed(newTransaction);
      setIsSubmitting(false);
      setSuccessTx(newTransaction);

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    }, 1200);
  };

  const handleConfirmWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!withdrawReceiver.trim() || withdrawReceiver.trim().length < 10) {
      setErrorMessage('অনুগ্রহ করে সঠিক ১১ ডিজিটের বিকাশ বা নগদ নাম্বার দিন');
      return;
    }

    if (!withdrawUSD || withdrawUSD <= 0) {
      setErrorMessage('উত্তোলনের পরিমাণ দিন');
      return;
    }

    if (withdrawUSD > wallet.usdBalance) {
      setErrorMessage(`পর্যাপ্ত ব্যালেন্স নেই! আপনার ওয়ালেটে আছে $${wallet.usdBalance.toFixed(2)} USD.`);
      return;
    }

    if (onWithdrawFunds) {
      const ok = onWithdrawFunds(withdrawUSD, selectedMethodId, withdrawReceiver);
      if (!ok) {
        setErrorMessage('উত্তোলন ব্যর্থ হয়েছে।');
        return;
      }
    }

    const ref = `WD-${Math.floor(100000 + Math.random() * 900000)}`;
    setWithdrawActiveRef(ref);
    setWithdrawNoticeOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 relative space-y-5 animate-scaleUp my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header & Tabs */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pr-8">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  ক্যাশিয়ার ও ওয়ালেট হাব
                </h3>
                <p className="text-[11px] text-slate-500">বিকাশ ও নগদ ডিপোজিট / উইথড্রয়াল</p>
              </div>
            </div>

            {/* Current Balance */}
            <div className="text-right bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <div className="text-[10px] text-slate-400 font-bold uppercase">ব্যালেন্স:</div>
              <div className="font-mono font-black text-xs text-emerald-600">${wallet.usdBalance.toFixed(2)} USD</div>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setSuccessTx(null);
                setWithdrawNoticeOpen(false);
                setModalTab('deposit');
              }}
              className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                modalTab === 'deposit'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              টাকা ডিপোজিট (Deposit)
            </button>

            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setSuccessTx(null);
                setWithdrawNoticeOpen(false);
                setModalTab('withdraw');
              }}
              className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                modalTab === 'withdraw'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              টাকা উত্তোলন (Withdraw)
            </button>
          </div>
        </div>

        {/* ---------------- DEPOSIT TAB ---------------- */}
        {modalTab === 'deposit' && (
          <>
            {successTx ? (
              <div className="p-6 text-center space-y-4 bg-emerald-50 rounded-2xl border border-emerald-200 animate-scaleUp">
                <div className="w-14 h-14 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-emerald-950">ডিপোজিট সফল হয়েছে!</h4>
                  <p className="text-xs text-emerald-800 mt-1">
                    আপনার ট্রেডিং অ্যাকাউন্টে <strong>+${successTx.usdAmount.toFixed(2)} USD</strong> যুক্ত হয়েছে।
                  </p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-emerald-200 text-xs font-mono text-slate-700">
                  <div>TrxID: <strong>{successTx.transactionId}</strong></div>
                  <div>যোগকৃত পরিমাণ: <strong>৳{successTx.bdtAmount.toLocaleString()} BDT</strong></div>
                </div>
                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  ট্রেডিং শুরু করুন
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirmDeposit} className="space-y-4">
                {/* Method selector */}
                <div className="grid grid-cols-4 gap-2">
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setSelectedMethodId(method.id)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        selectedMethodId === method.id
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold shadow-2xs'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 text-xs'
                      }`}
                    >
                      <div className="text-xs font-bold">{method.name}</div>
                    </button>
                  ))}
                </div>

                {/* Send Money Number Card */}
                <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-200 space-y-2">
                  <div className="flex items-center justify-between text-xs text-indigo-950 font-bold">
                    <span>{currentMethod.nameBn} Send Money নাম্বার:</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-200/60 text-indigo-900 font-bold">Personal Account</span>
                  </div>
                  <div className="flex items-center justify-between bg-white px-3.5 py-2.5 rounded-xl border border-indigo-200 shadow-2xs">
                    <span className="font-mono text-base font-black text-slate-900 tracking-wider">
                      {currentMethod.number}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyNumber}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'কপি হয়েছে' : 'কপি করুন'}</span>
                    </button>
                  </div>
                </div>

                {/* BENGALI NOTICE BOX: HOW TO SEND MONEY & STRICT AMOUNT WARNING */}
                <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-300 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-amber-900 font-black">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>জরুরি নোটিশ: Send Money করার নিয়ম ও নির্দেশাবলী</span>
                  </div>
                  <div className="space-y-1.5 text-amber-950 text-[11px] leading-relaxed">
                    <div className="flex items-start gap-1.5">
                      <span className="font-bold text-amber-700">১.</span>
                      <span>বিকাশ/নগদ অ্যাপে গিয়ে অবশ্যই <strong>"Send Money" (সেন্ড মানি)</strong> করবেন। (ক্যাশ আউট বা মোবাইল রিচার্জ করলে সিস্টেমে ডিপোজিট জমা হবে না)।</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="font-bold text-amber-700">২.</span>
                      <span>
                        সঠিক টাকার পরিমাণ: নিচে আপনি যে অংক নির্ধারণ করবেন (যেমন <strong>৳{bdtAmountInput} টাকা</strong>), ঠিক <strong>তত টাকাই</strong> সেন্ড মানি করতে হবে। 
                        <span className="text-red-700 font-black block mt-0.5">⚠️ সতর্কবার্তা: টাকার পরিমাণ কম দিলে ডিপোজিট গ্রহণ করা হবে না এবং ট্রানজেকশন বাতিল হয়ে যাবে।</span>
                      </span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="font-bold text-amber-700">৩.</span>
                      <span>টাকা পাঠানো সম্পন্ন হলে ফিরতি SMS থেকে প্রাপ্ত <strong>Transaction ID (TrxID)</strong> এবং আপনার <strong>প্রেরক বিকাশ/নগদ নাম্বার</strong> নিচের বক্সে বসিয়ে কনফার্ম বাটনে চাপ দিন।</span>
                    </div>
                  </div>
                </div>

                {/* Amount presets */}
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { bdt: 610, usd: 5 },
                    { bdt: 1220, usd: 10 },
                    { bdt: 3050, usd: 25 },
                    { bdt: 6100, usd: 50 },
                    { bdt: 12200, usd: 100 },
                  ].map((p) => (
                    <button
                      key={p.bdt}
                      type="button"
                      onClick={() => setBdtAmountInput(p.bdt)}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        bdtAmountInput === p.bdt
                          ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 text-xs hover:border-slate-300'
                      }`}
                    >
                      <div className="font-mono font-bold text-xs">৳{p.bdt}</div>
                      <div className="text-[10px]">${p.usd}</div>
                    </button>
                  ))}
                </div>

                {/* Custom inputs */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      টাকার পরিমাণ (BDT):
                    </label>
                    <input
                      type="number"
                      min={100}
                      value={bdtAmountInput}
                      onChange={(e) => setBdtAmountInput(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      পাবেন (USD):
                    </label>
                    <div className="p-2.5 bg-slate-100 rounded-xl text-xs font-mono font-bold text-emerald-600">
                      ${calculatedUSD.toFixed(2)} USD
                    </div>
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="প্রেরক নাম্বার (017XXXXXXXX)"
                    value={senderNumber}
                    onChange={(e) => setSenderNumber(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white"
                  />
                  <input
                    type="text"
                    required
                    placeholder="TrxID (e.g. BL92K0X9)"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase text-slate-900 focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>ভেরিফাই হচ্ছে...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>ডিপোজিট কনফার্ম করুন (+${calculatedUSD.toFixed(2)} USD)</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </>
        )}

        {/* ---------------- WITHDRAW TAB ---------------- */}
        {modalTab === 'withdraw' && (
          <>
            {withdrawNoticeOpen ? (
              <div className="space-y-4 animate-scaleUp">
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>স্ট্যাটাস: 24h Pending Queue (গেটওয়ে অডিট)</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    উইথড্রয়াল রিকোয়েস্ট গৃহীত হয়েছে। সিকিউরিটি ভেরিফিকেশন শেষে আগামী <strong>১২-২৪ ঘণ্টার</strong> মধ্যে আপনার বিকাশ/নগদ নাম্বারে টাকা পাঠিয়ে দেওয়া হবে।
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">রেফারেন্স ID:</span>
                    <span className="font-mono font-bold text-indigo-600">{withdrawActiveRef}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">প্রাপক নাম্বার:</span>
                    <span className="font-mono font-bold text-slate-900">{withdrawReceiver}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">উত্তোলিত ডলার:</span>
                    <span className="font-mono font-bold text-rose-600">-${withdrawUSD.toFixed(2)} USD</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1">
                    <span className="text-slate-500">পাবেন (টাকায়):</span>
                    <span className="font-mono font-black text-slate-900">৳{(withdrawUSD * exchangeRate).toLocaleString()} BDT</span>
                  </div>
                </div>

                {/* Countdown */}
                <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span>অডিট কিউ:</span>
                  </div>
                  <span className="font-mono font-bold text-amber-400">{format24h(countdownSeconds)}</span>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  ঠিক আছে (Close)
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirmWithdraw} className="space-y-4">
                {/* Method selector */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'bkash', label: 'বিকাশ (bKash)' },
                    { id: 'nagad', label: 'নগদ (Nagad)' },
                    { id: 'bank_transfer', label: 'ব্যাংক (Bank)' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMethodId(m.id as DepositPaymentMethod)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        selectedMethodId === m.id
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold shadow-2xs'
                          : 'border-slate-200 bg-slate-50 text-slate-700 text-xs'
                      }`}
                    >
                      <div className="text-xs font-bold">{m.label}</div>
                    </button>
                  ))}
                </div>

                {/* Amount presets */}
                <div className="grid grid-cols-5 gap-1.5">
                  {[5, 10, 25, 50, 100].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setWithdrawUSD(amt)}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer font-mono ${
                        withdrawUSD === amt
                          ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-700 text-xs'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      উত্তোলনের ডলার ($ USD):
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={withdrawUSD}
                      onChange={(e) => setWithdrawUSD(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      পাবেন (BDT ৳):
                    </label>
                    <div className="p-2.5 bg-slate-100 rounded-xl text-xs font-mono font-bold text-slate-900">
                      ৳{(withdrawUSD * exchangeRate).toLocaleString()} BDT
                    </div>
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    আপনার প্রাপক বিকাশ/নগদ নাম্বার:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 017XXXXXXXX বা 018XXXXXXXX"
                    value={withdrawReceiver}
                    onChange={(e) => setWithdrawReceiver(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ArrowUpRight className="w-4 h-4 text-amber-300" />
                  <span>উইথড্রয়াল রিকোয়েস্ট পাঠান (Submit)</span>
                </button>
              </form>
            )}
          </>
        )}

      </div>
    </div>
  );
};
