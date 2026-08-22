import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Download, 
  CheckSquare, 
  Square, 
  Eye, 
  Edit3, 
  Send, 
  Trash2, 
  Sparkles,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import { Invoice, InvoiceStatus, Client } from '../types';
import { FXService } from '../services/fxService';

interface InvoicesViewProps {
  invoices: Invoice[];
  clients: Client[];
  baseCurrency: string;
  onOpenCreate: () => void;
  onOpenAiDraft: () => void;
  onViewInvoice: (invoice: Invoice) => void;
  onEditInvoice: (invoice: Invoice) => void;
  onSendReminder: (invoice: Invoice) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  onDuplicateInvoice: (invoice: Invoice) => void;
  onMarkPaid: (invoiceId: string) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  invoices,
  clients,
  baseCurrency,
  onOpenCreate,
  onOpenAiDraft,
  onViewInvoice,
  onEditInvoice,
  onSendReminder,
  onDeleteInvoice,
  onDuplicateInvoice,
  onMarkPaid,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('all');
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');

  // Status counts & totals
  const counts = useMemo(() => {
    const map: Record<string, { count: number; totalBase: number }> = {
      all: { count: invoices.length, totalBase: 0 },
      sent: { count: 0, totalBase: 0 },
      overdue: { count: 0, totalBase: 0 },
      partially_paid: { count: 0, totalBase: 0 },
      paid: { count: 0, totalBase: 0 },
      draft: { count: 0, totalBase: 0 },
    };

    invoices.forEach((inv) => {
      const amountInBase = FXService.convert(inv.totalAmount, inv.currency, baseCurrency);
      map.all.totalBase += amountInBase;

      if (map[inv.status]) {
        map[inv.status].count += 1;
        map[inv.status].totalBase += amountInBase;
      }
    });

    return map;
  }, [invoices, baseCurrency]);

  // Financial summary metrics
  const financialSummary = useMemo(() => {
    let totalInflow = 0;
    let totalOutstanding = 0;
    invoices.forEach(inv => {
      const base = FXService.convert(inv.totalAmount, inv.currency, baseCurrency);
      if (inv.status === 'paid') {
        totalInflow += base;
      } else {
        totalOutstanding += FXService.convert(inv.balanceDue, inv.currency, baseCurrency);
      }
    });
    return {
      total: totalInflow + totalOutstanding,
      totalInflow,
      totalOutstanding,
      rate: totalInflow + totalOutstanding > 0 ? (totalInflow / (totalInflow + totalOutstanding)) * 100 : 0
    };
  }, [invoices, baseCurrency]);

  // Filtered and sorted invoices
  const filteredInvoices = useMemo(() => {
    return invoices
      .filter((inv) => {
        if (selectedStatus !== 'all' && inv.status !== selectedStatus) return false;
        if (selectedCurrency !== 'all' && inv.currency !== selectedCurrency) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchNum = inv.invoiceNumber.toLowerCase().includes(q);
          const matchClient = inv.client.companyName.toLowerCase().includes(q) || inv.client.name.toLowerCase().includes(q);
          const matchCountry = inv.client.country.toLowerCase().includes(q);
          const matchItem = inv.items.some(i => i.description.toLowerCase().includes(q));
          if (!matchNum && !matchClient && !matchCountry && !matchItem) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date_desc') return new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime();
        if (sortBy === 'date_asc') return new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime();
        if (sortBy === 'amount_desc') {
          const aBase = FXService.convert(a.totalAmount, a.currency, baseCurrency);
          const bBase = FXService.convert(b.totalAmount, b.currency, baseCurrency);
          return bBase - aBase;
        }
        if (sortBy === 'amount_asc') {
          const aBase = FXService.convert(a.totalAmount, a.currency, baseCurrency);
          const bBase = FXService.convert(b.totalAmount, b.currency, baseCurrency);
          return aBase - bBase;
        }
        return 0;
      });
  }, [invoices, selectedStatus, selectedCurrency, searchQuery, sortBy, baseCurrency]);

