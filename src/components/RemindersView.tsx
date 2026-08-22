import React, { useState } from 'react';
import { 
  Bell, 
  Play, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Sparkles, 
  Mail, 
  Send, 
  Edit3, 
  RefreshCw,
  Layers
} from 'lucide-react';
import { PaymentReminderRule, Invoice, BusinessProfile } from '../types';
import { FXService } from '../services/fxService';

interface RemindersViewProps {
  rules: PaymentReminderRule[];
  onUpdateRules: (rules: PaymentReminderRule[]) => void;
  invoices: Invoice[];
  onTriggerBatchReminders: () => { sentCount: number; invoicesProcessed: string[] };
  businessProfile: BusinessProfile;
  baseCurrency: string;
  onSendCustomReminder: (invoice: Invoice) => void;
}

export const RemindersView: React.FC<RemindersViewProps> = ({
  rules,
  onUpdateRules,
  invoices,
  onTriggerBatchReminders,
  businessProfile,
  baseCurrency,
  onSendCustomReminder,
}) => {
  const [editingRule, setEditingRule] = useState<PaymentReminderRule | null>(null);
  const [simulationLogs, setSimulationLogs] = useState<Array<{
    timestamp: string;
    invoiceNum: string;
    clientName: string;
    ruleName: string;
    status: string;
    tone: string;
  }>>([
    {
      timestamp: 'Today, 08:30 AM',
      invoiceNum: 'INV-2026-002',
      clientName: 'Horizon Media Group Ltd',
      ruleName: 'Overdue Follow-up (7 Days)',
      status: 'Delivered (Email)',
      tone: 'firm',
    },
    {
      timestamp: 'Yesterday, 09:00 AM',
      invoiceNum: 'INV-2026-004',
      clientName: 'Nordic Peak Analytics',
      ruleName: 'Due Date Notification',
      status: 'Delivered & Opened',
      tone: 'professional',
    },
    {
      timestamp: '2 days ago',
      invoiceNum: 'INV-2026-001',
      clientName: 'AeroTech Dynamics GmbH',
      ruleName: 'Upcoming Due Date Courtesy Reminder',
      status: 'Settled After Reminder',
      tone: 'friendly',
    }
  ]);

  const [isRunningScan, setIsRunningScan] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  // Invoices currently requiring attention
  const unpaidInvoices = invoices.filter((i) => i.status !== 'paid' && i.status !== 'draft');
  const overdueInvoices = invoices.filter((i) => i.status === 'overdue' || (
    i.status !== 'paid' && new Date(i.dueDate) < new Date()
  ));

  const handleToggleRule = (id: string) => {
    const updated = rules.map((r) => r.id === id ? { ...r, isEnabled: !r.isEnabled } : r);
    onUpdateRules(updated);
  };

  const handleSaveRuleEdit = (updatedRule: PaymentReminderRule) => {
    const updated = rules.map((r) => r.id === updatedRule.id ? updatedRule : r);
    onUpdateRules(updated);
    setEditingRule(null);
  };

  const handleRunDailyCron = () => {
    setIsRunningScan(true);
    setScanResult(null);

    setTimeout(() => {
      const { sentCount, invoicesProcessed } = onTriggerBatchReminders();
      setIsRunningScan(false);

      if (sentCount > 0) {
        const newLogs = invoicesProcessed.map((num) => ({
          timestamp: 'Just now (Automated Scan)',
          invoiceNum: num,
          clientName: invoices.find(i => i.invoiceNumber === num)?.client?.companyName || 'Client',
          ruleName: 'Automated Schedule Trigger',
          status: 'Delivered (Email)',
          tone: 'automated',
        }));
        setSimulationLogs((prev) => [...newLogs, ...prev]);
        setScanResult(`Successfully scanned ${invoices.length} invoices: Dispatched ${sentCount} automated reminder notification(s).`);
      } else {
        setScanResult(`Scan complete: All active invoices are current. No pending reminder triggers found.`);
      }
    }, 1100);
  };

  const getToneBadge = (tone: string) => {
    switch (tone) {
      case 'friendly':
        return <span className="text-[11px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Warm & Friendly</span>;
      case 'firm':
        return <span className="text-[11px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">Firm Follow-up</span>;
      case 'urgent':
        return <span className="text-[11px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">Urgent Escalation</span>;
      case 'incentive_discount':
        return <span className="text-[11px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">2% Discount Incentive</span>;
      default:
        return <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">Professional Neutral</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Automated Engine Status Header */}
      <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20 shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">Automated Payment Reminders Engine</h2>
              <span className="flex items-center gap-1 text-[11px] font-semibold bg-green-900/60 text-green-300 border border-green-700/60 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Active Daemon
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated escalation ladder scans invoices daily, schedules multi-channel follow-ups, and logs full audit history.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            id="run-daily-reminders-scan-btn"
            onClick={handleRunDailyCron}
            disabled={isRunningScan}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-all w-full md:w-auto cursor-pointer"
          >
            {isRunningScan ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Scanning Invoices...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Run Schedule Scan Now</span>
              </>
            )}
          </button>
        </div>
      </div>

      {scanResult && (
        <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="font-medium">{scanResult}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-500 font-medium block text-xs">Active Escalation Rules</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              {rules.filter(r => r.isEnabled).length} of {rules.length} Active
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-500 font-medium block text-xs">Unpaid Invoices Tracked</span>
            <span className="text-2xl font-bold text-amber-600 mt-1 block font-mono">
              {unpaidInvoices.length} Invoices
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-500 font-medium block text-xs">Overdue Accounts</span>
            <span className="text-2xl font-bold text-red-600 mt-1 block font-mono">
              {overdueInvoices.length} Overdue
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Rules Engine Configuration Section */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-base text-slate-900">Scheduled Automation Rules & Escalation Ladder</h3>
            <p className="text-xs text-slate-500 mt-0.5">Configure trigger conditions, timing offsets, communication tone, and message templates.</p>
          </div>
        </div>

        <div className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`p-4 rounded-xl border transition-all ${
                rule.isEnabled
                  ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  : 'bg-slate-50/50 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                
                <div className="flex items-start sm:items-center gap-3">
                  <input
                    type="checkbox"
                    checked={rule.isEnabled}
                    onChange={() => handleToggleRule(rule.id)}
                    className="w-4 h-4 rounded text-indigo-600 bg-white border-slate-300 mt-0.5 sm:mt-0 cursor-pointer focus:ring-indigo-500"
                  />
                  
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-slate-900">{rule.name}</span>
                      {getToneBadge(rule.tone)}
                      <span className="text-[11px] text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-full font-medium">
                        {rule.triggerCondition === 'before_due'
                          ? `${Math.abs(rule.daysOffset)} days before due`
                          : rule.triggerCondition === 'on_due_date'
                          ? 'On due date'
                          : `${rule.daysOffset} days past due`}
                      </span>
                      <span className="text-[11px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200 font-bold">
                        {rule.channel.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                      Subject: <span className="text-slate-700 font-mono">{rule.subjectTemplate}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => setEditingRule(rule)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Template</span>
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Rule Modal */}
      {editingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-xl text-slate-900 p-6 space-y-4 animate-fadeIn">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Edit Reminder Rule: {editingRule.name}</h3>
              <p className="text-xs text-slate-500">Update messaging templates and communication channels.</p>
            </div>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Rule Name</label>
                <input
                  type="text"
                  value={editingRule.name}
                  onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Communication Tone</label>
                  <select
                    value={editingRule.tone}
                    onChange={(e) => setEditingRule({ ...editingRule, tone: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs cursor-pointer"
                  >
                    <option value="friendly">Warm & Friendly</option>
                    <option value="professional">Professional Neutral</option>
                    <option value="firm">Firm Follow-up</option>
                    <option value="urgent">Urgent & Escalated</option>
                    <option value="incentive_discount">2% Early Discount Incentive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Channel</label>
                  <select
                    value={editingRule.channel}
                    onChange={(e) => setEditingRule({ ...editingRule, channel: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs cursor-pointer"
                  >
                    <option value="email">Email Only</option>
                    <option value="sms">SMS Only</option>
                    <option value="both">Both (Email + SMS)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Email Subject Template</label>
                <input
                  type="text"
                  value={editingRule.subjectTemplate}
                  onChange={(e) => setEditingRule({ ...editingRule, subjectTemplate: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
                <span className="text-[10px] text-slate-400">Available tags: {'{invoice_num}'}, {'{business_name}'}, {'{amount_due}'}, {'{due_date}'}, {'{days_overdue}'}</span>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Message Body Template</label>
                <textarea
                  rows={5}
                  value={editingRule.bodyTemplate}
                  onChange={(e) => setEditingRule({ ...editingRule, bodyTemplate: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-2.5 text-slate-900 resize-none font-sans text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditingRule(null)}
                className="px-4 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveRuleEdit(editingRule)}
                className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm cursor-pointer"
              >
                Save Rule Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reminder Activity Logs */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Mail className="w-4 h-4 text-indigo-600" />
            <span>Recent Automated Reminders & Delivery Log</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">Live Delivery Feed</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Invoice</th>
                <th className="py-2.5 px-3">Recipient Company</th>
                <th className="py-2.5 px-3">Triggered Rule</th>
                <th className="py-2.5 px-3">Delivery Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {simulationLogs.map((log, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">{log.timestamp}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{log.invoiceNum}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-900">{log.clientName}</td>
                  <td className="py-2.5 px-3 text-indigo-700 font-medium">{log.ruleName}</td>
                  <td className="py-2.5 px-3 text-green-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{log.status}</span>
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
