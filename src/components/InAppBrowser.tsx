import React, { useState } from 'react';
import { Copy, Globe, Check } from 'lucide-react';

export const InAppBrowser: React.FC<{ initialUrl?: string }> = ({ initialUrl = 'https://derickmusiyalike.com' }) => {
  const [url, setUrl] = useState(initialUrl);
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-zinc-200 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center">
          <Globe className="w-5 h-5 text-zinc-500" />
        </div>
        <div className="flex-grow relative">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setCurrentUrl(url)}
            className="w-full pl-4 pr-12 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all"
            placeholder="Enter URL (e.g., https://example.com)"
          />
          <button 
            onClick={() => setCurrentUrl(url)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <button 
          onClick={handleCopy}
          className={`p-3 rounded-xl border transition-all flex items-center gap-2 ${
            copied ? 'bg-green-50 border-green-200 text-green-600' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
          }`}
          title="Copy URL"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span className="text-xs font-bold uppercase tracking-widest hidden sm:inline">
            {copied ? 'Copied' : 'Copy'}
          </span>
        </button>
      </div>
      <div className="relative group">
        <div className="absolute inset-0 bg-zinc-900/5 rounded-2xl -m-1 blur-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
        <iframe 
          src={currentUrl} 
          className="w-full h-[600px] bg-white border border-zinc-200 rounded-2xl shadow-inner relative z-10" 
          title="Browser" 
        />
      </div>
      <div className="mt-4 flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
        <span>In-App Secure Browser</span>
        <span>Derick Musiyalike Tools</span>
      </div>
    </div>
  );
};

const ArrowRight = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);
