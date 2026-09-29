import React, { useState, useEffect } from 'react';
import { Share2, Copy, Check, Globe, Smartphone, X, Cloud, Zap, ShieldCheck, ExternalLink, Download } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  venueName?: string;
  city?: string;
}

export const ShareLinkModal: React.FC<Props> = ({
  isOpen,
  onClose,
  venueName,
  city,
}) => {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);
  const currentUrl = window.location.href;
  const sharedUrl = 'https://ais-pre-4hdiqhhjl5b3lcbyjwy6yv-873518940994.asia-east1.run.app';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl border border-white/20">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">Deploy & Share Without Billing</h3>
              <p className="text-xs text-emerald-100">100% Free Hosting • No Credit Card Required</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors cursor-pointer shrink-0"
            title="Close dialog (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
          {/* Active Free Hosted URL */}
          <div>
            <label className="block text-slate-300 font-bold mb-1.5 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              Live Free App URL (Active Now - Zero Billing)
            </label>
            <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-emerald-500/40 shadow-inner">
              <input
                type="text"
                readOnly
                value={sharedUrl}
                className="bg-transparent text-emerald-400 font-mono text-xs flex-1 outline-none select-all"
              />
              <button
                onClick={() => handleCopy(sharedUrl)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                {copied ? <Check className="w-4 h-4 text-slate-950" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              This link is already running live on Google Cloud. You and your team can open it immediately on any computer, tablet, or phone without setting up any billing.
            </p>
          </div>

          {/* Explanation of "Set up billing" modal */}
          <div className="p-4 bg-slate-950/80 border border-amber-500/40 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
              <span className="p-1 bg-amber-500/20 rounded-md">ℹ️</span>
              Why does AI Studio's "Publish" button show "Set up billing"?
            </div>
            <div className="text-[11px] text-slate-300 space-y-1.5 leading-relaxed">
              <p>
                When you click <strong>"Publish"</strong> inside Google AI Studio, it attempts to provision a dedicated <strong>Cloud Run</strong> container inside your private GCP project. Google Cloud requires a billing account on file to activate Cloud Run APIs (even though Google includes an ongoing <strong>Free Tier of 2 million requests/month</strong>).
              </p>
              <p className="text-amber-200">
                👉 <strong>If you do NOT want to enter credit card or billing details</strong>, you do not need to click Publish! Choose one of the 100% free options below.
              </p>
            </div>
          </div>

          {/* Alternative 100% Free Deployment Options */}
          <div className="space-y-2.5">
            <div className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
              <Cloud className="w-4 h-4 text-cyan-400" />
              100% Free Hosting Solutions (No Billing or Card Required)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Option 1: Use AI Studio Shared Link */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400 text-xs">1. Free Shared Preview</span>
                  <span className="text-[9px] font-mono bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800">
                    Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Ready right now. Share the link above with any user. Runs in browser with zero setup.
                </p>
              </div>

              {/* Option 2: Firebase Hosting Spark Plan */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-400 text-xs">2. Firebase Hosting</span>
                  <span className="text-[9px] font-mono bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-800">
                    Spark Free Tier
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Firebase Spark plan is completely free. We have created <code>firebase.json</code> and pre-built <code>dist/</code>.
                </p>
              </div>

              {/* Option 3: Netlify / Vercel */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sky-400 text-xs">3. Netlify / Vercel</span>
                  <span className="text-[9px] font-mono bg-sky-950 text-sky-300 px-1.5 py-0.5 rounded border border-sky-800">
                    Zero Card
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Drag and drop the compiled <code>dist</code> folder into <a href="https://app.netlify.com/drop" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline">Netlify Drop</a> for instant free global HTTPS hosting.
                </p>
              </div>

              {/* Option 4: GitHub Pages */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-400 text-xs">4. GitHub Pages</span>
                  <span className="text-[9px] font-mono bg-purple-950 text-purple-300 px-1.5 py-0.5 rounded border border-purple-800">
                    Free
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Push to GitHub repository and enable Pages for completely free organization hosting.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300">
            <Smartphone className="w-5 h-5 shrink-0" />
            <span className="text-[11px]">
              The web app works on laptops, tablets, and phones across Chrome, Edge, Safari, and Firefox.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center shrink-0">
          <span className="text-[11px] text-slate-500 font-mono">Status: Ready for Free Use</span>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
          >
            <X className="w-4 h-4" />
            <span>Close</span>
          </button>
        </div>
      </div>
    </div>
  );
};
