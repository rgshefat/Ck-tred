import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  Globe, 
  Edit3, 
  Trash2, 
  FileText, 
  ShieldCheck
} from 'lucide-react';
import { Client, Invoice } from '../types';
import { FXService } from '../services/fxService';

interface ClientsViewProps {
  clients: Client[];
  invoices: Invoice[];
  onSaveClient: (client: Client) => void;
  onDeleteClient: (clientId: string) => void;
  baseCurrency: string;
  onViewClientInvoices: (clientName: string) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  invoices,
  onSaveClient,
  onDeleteClient,
  baseCurrency,
  onViewClientInvoices,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState<Client>({
    id: '',
    name: '',
    companyName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'United States',
    taxId: '',
    preferredCurrency: 'USD',
    paymentTermsDays: 30,
    notes: '',
  });

  const handleOpenCreate = () => {
    setFormData({
      id: `client_${Date.now()}`,
      name: '',
      companyName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      postalCode: '',
      country: 'United States',
      taxId: '',
      preferredCurrency: 'USD',
      paymentTermsDays: 30,
      notes: '',
    });
    setIsCreating(true);
    setEditingClient(null);
  };

  const handleOpenEdit = (client: Client) => {
    setFormData(client);
    setEditingClient(client);
    setIsCreating(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.companyName || !formData.email) return;
    onSaveClient(formData);
    setIsCreating(false);
    setEditingClient(null);
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Global Client Directory</h2>
              <span className="text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                {clients.length} Registered Accounts
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Maintain international billing profiles, tax exempt IDs, preferred settlement currencies, and terms.
            </p>
          </div>
        </div>

        <button
          id="add-new-client-btn"
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Client</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search clients by name, company, country, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-md pl-9 pr-3 py-1.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
          />
        </div>
      </div>

      {/* Client Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
        {filteredClients.map((client) => {
          const clientInvoices = invoices.filter(i => i.clientId === client.id);
          const totalBilledBase = clientInvoices.reduce((acc, inv) => acc + FXService.convert(inv.totalAmount, inv.currency, baseCurrency), 0);
          const totalDueBase = clientInvoices.reduce((acc, inv) => acc + FXService.convert(inv.balanceDue, inv.currency, baseCurrency), 0);

          return (
            <div
              key={client.id}
              className="bg-white p-5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between space-y-4 shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">{client.companyName}</h3>
                    <p className="text-xs text-slate-500 font-medium">{client.name}</p>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                    {client.preferredCurrency}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-slate-500 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-700 truncate">{client.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-700">{client.city ? `${client.city}, ` : ''}{client.country}</span>
                  </div>
                  {client.taxId && (
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="text-emerald-700 font-mono text-[10px] font-medium">VAT/Tax: {client.taxId}</span>
                    </div>
                  )}
                </div>

                {/* Financial Summary Box */}
                <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 grid grid-cols-2 gap-2 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Total Invoiced</span>
                    <span className="font-mono font-bold text-slate-900 text-xs block">
                      {FXService.format(totalBilledBase, baseCurrency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Outstanding</span>
                    <span className={`font-mono font-bold text-xs block ${totalDueBase > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {FXService.format(totalDueBase, baseCurrency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <button
                  onClick={() => onViewClientInvoices(client.companyName)}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{clientInvoices.length} Invoices</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(client)}
                    className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Edit Client"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteClient(client.id)}
                    className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Delete Client"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Client Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-xl text-slate-900 p-6 space-y-4 max-h-[92vh] overflow-y-auto animate-fadeIn">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingClient ? 'Edit Client Details' : 'Add New Client Profile'}
              </h3>
              <p className="text-xs text-slate-500">Configure client billing information and payment preferences.</p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Company / Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Primary Contact Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Billing Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Preferred Currency</label>
                  <select
                    value={formData.preferredCurrency}
                    onChange={(e) => setFormData({ ...formData, preferredCurrency: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs cursor-pointer"
                  >
                    {FXService.getSupportedCurrencies().map((c) => (
                      <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Tax/VAT Number</label>
                  <input
                    type="text"
                    placeholder="e.g. DE123456789"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Billing Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setIsCreating(false); setEditingClient(null); }}
                className="px-4 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm cursor-pointer"
              >
                Save Client Profile
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
