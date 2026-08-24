import React, { useState, useEffect } from 'react';
import { 
  Invoice, 
  Client, 
  PaymentReminderRule, 
  BankingPlatform, 
  BankFeedTransaction, 
  BusinessProfile,
  PaymentMethod,
  UserTradingWallet,
  DepositTransaction,
  TradingPosition,
  TimedTrade,
  ClosedTrade,
  Stock,
  DepositPaymentMethod 
} from './types';
import { 
  TrendingUp, 
  DollarSign, 
  FileText, 
  ArrowUpRight, 
  Menu as MenuIcon,
  Layers,
  Wallet as WalletIcon
} from 'lucide-react';
import { StorageService } from './services/storageService';
import { FXService } from './services/fxService';
import { FirebaseSyncService } from './services/firebaseSyncService';
import { AuthProvider, useAuth } from './context/AuthContext';

import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { InvoicesView } from './components/InvoicesView';
import { InvoiceEditor } from './components/InvoiceEditor';
import { InvoiceDetailModal } from './components/InvoiceDetailModal';
import { AiQuickDraftModal } from './components/AiQuickDraftModal';
import { SendReminderModal } from './components/SendReminderModal';
import { RemindersView } from './components/RemindersView';
import { ReportsView } from './components/ReportsView';
import { TaxComplianceView } from './components/TaxComplianceView';
import { BankingView } from './components/BankingView';
import { ClientsView } from './components/ClientsView';
import { SettingsView } from './components/SettingsView';
import { TradingView } from './components/TradingView';
import { DepositShopView } from './components/DepositShopView';
import { DepositShopModal } from './components/DepositShopModal';
import { AuthModal } from './components/AuthModal';

