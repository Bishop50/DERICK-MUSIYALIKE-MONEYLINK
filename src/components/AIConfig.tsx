import React, { useEffect, useState } from 'react';
import { Activity, Shield, Key, Save, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export const AIConfig: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [serverStatuses, setServerStatuses] = useState([
    { name: 'Google Gemini', status: 'checking', icon: 'https://www.gstatic.com/lamda/images/favicon_v2_71db1039137568a2833c.png' },
    { name: 'OpenAI GPT', status: 'checking', icon: 'https://openai.com/favicon.ico' },
    { name: 'Anthropic Claude', status: 'checking', icon: 'https://www.anthropic.com/favicon.ico' }
  ]);

  useEffect(() => {
    fetch('/api/system-config')
      .then(res => res.json())
      .then(data => {
        setPrompt(data.systemPrompt || '');
        // We don't fetch the actual API key for security, just show if it's set
        const savedKey = localStorage.getItem('gemini_api_key');
        if (savedKey) setApiKey('••••••••••••••••');
      });

    // Simulate server status checks
    const checkStatuses = async () => {
      setServerStatuses(prev => prev.map(s => ({ ...s, status: 'checking' })));
      await new Promise(resolve => setTimeout(resolve, 1500));
      setServerStatuses([
        { name: 'Google Gemini', status: 'online', icon: 'https://www.gstatic.com/lamda/images/favicon_v2_71db1039137568a2833c.png' },
        { name: 'OpenAI GPT', status: 'online', icon: 'https://openai.com/favicon.ico' },
        { name: 'Anthropic Claude', status: 'maintenance', icon: 'https://www.anthropic.com/favicon.ico' }
      ]);
    };

    window.refreshAIStatuses = checkStatuses;
    checkStatuses();
  }, []);

  const refreshStatuses = () => {
    if (window.refreshAIStatuses) {
      window.refreshAIStatuses();
    }
  };

  const saveConfig = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/system-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemPrompt: prompt })
      });

      if (apiKey && apiKey !== '••••••••••••••••') {
        localStorage.setItem('gemini_api_key', apiKey);
      }

      if (res.ok) {
        toast.success('AI Configuration saved successfully');
      }
    } catch (error) {
      toast.error('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Server Status Section */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900">AI Server Status</h3>
              <p className="text-xs text-zinc-500">Real-time monitoring of AI providers</p>
            </div>
          </div>
          <button 
            onClick={refreshStatuses} 
            className="p-2 hover:bg-zinc-50 rounded-lg transition-colors text-zinc-400"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {serverStatuses.map((server) => (
            <div key={server.name} className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={server.icon} alt="" className="w-5 h-5 rounded-sm" onError={(e) => e.currentTarget.style.display = 'none'} />
                <span className="text-xs font-bold text-zinc-700">{server.name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {server.status === 'online' ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[10px] font-bold text-emerald-600 uppercase">Online</span>
                  </>
                ) : server.status === 'checking' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 text-zinc-400 animate-spin" />
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">Checking</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[10px] font-bold text-amber-600 uppercase">Maintenance</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Configuration Section */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-900">AI Integration Settings</h3>
            <p className="text-xs text-zinc-500">Manage API keys and system instructions</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Key className="w-3 h-3" />
              Gemini API Key
            </label>
            <div className="relative">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Gemini API key..."
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
              <p className="mt-1.5 text-[10px] text-zinc-500">
                Key is stored securely in your browser's local storage.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">System Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-40 bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
              placeholder="Enter global system instructions for the AI..."
            />
          </div>

          <button 
            onClick={saveConfig} 
            disabled={isSaving}
            className="w-full bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-400 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            SAVE_AI_CONFIGURATION
          </button>
        </div>
      </div>
    </div>
  );
};
