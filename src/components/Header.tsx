import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  Search, 
  Plus, 
  Sparkles, 
  Settings, 
  Globe2, 
  CheckCircle2, 
  Building2,
  DollarSign,
  TrendingUp,
  CreditCard,
  LogIn,
  LogOut,
  User as UserIcon,
  Database,
  Cloud,
  ShieldCheck,
  ArrowDownLeft
} from 'lucide-react';
import { SUPPORTED_CURRENCIES, FXService } from '../services/fxService';
import { Invoice, UserTradingWallet } from '../types';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  baseCurrency: string;
  setBaseCurrency: (currency: string) => void;
  invoices?: Invoice[];
  wallet?: UserTradingWallet;
  onOpenCreateInvoice: () => void;
  onOpenAiDraft: () => void;
  onOpenDepositShop?: () => void;
  onOpenWithdraw?: () => void;
  onOpenSettings?: () => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  baseCurrency,
  setBaseCurrency,
  invoices = [],
  wallet,
  onOpenCreateInvoice,
  onOpenAiDraft,
  onOpenDepositShop,
  onOpenWithdraw,
  onOpenSettings,
  onToggleMobileMenu,
}) => {
  const { currentUser, openAuthModal, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      
      {/* Left: Mobile hamburger, Brand Logo & Search bar */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        {/* Mobile menu toggle */}
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Mini Logo */}
        <div 
          onClick={() => setActiveTab('trading')}
          className="flex lg:hidden items-center gap-1.5 cursor-pointer shrink-0"
        >
          <div className="w-7 h-7 bg-gradient-to-br from-indigo-600 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-xs">
            Q
          </div>
          <span className="font-bold text-sm text-slate-900 tracking-tight hidden xs:inline">Quill</span>
        </div>

        {/* Global Quick Search - Hidden on small mobile, expands on desktop */}
        <div className="relative w-full max-w-[140px] xs:max-w-[200px] sm:max-w-xs md:max-w-md hidden sm:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search stocks or invoices..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            onClick={() => {
              if (activeTab !== 'invoices' && activeTab !== 'trading') {
                setActiveTab('trading');
              }
            }}
          />
        </div>
      </div>

      {/* Right: Live Wallet Balance, Deposit Trigger, Base Selector, Auth & Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        
        {/* Live Wallet Balance Pill */}
        {wallet && (
          <div 
            onClick={() => setActiveTab('trading')}
            className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer transition-colors shrink-0"
            title="Click to open Stock Trading Terminal"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <div className="text-right">
              <div className="hidden sm:block text-[9px] text-slate-400 font-semibold uppercase leading-none">ব্যালেন্স</div>
              <div className="font-mono font-bold text-xs text-slate-900 leading-tight">
                ${wallet.usdBalance.toFixed(2)}
              </div>
            </div>
          </div>
        )}

        {/* Quick Deposit Button (টাকা ➔ ডলার) */}
        <button
          id="header-deposit-btn"
          onClick={onOpenDepositShop}
          className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-pink-50 hover:bg-pink-100 border border-pink-200 text-pink-700 text-xs font-bold transition-all cursor-pointer shadow-2xs shrink-0"
          title="Deposit funds via bKash, Nagad or Bank"
        >
          <DollarSign className="w-3.5 h-3.5 text-pink-600 shrink-0" />
          <span className="whitespace-nowrap font-sans text-xs">ডিপোজিট</span>
        </button>

        {/* Quick Withdraw Button (উইথড্রয়াল) - Visible on larger screens */}
        <button
          id="header-withdraw-btn"
          onClick={onOpenWithdraw || onOpenDepositShop}
          className="hidden md:flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold transition-all cursor-pointer shadow-2xs shrink-0"
          title="Withdraw funds to bKash or Nagad"
        >
          <ArrowDownLeft className="w-3.5 h-3.5 text-amber-600 rotate-180 shrink-0" />
          <span className="whitespace-nowrap">উইথড্রয়াল</span>
        </button>

        {/* Base Currency Selector */}
        <div className="hidden lg:flex items-center gap-1.5 bg-slate-100 rounded-xl px-2.5 py-1.5 border border-slate-200 text-xs">
          <Globe2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <label htmlFor="header-base-currency" className="text-slate-500 text-[11px] font-medium">Base:</label>
          <select
            id="header-base-currency"
            value={baseCurrency}
            onChange={(e) => setBaseCurrency(e.target.value)}
            className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer text-xs"
          >
            {Object.values(SUPPORTED_CURRENCIES).map((curr) => (
              <option key={curr.code} value={curr.code} className="bg-white text-slate-800">
                {curr.code} ({curr.symbol})
              </option>
            ))}
          </select>
        </div>

        {/* AI Quick Draft Trigger */}
        <button
          id="header-ai-draft-btn"
          onClick={onOpenAiDraft}
          className="hidden xl:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-semibold transition-all cursor-pointer shrink-0"
          title="Generate invoice using Gemini AI"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>AI Draft</span>
        </button>

        {/* Primary Action: Create New Invoice (Desktop) */}
        <button
          id="header-create-invoice-btn"
          onClick={onOpenCreateInvoice}
          className="hidden sm:flex items-center gap-1.5 bg-indigo-600 text-white px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-semibold shadow-xs hover:bg-indigo-700 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="whitespace-nowrap">New Invoice</span>
        </button>

        {/* Authentication & User Profile Button */}
        {currentUser ? (
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-full border border-slate-200 hover:border-indigo-300 bg-slate-50 hover:bg-white transition-all cursor-pointer shadow-2xs"
            >
              {currentUser.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt="Avatar" 
                  className="w-7 h-7 rounded-full object-cover border border-indigo-200"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                  {currentUser.displayName?.[0] || currentUser.email?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="hidden sm:block text-left">
                <div className="text-[11px] font-bold text-slate-800 leading-none truncate max-w-[100px]">
                  {currentUser.displayName || currentUser.email?.split('@')[0]}
                </div>
                <div className="text-[9px] text-emerald-600 font-semibold flex items-center gap-1 leading-none mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Cloud Synced</span>
                </div>
              </div>
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-scaleUp">
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="font-bold text-xs text-slate-900 truncate">
                    {currentUser.displayName || 'User Account'}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5 font-mono">
                    {currentUser.email}
                  </div>
                  <div className="mt-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">ব্যালেন্স:</span>
                    <span className="font-mono font-bold text-indigo-700">
                      ${wallet?.usdBalance.toFixed(2) ?? '0.00'} USD
                    </span>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      if (onOpenSettings) onOpenSettings();
                      else setActiveTab('settings');
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>প্রোফাইল সেটিংস</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>লগআউট (Sign Out)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            id="header-auth-login-btn"
            onClick={openAuthModal}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">লগইন / সাইন আপ</span>
          </button>
        )}

      </div>
    </header>
  );
};