function AppContent() {
  const { currentUser } = useAuth();

  // Navigation State
  const [activeTab, setActiveTab] = useState<'trading' | 'shop' | 'invoices' | 'reminders' | 'reports' | 'tax' | 'banking' | 'clients' | 'settings'>('trading');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Business State
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>(() => StorageService.getBusinessProfile());
  const [baseCurrency, setBaseCurrency] = useState<string>(() => StorageService.getBaseCurrency());
  const [invoices, setInvoices] = useState<Invoice[]>(() => StorageService.getInvoices());
  const [clients, setClients] = useState<Client[]>(() => StorageService.getClients());
  const [reminderRules, setReminderRules] = useState<PaymentReminderRule[]>(() => StorageService.getReminderRules());
  const [bankingPlatforms, setBankingPlatforms] = useState<BankingPlatform[]>(() => StorageService.getBankingPlatforms());
  const [bankFeed, setBankFeed] = useState<BankFeedTransaction[]>(() => StorageService.getBankFeed());

  // Trading & Wallet State
  const [wallet, setWallet] = useState<UserTradingWallet>(() => StorageService.getWallet());
  const [stocks, setStocks] = useState<Stock[]>(() => StorageService.getStocks());
  const [positions, setPositions] = useState<TradingPosition[]>(() => StorageService.getPositions());
  const [timedTrades, setTimedTrades] = useState<TimedTrade[]>(() => StorageService.getTimedTrades());
  const [closedTrades, setClosedTrades] = useState<ClosedTrade[]>(() => StorageService.getClosedTrades());
  const [deposits, setDeposits] = useState<DepositTransaction[]>(() => StorageService.getDeposits());

  // Modal States
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  const [isAiDraftOpen, setIsAiDraftOpen] = useState(false);

  const [isSendReminderOpen, setIsSendReminderOpen] = useState(false);
  const [reminderTargetInvoice, setReminderTargetInvoice] = useState<Invoice | null>(null);

  const [isDepositShopOpen, setIsDepositShopOpen] = useState(false);

  // Real-time Firestore Cloud Database Synchronization
  useEffect(() => {
    if (!currentUser) return;

    const unsubWallet = FirebaseSyncService.subscribeToWallet(currentUser.uid, (cloudWallet) => {
      setWallet(cloudWallet);
      StorageService.saveWallet(cloudWallet);
    });

    const unsubDeposits = FirebaseSyncService.subscribeToDeposits(currentUser.uid, (cloudDeposits) => {
      if (cloudDeposits.length > 0) {
        setDeposits(cloudDeposits);
        StorageService.saveDeposits(cloudDeposits);
      }
    });

    const unsubTimedTrades = FirebaseSyncService.subscribeToTimedTrades(currentUser.uid, (cloudTrades) => {
      if (cloudTrades.length > 0) {
        setTimedTrades(cloudTrades);
        StorageService.saveTimedTrades(cloudTrades);
      }
    });

    const unsubPositions = FirebaseSyncService.subscribeToPositions(currentUser.uid, (cloudPositions) => {
      setPositions(cloudPositions);
      StorageService.savePositions(cloudPositions);
    });

    const unsubInvoices = FirebaseSyncService.subscribeToInvoices(currentUser.uid, (cloudInvoices) => {
      if (cloudInvoices.length > 0) {
        setInvoices(cloudInvoices);
        StorageService.saveInvoices(cloudInvoices);
      }
    });

    const unsubClients = FirebaseSyncService.subscribeToClients(currentUser.uid, (cloudClients) => {
      if (cloudClients.length > 0) {
        setClients(cloudClients);
        StorageService.saveClients(cloudClients);
      }
    });

    return () => {
      unsubWallet();
      unsubDeposits();
      unsubTimedTrades();
      unsubPositions();
      unsubInvoices();
      unsubClients();
    };
  }, [currentUser]);

  // Sync state changes to local storage & cloud
  useEffect(() => {
    StorageService.saveInvoices(invoices);
  }, [invoices]);

  useEffect(() => {
    StorageService.saveClients(clients);
  }, [clients]);

  useEffect(() => {
    StorageService.saveBusinessProfile(businessProfile);
  }, [businessProfile]);

  useEffect(() => {
    StorageService.saveBaseCurrency(baseCurrency);
    FXService.setBaseCurrency(baseCurrency);
  }, [baseCurrency]);

  useEffect(() => {
    StorageService.saveReminderRules(reminderRules);
  }, [reminderRules]);

  useEffect(() => {
    StorageService.saveBankingPlatforms(bankingPlatforms);
  }, [bankingPlatforms]);

  useEffect(() => {
    StorageService.saveBankFeed(bankFeed);
  }, [bankFeed]);

  useEffect(() => {
    StorageService.saveWallet(wallet);
    if (currentUser) {
      FirebaseSyncService.updateWallet(currentUser.uid, wallet);
    }
  }, [wallet, currentUser]);

  useEffect(() => {
    StorageService.savePositions(positions);
  }, [positions]);

  useEffect(() => {
    StorageService.saveTimedTrades(timedTrades);
  }, [timedTrades]);

  useEffect(() => {
    StorageService.saveClosedTrades(closedTrades);
  }, [closedTrades]);

  useEffect(() => {
    StorageService.saveDeposits(deposits);
  }, [deposits]);

  useEffect(() => {
    StorageService.saveStocks(stocks);
  }, [stocks]);

  // Deposit Handlers
  const handleDepositConfirmed = (newTx: DepositTransaction) => {
    setDeposits((prev) => [newTx, ...prev]);
    const updatedWallet: UserTradingWallet = {
      ...wallet,
      usdBalance: Number((wallet.usdBalance + newTx.usdAmount).toFixed(2)),
      totalDepositedUSD: Number((wallet.totalDepositedUSD + newTx.usdAmount).toFixed(2)),
    };
    setWallet(updatedWallet);

    if (currentUser) {
      FirebaseSyncService.saveDeposit(currentUser.uid, newTx);
      FirebaseSyncService.updateWallet(currentUser.uid, updatedWallet);
    }
  };

  const handleWithdrawFunds = (amountUSD: number, method: DepositPaymentMethod, receiverNo: string): boolean => {
    if (amountUSD > wallet.usdBalance) return false;

    const updatedWallet: UserTradingWallet = {
      ...wallet,
      usdBalance: Number((wallet.usdBalance - amountUSD).toFixed(2)),
      totalWithdrawnUSD: Number((wallet.totalWithdrawnUSD + amountUSD).toFixed(2)),
    };
    setWallet(updatedWallet);

    if (currentUser) {
      FirebaseSyncService.updateWallet(currentUser.uid, updatedWallet);
    }

    return true;
  };

  // Invoice Handlers
  const handleSaveInvoice = (savedInvoice: Invoice) => {
    setInvoices((prev) => {
      const exists = prev.some((i) => i.id === savedInvoice.id);
      if (exists) {
        return prev.map((i) => (i.id === savedInvoice.id ? savedInvoice : i));
      }
      return [savedInvoice, ...prev];
    });

    if (currentUser) {
      FirebaseSyncService.saveInvoice(currentUser.uid, savedInvoice);
    }

    if (viewingInvoice?.id === savedInvoice.id) {
      setViewingInvoice(savedInvoice);
    }
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      setInvoices((prev) => prev.filter((i) => i.id !== invoiceId));
      if (currentUser) {
        FirebaseSyncService.deleteInvoice(currentUser.uid, invoiceId);
      }
      if (viewingInvoice?.id === invoiceId) {
        setIsDetailOpen(false);
        setViewingInvoice(null);
      }
    }
  };

  const handleDuplicateInvoice = (invoice: Invoice) => {
    const newNum = `INV-2026-${String(invoices.length + 1).padStart(3, '0')}`;
    const duplicated: Invoice = {
      ...invoice,
      id: `inv_${Date.now()}`,
      invoiceNumber: newNum,
      status: 'draft',
      issueDate: new Date().toISOString().split('T')[0],
      totalPaid: 0,
      balanceDue: invoice.totalAmount,
      reminderCount: 0,
      lastReminderSentAt: undefined,
      auditTrail: [
        {
          id: `aud_${Date.now()}`,
          action: 'created',
          timestamp: new Date().toISOString(),
          actor: 'System (Duplicated)',
          details: `Duplicated from invoice ${invoice.invoiceNumber}`,
        }
      ]
    };
    handleSaveInvoice(duplicated);
  };

  const handleMarkPaid = (invoiceId: string, paymentMethod: PaymentMethod = 'bank_transfer') => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== invoiceId) return inv;

        const isAlreadyPaid = inv.status === 'paid';
        const newStatus = isAlreadyPaid ? 'sent' : 'paid';
        const newTotalPaid = isAlreadyPaid ? 0 : inv.totalAmount;
        const newBalanceDue = isAlreadyPaid ? inv.totalAmount : 0;

        const updated: Invoice = {
          ...inv,
          status: newStatus,
          totalPaid: newTotalPaid,
          balanceDue: newBalanceDue,
          auditTrail: [
            ...inv.auditTrail,
            {
              id: `aud_${Date.now()}`,
              action: isAlreadyPaid ? 'status_changed' : 'payment_received',
              timestamp: new Date().toISOString(),
              actor: 'User',
              details: isAlreadyPaid 
                ? 'Payment status reverted to unpaid' 
                : `Settled in full via ${paymentMethod.replace('_', ' ')}`,
            }
          ]
        };

        if (currentUser) {
          FirebaseSyncService.saveInvoice(currentUser.uid, updated);
        }

        if (viewingInvoice?.id === invoiceId) {
          setViewingInvoice(updated);
        }

        return updated;
      })
    );
  };

  // Automated Batch Reminders Trigger
  const handleTriggerBatchReminders = () => {
    const processed: string[] = [];
    const now = new Date();

    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.status === 'paid' || inv.status === 'draft') return inv;

        const dueDate = new Date(inv.dueDate);
        const diffDays = Math.round((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        
        const matchesRule = reminderRules.some((r) => {
          if (!r.isEnabled) return false;
          if (r.triggerCondition === 'before_due' && diffDays >= r.daysOffset && diffDays < 0) return true;
          if (r.triggerCondition === 'on_due_date' && diffDays === 0) return true;
          if (r.triggerCondition === 'after_due' && diffDays >= r.daysOffset) return true;
          return false;
        });

        if (matchesRule) {
          processed.push(inv.invoiceNumber);
          const updated: Invoice = {
            ...inv,
            reminderCount: inv.reminderCount + 1,
            lastReminderSentAt: new Date().toISOString(),
            auditTrail: [
              ...inv.auditTrail,
              {
                id: `aud_${Date.now()}_${Math.random()}`,
                action: 'reminder_sent',
                timestamp: new Date().toISOString(),
                actor: 'Automated Daemon',
                details: `Dispatched automated reminder (Notice #${inv.reminderCount + 1})`,
              }
            ]
          };

          if (currentUser) {
            FirebaseSyncService.saveInvoice(currentUser.uid, updated);
          }

          return updated;
        }

        return inv;
      })
    );

    return {
      sentCount: processed.length,
      invoicesProcessed: processed,
    };
  };

  // Single Manual / AI Reminder Dispatch
  const handleReminderSent = (invoiceId: string, subject: string, body: string, tone: string) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== invoiceId) return inv;
        const updated: Invoice = {
          ...inv,
          reminderCount: inv.reminderCount + 1,
          lastReminderSentAt: new Date().toISOString(),
          auditTrail: [
            ...inv.auditTrail,
            {
              id: `aud_${Date.now()}`,
              action: 'reminder_sent',
              timestamp: new Date().toISOString(),
              actor: 'User (AI Composer)',
              details: `Dispatched reminder [Tone: ${tone}] - "${subject}"`,
            }
          ]
        };

        if (currentUser) {
          FirebaseSyncService.saveInvoice(currentUser.uid, updated);
        }

        if (viewingInvoice?.id === invoiceId) {
          setViewingInvoice(updated);
        }

        return updated;
      })
    );
  };

  // Bank Feed Reconcile Handler
  const handleReconcileInvoice = (transactionId: string, invoiceId: string) => {
    setBankFeed((prev) =>
      prev.map((tx) =>
        tx.id === transactionId
          ? { ...tx, reconciled: true, matchedInvoiceId: invoiceId }
          : tx
      )
    );
    handleMarkPaid(invoiceId, 'bank_transfer');
  };

  // Client Directory Handlers
  const handleSaveClient = (client: Client) => {
    setClients((prev) => {
      const idx = prev.findIndex((c) => c.id === client.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = client;
        return next;
      }
      return [...prev, client];
    });

    if (currentUser) {
      FirebaseSyncService.saveClient(currentUser.uid, client);
    }
  };

  const handleDeleteClient = (clientId: string) => {
    if (window.confirm('Delete this client profile?')) {
      setClients((prev) => prev.filter((c) => c.id !== clientId));
      if (currentUser) {
        FirebaseSyncService.deleteClient(currentUser.uid, clientId);
      }
    }
  };

  // Open modals helper
  const handleOpenCreateInvoice = () => {
    setEditingInvoice(null);
    setIsEditorOpen(true);
  };

  const handleOpenEditInvoice = (inv: Invoice) => {
    setEditingInvoice(inv);
    setIsEditorOpen(true);
    setIsDetailOpen(false);
  };

  const handleOpenViewInvoice = (inv: Invoice) => {
    setViewingInvoice(inv);
    setIsDetailOpen(true);
  };

  const handleOpenSendReminder = (inv: Invoice) => {
    setReminderTargetInvoice(inv);
    setIsSendReminderOpen(true);
  };

  const handleOpenAiDraft = () => {
    setIsAiDraftOpen(true);
  };

  const handleApplyAiDraft = (draftedInvoice: Invoice) => {
    handleSaveInvoice(draftedInvoice);
    setIsAiDraftOpen(false);
    handleOpenViewInvoice(draftedInvoice);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-600 selection:text-white">
      
      {/* Left Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        baseCurrency={baseCurrency}
        setBaseCurrency={setBaseCurrency}
        openSettings={() => setActiveTab('settings')}
        wallet={wallet}
        onOpenDepositShop={() => setIsDepositShopOpen(true)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Top Header Bar */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          baseCurrency={baseCurrency}
          setBaseCurrency={setBaseCurrency}
          invoices={invoices}
          wallet={wallet}
          onOpenCreateInvoice={handleOpenCreateInvoice}
          onOpenAiDraft={handleOpenAiDraft}
          onOpenDepositShop={() => setIsDepositShopOpen(true)}
          onOpenWithdraw={() => setActiveTab('shop')}
          onOpenSettings={() => setActiveTab('settings')}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        {/* Content Container */}
        <main className="flex-1 p-3 sm:p-5 lg:p-8 pb-24 sm:pb-24 lg:pb-8 max-w-7xl w-full mx-auto overflow-x-hidden">
          
          {/* STOCK TRADING VIEW */}
          {activeTab === 'trading' && (
            <TradingView
              stocks={stocks}
              setStocks={setStocks}
              wallet={wallet}
              setWallet={setWallet}
              positions={positions}
              setPositions={setPositions}
              timedTrades={timedTrades}
              setTimedTrades={setTimedTrades}
              closedTrades={closedTrades}
              setClosedTrades={setClosedTrades}
              onOpenDepositShop={() => setIsDepositShopOpen(true)}
              onOpenWithdraw={() => setActiveTab('shop')}
              baseCurrency={baseCurrency}
            />
          )}

          {/* DEPOSIT SHOP VIEW */}
          {activeTab === 'shop' && (
            <DepositShopView
              wallet={wallet}
              deposits={deposits}
              onDepositConfirmed={handleDepositConfirmed}
              onWithdrawFunds={handleWithdrawFunds}
              baseCurrency={baseCurrency}
              onOpenTrading={() => setActiveTab('trading')}
            />
          )}

          {/* INVOICES VIEW */}
          {activeTab === 'invoices' && (
            <InvoicesView
              invoices={invoices}
              clients={clients}
              baseCurrency={baseCurrency}
              onOpenCreate={handleOpenCreateInvoice}
              onOpenAiDraft={handleOpenAiDraft}
              onViewInvoice={handleOpenViewInvoice}
              onEditInvoice={handleOpenEditInvoice}
              onSendReminder={handleOpenSendReminder}
              onDeleteInvoice={handleDeleteInvoice}
              onDuplicateInvoice={handleDuplicateInvoice}
              onMarkPaid={handleMarkPaid}
            />
          )}

          {/* REMINDERS VIEW */}
          {activeTab === 'reminders' && (
            <RemindersView
              rules={reminderRules}
              onUpdateRules={setReminderRules}
              invoices={invoices}
              onTriggerBatchReminders={handleTriggerBatchReminders}
              businessProfile={businessProfile}
              baseCurrency={baseCurrency}
              onSendCustomReminder={handleOpenSendReminder}
            />
          )}

          {/* FINANCIAL REPORTS VIEW */}
          {activeTab === 'reports' && (
            <ReportsView
              invoices={invoices}
              clients={clients}
              baseCurrency={baseCurrency}
              businessProfile={businessProfile}
            />
          )}

          {/* TAX COMPLIANCE VIEW */}
          {activeTab === 'tax' && (
            <TaxComplianceView
              invoices={invoices}
              businessProfile={businessProfile}
              baseCurrency={baseCurrency}
            />
          )}

          {/* BANKING VIEW */}
          {activeTab === 'banking' && (
            <BankingView
              platforms={bankingPlatforms}
              onUpdatePlatforms={setBankingPlatforms}
              bankFeed={bankFeed}
              onUpdateBankFeed={setBankFeed}
              invoices={invoices}
              onReconcileInvoice={handleReconcileInvoice}
              baseCurrency={baseCurrency}
            />
          )}

          {/* CLIENTS VIEW */}
          {activeTab === 'clients' && (
            <ClientsView
              clients={clients}
              invoices={invoices}
              onSaveClient={handleSaveClient}
              onDeleteClient={handleDeleteClient}
              baseCurrency={baseCurrency}
              onViewClientInvoices={(clientName) => {
                setActiveTab('invoices');
              }}
            />
          )}

          {/* SETTINGS VIEW */}
          {activeTab === 'settings' && (
            <SettingsView
              businessProfile={businessProfile}
              onUpdateBusinessProfile={setBusinessProfile}
              baseCurrency={baseCurrency}
              onChangeBaseCurrency={setBaseCurrency}
            />
          )}

        </main>

        {/* Mobile Sticky Bottom Navigation Bar */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
          <button
            onClick={() => setActiveTab('trading')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
              activeTab === 'trading'
                ? 'text-indigo-600 font-black'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className={`w-4 h-4 mb-0.5 ${activeTab === 'trading' ? 'text-indigo-600 stroke-[2.5]' : 'text-slate-400'}`} />
            <span>ট্রেডিং</span>
          </button>

          <button
            onClick={() => setIsDepositShopOpen(true)}
            className="flex flex-col items-center justify-center py-1 px-3 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 text-white text-[10px] font-black shadow-md shadow-pink-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <DollarSign className="w-4 h-4 stroke-[3] mb-0.5" />
            <span>ডিপোজিট</span>
          </button>

          <button
            onClick={() => setActiveTab('shop')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
              activeTab === 'shop'
                ? 'text-amber-700 font-black'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ArrowUpRight className={`w-4 h-4 mb-0.5 ${activeTab === 'shop' ? 'text-amber-600 stroke-[2.5]' : 'text-slate-400'}`} />
            <span>উইথড্র</span>
          </button>

          <button
            onClick={() => setActiveTab('invoices')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
              activeTab === 'invoices'
                ? 'text-indigo-600 font-black'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className={`w-4 h-4 mb-0.5 ${activeTab === 'invoices' ? 'text-indigo-600 stroke-[2.5]' : 'text-slate-400'}`} />
            <span>ইনভয়েস</span>
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-bold text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
          >
            <MenuIcon className="w-4 h-4 text-slate-400 mb-0.5" />
            <span>মেনু</span>
          </button>
        </nav>

        {/* Professional Footer */}
        <footer className="border-t border-slate-200 bg-white py-4 px-4 sm:px-8 text-slate-500 text-xs flex flex-col sm:flex-row items-center justify-between gap-2 mt-auto hidden lg:flex">
          <p className="font-medium text-slate-600">
            QuillInvoice™ Global Multi-Currency Invoicing, Real-Time Stock Trading & bKash/Nagad Cashier Desk
          </p>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Base Currency: <strong className="text-slate-700">{baseCurrency}</strong></span>
            <span>•</span>
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {currentUser ? 'Firebase Cloud Connected' : 'Local Storage Mode'}
            </span>
          </div>
        </footer>

      </div>

      {/* MODALS */}

      {/* Auth Modal */}
      <AuthModal />

      {/* Deposit Shop Modal */}
      <DepositShopModal
        isOpen={isDepositShopOpen}
        onClose={() => setIsDepositShopOpen(false)}
        wallet={wallet}
        onDepositConfirmed={handleDepositConfirmed}
        onWithdrawFunds={handleWithdrawFunds}
        baseCurrency={baseCurrency}
      />

      {/* Invoice Editor Modal */}
      <InvoiceEditor
        invoice={editingInvoice}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveInvoice}
        clients={clients}
        businessProfile={businessProfile}
        baseCurrency={baseCurrency}
      />

      {/* Invoice Detail / Client Portal Preview Modal */}
      <InvoiceDetailModal
        invoice={viewingInvoice}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setViewingInvoice(null);
        }}
        onEdit={handleOpenEditInvoice}
        onMarkPaid={handleMarkPaid}
        onSendReminder={handleOpenSendReminder}
        businessProfile={businessProfile}
        baseCurrency={baseCurrency}
      />

      {/* AI Quick Draft Modal */}
      <AiQuickDraftModal
        isOpen={isAiDraftOpen}
        onClose={() => setIsAiDraftOpen(false)}
        onApplyInvoice={handleApplyAiDraft}
        clients={clients}
        businessProfile={businessProfile}
        baseCurrency={baseCurrency}
      />

      {/* Send Reminder Modal */}
      <SendReminderModal
        invoice={reminderTargetInvoice}
        isOpen={isSendReminderOpen}
        onClose={() => {
          setIsSendReminderOpen(false);
          setReminderTargetInvoice(null);
        }}
        onReminderSent={handleReminderSent}
        businessProfile={businessProfile}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
