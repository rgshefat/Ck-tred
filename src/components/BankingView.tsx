import React, { useState } from 'react';
import { 
  Building2, 
  CreditCard, 
  Globe, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  ArrowDownLeft, 
  Check, 
  Zap,
  Plus
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BankingPlatform, BankFeedTransaction, Invoice } from '../types';
import { FXService } from '../services/fxService';

interface BankingViewProps {
  platforms: BankingPlatform[];
  onUpdatePlatforms: (platforms: BankingPlatform[]) => void;
  bankFeed: BankFeedTransaction[];
  onUpdateBankFeed: (feed: BankFeedTransaction[]) => void;
  invoices: Invoice[];
  onReconcileInvoice: (transactionId: string, invoiceId: string) => void;
  baseCurrency: string;
}

export const BankingView: React.FC<BankingViewProps> = ({
  platforms,
  onUpdatePlatforms,
  bankFeed,
  onUpdateBankFeed,
  invoices,
  onReconcileInvoice,
  baseCurrency,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncAllFeeds = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      const updated = platforms.map(p => ({ ...p, lastSyncedAt: 'Just now' }));
      onUpdatePlatforms(updated);
    }, 1200);
  };

  const handleReconcile = (txId: string, invoiceId: string) => {
    onReconcileInvoice(txId, invoiceId);
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
    });
  };

  const unreconciledCount = bankFeed.filter(tx => !tx.reconciled).length;

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Banking Integrations & Smart Reconciliation</h2>
              <span className="text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                5 Connected Gateways
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Sync live bank feeds, incoming wires, Stripe settlements, and automatically reconcile unpaid invoices.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="sync-bank-feeds-btn"
            onClick={handleSyncAllFeeds}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing Feeds...' : 'Sync All Live Feeds'}</span>
          </button>
        </div>
      </div>

      {/* Connected Integrations Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
        {platforms.map((plat) => (
          <div
            key={plat.id}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3 hover:border-slate-300 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-indigo-600 font-bold">
                  {plat.category === 'payment_gateway' ? (
                    <CreditCard className="w-4 h-4" />
                  ) : plat.category === 'accounting_sync' ? (
                    <Zap className="w-4 h-4 text-amber-600" />
                  ) : (
                    <Globe className="w-4 h-4 text-emerald-600" />
                  )}
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-sm block">{plat.name}</span>
                  <span className="text-[11px] text-slate-500 capitalize">{plat.category.replace('_', ' ')}</span>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Live
              </span>
            </div>

            <p className="text-slate-600 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono line-clamp-2">
              {plat.accountDetails}
            </p>

            <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
              <span>Synced: {plat.lastSyncedAt}</span>
              <span className="text-indigo-600 font-bold">Auto-Reconcile On</span>
            </div>
          </div>
        ))}
      </div>

      {/* Live Bank Feed & Smart Match Module */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
              <span>Live Bank Feed & Automated Transaction Reconciliation</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Incoming deposits are matched with outstanding invoices based on amount, currency, and counterparty.
            </p>
          </div>
          <span className="text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full">
            {unreconciledCount} Pending Match
          </span>
        </div>

        {/* Transactions List */}
        <div className="space-y-3">
          {bankFeed.map((tx) => {
            const matchedInvoice = invoices.find((i) => i.id === tx.matchedInvoiceId);

            return (
              <div
                key={tx.id}
                className={`p-4 rounded-xl border transition-all ${
                  tx.reconciled
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-white border-indigo-200 shadow-xs ring-1 ring-indigo-500/10'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Left Transaction Details */}
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-400 text-[11px]">{tx.date}</span>
                      <span className="font-semibold text-slate-800">{tx.accountName}</span>
                      {tx.reconciled ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3" /> Reconciled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3" /> Match Found
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-slate-900 font-bold">{tx.description}</p>
                    <p className="text-slate-500 text-[11px]">Payer: <span className="text-slate-800 font-medium">{tx.rawPayerName}</span></p>
                  </div>

                  {/* Right Match Box & 1-Click Reconcile */}
                  <div className="flex flex-wrap items-center gap-4">
                    
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block font-medium">Credit Amount:</span>
                      <span className="text-base font-bold font-mono text-emerald-600">
                        +{FXService.format(tx.amount, tx.currency)}
                      </span>
                    </div>

                    {matchedInvoice && !tx.reconciled && (
                      <div className="bg-indigo-50 border border-indigo-200 p-2.5 rounded-lg flex items-center gap-3 text-xs">
                        <div>
                          <div className="flex items-center gap-1 text-indigo-900 font-bold">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Matched: {matchedInvoice.invoiceNumber}</span>
                          </div>
                          <span className="text-[11px] text-slate-600 block">
                            {matchedInvoice.client.companyName} ({FXService.format(matchedInvoice.balanceDue, matchedInvoice.currency)})
                          </span>
                        </div>

                        <button
                          id={`reconcile-btn-${tx.id}`}
                          onClick={() => handleReconcile(tx.id, matchedInvoice.id)}
                          className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>1-Click Reconcile</span>
                        </button>
                      </div>
                    )}

                    {tx.reconciled && (
                      <div className="text-xs text-slate-500 font-mono">
                        Settled to Invoice {matchedInvoice?.invoiceNumber || ''}
                      </div>
                    )}

                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
