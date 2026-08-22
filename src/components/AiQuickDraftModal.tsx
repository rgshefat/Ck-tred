import React, { useState } from 'react';
import { Sparkles, X, Loader2, ArrowRight, Wand2, Lightbulb } from 'lucide-react';
import { Client } from '../types';

interface AiQuickDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvoiceGenerated: (draftData: any) => void;
  clients: Client[];
  baseCurrency: string;
}

export const AiQuickDraftModal: React.FC<AiQuickDraftModalProps> = ({
  isOpen,
  onClose,
  onInvoiceGenerated,
  clients,
  baseCurrency,
}) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const samplePrompts = [
    'Bill AeroTech Dynamics GmbH €14,000 for Q3 Cloud Architecture Sprint and €2,500 for Security Audit, Net 30 with EU VAT reverse charge.',
    'Invoice Horizon Media Group £6,500 for Website Redesign, 40 hours of frontend development at £95/hr, plus 20% UK VAT Net 30.',
    'Bill Nordic Peak Analytics $8,500 for Data Pipeline Engineering (50 hours @ $170/hr) and $1,500 for Kafka integration, Net 14.',
    'Send invoice to Mirai Cloud Systems for 1,500,000 JPY monthly cloud retainer plus 10% Japanese consumption tax, Net 15.',
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/draft-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          clientsList: clients.map(c => ({ id: c.id, name: c.name, companyName: c.companyName, currency: c.preferredCurrency, country: c.country })),
          baseCurrency,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate draft from AI');
      }

      const data = await res.json();
      onInvoiceGenerated(data);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error communicating with AI service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden text-slate-900">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">AI Invoice Creator</h3>
              <p className="text-xs text-slate-500">Describe what you did in natural language, and Gemini will build the invoice.</p>
            </div>
          </div>
          <button
            id="close-ai-modal-btn"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Invoice Scope / Work Summary / Receipt Notes
            </label>
            <textarea
              id="ai-prompt-input"
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Bill Acme Corp $4,200 for React UI development (35 hrs @ $120) and $600 hosting setup, 0% tax, Net 30..."
              className="w-full bg-slate-50 border border-slate-200 rounded-md p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
            />
          </div>

          {error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs">
              {error}
            </div>
          )}

          {/* Quick Preset Ideas */}
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-semibold">Or click a quick prompt template to test:</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {samplePrompts.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(sample)}
                  className="text-left text-xs p-2.5 rounded-md bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-900 transition-all line-clamp-1 hover:line-clamp-none cursor-pointer"
                >
                  "{sample}"
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
            <Wand2 className="w-3.5 h-3.5 text-indigo-600" /> Powered by Gemini Flash
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="generate-draft-submit-btn"
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Drafting Invoice...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Invoice</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
