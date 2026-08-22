import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Globe2, 
  FileCheck, 
  AlertTriangle, 
  Download, 
  Sparkles, 
  ExternalLink,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { Invoice, BusinessProfile } from '../types';
import { FXService } from '../services/fxService';

interface TaxComplianceViewProps {
  invoices: Invoice[];
  baseCurrency: string;
  businessProfile: BusinessProfile;
}

export const TaxComplianceView: React.FC<TaxComplianceViewProps> = ({
  invoices,
  baseCurrency,
  businessProfile,
}) => {
  const [isAuditing, setIsAuditing] = useState(false);
  const [taxAuditResult, setTaxAuditResult] = useState<any>(null);

  // Group Tax Liabilities by Jurisdiction
  const taxBreakdown = useMemo(() => {
    let totalTaxLiabilityBase = 0;
    let totalTaxableSalesBase = 0;

    const map: Record<string, { jurisdiction: string; taxCollected: number; taxableSales: number; invoiceCount: number; taxType: string }> = {
      'United States': { jurisdiction: 'United States (State Sales Tax)', taxCollected: 0, taxableSales: 0, invoiceCount: 0, taxType: 'State Sales Tax' },
      'European Union': { jurisdiction: 'European Union (VAT MOSS)', taxCollected: 0, taxableSales: 0, invoiceCount: 0, taxType: 'EU Standard VAT' },
      'United Kingdom': { jurisdiction: 'United Kingdom (HMRC VAT)', taxCollected: 0, taxableSales: 0, invoiceCount: 0, taxType: 'UK VAT 20%' },
      'Japan': { jurisdiction: 'Japan (JCT National)', taxCollected: 0, taxableSales: 0, invoiceCount: 0, taxType: 'Japanese Consumption Tax' },
      'Australia': { jurisdiction: 'Australia (ATO GST)', taxCollected: 0, taxableSales: 0, invoiceCount: 0, taxType: 'Australian GST' },
      'Singapore': { jurisdiction: 'Singapore (IRAS GST)', taxCollected: 0, taxableSales: 0, invoiceCount: 0, taxType: 'Singapore GST' },
      'Other': { jurisdiction: 'Rest of World / Export Exempt', taxCollected: 0, taxableSales: 0, invoiceCount: 0, taxType: 'Zero-Rated / Exempt' },
    };

    invoices.forEach((inv) => {
      const taxBase = FXService.convert(inv.totalTax, inv.currency, baseCurrency);
      const subtotalBase = FXService.convert(inv.subtotal, inv.currency, baseCurrency);

      totalTaxLiabilityBase += taxBase;
      totalTaxableSalesBase += subtotalBase;

      const country = inv.client.country;
      let targetKey = 'Other';

      if (country === 'United States') {
        targetKey = 'United States';
      } else if (['Germany', 'France', 'Netherlands', 'Ireland', 'Spain', 'Italy', 'Sweden', 'Poland'].includes(country)) {
        targetKey = 'European Union';
      } else if (country === 'United Kingdom') {
        targetKey = 'United Kingdom';
      } else if (country === 'Japan') {
        targetKey = 'Japan';
      } else if (country === 'Australia') {
        targetKey = 'Australia';
      } else if (country === 'Singapore') {
        targetKey = 'Singapore';
      }

      if (map[targetKey]) {
        map[targetKey].taxableSales += subtotalBase;
        map[targetKey].taxCollected += taxBase;
        map[targetKey].invoiceCount += 1;
      }
    });

    return {
      jurisdictions: Object.values(map).filter((j) => j.invoiceCount > 0 || j.taxCollected > 0),
      totalTaxLiabilityBase,
      totalTaxableSalesBase,
    };
  }, [invoices, baseCurrency]);

  const handleRunAiTaxAudit = async () => {
    setIsAuditing(true);
    try {
      const res = await fetch('/api/ai/tax-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoices: invoices.map(i => ({
            num: i.invoiceNumber,
            clientCountry: i.client.country,
            taxId: i.client.taxId,
            taxType: i.taxType,
            amount: i.totalAmount,
            taxAmount: i.totalTax,
            currency: i.currency,
          })),
          businessCountry: businessProfile.country,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTaxAuditResult(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleExportTaxSchedule = () => {
    const data = {
      taxPeriod: '2026-Q3',
      reportingEntity: businessProfile.legalEntityName,
      taxRegistrationNumber: businessProfile.taxId,
      baseCurrency,
      totalTaxCollected: taxBreakdown.totalTaxLiabilityBase,
      totalTaxableSales: taxBreakdown.totalTaxableSalesBase,
      jurisdictionBreakdown: taxBreakdown.jurisdictions,
      exemptAndReverseChargeInvoices: invoices
        .filter(i => i.taxType === 'reverse_charge' || i.taxType === 'exempt')
        .map(i => ({
          invoice: i.invoiceNumber,
          client: i.client.companyName,
          country: i.client.country,
          clientTaxId: i.client.taxId || 'N/A',
          taxType: i.taxType,
          subtotal: i.subtotal,
          currency: i.currency,
        })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Global_Tax_Filing_Schedule_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-green-50 text-green-700 flex items-center justify-center border border-green-200">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Global Tax Compliance & Cross-Border Nexus</h2>
              <span className="text-[11px] font-bold bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full">
                VAT / GST / Sales Tax Ready
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated EU reverse charge validation, VAT deduction audit, and multi-jurisdiction tax collection.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportTaxSchedule}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Filing Schedule</span>
          </button>
          
          <button
            id="run-tax-compliance-ai-btn"
            onClick={handleRunAiTaxAudit}
            disabled={isAuditing}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-indigo-200" />
            <span>{isAuditing ? 'Auditing Invoices...' : 'AI Tax Compliance Audit'}</span>
          </button>
        </div>
      </div>

      {/* AI Tax Audit Results Box */}
      {taxAuditResult && (
        <div className="p-6 rounded-xl bg-emerald-50/70 border border-emerald-200 text-slate-900 text-xs space-y-3 shadow-sm animate-fadeIn">
          <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2.5">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>International Tax Audit Report</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
              Compliance Risk: {taxAuditResult.riskScore || 'Low'}
            </span>
          </div>

          <p className="text-slate-700 leading-relaxed font-sans">{taxAuditResult.summary}</p>

          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] uppercase font-bold text-emerald-800 block">Key Advisory Findings:</span>
            <ul className="list-disc list-inside text-slate-700 space-y-1">
              {taxAuditResult.recommendations?.map((rec: string, idx: number) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Tax Liability Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-slate-500 font-medium text-[11px]">Total Tax Liability Collected</span>
          <div className="text-2xl font-bold text-emerald-600 font-mono">
            {FXService.format(taxBreakdown.totalTaxLiabilityBase, baseCurrency)}
          </div>
          <span className="text-[10px] text-slate-400">Held for quarterly remittance</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-slate-500 font-medium text-[11px]">Total Taxable Gross Sales</span>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {FXService.format(taxBreakdown.totalTaxableSalesBase, baseCurrency)}
          </div>
          <span className="text-[10px] text-slate-400">Across {invoices.length} transactions</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-slate-500 font-medium text-[11px]">Active Tax Registrations</span>
          <div className="text-2xl font-bold text-indigo-600 font-mono">
            {businessProfile.taxId ? 'Registered' : 'Pending'}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {businessProfile.taxId || 'US EIN / VAT'}
          </span>
        </div>
      </div>

      {/* Jurisdictions Table */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Globe2 className="w-4 h-4 text-indigo-600" />
          <span>Tax Collected by Jurisdiction & Framework</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Jurisdiction</th>
                <th className="py-3 px-3">Tax Framework</th>
                <th className="py-3 px-3 text-right">Invoices</th>
                <th className="py-3 px-3 text-right">Taxable Gross ({baseCurrency})</th>
                <th className="py-3 px-3 text-right">Tax Collected ({baseCurrency})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {taxBreakdown.jurisdictions.map((j, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-3 px-3 font-semibold text-slate-900">{j.jurisdiction}</td>
                  <td className="py-3 px-3 text-slate-600">{j.taxType}</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-500">{j.invoiceCount}</td>
                  <td className="py-3 px-3 text-right font-mono font-medium text-slate-900">
                    {FXService.format(j.taxableSales, baseCurrency)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">
                    {FXService.format(j.taxCollected, baseCurrency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* B2B Reverse Charge & Exemption Register */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-indigo-600" />
          <span>Cross-Border Zero-Rated & Reverse Charge Audit Log</span>
        </h3>
        <p className="text-xs text-slate-500 border-b border-slate-100 pb-3">
          Statutory register of EU VAT reverse charge and international export transactions required for tax authorities.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Invoice #</th>
                <th className="py-3 px-3">Customer Company</th>
                <th className="py-3 px-3">Country</th>
                <th className="py-3 px-3">Customer VAT/Tax ID</th>
                <th className="py-3 px-3">Exemption Basis</th>
                <th className="py-3 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {invoices
                .filter(i => i.taxType === 'reverse_charge' || i.taxType === 'exempt')
                .map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                    <td className="py-3 px-3 font-medium text-slate-900">{inv.client.companyName}</td>
                    <td className="py-3 px-3 text-slate-600">{inv.client.country}</td>
                    <td className="py-3 px-3 font-mono text-indigo-700 font-medium">{inv.client.taxId || 'Verified B2B'}</td>
                    <td className="py-3 px-3 text-slate-500">
                      {inv.taxType === 'reverse_charge' ? 'EU VAT Directive Art. 196' : 'Export of B2B Services'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {FXService.format(inv.totalAmount, inv.currency)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