  const handleSelectAll = () => {
    if (selectedInvoiceIds.length === filteredInvoices.length) {
      setSelectedInvoiceIds([]);
    } else {
      setSelectedInvoiceIds(filteredInvoices.map((i) => i.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedInvoiceIds.includes(id)) {
      setSelectedInvoiceIds(selectedInvoiceIds.filter((x) => x !== id));
    } else {
      setSelectedInvoiceIds([...selectedInvoiceIds, id]);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Invoice Number', 'Client Company', 'Client Name', 'Status', 'Issue Date', 'Due Date', 'Currency', 'Total Amount', 'Balance Due', 'Tax Type'];
    const rows = filteredInvoices.map(inv => [
      inv.invoiceNumber,
      `"${inv.client.companyName}"`,
      `"${inv.client.name}"`,
      inv.status,
      inv.issueDate,
      inv.dueDate,
      inv.currency,
      inv.totalAmount,
      inv.balanceDue,
      inv.taxType,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `QuillInvoice_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'paid':
        return (
          <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            PAID
          </span>
        );
      case 'overdue':
        return (
          <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            OVERDUE
          </span>
        );
      case 'partially_paid':
        return (
          <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
            <Clock className="w-3 h-3" />
            PARTIAL
          </span>
        );
      case 'sent':
        return (
          <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
            <Send className="w-3 h-3" />
            PENDING
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-[11px] font-bold">
            DRAFT
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Status Tabs Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { id: 'all', label: 'All Invoices' },
          { id: 'sent', label: 'Pending Payment' },
          { id: 'overdue', label: 'Overdue' },
          { id: 'partially_paid', label: 'Partially Paid' },
          { id: 'paid', label: 'Paid & Settled' },
          { id: 'draft', label: 'Drafts' },
        ].map((tab) => {
          const isSelected = selectedStatus === tab.id;
          const stat = counts[tab.id] || { count: 0, totalBase: 0 };
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`p-4 rounded-xl text-left border transition-all cursor-pointer shadow-xs ${
                isSelected
                  ? 'bg-white border-indigo-600 ring-2 ring-indigo-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-xs font-semibold ${isSelected ? 'text-indigo-900' : 'text-slate-600'}`}>
                  {tab.label}
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  isSelected ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'
                }`}>
                  {stat.count}
                </span>
              </div>
              <div className="text-sm font-semibold text-slate-900 truncate">
                {FXService.format(stat.totalBase, baseCurrency)}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Layout: Left Invoices Table & Right Financial Summary */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left 1.5x / Primary Table Section */}
        <div className="flex-1 space-y-6 min-w-0">
          
          {/* Table Container Card */}
          <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="font-bold text-slate-800 text-lg tracking-tight">Recent Invoices</h2>
                <p className="text-xs text-slate-500 mt-0.5">Manage and track multi-currency invoices with automated FX conversions.</p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  id="export-invoices-csv-btn"
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                  title="Export to CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export</span>
                </button>

                <button
                  onClick={onOpenAiDraft}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-semibold transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>AI Draft</span>
                </button>

                <button
                  id="create-new-invoice-table-btn"
                  onClick={onOpenCreate}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-xs sm:text-sm font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Invoice</span>
                </button>
              </div>
            </div>

            {/* Search & Filter Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 text-xs">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search invoices, clients, or items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md pl-9 pr-3 py-1.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer text-xs"
                >
                  <option value="date_desc">Newest First</option>
                  <option value="date_asc">Oldest First</option>
                  <option value="amount_desc">Highest Amount</option>
                  <option value="amount_asc">Lowest Amount</option>
                </select>
              </div>

              {selectedInvoiceIds.length > 0 && (
                <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-md border border-indigo-200">
                  <span className="text-indigo-700 font-bold">{selectedInvoiceIds.length} selected</span>
                  <button
                    onClick={() => {
                      selectedInvoiceIds.forEach((id) => onMarkPaid(id));
                      setSelectedInvoiceIds([]);
                    }}
                    className="text-emerald-700 hover:text-emerald-800 font-bold ml-2 cursor-pointer"
                  >
                    Mark Paid
                  </button>
                </div>
              )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200 bg-slate-50/50">
                    <th className="py-3 px-3 w-8 text-center">
                      <button
                        onClick={handleSelectAll}
                        className="text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {selectedInvoiceIds.length > 0 && selectedInvoiceIds.length === filteredInvoices.length ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="py-3 px-3 font-semibold">ID / Client</th>
                    <th className="py-3 px-3 font-semibold">Issue / Due Date</th>
                    <th className="py-3 px-3 font-semibold">Amount</th>
                    <th className="py-3 px-3 font-semibold">Status</th>
                    <th className="py-3 px-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold text-slate-700 text-sm">No invoices found</p>
                        <p className="text-xs text-slate-400 mt-1">Try resetting your search or create a new invoice.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((invoice) => {
                      const isSelected = selectedInvoiceIds.includes(invoice.id);
                      const baseAmount = FXService.convert(invoice.totalAmount, invoice.currency, baseCurrency);

                      return (
                        <tr key={invoice.id} className="hover:bg-slate-50 transition-colors">
                          
                          {/* Selection Checkbox */}
                          <td className="py-4 px-3 text-center">
                            <button
                              onClick={() => toggleSelectOne(invoice.id)}
                              className="text-slate-400 hover:text-slate-700 cursor-pointer"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-indigo-600" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </td>

                          {/* ID / Client */}
                          <td className="py-4 px-3">
                            <button
                              onClick={() => onViewInvoice(invoice)}
                              className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors text-left block"
                            >
                              {invoice.invoiceNumber}
                            </button>
                            <p className="text-xs text-slate-500 truncate max-w-[200px]">
                              {invoice.client.companyName || invoice.client.name}
                            </p>
                          </td>

                          {/* Dates */}
                          <td className="py-4 px-3 text-xs text-slate-600">
                            <div>Issued: {invoice.issueDate}</div>
                            <div className="text-slate-400 text-[11px]">Due: {invoice.dueDate}</div>
                          </td>

                          {/* Amount */}
                          <td className="py-4 px-3">
                            <p className="font-medium text-slate-900 font-mono">
                              {FXService.format(invoice.totalAmount, invoice.currency)}
                            </p>
                            {invoice.currency !== baseCurrency && (
                              <p className="text-[10px] text-slate-400 font-mono">
                                {FXService.format(baseAmount, baseCurrency)} Equiv.
                              </p>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-4 px-3">
                            {getStatusBadge(invoice.status)}
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => onViewInvoice(invoice)}
                                className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs hover:underline cursor-pointer"
                              >
                                View
                              </button>

                              {invoice.status !== 'paid' && (
                                <button
                                  onClick={() => onSendReminder(invoice)}
                                  className="text-amber-600 hover:text-amber-800 font-semibold text-xs hover:underline cursor-pointer"
                                >
                                  Remind
                                </button>
                              )}

                              <button
                                onClick={() => onEditInvoice(invoice)}
                                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                                title="Edit"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => onDeleteInvoice(invoice.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </section>

          {/* Secondary 2-Column Info Widgets matching Design HTML */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Global Tax Compliance Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Global Tax Compliance</p>
              <p className="text-sm text-slate-700 leading-snug">
                Digital VAT & GST reports for <span className="font-semibold">Q3 2026</span> are ready for submission. EU/UK VAT MOSS active.
              </p>
              <button 
                onClick={() => {
                  const tabBtn = document.getElementById('sidebar-nav-tax');
                  if (tabBtn) tabBtn.click();
                }}
                className="mt-3 text-xs text-indigo-600 font-bold hover:text-indigo-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                REVIEW FILINGS →
              </button>
            </div>

            {/* Auto-Reminders Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Auto-Reminders</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-700">Automated escalation ladder active</span>
                <div className="w-9 h-5 bg-indigo-600 rounded-full flex items-center px-1">
                  <div className="w-3.5 h-3.5 bg-white rounded-full ml-auto shadow-xs"></div>
                </div>
              </div>
              <button 
                onClick={() => {
                  const tabBtn = document.getElementById('sidebar-nav-reminders');
                  if (tabBtn) tabBtn.click();
                }}
                className="mt-3 text-xs text-indigo-600 font-bold hover:text-indigo-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                EDIT TEMPLATES →
              </button>
            </div>

          </div>

        </div>

        {/* Right Sidebar Financial Summary & Banking Widgets (matching Design HTML) */}
        <aside className="w-full lg:w-80 space-y-6 shrink-0">
          
          {/* Financial Summary Dark Card */}
          <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg border border-slate-800">
            <h3 className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wider">
              Financial Summary ({baseCurrency})
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-3xl font-bold font-mono">
                  {FXService.format(financialSummary.total, baseCurrency)}
                </p>
                <p className="text-xs text-emerald-400 font-medium mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  +12.4% vs last month
                </p>
              </div>

              {/* Cash Inflow Progress */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Cash Inflow (Paid)</span>
                  <span className="font-mono font-medium">{FXService.format(financialSummary.totalInflow, baseCurrency)}</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, Math.max(10, financialSummary.rate))}%` }}
                  />
                </div>
              </div>

              {/* Outstanding AR */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Outstanding Receivables</span>
                  <span className="font-mono font-medium text-amber-400">{FXService.format(financialSummary.totalOutstanding, baseCurrency)}</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-amber-400 h-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, Math.max(10, 100 - financialSummary.rate))}%` }}
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Banking Integration Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold text-slate-800 mb-4 uppercase tracking-wider">
              Banking Integration
            </h3>
            <div className="space-y-3">
              
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs italic shadow-xs">
                  CH
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800">Chase Business Checking</p>
                  <p className="text-[10px] text-slate-500 truncate">Account ending in **4421</p>
                </div>
                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                  Live
                </span>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold text-xs italic shadow-xs">
                  WI
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800">Wise Multi-Currency</p>
                  <p className="text-[10px] text-slate-500 truncate">USD, EUR, GBP Wallets</p>
                </div>
                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                  Live
                </span>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 opacity-60">
                <div className="w-8 h-8 bg-slate-800 rounded flex items-center justify-center text-white font-bold text-xs italic">
                  SV
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800">Silicon Valley Bank</p>
                  <p className="text-[10px] text-slate-500 truncate">Commercial Escrow</p>
                </div>
                <span className="text-xs font-semibold text-slate-400">
                  Syncing
                </span>
              </div>

            </div>

            <button 
              onClick={() => {
                const tabBtn = document.getElementById('sidebar-nav-banking');
                if (tabBtn) tabBtn.click();
              }}
              className="w-full mt-4 py-2 border-2 border-dashed border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 text-xs font-bold rounded-lg transition-all cursor-pointer"
            >
              + CONNECT NEW PLATFORM
            </button>
          </div>

        </aside>

      </div>

    </div>
  );
};
