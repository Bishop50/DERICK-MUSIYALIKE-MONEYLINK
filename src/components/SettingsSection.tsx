import React, { useState } from 'react';
import { ArrowLeft, Moon, Sun, Terminal, Shield, ShieldCheck, X as CloseIcon, Users, Info, Download } from 'lucide-react';
import { Section } from '../types';
import AppIconViewer from './AppIconViewer';

interface SettingsSectionProps {
  onBack: () => void;
  onNavigate: (section: Section) => void;
  onDeveloperLogin?: () => void;
  onAdminLogin?: () => void;
  isDarkMode: boolean;
  setIsDarkMode: (isDarkMode: boolean) => void;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ onBack, onNavigate, onDeveloperLogin, onAdminLogin, isDarkMode, setIsDarkMode }) => {
  const [showDevLogin, setShowDevLogin] = useState(false);
  const [devUsername, setDevUsername] = useState('');
  const [devPassword, setDevPassword] = useState('');
  const [devError, setDevError] = useState('');
  const [showIconViewer, setShowIconViewer] = useState(false);
  const [config, setConfig] = useState<any>({
    appName: 'Derick Musiyalike',
    appLogo: 'https://storage.googleapis.com/static.aistudio.google.com/content/2026/02/25/08/46/27/95/96/image.png',
    biometricEnabled: false
  });
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');

  React.useEffect(() => {
    const storedConfig = JSON.parse(localStorage.getItem('moneylink_config') || '{}');
    setConfig((prev: any) => ({ ...prev, ...storedConfig }));
  }, []);

  const updateConfig = (newConfig: any) => {
    setConfig(newConfig);
    localStorage.setItem('moneylink_config', JSON.stringify(newConfig));
  };

  const toggleBiometric = () => {
    const newConfig = { ...config, biometricEnabled: !config.biometricEnabled };
    updateConfig(newConfig);
  };

  const handleDevLogin = () => {
    if (devUsername === '709580' && devPassword === '709580') {
      if (onAdminLogin) {
        onAdminLogin();
      }
      return;
    }
    if (devUsername === 'BISHOP' && devPassword === 'DERICK') {
      if (onDeveloperLogin) {
        onDeveloperLogin();
      } else {
        onNavigate('developer');
      }
    } else {
      setDevError('Invalid Developer Credentials');
    }
  };

  const isPartner = new URLSearchParams(window.location.search).get('mode') === 'dmi';

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-[#E5E5E5]"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-[#666] text-sm">Manage your app preferences.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-[#E5E5E5] shadow-sm">
        <h3 className="font-bold text-sm mb-4">Security</h3>
        <div className="flex items-center justify-between mb-4">
          <p className="font-medium text-sm">Biometric Login</p>
          <button 
            onClick={toggleBiometric}
            className={`w-12 h-6 rounded-full transition-all relative ${config.biometricEnabled ? 'bg-green-700' : 'bg-gray-300'}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${config.biometricEnabled ? 'right-1' : 'left-1'}`}></div>
          </button>
        </div>
        <h3 className="font-bold text-sm mb-4">Appearance</h3>
        <div className="flex items-center justify-between mb-4">
          <p className="font-medium text-sm">Dark Mode</p>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`w-12 h-6 rounded-full transition-all relative ${isDarkMode ? 'bg-green-700' : 'bg-gray-300'}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isDarkMode ? 'right-1' : 'left-1'}`}></div>
          </button>
        </div>

        <h3 className="font-bold text-sm mb-4">AI Configuration</h3>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-[#999] uppercase tracking-widest ml-1">Gemini API Key</label>
          <div className="flex gap-2">
            <input 
              type="password"
              value={geminiKey}
              onChange={(e) => {
                setGeminiKey(e.target.value);
                localStorage.setItem('gemini_api_key', e.target.value);
              }}
              placeholder="Enter your Gemini API Key"
              className="flex-1 px-4 py-3 bg-[#F8F9FA] border border-[#E5E5E5] rounded-xl text-sm font-medium focus:outline-none focus:border-green-700"
            />
          </div>
          <p className="text-[10px] text-[#999] leading-relaxed">
            This key is used for AI-powered features like the AI Lab and Support Chat. It is stored locally on your device.
          </p>
        </div>

      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-[#E5E5E5] shadow-sm space-y-4">
        <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-green-700" />
          Security Settings
        </h3>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-[#999] uppercase tracking-widest">Login PIN (4 Digits)</label>
            <input 
              type="password"
              maxLength={4}
              value={localStorage.getItem('moneylink_user_pin') || ''}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                if (val.length <= 4) {
                  localStorage.setItem('moneylink_user_pin', val);
                  // Force re-render to show updated value
                  setGeminiKey(geminiKey + ' ');
                  setTimeout(() => setGeminiKey(geminiKey.trim()), 0);
                }
              }}
              placeholder="Enter 4-digit PIN"
              className="px-4 py-3 bg-[#F8F9FA] border border-[#E5E5E5] rounded-xl text-sm font-medium focus:outline-none focus:border-green-700"
            />
          </div>
          <p className="text-[10px] text-[#999] leading-relaxed">
            Set a 4-digit PIN to log in quickly to your account.
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-[#E5E5E5] shadow-sm space-y-4">
        <h3 className="font-bold text-sm mb-4">About App</h3>
        <button 
          onClick={() => setShowIconViewer(true)}
          className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center overflow-hidden border border-gray-100">
              <img src={config.appLogo} alt="App Icon" className="w-full h-full object-cover" />
            </div>
            <div className="text-left">
              <p className="font-bold text-sm text-gray-900">App Icon</p>
              <p className="text-[10px] text-gray-500 font-medium">View & Download Asset</p>
            </div>
          </div>
          <div className="p-2 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
            <Info className="w-4 h-4 text-gray-400" />
          </div>
        </button>

        {config.downloadUrl && (
          <a 
            href={config.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between p-4 bg-blue-50 rounded-2xl hover:bg-blue-100 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                <Download className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm text-blue-900">Download APK</p>
                <p className="text-[10px] text-blue-600 font-medium">Get the latest Android app</p>
              </div>
            </div>
            <div className="p-2 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
              <ArrowLeft className="w-4 h-4 text-blue-600 rotate-[135deg]" />
            </div>
          </a>
        )}
      </div>

      <div className="pt-4">
        <div className="w-full bg-green-700 text-white p-6 rounded-[2rem] shadow-lg shadow-green-700/20 transition-all group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center overflow-hidden">
                {config.dmiLogo ? (
                  <img src={config.dmiLogo} alt="DMI Logo" className="w-full h-full object-cover" />
                ) : (
                  <Users className="w-6 h-6 text-white" />
                )}
              </div>
              <div className="text-left">
                <p className="font-black text-lg tracking-tight">Join The DMI Group</p>
                <p className="text-xs text-green-100 font-medium">Connect with our community</p>
              </div>
            </div>
            <button 
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set('mode', 'dmi');
                window.open(url.toString(), '_blank');
              }}
              className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all"
            >
              <ArrowLeft className="w-5 h-5 rotate-180" />
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-white/10">
            <button 
              onClick={() => setShowDevLogin(true)}
              className="w-full p-4 flex items-center justify-between bg-white/10 hover:bg-white/20 transition-colors group/dev rounded-2xl border border-white/10"
            >
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-white/20 text-white rounded-xl group-hover/dev:bg-white group-hover/dev:text-green-700 transition-colors">
                  <Terminal className="w-5 h-5" />
                </div>
                <span className="text-sm font-bold text-white">Developer Settings</span>
              </div>
              <ShieldCheck className="w-4 h-4 text-white/40 group-hover/dev:text-white transition-colors" />
            </button>
          </div>
        </div>
      </div>

      {/* Developer Login Modal */}
      {showDevLogin && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl space-y-6 text-black">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center overflow-hidden border border-blue-100 shadow-sm">
                  <img src={config.appLogo} alt="App Logo" className="w-full h-full object-cover" />
                </div>
                <h3 className="font-bold">Developer Access</h3>
              </div>
              <button onClick={() => setShowDevLogin(false)} className="text-[#999]">
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            {devError && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold border border-red-100">
                {devError}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#999] uppercase tracking-wider ml-1">Username</label>
                <input 
                  type="text" 
                  value={devUsername}
                  onChange={(e) => setDevUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#E5E5E5] rounded-xl text-sm font-medium focus:outline-none focus:border-blue-600"
                  placeholder="DEV_ID"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#999] uppercase tracking-wider ml-1">Password</label>
                <input 
                  type="password" 
                  value={devPassword}
                  onChange={(e) => setDevPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#E5E5E5] rounded-xl text-sm font-medium focus:outline-none focus:border-blue-600"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              onClick={handleDevLogin}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              Authorize Access
            </button>
          </div>
        </div>
      )}

      {/* App Icon Viewer Modal */}
      <AppIconViewer 
        isOpen={showIconViewer}
        onClose={() => setShowIconViewer(false)}
        iconUrl={config.appLogo}
        appName={config.appName}
      />
    </div>
  );
};

export default SettingsSection;
