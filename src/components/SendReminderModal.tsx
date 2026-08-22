import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Sparkles, 
  Loader2, 
  Check, 
  Mail
} from 'lucide-react';
import { Invoice, BusinessProfile } from '../types';
import { FXService } from '../services/fxService';

interface SendReminderModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  onReminderSent: (invoiceId: string, subject: string, body: string, tone: string) => void;
  businessProfile: BusinessProfile;
}

export const SendReminderModal: React.FC<SendReminderModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onReminderSent,
  businessProfile,
}) => {
  if (!isOpen || !invoice) return null;

  const [tone, setTone] = useState<string>(
    invoice.status === 'overdue' ? 'firm' : 'friendly'
  );
  const [customInstructions, setCustomInstructions] = useState('');
  const [subject, setSubject] = useState(
    `Payment Reminder: Invoice ${invoice.invoiceNumber} from ${businessProfile.name}`
  );
  const [body, setBody] = useState(
    `Hi ${invoice.client.name},\n\nWe hope this email finds you well. This is a gentle reminder regarding invoice ${invoice.invoiceNumber} for ${invoice.currency} ${invoice.balanceDue.toLocaleString()}, which was due on ${invoice.dueDate}.\n\nYou can easily review and settle your invoice online here:\n${window.location.origin}/portal/inv/${invoice.invoiceNumber}\n\nPlease let us know if you have any questions.\n\nWarm regards,\n${businessProfile.name}`
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const toneOptions = [
    { id: 'friendly', label: 'Warm & Friendly', desc: 'Courteous check-in for good clients' },
    { id: 'professional', label: 'Standard Professional', desc: 'Direct, neutral business tone' },
    { id: 'firm', label: 'Firm Follow-up', desc: 'For overdue bills needing clear priority' },
    { id: 'urgent', label: 'Urgent & Escalated', desc: 'For delinquent invoices >14 days' },
    { id: 'incentive_discount', label: '2% Early Discount Offer', desc: 'Offer a prompt settlement concession' },
  ];

  const handleGenerateAiCopy = async (selectedTone?: string) => {
    const toneToUse = selectedTone || tone;
    setIsGenerating(true);

    try {
      const res = await fetch('/api/ai/generate-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice,
          tone: toneToUse,
          customPrompt: customInstructions || `Write an effective ${toneToUse} payment reminder for ${businessProfile.name}. Include link: ${window.location.origin}/portal/inv/${invoice.invoiceNumber}`,
        }),
      });

      if (!res.ok) throw new Error('AI service error');
      const data = await res.json();
      if (data.subject) setSubject(data.subject);
      if (data.body) setBody(data.body);
    } catch (err) {
      console.error('Failed to generate AI reminder:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setSentSuccess(true);
      onReminderSent(invoice.id, subject, body, tone);
      setTimeout(() => {
        setSentSuccess(false);
        onClose();
      }, 1400);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-2xl text-slate-900 flex flex-col overflow-hidden max-h-[92vh] animate-fadeIn">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Send Payment Reminder: {invoice.invoiceNumber}
              </h3>
              <p className="text-xs text-slate-500">
                Recipient: <span className="text-slate-800 font-medium">{invoice.client.companyName} ({invoice.client.email})</span>
              </p>
            </div>
          </div>
          <button
            id="close-reminder-modal-btn"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          
          {/* Invoice Snapshot */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Outstanding Balance:</span>
              <span className="text-base font-bold text-indigo-600 font-mono">
                {FXService.format(invoice.balanceDue, invoice.currency)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Due Date:</span>
              <span className="font-semibold text-slate-900">{invoice.dueDate}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Reminders Sent So Far:</span>
              <span className="font-semibold text-amber-700">{invoice.reminderCount} reminder(s)</span>
            </div>
          </div>

          {/* Tone Selector & AI Prompt */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700">Select Communication Tone & Style:</label>
              <button
                type="button"
                onClick={() => handleGenerateAiCopy()}
                disabled={isGenerating}
                className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
              >
                {isGenerating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                <span>Generate with AI</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {toneOptions.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTone(t.id);
                    handleGenerateAiCopy(t.id);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    tone === t.id
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold text-slate-900">{t.label}</div>
                  <div className="text-[10px] text-slate-500 line-clamp-1">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Instruction Box */}
          <div>
            <label className="block text-slate-700 mb-1 font-semibold">
              Custom context or notes for AI copy (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Mention that next sprint starts as soon as this invoice is cleared..."
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Subject Line */}
          <div>
            <label className="block text-slate-700 mb-1 font-semibold">Email Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Message Body Preview */}
          <div>
            <label className="block text-slate-700 mb-1 font-semibold">Email Body Preview & Editing</label>
            <textarea
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-md p-3 text-slate-800 leading-relaxed font-sans focus:bg-white focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Will automatically log into invoice activity audit trail
          </span>
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="confirm-send-reminder-btn"
              onClick={handleSend}
              disabled={isSending || sentSuccess}
              className="flex items-center gap-2 px-5 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm transition-all cursor-pointer"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Dispatching Reminder...</span>
                </>
              ) : sentSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Reminder Dispatched!</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Reminder Now</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
