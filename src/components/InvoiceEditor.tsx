import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Calculator, 
  UserPlus, 
  Building2, 
  FileCheck
} from 'lucide-react';
import { Invoice, Client, LineItem, BusinessProfile, InvoiceStatus } from '../types';
import { SUPPORTED_CURRENCIES, FXService } from '../services/fxService';

interface InvoiceEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoice: Invoice) => void;
  initialInvoice?: Invoice | null;
  clients: Client[];
  onAddClient: (newClient: Client) => void;
  businessProfile: BusinessProfile;
  baseCurrency: string;
}

export const InvoiceEditor: React.FC<InvoiceEditorProps> = ({
  isOpen,
  onClose,
  onSave,
  initialInvoice,
  clients,
  onAddClient,
  businessProfile,
  baseCurrency,
}) => {
  if (!isOpen) return null;

  // Selected Client
  const [selectedClientId, setSelectedClientId] = useState<string>(
    initialInvoice?.clientId || (clients[0]?.id || '')
  );
  const [showNewClientForm, setShowNewClientForm] = useState(false);

  // New Client quick fields
  const [newClientName, setNewClientName] = useState('');
  const [newClientCompany, setNewClientCompany] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientCountry, setNewClientCountry] = useState('United States');
  const [newClientCurrency, setNewClientCurrency] = useState(baseCurrency);
  const [newClientTaxId, setNewClientTaxId] = useState('');

  // Invoice Fields
  const [invoiceNumber, setInvoiceNumber] = useState(
    initialInvoice?.invoiceNumber || `INV-2026-${Math.floor(100 + Math.random() * 900)}`
  );
  const [currency, setCurrency] = useState<string>(
    initialInvoice?.currency || clients[0]?.preferredCurrency || baseCurrency
  );
  const [issueDate, setIssueDate] = useState(
    initialInvoice?.issueDate || new Date().toISOString().split('T')[0]
  );
  const [paymentTermsDays, setPaymentTermsDays] = useState<number>(
    initialInvoice?.paymentTermsDays ?? businessProfile.defaultPaymentTermsDays ?? 30
  );
  const [dueDate, setDueDate] = useState(initialInvoice?.dueDate || '');
  const [taxType, setTaxType] = useState<any>(initialInvoice?.taxType || 'standard');
  const [taxRegistrationNumber, setTaxRegistrationNumber] = useState(
    initialInvoice?.taxRegistrationNumber || businessProfile.taxId || ''
  );
  const [notes, setNotes] = useState(
    initialInvoice?.notes || businessProfile.defaultNotes || ''
  );
  const [signatureName, setSignatureName] = useState(
    initialInvoice?.signatureName || businessProfile.legalEntityName || ''
  );

  // Line items
  const [items, setItems] = useState<LineItem[]>(
    initialInvoice?.items || [
      {
        id: 'li-' + Date.now(),
        description: 'Software Engineering & Consulting',
        quantity: 1,
        unitPrice: 1500,
        taxRatePercent: businessProfile.defaultTaxRatePercent || 0,
        discountPercent: 0,
        total: 1500,
      },
    ]
  );

  // Calculate Due Date based on issueDate + paymentTermsDays
  useEffect(() => {
    if (!issueDate) return;
    const issue = new Date(issueDate);
    issue.setDate(issue.getDate() + Number(paymentTermsDays));
    setDueDate(issue.toISOString().split('T')[0]);
  }, [issueDate, paymentTermsDays]);

  // If selected client changes, adopt their preferred currency if new invoice
  const handleClientChange = (cId: string) => {
    setSelectedClientId(cId);
    if (!initialInvoice) {
      const clientObj = clients.find(c => c.id === cId);
      if (clientObj?.preferredCurrency) {
        setCurrency(clientObj.preferredCurrency);
      }
      if (clientObj?.paymentTermsDays !== undefined) {
        setPaymentTermsDays(clientObj.paymentTermsDays);
      }
    }
  };

  const handleAddItem = () => {
    const defaultTax = taxType === 'vat' ? 20 : taxType === 'gst' ? 10 : 0;
    setItems([
      ...items,
      {
        id: 'li-' + Date.now() + Math.random().toString(36).substr(2, 4),
        description: '',
        quantity: 1,
        unitPrice: 0,
        taxRatePercent: defaultTax,
        discountPercent: 0,
        total: 0,
      },
    ]);
  };

  const handleItemChange = (index: number, field: keyof LineItem, value: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };

    // Recompute total
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    const discount = Number(item.discountPercent) || 0;
    const discountedPrice = price * (1 - discount / 100);
    item.total = qty * discountedPrice;

    updated[index] = item;
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = items.reduce((acc, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    return acc + qty * price;
  }, 0);

  const totalDiscount = items.reduce((acc, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    const disc = Number(item.discountPercent) || 0;
    return acc + qty * price * (disc / 100);
  }, 0);

  const totalTax = items.reduce((acc, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    const disc = Number(item.discountPercent) || 0;
    const discounted = price * (1 - disc / 100);
    const taxRate = Number(item.taxRatePercent) || 0;
    return acc + qty * discounted * (taxRate / 100);
  }, 0);

  const totalAmount = subtotal - totalDiscount + totalTax;

  // Handle adding a new client quickly inline
  const handleQuickAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientCompany.trim() || !newClientEmail.trim()) return;

    const newC: Client = {
      id: 'cli-' + Date.now(),
      name: newClientName || newClientCompany,
      companyName: newClientCompany,
      email: newClientEmail,
      address: '100 Business St',
      city: 'Capital City',
      postalCode: '10001',
      country: newClientCountry,
      taxId: newClientTaxId,
      preferredCurrency: newClientCurrency,
      paymentTermsDays: 30,
    };

    onAddClient(newC);
    setSelectedClientId(newC.id);
    setCurrency(newC.preferredCurrency);
    setShowNewClientForm(false);
    setNewClientName('');
    setNewClientCompany('');
    setNewClientEmail('');
  };

  const handleSaveInvoice = (saveStatus: InvoiceStatus) => {
    const client = clients.find((c) => c.id === selectedClientId) || clients[0];
    if (!client) return;

    const nowIso = new Date().toISOString();
    const isNew = !initialInvoice;

    const finalInvoice: Invoice = {
      id: initialInvoice?.id || 'inv-' + Date.now(),
      invoiceNumber,
      clientId: client.id,
      client,
      status: saveStatus,
      issueDate,
      dueDate,
      currency,
      exchangeRateToBase: FXService.getRate(currency),
      items,
      subtotal,
      totalTax,
      totalDiscount,
      totalAmount,
      totalPaid: initialInvoice?.totalPaid || (saveStatus === 'paid' ? totalAmount : 0),
      balanceDue: saveStatus === 'paid' ? 0 : (totalAmount - (initialInvoice?.totalPaid || 0)),
      notes,
      paymentTerms: paymentTermsDays === 0 ? 'Due on Receipt' : `Net ${paymentTermsDays}`,
      paymentTermsDays: Number(paymentTermsDays),
      taxType,
      taxRegistrationNumber,
      signatureName,
      signatureDate: issueDate,
      createdAt: initialInvoice?.createdAt || nowIso,
      updatedAt: nowIso,
      reminderCount: initialInvoice?.reminderCount || 0,
      auditTrail: [
        ...(initialInvoice?.auditTrail || []),
        {
          id: 'aud-' + Date.now(),
          timestamp: nowIso,
          action: isNew ? 'created' : 'updated',
          actor: 'User',
          details: isNew ? `Invoice ${invoiceNumber} created with status: ${saveStatus}` : `Invoice ${invoiceNumber} updated`,
        },
      ],
    };

    onSave(finalInvoice);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-5xl my-4 text-slate-900 flex flex-col max-h-[92vh] animate-fadeIn">
        
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-20 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900">
                {initialInvoice ? `Edit Invoice ${invoiceNumber}` : 'Create New Invoice'}
              </h2>
              <p className="text-xs text-slate-500">Configure client details, multi-currency items, and tax compliance.</p>
            </div>
          </div>
          <button
            id="close-editor-btn"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
          
          {/* Section 1: Client & Invoice Core Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            
            {/* Client Picker */}
            <div className="space-y-1.5 md:col-span-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">Client / Customer</label>
                <button
                  type="button"
                  onClick={() => setShowNewClientForm(!showNewClientForm)}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>{showNewClientForm ? 'Select Existing' : '+ New Client'}</span>
                </button>
              </div>

              {!showNewClientForm ? (
                <select
                  id="client-select"
                  value={selectedClientId}
                  onChange={(e) => handleClientChange(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-md p-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName} ({c.name}) - {c.country}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 bg-white border border-indigo-200 rounded-lg space-y-2 shadow-xs">
                  <span className="text-[11px] font-bold text-indigo-900 block">Quick Add Client</span>
                  <input
                    type="text"
                    placeholder="Company Name *"
                    value={newClientCompany}
                    onChange={(e) => setNewClientCompany(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-900"
                  />
                  <input
                    type="text"
                    placeholder="Contact Name"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-900"
                  />
                  <input
                    type="email"
                    placeholder="Email Address *"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-900"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Country (e.g. Germany)"
                      value={newClientCountry}
                      onChange={(e) => setNewClientCountry(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-900"
                    />
                    <input
                      type="text"
                      placeholder="Tax/VAT ID"
                      value={newClientTaxId}
                      onChange={(e) => setNewClientTaxId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-900 font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleQuickAddClient}
                    className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    Save & Attach Client
                  </button>
                </div>
              )}
            </div>

            {/* Invoice Number & Currency */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice #</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-md p-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Billing Currency</span>
                  <span className="text-[10px] text-slate-500">
                    1 {currency} ≈ {(1 / FXService.getRate(currency)).toFixed(4)} USD
                  </span>
                </label>
                <select
                  id="invoice-currency-select"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-md p-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer font-medium"
                >
                  {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.symbol}) - {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dates & Terms */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-md p-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Terms</label>
                  <select
                    value={paymentTermsDays}
                    onChange={(e) => setPaymentTermsDays(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-md p-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value={0}>Due on Receipt</option>
                    <option value={7}>Net 7 Days</option>
                    <option value={14}>Net 14 Days</option>
                    <option value={15}>Net 15 Days</option>
                    <option value={30}>Net 30 Days</option>
                    <option value={60}>Net 60 Days</option>
                    <option value={90}>Net 90 Days</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-md p-2 text-xs text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>
            </div>

          </div>

          {/* Section 2: Tax Framework & Exemption Selector */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-semibold text-slate-700">Tax Compliance Regime:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'standard', label: 'Standard Sales Tax' },
                { id: 'vat', label: 'EU / UK VAT (20%)' },
                { id: 'reverse_charge', label: 'EU Reverse Charge (0%)' },
                { id: 'gst', label: 'GST (10%)' },
                { id: 'exempt', label: 'Export / Tax Exempt' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTaxType(t.id);
                    if (t.id === 'reverse_charge' || t.id === 'exempt') {
                      setItems(items.map(i => ({ ...i, taxRatePercent: 0 })));
                    } else if (t.id === 'vat') {
                      setItems(items.map(i => ({ ...i, taxRatePercent: 20 })));
                    } else if (t.id === 'gst') {
                      setItems(items.map(i => ({ ...i, taxRatePercent: 10 })));
                    }
                  }}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    taxType === t.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Line Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Itemized Deliverables & Services</h3>
              <button
                type="button"
                id="add-line-item-btn"
                onClick={handleAddItem}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-semibold transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3 w-5/12">Description</th>
                    <th className="py-2.5 px-2 w-1/12 text-right">Qty</th>
                    <th className="py-2.5 px-2 w-2/12 text-right">Rate ({currency})</th>
                    <th className="py-2.5 px-2 w-1/12 text-right">Disc %</th>
                    <th className="py-2.5 px-2 w-1/12 text-right">Tax %</th>
                    <th className="py-2.5 px-3 w-2/12 text-right">Amount ({currency})</th>
                    <th className="py-2.5 px-2 w-8 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="p-2">
                        <input
                          type="text"
                          placeholder="Service or product description..."
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-900 focus:bg-white focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0.1"
                          step="any"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-900 text-right focus:bg-white focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-900 text-right focus:bg-white focus:ring-1 focus:ring-indigo-500 font-mono"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discountPercent || 0}
                          onChange={(e) => handleItemChange(idx, 'discountPercent', parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-900 text-right focus:bg-white focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.taxRatePercent || 0}
                          onChange={(e) => handleItemChange(idx, 'taxRatePercent', parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-900 text-right focus:bg-white focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="p-2 text-right font-mono font-semibold text-slate-900">
                        {FXService.format(item.total, currency)}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={items.length <= 1}
                          className="text-slate-400 hover:text-red-600 disabled:opacity-30 transition-colors p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Totals Breakdown & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            
            {/* Notes & Remittance instructions */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Instructions & Notes (Remittance details)
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Include wire details, IBAN/SWIFT, or credit card portal link..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Signatory Name</label>
                  <input
                    type="text"
                    value={signatureName}
                    onChange={(e) => setSignatureName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tax ID on Invoice</label>
                  <input
                    type="text"
                    value={taxRegistrationNumber}
                    onChange={(e) => setTaxRegistrationNumber(e.target.value)}
                    placeholder="e.g. DE319884210"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-xs text-slate-900 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Calculations Box */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono font-medium text-slate-900">{FXService.format(subtotal, currency)}</span>
              </div>
              
              {totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Total Discount:</span>
                  <span className="font-mono font-medium">-{FXService.format(totalDiscount, currency)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Tax ({taxType.toUpperCase()}):</span>
                <span className="font-mono font-medium text-slate-900">{FXService.format(totalTax, currency)}</span>
              </div>

              <div className="border-t border-slate-200 my-2 pt-2 flex justify-between items-baseline">
                <span className="font-bold text-sm text-slate-900">Total Amount Due:</span>
                <div className="text-right">
                  <span className="font-bold text-base text-indigo-600 font-mono block">
                    {FXService.format(totalAmount, currency)}
                  </span>
                  {currency !== baseCurrency && (
                    <span className="text-[10px] text-slate-400 block font-mono">
                      ≈ {FXService.format(FXService.convert(totalAmount, currency, baseCurrency), baseCurrency)} (Base)
                    </span>
                  )}
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-3 sticky bottom-0 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            Cancel
          </button>
          
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              id="save-draft-btn"
              onClick={() => handleSaveInvoice('draft')}
              className="px-4 py-2 rounded-md bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-xs"
            >
              Save as Draft
            </button>
            <button
              type="button"
              id="save-mark-paid-btn"
              onClick={() => handleSaveInvoice('paid')}
              className="px-4 py-2 rounded-md bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 text-xs font-semibold transition-all cursor-pointer"
            >
              Mark Already Paid
            </button>
            <button
              type="button"
              id="save-send-invoice-btn"
              onClick={() => handleSaveInvoice('sent')}
              className="px-5 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              <FileCheck className="w-4 h-4" />
              <span>Issue & Finalize Invoice</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
