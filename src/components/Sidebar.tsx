import React from 'react';
import { 
  FileText, 
  Bell, 
  BarChart3, 
  ShieldCheck, 
  Building2, 
  Users, 
  Settings,
  Sparkles,
  Layers,
  ChevronRight,
  TrendingUp,
  CreditCard,
  DollarSign,
  Wallet,
  ArrowDownLeft,
  LogIn,
  LogOut,
  User as UserIcon,
  Cloud
} from 'lucide-react';
import { SUPPORTED_CURRENCIES } from '../services/fxService';
import { UserTradingWallet } from '../types';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  baseCurrency: string;
  setBaseCurrency: (currency: string) => void;
  openSettings: () => void;
  wallet?: UserTradingWallet;
  onOpenDepositShop?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  baseCurrency,
  setBaseCurrency,
  openSettings,
  wallet,
  onOpenDepositShop,
  isMobileOpen,
  onCloseMobile,
}) => {
  const { currentUser, openAuthModal, logout } = useAuth();

  const tradingNavItems = [
    { 
      id: 'trading', 
      label: 'Stock Trading', 
      labelBn: 'স্টক ট্রেডিং', 
      icon: TrendingUp, 
      badge: 'LIVE',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
    },
    { 
      id: 'shop', 
      label: 'Deposit Shop', 
      labelBn: 'টাকা ➔ ডলার শপ', 
      icon: DollarSign, 
      badge: 'bKash/Nagad',
      badgeColor: 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
    },
  ];

  const businessNavItems = [
    { id: 'invoices', label: 'Invoices & Billing', icon: FileText },
    { id: 'reminders', label: 'Payment Reminders', icon: Bell },
    { id: 'reports', label: 'Financial Analytics', icon: BarChart3 },
    { id: 'tax', label: 'Tax & Compliance', icon: ShieldCheck },
    { id: 'banking', label: 'Banking & Feeds', icon: Building2 },
    { id: 'clients', label: 'Clients Directory', icon: Users },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out shrink-0 overflow-y-auto ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        
        {/* Brand Logo & Title */}
        <div className="p-6 pb-3">
          <div className="flex items-center gap-3 text-white mb-5">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-lg flex items-center justify-center shadow-md shadow-indigo-500/30 text-white font-bold text-lg">
              Q
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white block">QuillInvoice</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300">Trading & Financial Hub</span>
            </div>
          </div>

          {/* TRADING & CASHIER SECTION */}
          <div className="mb-4">
            <div className="px-2 mb-1.5 text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center justify-between">
              <span>ট্রেডিং ও ডিপোজিট</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <nav className="space-y-1">
              {tradingNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`sidebar-nav-${item.id}`}
                    onClick={() => {
                      setActiveTab(item.id);
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all text-left cursor-pointer ${
                      isActive
                        ? 'text-white bg-indigo-600/90 shadow-md font-bold'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-indigo-400'}`} />
                      <div>
                        <div className="font-semibold text-xs leading-tight">{item.label}</div>
                        <div className="text-[10px] text-slate-400 font-sans leading-tight">{item.labelBn}</div>
                      </div>
                    </div>
                    {item.badge && (
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* BUSINESS & INVOICING SECTION */}
          <div>
            <div className="px-2 mb-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              ইনভয়েসিং ও ফাইন্যান্স
            </div>
            <nav className="space-y-0.5">
              {businessNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`sidebar-nav-${item.id}`}
                    onClick={() => {
                      setActiveTab(item.id);
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-lg font-medium text-xs transition-colors text-left cursor-pointer ${
                      isActive
                        ? 'text-indigo-400 bg-slate-800/80 font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <span className="flex-1 truncate">{item.label}</span>
                  </button>
                );
              })}

              <button
                id="sidebar-nav-settings"
                onClick={() => {
                  setActiveTab('settings');
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-lg font-medium text-xs transition-colors text-left cursor-pointer ${
                  activeTab === 'settings'
                    ? 'text-indigo-400 bg-slate-800/80 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <Settings className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'settings' ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span className="flex-1 truncate">Settings & Profile</span>
              </button>
            </nav>
          </div>
        </div>

        {/* User Balance Quick Box, Auth Card & Currency Support */}
        <div className="mt-auto p-5 border-t border-slate-800 space-y-3">
          
          {/* Auth Status Card */}
          {currentUser ? (
            <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700/60 text-white space-y-2">
              <div className="flex items-center gap-2.5">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt="User"
                    className="w-8 h-8 rounded-full object-cover border border-indigo-400"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                    {currentUser.displayName?.[0] || currentUser.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <div className="overflow-hidden flex-1">
                  <div className="text-xs font-bold truncate text-slate-200">
                    {currentUser.displayName || currentUser.email?.split('@')[0]}
                  </div>
                  <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                    <Cloud className="w-3 h-3" />
                    <span>Firebase Sync Active</span>
                  </div>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full py-1 rounded-lg bg-slate-700/60 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 text-[10px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <LogOut className="w-3 h-3" />
                <span>লগআউট (Logout)</span>
              </button>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-indigo-950 to-slate-800 p-3.5 rounded-xl border border-indigo-500/40 text-white text-center space-y-2">
              <div className="text-xs font-bold text-indigo-200">ক্লাউড সেভ একাউন্ট</div>
              <p className="text-[10px] text-slate-400 leading-tight">
                আপনার ব্যালেন্স ও ট্রেড হিস্টোরি ক্লাউডে সুরক্ষিত রাখতে লগইন করুন
              </p>
              <button
                onClick={openAuthModal}
                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>লগইন / সাইন আপ</span>
              </button>
            </div>
          )}

          {/* Quick Wallet Bar */}
          {wallet && (
            <div className="bg-gradient-to-br from-indigo-950/80 to-slate-800 p-3.5 rounded-xl border border-indigo-500/30 text-white space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300 font-medium">ট্রেডিং ব্যালেন্স:</span>
                <span className="text-emerald-400 font-bold font-mono">
                  ${wallet.usdBalance.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>টাকায়:</span>
                <span className="text-slate-200 font-semibold">
                  ৳{(wallet.usdBalance * 122).toLocaleString()} BDT
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  onClick={() => {
                    if (onOpenDepositShop) onOpenDepositShop();
                    else setActiveTab('shop');
                  }}
                  className="py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs"
                >
                  <DollarSign className="w-3 h-3" />
                  <span>ডিপোজিট</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('shop');
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className="py-1.5 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 rounded-lg font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <ArrowDownLeft className="w-3 h-3 rotate-180" />
                  <span>উইথড্রয়াল</span>
                </button>
              </div>
            </div>
          )}

          {/* Currency Support */}
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1.5 font-bold flex items-center justify-between">
              <span>Currencies</span>
              <span className="text-indigo-300 font-mono">৳ BDT / $ USD</span>
            </p>
            <div className="flex flex-wrap gap-1">
              {['USD', 'BDT', 'EUR', 'GBP'].map((curr) => {
                const isCurrentBase = curr === baseCurrency;
                return (
                  <button
                    key={curr}
                    onClick={() => setBaseCurrency(curr)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer ${
                      isCurrentBase
                        ? 'bg-indigo-900/60 text-indigo-300 border border-indigo-500/50 font-bold'
                        : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {curr}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </aside>
    </>
  );
};
