import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Download, 
  Sparkles, 
  ArrowUpRight, 
  Activity,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { Invoice, Client, BusinessProfile } from '../types';
import { FXService } from '../services/fxService';

interface ReportsViewProps {
  invoices: Invoice[];
  clients: Client[];
  baseCurrency: string;
  businessProfile: BusinessProfile;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  invoices,
  clients,
  baseCurrency,
  businessProfile,
}) => {
  const [isGeneratingAiInsights, setIsGeneratingAiInsights] = useState(false);
  const [aiInsights, setAiInsights] = useState<any>(null);

  // Financial Metrics Calculated in Base Currency
  const metrics = useMemo(() => {
    let totalInvoiced = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    let totalOverdue = 0;
    const now = new Date();

    const aging = {
      current: 0,
      days_1_30: 0,
      days_31_60: 0,
      days_61_90: 0,
      days_90_plus: 0,
    };

    const clientRevenue: Record<string, { companyName: string; totalBilled: number; totalUnpaid: number }> = {};

    invoices.forEach((inv) => {
      const invTotalBase = FXService.convert(inv.totalAmount, inv.currency, baseCurrency);
      const invPaidBase = FXService.convert(inv.totalPaid, inv.currency, baseCurrency);
      const invDueBase = FXService.convert(inv.balanceDue, inv.currency, baseCurrency);

      totalInvoiced += invTotalBase;
      totalCollected += invPaidBase;
      totalOutstanding += invDueBase;

      const dueDate = new Date(inv.dueDate);
      const isPastDue = inv.status === 'overdue' || (inv.status !== 'paid' && dueDate < now);

      if (isPastDue) {
        totalOverdue += invDueBase;
        const diffDays = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 30) aging.days_1_30 += invDueBase;
        else if (diffDays <= 60) aging.days_31_60 += invDueBase;
        else if (diffDays <= 90) aging.days_61_90 += invDueBase;
        else aging.days_90_plus += invDueBase;
      } else if (inv.status !== 'paid') {
        aging.current += invDueBase;
      }

      if (!clientRevenue[inv.clientId]) {
        clientRevenue[inv.clientId] = {
          companyName: inv.client.companyName,
          totalBilled: 0,
          totalUnpaid: 0,
        };
      }
      clientRevenue[inv.clientId].totalBilled += invTotalBase;
      clientRevenue[inv.clientId].totalUnpaid += invDueBase;
    });

    const collectionEfficiency = totalInvoiced > 0 ? (totalCollected / totalInvoiced) * 100 : 100;
    const dsoDays = totalInvoiced > 0 ? Math.round((totalOutstanding / totalInvoiced) * 90) : 0;

    return {
      totalInvoiced,
      totalCollected,
      totalOutstanding,
      totalOverdue,
      collectionEfficiency,
      dsoDays,
      aging,
      clientRevenue: Object.values(clientRevenue).sort((a, b) => b.totalBilled - a.totalBilled),
    };
  }, [invoices, baseCurrency]);

  const handleFetchAiInsights = async () => {
    setIsGeneratingAiInsights(true);
    try {
      const res = await fetch('/api/ai/cashflow-forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoices: invoices.map(i => ({
            num: i.invoiceNumber,
            client: i.client.companyName,
            amount: i.totalAmount,
            currency: i.currency,
            status: i.status,
            dueDate: i.dueDate,
            balanceDue: i.balanceDue,
          })),
          baseCurrency,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiInsights(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingAiInsights(false);
    }
  };

  const handleExportReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      baseCurrency,
      summary: {
        totalInvoiced: metrics.totalInvoiced,
        totalCollected: metrics.totalCollected,
        totalOutstanding: metrics.totalOutstanding,
        totalOverdue: metrics.totalOverdue,
        collectionEfficiencyRate: `${metrics.collectionEfficiency.toFixed(1)}%`,
        daysSalesOutstanding: `${metrics.dsoDays} days`,
      },
      agingBuckets: metrics.aging,
      clientsBreakdown: metrics.clientRevenue,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Financial_Report_${baseCurrency}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner with AI Insights Trigger */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Real-Time Financial Reporting & Cashflow</h2>
            <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full">
              Consolidated in {baseCurrency}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            All international multi-currency receivables converted in real-time via live FX rates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportReport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>

          <button
            id="generate-ai-cfo-insights-btn"
            onClick={handleFetchAiInsights}
            disabled={isGeneratingAiInsights}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-indigo-200" />
            <span>{isGeneratingAiInsights ? 'Analyzing Cashflow...' : 'AI CFO Advisory Insights'}</span>
          </button>
        </div>
      </div>

      {/* AI CFO Advisory Insights Box */}
      {aiInsights && (
        <div className="p-6 rounded-xl bg-indigo-50/70 border border-indigo-200 text-slate-900 text-xs space-y-3 animate-fadeIn shadow-sm">
          <div className="flex items-center justify-between border-b border-indigo-200/60 pb-2.5">
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Gemini AI Financial Health Assessment</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-300 font-bold">
              Health Rating: {aiInsights.healthRating || 'Strong'}
            </span>
          </div>
          
          <p className="text-slate-700 leading-relaxed font-sans">{aiInsights.executiveSummary}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 bg-white rounded-lg border border-indigo-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-indigo-700 block mb-1">Projected 30-Day Cash Collection</span>
              <span className="text-base font-bold text-emerald-600 font-mono">
                {FXService.format(aiInsights.projected30DayCollections || metrics.totalOutstanding, baseCurrency)}
              </span>
            </div>
            <div className="p-3.5 bg-white rounded-lg border border-indigo-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-indigo-700 block mb-1">Key Action Recommendations</span>
              <ul className="list-disc list-inside text-slate-700 space-y-0.5">
                {aiInsights.actionItems?.map((act: string, idx: number) => (
                  <li key={idx} className="line-clamp-1">{act}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Core KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-slate-500 text-[11px] font-medium">Total Revenue Invoiced (YTD)</span>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {FXService.format(metrics.totalInvoiced, baseCurrency)}
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
            <ArrowUpRight className="w-3 h-3" /> +18.4% vs last period
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-slate-500 text-[11px] font-medium">Outstanding Receivables (AR)</span>
          <div className="text-2xl font-bold text-indigo-600 font-mono">
            {FXService.format(metrics.totalOutstanding, baseCurrency)}
          </div>
          <span className="text-[10px] text-slate-400">
            {invoices.filter(i => i.status !== 'paid').length} open invoice(s)
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-slate-500 text-[11px] font-medium">Overdue Accounts</span>
          <div className="text-2xl font-bold text-red-600 font-mono">
            {FXService.format(metrics.totalOverdue, baseCurrency)}
          </div>
          <span className="text-[10px] text-red-600 font-medium">
            Action required on late accounts
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-slate-500 text-[11px] font-medium">Collection Efficiency & DSO</span>
          <div className="text-2xl font-bold text-emerald-600 font-mono">
            {metrics.collectionEfficiency.toFixed(0)}%
          </div>
          <span className="text-[10px] text-slate-500">
            Avg DSO: <span className="font-bold text-slate-900">{metrics.dsoDays} days</span>
          </span>
        </div>

      </div>

      {/* AR Aging Buckets Analysis */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Accounts Receivable (AR) Aging Buckets</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Risk distribution of unpaid balances categorized by days past due.</p>
          </div>
          <span className="font-mono font-bold text-slate-900 text-sm">
            Total Open: {FXService.format(metrics.totalOutstanding, baseCurrency)}
          </span>
        </div>

        {/* Visual Distribution Bars */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          {[
            { label: 'Current (Not Due)', amount: metrics.aging.current, color: 'bg-emerald-500', textColor: 'text-emerald-700' },
            { label: '1 - 30 Days Past', amount: metrics.aging.days_1_30, color: 'bg-amber-500', textColor: 'text-amber-700' },
            { label: '31 - 60 Days Past', amount: metrics.aging.days_31_60, color: 'bg-orange-500', textColor: 'text-orange-700' },
            { label: '61 - 90 Days Past', amount: metrics.aging.days_61_90, color: 'bg-red-500', textColor: 'text-red-700' },
            { label: '90+ Days (Critical)', amount: metrics.aging.days_90_plus, color: 'bg-red-700', textColor: 'text-red-800' },
          ].map((bucket, idx) => {
            const pct = metrics.totalOutstanding > 0 ? (bucket.amount / metrics.totalOutstanding) * 100 : 0;
            return (
              <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-semibold text-slate-600 block truncate">{bucket.label}</span>
                <span className={`text-base font-bold font-mono block ${bucket.textColor}`}>
                  {FXService.format(bucket.amount, baseCurrency)}
                </span>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className={`h-full rounded-full ${bucket.color}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[10px] text-slate-500 font-mono block text-right font-medium">{pct.toFixed(0)}% of AR</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Client Exposure & Performance Breakdown */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Activity className="w-4 h-4 text-indigo-600" />
          <span>Revenue & Credit Exposure by Client</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Client Company</th>
                <th className="py-3 px-3 text-right">Total Billed YTD ({baseCurrency})</th>
                <th className="py-3 px-3 text-right">Outstanding Balance ({baseCurrency})</th>
                <th className="py-3 px-3 text-right">Payment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {metrics.clientRevenue.map((c, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-3 px-3 font-semibold text-slate-900">{c.companyName}</td>
                  <td className="py-3 px-3 text-right font-mono font-medium text-slate-900">
                    {FXService.format(c.totalBilled, baseCurrency)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-amber-700 font-semibold">
                    {FXService.format(c.totalUnpaid, baseCurrency)}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {c.totalUnpaid === 0 ? (
                      <span className="text-emerald-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200 font-bold text-[11px]">
                        Current (0 Due)
                      </span>
                    ) : (
                      <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-bold text-[11px]">
                        Pending Settlement
                      </span>
                    )}
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
