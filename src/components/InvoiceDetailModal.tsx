import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  CreditCard, 
  Copy, 
  Check, 
  Edit3, 
  Sparkles,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Invoice, BusinessProfile, PaymentMethod } from '../types';
import { FXService } from '../services/fxService';

interface InvoiceDetailModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (invoice: Invoice) => void;
  onMarkPaid: (invoiceId: string, method: PaymentMethod) => void;
  onSendReminder: (invoice: Invoice) => void;
  businessProfile: BusinessProfile;
  baseCurrency: string;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onEdit,
  onMarkPaid,
  onSendReminder,
  businessProfile,
}) => {
  const [activeView, setActiveView] = useState<'invoice' | 'client_portal' | 'audit_trail'>('invoice');
  const [copiedLink, setCopiedLink] = useState(false);
  const [payingState, setPayingState] = useState(false);
  const [selectedPayMethod, setSelectedPayMethod] = useState<PaymentMethod>('credit_card');
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');

  if (!isOpen || !invoice) return null;

  const isOverdue = invoice.status === 'overdue' || (
    invoice.status !== 'paid' && new Date(invoice.dueDate) < new Date()
  );

  const getStatusBadge = () => {
    switch (invoice.status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Paid & Settled
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5" />
            Overdue
          </span>
        );
      case 'partially_paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            Partially Paid
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold uppercase tracking-wider">
            <Send className="w-3.5 h-3.5" />
            Awaiting Payment
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold uppercase tracking-wider">
            Draft
          </span>
        );
    }
  };

  const handleCopyPortalLink = () => {
    const link = `${window.location.origin}/portal/inv/${invoice.invoiceNumber}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSimulatePayment = () => {
    setPayingState(true);
    setTimeout(() => {
      setPayingState(false);
      onMarkPaid(invoice.id, selectedPayMethod);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-4xl my-4 text-slate-900 flex flex-col max-h-[92vh] animate-fadeIn">
        
        {/* Top Control Bar */}
        <div className="px-6 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white sticky top-0 z-20 rounded-t-xl">
          
          {/* Tabs switch: Standard View vs Client Payment Portal Simulator */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveView('invoice')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'invoice'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Invoice Document
            </button>
            <button
              onClick={() => setActiveView('client_portal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'client_portal'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Client Portal View</span>
            </button>
            <button
              onClick={() => setActiveView('audit_trail')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'audit_trail'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Audit Trail ({invoice.auditTrail.length})
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyPortalLink}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              title="Copy Client Link"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied Link!' : 'Share Link'}</span>
            </button>
            
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              title="Print / Save PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>

            <button
              onClick={() => onEdit(invoice)}
              className="p-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs transition-colors cursor-pointer"
              title="Edit Invoice"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
          
          {/* VIEW 1: Printable High-Craft Invoice Paper Sheet */}
          {activeView === 'invoice' && (
            <div id="printable-invoice" className="bg-white text-slate-900 p-8 sm:p-10 rounded-xl shadow-sm max-w-3xl mx-auto font-sans text-xs border border-slate-200">
              
              {/* Header Letterhead */}
              <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-200 pb-6 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                      GL
                    </div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                      {businessProfile.name}
                    </h1>
                  </div>
                  <p className="text-slate-500 font-medium">{businessProfile.legalEntityName}</p>
                  <p className="text-slate-500">{businessProfile.address}, {businessProfile.city}, {businessProfile.state} {businessProfile.postalCode}</p>
                  <p className="text-slate-500">{businessProfile.email} • {businessProfile.phone}</p>
                  {businessProfile.taxId && (
                    <p className="text-slate-600 font-semibold mt-1">Tax/VAT ID: {businessProfile.taxId}</p>
                  )}
                </div>

                <div className="text-left sm:text-right">
                  <div className="inline-block mb-2">
                    {getStatusBadge()}
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-900 uppercase tracking-tight">
                    INVOICE
                  </h2>
                  <p className="font-mono text-sm font-bold text-indigo-600">{invoice.invoiceNumber}</p>
                  <div className="mt-2 space-y-0.5 text-slate-600">
                    <p>Issue Date: <span className="font-semibold text-slate-900">{invoice.issueDate}</span></p>
                    <p>Due Date: <span className={`font-semibold ${isOverdue ? 'text-red-600 font-bold' : 'text-slate-900'}`}>{invoice.dueDate}</span></p>
                    <p>Payment Terms: <span className="font-semibold text-slate-900">{invoice.paymentTerms}</span></p>
                  </div>
                </div>
              </div>

              {/* Bill To & Remittance Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">Billed To:</span>
                  <p className="font-bold text-sm text-slate-900">{invoice.client.companyName}</p>
                  <p className="text-slate-700 font-medium">{invoice.client.name}</p>
                  <p className="text-slate-500">{invoice.client.address}</p>
                  <p className="text-slate-500">{invoice.client.city} {invoice.client.postalCode}, {invoice.client.country}</p>
                  <p className="text-slate-500">{invoice.client.email}</p>
                  {invoice.client.taxId && (
                    <p className="text-slate-700 font-medium mt-1">Client Tax/VAT: {invoice.client.taxId}</p>
                  )}
                </div>

                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">Banking & Remittance:</span>
                  <p className="text-slate-800"><span className="font-semibold">Bank:</span> {businessProfile.bankName}</p>
                  <p className="text-slate-800"><span className="font-semibold">Account:</span> {businessProfile.accountName}</p>
                  <p className="text-slate-800 font-mono text-[11px]"><span className="font-semibold font-sans">SWIFT/BIC:</span> {businessProfile.swiftBic}</p>
                  <p className="text-slate-800 font-mono text-[11px]"><span className="font-semibold font-sans">IBAN / Wire:</span> {businessProfile.iban}</p>
                  {businessProfile.wiseTag && (
                    <p className="text-slate-800 text-[11px]"><span className="font-semibold">Wise:</span> {businessProfile.wiseTag}</p>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="py-6">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-300 text-slate-500 uppercase font-semibold text-[10px]">
                      <th className="pb-2 w-6/12">Description</th>
                      <th className="pb-2 w-1/12 text-right">Qty</th>
                      <th className="pb-2 w-2/12 text-right">Unit Price</th>
                      <th className="pb-2 w-1/12 text-right">Tax %</th>
                      <th className="pb-2 w-2/12 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoice.items.map((item) => (
                      <tr key={item.id} className="py-2.5">
                        <td className="py-2.5 text-slate-900 font-medium">{item.description}</td>
                        <td className="py-2.5 text-right text-slate-700">{item.quantity}</td>
                        <td className="py-2.5 text-right font-mono text-slate-700">
                          {FXService.format(item.unitPrice, invoice.currency)}
                        </td>
                        <td className="py-2.5 text-right text-slate-500">{item.taxRatePercent}%</td>
                        <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                          {FXService.format(item.total, invoice.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Subtotals & Balances */}
              <div className="border-t border-slate-200 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  {invoice.notes && (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Notes & Terms:</span>
                      <p className="text-slate-600 text-xs mt-0.5 whitespace-pre-line">{invoice.notes}</p>
                    </div>
                  )}
                  {invoice.taxType === 'reverse_charge' && (
                    <div className="p-2 rounded bg-indigo-50 border border-indigo-200 text-indigo-800 text-[11px]">
                      <span className="font-bold">EU Reverse Charge:</span> VAT to be accounted for by the recipient as per Article 196 of Council Directive 2006/112/EC.
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-right">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-medium">{FXService.format(invoice.subtotal, invoice.currency)}</span>
                  </div>
                  {invoice.totalDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount:</span>
                      <span className="font-mono">-{FXService.format(invoice.totalDiscount, invoice.currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>Tax ({invoice.taxType.toUpperCase()}):</span>
                    <span className="font-mono font-medium">{FXService.format(invoice.totalTax, invoice.currency)}</span>
                  </div>
                  <div className="border-t border-slate-300 pt-2 flex justify-between items-baseline text-slate-900">
                    <span className="font-bold text-sm">Total Amount:</span>
                    <span className="font-bold text-base font-mono">
                      {FXService.format(invoice.totalAmount, invoice.currency)}
                    </span>
                  </div>

                  {invoice.totalPaid > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Amount Paid:</span>
                      <span className="font-mono">-{FXService.format(invoice.totalPaid, invoice.currency)}</span>
                    </div>
                  )}

                  <div className="bg-slate-100 p-2.5 rounded-lg border border-slate-200 flex justify-between items-baseline text-slate-900 mt-2">
                    <span className="font-extrabold text-xs uppercase tracking-wider">Balance Due:</span>
                    <span className="font-extrabold text-base font-mono text-indigo-700">
                      {FXService.format(invoice.balanceDue, invoice.currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Signature Block */}
              {invoice.signatureName && (
                <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-end">
                  <div className="text-slate-400 text-[10px]">
                    Authorized Electronic Sign-off
                  </div>
                  <div className="text-right">
                    <span className="font-serif italic text-base text-slate-800 font-semibold">{invoice.signatureName}</span>
                    <p className="text-[10px] text-slate-500">Authorized Signature • {invoice.issueDate}</p>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* VIEW 2: Interactive Client Payment Portal (Simulates Client View) */}
          {activeView === 'client_portal' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 text-center space-y-3 shadow-sm">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs border border-indigo-200 font-semibold">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Interactive Client Checkout View</span>
                </div>
                
                <h2 className="text-xl font-bold text-slate-900">
                  Invoice from {businessProfile.name}
                </h2>
                
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Invoice <span className="font-mono font-bold text-slate-800">{invoice.invoiceNumber}</span> is prepared for <span className="font-semibold text-slate-800">{invoice.client.companyName}</span>.
                </p>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 inline-block text-left min-w-[280px]">
                  <div className="text-xs text-slate-500">Total Outstanding Balance:</div>
                  <div className="text-2xl font-bold text-indigo-600 font-mono">
                    {FXService.format(invoice.balanceDue, invoice.currency)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Due Date: {invoice.dueDate}</div>
                </div>
              </div>

              {invoice.status === 'paid' ? (
                <div className="p-6 rounded-xl bg-green-50 border border-green-200 text-center space-y-3 shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-green-800">This invoice has been fully settled!</h3>
                  <p className="text-xs text-green-700">
                    A formal payment receipt has been issued and logged to the ledger.
                  </p>
                </div>
              ) : (
                <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-5 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-indigo-600" />
                    <span>Select Payment Method</span>
                  </h3>

                  {/* Payment Method Selector */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: 'credit_card', label: 'Credit Card / Apple Pay', icon: '💳' },
                      { id: 'bank_transfer', label: 'Direct Wire / IBAN', icon: '🏦' },
                      { id: 'wise', label: 'Wise Global Transfer', icon: '🌐' },
                      { id: 'stripe', label: 'SEPA / ACH Transfer', icon: '⚡' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedPayMethod(m.id as PaymentMethod)}
                        className={`p-3 rounded-xl text-left border text-xs transition-all cursor-pointer ${
                          selectedPayMethod === m.id
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-base mb-1">{m.icon}</div>
                        <div className="font-semibold">{m.label}</div>
                      </button>
                    ))}
                  </div>

                  {/* Payment Inputs */}
                  {selectedPayMethod === 'credit_card' && (
                    <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <div>
                        <label className="block text-slate-700 mb-1 font-semibold">Cardholder Full Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Sarah Jenkins"
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-md p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <label className="block text-slate-700 mb-1 font-semibold">Card Number</label>
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-md p-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 mb-1 font-semibold">CVV / CVC</label>
                          <input
                            type="text"
                            defaultValue="882"
                            className="w-full bg-white border border-slate-200 rounded-md p-2 text-slate-900 font-mono text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedPayMethod === 'bank_transfer' && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 text-slate-700">
                      <p className="font-bold text-slate-900">Wire Instructions:</p>
                      <p><span className="font-semibold">Beneficiary:</span> {businessProfile.accountName}</p>
                      <p><span className="font-semibold">Bank:</span> {businessProfile.bankName}</p>
                      <p className="font-mono"><span className="font-semibold font-sans">IBAN:</span> {businessProfile.iban}</p>
                      <p className="font-mono"><span className="font-semibold font-sans">SWIFT:</span> {businessProfile.swiftBic}</p>
                      <p className="text-[11px] text-amber-700 font-semibold mt-2">Include reference: "{invoice.invoiceNumber}"</p>
                    </div>
                  )}

                  {/* Submit Payment Simulator */}
                  <button
                    id="client-portal-pay-now-btn"
                    onClick={handleSimulatePayment}
                    disabled={payingState}
                    className="w-full py-3 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {payingState ? (
                      <span>Verifying & Settling Transaction...</span>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-emerald-300" />
                        <span>Pay {FXService.format(invoice.balanceDue, invoice.currency)} Securely Now</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-slate-500 text-center flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    256-bit encrypted end-to-end payment gateway simulation
                  </p>
                </div>
              )}
            </div>
          )}

          {/* VIEW 3: Audit Trail Timeline */}
          {activeView === 'audit_trail' && (
            <div className="max-w-2xl mx-auto space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Invoice Lifecycle & Automated Event History</span>
              </h3>

              <div className="space-y-3 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {invoice.auditTrail.map((event) => (
                  <div key={event.id} className="relative flex items-start gap-3 pl-8">
                    <div className="absolute left-2 top-1.5 w-3.5 h-3.5 rounded-full bg-indigo-600 ring-4 ring-white" />
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex-1 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                          {event.action.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(event.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-600">{event.details}</p>
                      <div className="text-[10px] text-slate-400">Initiated by: {event.actor}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-3 sticky bottom-0 rounded-b-xl">
          <div className="flex items-center gap-2">
            {invoice.status !== 'paid' && (
              <button
                id="modal-send-reminder-btn"
                onClick={() => onSendReminder(invoice)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Send AI / Custom Reminder</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {invoice.status !== 'paid' ? (
              <button
                id="modal-mark-paid-btn"
                onClick={() => onMarkPaid(invoice.id, 'bank_transfer')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark as Paid</span>
              </button>
            ) : (
              <button
                onClick={() => onMarkPaid(invoice.id, 'bank_transfer')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Revert to Unpaid</span>
              </button>
            )}
            
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
