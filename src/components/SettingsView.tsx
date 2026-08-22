import React, { useState } from 'react';
import { 
  Building, 
  CreditCard, 
  Globe2, 
  Save, 
  Check, 
  Settings
} from 'lucide-react';
import { BusinessProfile } from '../types';
import { FXService } from '../services/fxService';

interface SettingsViewProps {
  businessProfile: BusinessProfile;
  onUpdateBusinessProfile: (profile: BusinessProfile) => void;
  baseCurrency: string;
  onChangeBaseCurrency: (curr: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  businessProfile,
  onUpdateBusinessProfile,
  baseCurrency,
  onChangeBaseCurrency,
}) => {
  const [profile, setProfile] = useState<BusinessProfile>({ ...businessProfile });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [ratesList, setRatesList] = useState<Record<string, number>>(() => FXService.getAllRates());

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBusinessProfile(profile);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleBaseCurrencyChange = (newBase: string) => {
    onChangeBaseCurrency(newBase);
    FXService.setBaseCurrency(newBase);
    setRatesList({ ...FXService.getAllRates() });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Business Profile & Global Invoicing Settings</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure company legal identification, bank wire remittance coordinates, and base reporting currency.
            </p>
          </div>
        </div>

        {savedSuccess && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-200 text-xs font-bold animate-fadeIn">
            <Check className="w-4 h-4" />
            <span>Settings Saved!</span>
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Business Legal Entity Info */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building className="w-4 h-4 text-indigo-600" />
            <span>Company Legal & Tax Identity</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 mb-1 font-semibold">Trading Name / Brand Name</label>
              <input
                type="text"
                required
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1 font-semibold">Full Legal Entity Name</label>
              <input
                type="text"
                required
                value={profile.legalEntityName}
                onChange={(e) => setProfile({ ...profile, legalEntityName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1 font-semibold">Tax ID / VAT Registration #</label>
              <input
                type="text"
                value={profile.taxId}
                onChange={(e) => setProfile({ ...profile, taxId: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1 font-semibold">Company Registered Email</label>
              <input
                type="email"
                required
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1 font-semibold">Headquarters Country</label>
              <input
                type="text"
                value={profile.country}
                onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1 font-semibold">Phone Number</label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-700 mb-1 font-semibold">Registered Office Address</label>
              <input
                type="text"
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
              />
            </div>
          </div>
        </div>

        {/* Global Banking & Wire Coordinates */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>Banking & Remittance Coordinates (Printed on Invoices)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 mb-1 font-semibold">Bank Name</label>
              <input
                type="text"
                value={profile.bankName}
                onChange={(e) => setProfile({ ...profile, bankName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1 font-semibold">Beneficiary Account Name</label>
              <input
                type="text"
                value={profile.accountName}
                onChange={(e) => setProfile({ ...profile, accountName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1 font-semibold">IBAN / Wire Account Number</label>
              <input
                type="text"
                value={profile.iban}
                onChange={(e) => setProfile({ ...profile, iban: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1 font-semibold">SWIFT / BIC Code</label>
              <input
                type="text"
                value={profile.swiftBic}
                onChange={(e) => setProfile({ ...profile, swiftBic: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1 font-semibold">Routing / Sort Code (Optional)</label>
              <input
                type="text"
                value={profile.routingNumber || ''}
                onChange={(e) => setProfile({ ...profile, routingNumber: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1 font-semibold">Wise Multi-Currency Tag (Optional)</label>
              <input
                type="text"
                value={profile.wiseTag || ''}
                onChange={(e) => setProfile({ ...profile, wiseTag: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Reporting Base Currency & FX Multi-Currency Matrix */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-indigo-600" />
              <span>Consolidated Financial Reporting Base Currency</span>
            </h3>
            <span className="text-[11px] text-indigo-700 font-mono font-bold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">Base: {baseCurrency}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 mb-1 font-semibold">Select Primary Base Reporting Currency</label>
              <select
                value={baseCurrency}
                onChange={(e) => handleBaseCurrencyChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white cursor-pointer"
              >
                {FXService.getSupportedCurrencies().map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} - {c.name} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Live Rates Grid */}
          <div className="pt-2">
            <span className="text-[11px] font-semibold text-slate-600 block mb-2">Live FX Conversion Matrix (1 {baseCurrency} = ):</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              {Object.entries(ratesList).map(([code, rate]) => (
                <div key={code} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between font-mono">
                  <span className="text-slate-800 font-bold">{code}</span>
                  <span className="text-indigo-600 font-semibold">{Number(rate).toFixed(4)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            id="save-business-settings-btn"
            className="flex items-center gap-2 px-6 py-2.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile & Invoicing Preferences</span>
          </button>
        </div>

      </form>

    </div>
  );
};
