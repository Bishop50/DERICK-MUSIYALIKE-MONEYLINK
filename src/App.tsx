import React, { useState, useEffect } from 'react';
const logo = '/logo.png';
import { 
  Home as HomeIcon, 
  Wallet, 
  CreditCard, 
  User as UserIcon, 
  Shield,
  Bell,
  LogOut,
  Settings,
  Menu,
  X,
  ChevronLeft,
  FileText,
  HelpCircle,
  RefreshCw,
  Sparkles,
  Calculator,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Home from './components/Home';
import LoanSection from './components/LoanSection';
import DigitalServices from './components/DigitalServices';
import AccountSection from './components/AccountSection';
import TrustSection from './components/TrustSection';
import TransactionsSection from './components/TransactionsSection';
import SettingsSection from './components/SettingsSection';
import HelpSection from './components/HelpSection';
import AdminPanel from './components/AdminPanel';
import DeveloperPanel from './components/DeveloperPanel';
import AgentPanel from './components/AgentPanel';
import SupportChat from './components/SupportChat';
import NetworkStatus from './components/NetworkStatus';
import LocationTracker from './components/LocationTracker';
import NotificationsPanel from './components/NotificationsPanel';
import AgentLogin from './components/AgentLogin';
import LoginFlow from './components/LoginFlow';
import RegistrationFlow from './components/RegistrationFlow';
import AIServicesSection from './components/AIServicesSection';
import TaxSection from './components/TaxSection';
import { Section, User, SystemConfig, AppNotification, Agent } from './types';
import { saveUserToLocalStorage, getUserFromLocalStorage, removeUserFromLocalStorage } from './utils/storage';
import { Toaster, toast } from 'sonner';

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<Section>(() => {
    return (localStorage.getItem('moneylink_active_section') as Section) || 'home';
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAgentMode, setIsAgentMode] = useState(false);
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);
  const [showAgentLogin, setShowAgentLogin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('moneylink_dark_mode') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('moneylink_dark_mode', String(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const saved = localStorage.getItem('moneylink_recent_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const playNotificationSound = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(e => console.warn('Audio playback failed:', e));
  };

  useEffect(() => {
    if (notifications.length > 0) {
      const lastNotification = notifications[0];
      if (!lastNotification.isRead) {
        playNotificationSound();
      }
    }
  }, [notifications.length]);

  const handleSearch = (term: string) => {
    setSearchQuery(term);
    if (!term.trim()) return;

    if (!recentSearches.includes(term.trim())) {
      const updated = [term.trim(), ...recentSearches].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('moneylink_recent_searches', JSON.stringify(updated));
    }

    const lowerTerm = term.toLowerCase();
    
    // Search in nav items
    const match = navItems.find(item => 
      item.label.toLowerCase().includes(lowerTerm) || 
      item.id.toLowerCase().includes(lowerTerm)
    );

    if (match) {
      setActiveSection(match.id as Section);
    } else {
      // Fallback keyword matching
      if (lowerTerm.includes('loan')) setActiveSection('apply-loan');
      else if (lowerTerm.includes('service') || lowerTerm.includes('pay')) setActiveSection('digital-services');
      else if (lowerTerm.includes('account') || lowerTerm.includes('profile')) setActiveSection('account');
      else if (lowerTerm.includes('help') || lowerTerm.includes('support')) setActiveSection('help');
      else if (lowerTerm.includes('transaction') || lowerTerm.includes('history')) setActiveSection('transactions');
      else if (lowerTerm.includes('setting')) setActiveSection('settings');
      else if (lowerTerm.includes('ai') || lowerTerm.includes('lab')) setActiveSection('ai-lab');
      else if (lowerTerm.includes('tax')) setActiveSection('tax');
    }
    
    setShowRecentSearches(false);
  };

  // Persist state
  useEffect(() => {
    localStorage.setItem('moneylink_active_section', activeSection);
  }, [activeSection]);

  // Prevent accidental reloads - REMOVED as per user request to stop reload site prompts
  useEffect(() => {
    // The user explicitly requested to stop the "Reload site?" prompt in all panels.
    // We ensure no window.onbeforeunload listeners are active.
  }, []);

  // Global error handler for unhandled rejections
  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
    };

    window.addEventListener('unhandledrejection', handleRejection);
    return () => window.removeEventListener('unhandledrejection', handleRejection);
  }, []);

  const lockSession = () => {
    // Session lock removed
  };

  const unlockSession = () => {
    // Session lock removed
  };

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isPartner = params.get('mode') === 'dmi';
    const isAdminParam = params.get('admin') === 'true';
    
    if (isAdminParam) {
      setIsAdminMode(true);
      localStorage.setItem('moneylink_admin_direct_login', 'true');
    }

    if (isPartner) {
      document.body.classList.add('partner-mode');
    } else {
      document.body.classList.remove('partner-mode');
    }

    const fetchWithFallback = async (url: string, fallback: any = []) => {
      try {
        const res = await fetch(url);
        if (!res.ok) return fallback;
        return await res.json();
      } catch (e) {
        console.warn(`Failed to fetch ${url}:`, e);
        return fallback;
      }
    };

    const directLogin = localStorage.getItem('moneylink_admin_direct_login');
    if (directLogin === 'true') {
      setIsAdminMode(true);
    }
    
    // Agent persistence removed as per user request to return to home page on reload
    
    const user = getUserFromLocalStorage();
    if (user) {
      setCurrentUser(user);
      
      // Sync with backend to get latest balance/verification status
      fetchWithFallback(`/api/users`)
        .then(async (users) => {
          const latest = users.find((u: any) => u.id === user.id);
          if (latest) {
            setCurrentUser(latest);
            saveUserToLocalStorage(latest);
            
            // If user has an admin, fetch the admin's approved app name
            if (latest.adminId && !isPartner) {
              const adminData = await fetchWithFallback(`/api/admins/${latest.adminId}`, null);
              if (adminData && adminData.approvedAppName) {
                setConfig(prev => prev ? { ...prev, appName: adminData.approvedAppName } : prev);
              }
            }
          }
        });
    }
    const storedConfig = JSON.parse(localStorage.getItem('moneylink_config') || '{}');
    const defaultConfig: SystemConfig = {
      appName: isPartner ? 'DERICK MUSIYALIKE INSTITUTION (DMI)' : 'MONEYLINK ADMIN',
      appLogo: logo,
      aiPrompt: '',
      primaryColor: isPartner ? '#1e3a8a' : '#15803d',
      maintenanceMode: false,
      twoFactorEnabled: true,
      biometricEnabled: true,
      version: '1.0.0'
    };
    
    if (isPartner) {
      setConfig(defaultConfig);
    } else {
      setConfig({ ...defaultConfig, ...storedConfig });
    }

    // Check for system config
    const fetchConfig = async () => {
      if (isPartner) return; 
      try {
        const res = await fetch('/api/system-config');
        if (!res.ok) return;
        
        const systemConfig = await res.json();
        
        if (systemConfig && Object.keys(systemConfig).length > 0) {
          // Sync backend config to local state
          setConfig(prev => ({ ...prev, ...systemConfig }));
          localStorage.setItem('moneylink_config', JSON.stringify(systemConfig));
        }
      } catch (e) {
        // Silently ignore network errors
      }
    };
    fetchConfig();
    const configInterval = setInterval(fetchConfig, 30000);
    return () => clearInterval(configInterval);
  }, []);

  useEffect(() => {
    // Load notifications from backend if user is logged in
    const fetchNotifications = async () => {
      if (currentUser) {
        try {
          const res = await fetch(`/api/notifications?userId=${currentUser.id}`);
          if (res.ok) {
            const data = await res.json();
            setNotifications(data);
            localStorage.setItem('moneylink_notifications', JSON.stringify(data));
          } else {
            // Fallback to local storage
            const savedNotifications = JSON.parse(localStorage.getItem('moneylink_notifications') || '[]');
            setNotifications(savedNotifications.filter((n: AppNotification) => n.userId === currentUser.id));
          }
        } catch (e) {
          const savedNotifications = JSON.parse(localStorage.getItem('moneylink_notifications') || '[]');
          setNotifications(savedNotifications.filter((n: AppNotification) => n.userId === currentUser.id));
        }
      } else {
        setNotifications([]);
      }
    };
    fetchNotifications();
    
    // Poll for new notifications every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    saveUserToLocalStorage(user);
    setShowLogin(false);
    setShowRegistration(false);
    setActiveSection('home'); // Direct to home page after login
  };

  const handleAdminLogin = () => {
    setIsAdminMode(true);
    setIsAgentMode(false);
    setIsDeveloperMode(false);
    setActiveSection('home');
    localStorage.setItem('moneylink_admin_direct_login', 'true');
  };

  const handleAgentLogin = (agent: Agent) => {
    setCurrentAgent(agent);
    setIsAgentMode(true);
    setIsAdminMode(false);
    setIsDeveloperMode(false);
    setActiveSection('agent');
    setShowAgentLogin(false);
    localStorage.setItem('moneylink_agent_direct_login', 'true');
    localStorage.setItem('moneylink_current_agent_id', agent.id);
  };

  const handleDeveloperLogin = () => {
    setIsDeveloperMode(true);
    setIsAdminMode(false);
    setIsAgentMode(false);
    setActiveSection('developer');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentAgent(null);
    setIsAdminMode(false);
    setIsAgentMode(false);
    setIsDeveloperMode(false);
    removeUserFromLocalStorage();
    localStorage.removeItem('moneylink_admin_direct_login');
    localStorage.removeItem('moneylink_agent_direct_login');
    localStorage.removeItem('moneylink_current_agent_id');
    setNotifications([]);
    setActiveSection('home');
    setIsMenuOpen(false);
  };

  const markNotificationAsRead = async (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
    setNotifications(updated);
    
    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true })
      });
    } catch (e) {
      console.warn('Failed to sync notification read status to backend');
    }

    const allNotifications = JSON.parse(localStorage.getItem('moneylink_notifications') || '[]');
    const final = allNotifications.map((n: AppNotification) => n.id === id ? { ...n, isRead: true } : n);
    localStorage.setItem('moneylink_notifications', JSON.stringify(final));
  };

  const clearAllNotifications = () => {
    if (!currentUser) return;
    const allNotifications = JSON.parse(localStorage.getItem('moneylink_notifications') || '[]');
    const final = allNotifications.filter((n: AppNotification) => n.userId !== currentUser.id);
    localStorage.setItem('moneylink_notifications', JSON.stringify(final));
    setNotifications([]);
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'home':
        return (
          <Home 
            onNavigate={setActiveSection} 
            currentUser={currentUser}
            onRegister={handleLogin}
            onLogin={handleLogin}
            onAdminLogin={handleAdminLogin}
            onAgentLogin={() => {
              if (currentUser && !currentUser.isVerified) {
                toast.error('Your account must be verified to access the Agent Portal.');
                return;
              }
              setShowAgentLogin(true);
            }}
            onLogout={handleLogout}
            config={config}
            onShowLogin={() => setShowLogin(true)}
            onShowRegistration={() => setShowRegistration(true)}
            isDarkMode={isDarkMode}
          />
        );
      case 'apply-loan':
      case 'my-loans':
        return <LoanSection onBack={() => setActiveSection('home')} isRegistered={!!currentUser} config={config} />;
      case 'digital-services':
        return <DigitalServices onBack={() => setActiveSection('home')} currentUser={currentUser} onUpdateUser={handleLogin} config={config} onNavigate={setActiveSection} />;
      case 'account':
        return <AccountSection onBack={() => setActiveSection('home')} onLogout={handleLogout} currentUser={currentUser} onUpdateUser={handleLogin} onNavigate={setActiveSection} config={config} />;
      case 'trust':
        return <TrustSection onBack={() => setActiveSection('home')} config={config} />;
      case 'transactions':
        return <TransactionsSection onBack={() => setActiveSection('home')} currentUser={currentUser} />;
      case 'settings':
        return <SettingsSection onBack={() => setActiveSection('home')} onNavigate={setActiveSection} onDeveloperLogin={handleDeveloperLogin} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />;
      case 'help':
        return <HelpSection onBack={() => setActiveSection('home')} />;
      case 'ai-lab':
        return <AIServicesSection 
          onBack={() => setActiveSection('home')} 
          config={config} 
          role={isDeveloperMode ? 'developer' : isAdminMode ? 'admin' : 'user'}
        />;
      case 'tax':
        return <TaxSection currentUser={currentUser} />;
      case 'developer':
        return <DeveloperPanel 
          currentUser={currentUser}
          onBack={() => setActiveSection('home')}
          onUpdateConfig={setConfig}
          onLogout={() => {
            setIsDeveloperMode(false);
            setActiveSection('account');
          }} 
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          hasUnreadNotifications={notifications.some(n => !n.isRead)}
        />;
      case 'agent':
        return <AgentPanel 
          currentUser={currentUser}
          onBack={() => setActiveSection('home')}
          onLogout={() => {
            setIsAgentMode(false);
            setCurrentAgent(null);
            setActiveSection('home');
          }} 
          agentId={currentAgent?.id || ''} 
          isDeveloper={isDeveloperMode} 
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          hasUnreadNotifications={notifications.some(n => !n.isRead)}
          appConfig={{ name: config?.appName || 'MONEYLINK ADMIN', logo: config?.appLogo || logo }}
        />;
      default:
        return <Home 
          onNavigate={setActiveSection} 
          currentUser={currentUser} 
          onRegister={handleLogin} 
          onLogin={handleLogin} 
          onAdminLogin={handleAdminLogin} 
          onAgentLogin={() => setShowAgentLogin(true)}
          onLogout={handleLogout} 
          config={config}
          onShowLogin={() => setShowLogin(true)}
          onShowRegistration={() => setShowRegistration(true)}
          isDarkMode={isDarkMode}
        />;
    }
  };

  if (isAdminMode) {
    return (
      <div className="min-h-screen bg-[#F8F9FA]">
        <AdminPanel 
          currentUser={currentUser}
          onBack={() => setIsAdminMode(false)}
          onLogout={() => setIsAdminMode(false)} 
          isDeveloper={isDeveloperMode} 
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          hasUnreadNotifications={notifications.some(n => !n.isRead)}
          appConfig={{ name: config?.appName || 'MONEYLINK ADMIN', logo: config?.appLogo || logo }}
        />
        <NotificationsPanel 
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          notifications={notifications}
          onMarkAsRead={markNotificationAsRead}
          onClearAll={clearAllNotifications}
        />
      </div>
    );
  }

  if (showLogin) {
    return (
      <div className="min-h-screen bg-white">
        <LoginFlow 
          appConfig={{ name: config?.appName || 'MONEYLINK ADMIN', logo: config?.appLogo || logo }}
          onLogin={handleLogin}
          onAdminLogin={handleAdminLogin}
          onAgentLogin={handleAgentLogin}
          onCancel={() => setShowLogin(false)}
          onSwitchToRegister={() => {
            setShowLogin(false);
            setShowRegistration(true);
          }}
        />
      </div>
    );
  }

  if (showRegistration) {
    return (
      <div className="min-h-screen bg-white">
        <RegistrationFlow 
          appConfig={{ name: config?.appName || 'MONEYLINK ADMIN', logo: config?.appLogo || logo }}
          onComplete={(user) => {
            handleLogin(user);
            setShowRegistration(false);
            setActiveSection('home');
          }}
          onCancel={() => setShowRegistration(false)}
          onSwitchToLogin={() => {
            setShowRegistration(false);
            setShowLogin(true);
          }}
        />
      </div>
    );
  }

  if (isAgentMode) {
    return (
      <div className="min-h-screen bg-[#F8F9FA]">
        <AgentPanel 
          currentUser={currentUser}
          onBack={() => setIsAgentMode(false)}
          onLogout={() => {
            setIsAgentMode(false);
            setCurrentAgent(null);
          }} 
          agentId={currentAgent?.id || ''} 
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          hasUnreadNotifications={notifications.some(n => !n.isRead)}
          appConfig={{ name: config?.appName || 'MONEYLINK ADMIN', logo: config?.appLogo || logo }}
        />
        <NotificationsPanel 
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          notifications={notifications}
          onMarkAsRead={markNotificationAsRead}
          onClearAll={clearAllNotifications}
        />
      </div>
    );
  }

  if (showSplash || !config) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex flex-col items-center justify-center relative overflow-hidden">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 flex flex-col items-center"
        >
          <div className="w-24 h-24 bg-green-700 rounded-[2rem] flex items-center justify-center shadow-[0_0_50px_rgba(21,128,61,0.5)] mb-6 overflow-hidden border border-green-600/50">
            <img src={config?.appLogo || logo} alt="Logo" className="w-full h-full object-cover" />
          </div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-4xl font-black text-white tracking-tighter"
          >
            {config?.appName || 'MONEYLINK ADMIN'}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-green-500 text-[10px] font-bold uppercase tracking-[0.4em] mt-2"
          >
            Financial Freedom
          </motion.p>
        </motion.div>

        {/* Loading Bar */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-48 h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div 
            initial={{ x: "-100%" }}
            animate={{ x: "0%" }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="w-full h-full bg-green-700"
          />
        </div>

        {/* Developer Credit */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-0 right-0 text-center"
        >
          <p className="text-[8px] text-white/30 font-bold uppercase tracking-[0.2em]">Developed By</p>
          <p className="text-[10px] text-white/50 font-black">Derick Musiyalike (DMI GROUP)</p>
        </motion.div>

        {/* Decorative Background */}
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-green-700/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-green-900/20 rounded-full blur-[120px]"></div>
      </div>
    );
  }

  const navItems = [
    { id: 'home', label: 'Home', icon: HomeIcon },
    { id: 'apply-loan', label: 'Loans', icon: Wallet },
    { id: 'digital-services', label: 'Services', icon: CreditCard },
    { id: 'transactions', label: 'Transactions', icon: FileText },
    { id: 'trust', label: 'Trust', icon: Shield },
    { id: 'account', label: 'Account', icon: UserIcon },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'ai-lab', label: 'AI Lab', icon: Sparkles },
    { id: 'tax', label: 'Tax', icon: Calculator },
    { id: 'help', label: 'Help & Support', icon: HelpCircle },
  ];

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900 text-white' : 'bg-[#F8F9FA] text-[#1A1A1A]'} font-sans selection:bg-green-100 selection:text-green-900`}>
      <Toaster position="top-center" richColors />
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 ${isDarkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white/80 border-[#F0F0F0]'} backdrop-blur-md z-50 border-b`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {activeSection !== 'home' && (
              <button 
                onClick={() => setActiveSection('home')}
                className="p-2 hover:bg-[#F0F0F0] rounded-full transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div 
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => setActiveSection('home')}
            >
              <div className="w-8 h-8 bg-green-700 rounded-xl flex items-center justify-center shadow-lg shadow-green-700/20 overflow-hidden">
                <img src={config?.appLogo || logo} alt="Logo" className="w-full h-full object-cover" />
              </div>
              <span className="font-black text-xl tracking-tighter">{config?.appName || 'MONEYLINK ADMIN'}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:block relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]">
                <Search className="w-4 h-4" />
              </div>
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowRecentSearches(true)}
                onBlur={() => setTimeout(() => setShowRecentSearches(false), 200)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                placeholder="Search services..."
                className={`pl-10 pr-4 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-[#F8F9FA] border-[#F0F0F0]'} border rounded-xl text-xs font-bold focus:outline-none focus:border-green-700 w-64 transition-all`}
              />
              <AnimatePresence>
                {showRecentSearches && recentSearches.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={`absolute top-full left-0 right-0 mt-2 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#F0F0F0]'} border rounded-xl shadow-xl z-[60] overflow-hidden`}
                  >
                    <div className="p-2">
                      <p className="text-[10px] font-bold text-[#999] uppercase tracking-widest px-2 py-1">Recent Searches</p>
                      {recentSearches.map((term, i) => (
                        <button
                          key={i}
                          onClick={() => handleSearch(term)}
                          className={`w-full text-left px-3 py-2 text-xs font-bold ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-[#F8F9FA]'} rounded-lg transition-colors flex items-center gap-2`}
                        >
                          <RefreshCw className="w-3 h-3 text-[#999]" />
                          {term}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <NetworkStatus />
            <button 
              onClick={() => setIsNotificationsOpen(true)}
              className="p-2 hover:bg-[#F0F0F0] rounded-full transition-colors relative"
            >
              <Bell className="w-5 h-5 text-[#666]" />
              {notifications.some(n => !n.isRead) && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
            {currentUser ? (
              <div className="flex items-center gap-2">
                {isDeveloperMode && (
                  <div className="flex items-center gap-1 bg-blue-50 p-1 rounded-xl border border-blue-100">
                    <button 
                      onClick={() => setIsAdminMode(true)}
                      className="px-2 py-1 text-[8px] font-bold text-blue-600 hover:bg-blue-100 rounded-lg"
                    >
                      ADMIN
                    </button>
                    <button 
                      onClick={() => setIsAgentMode(true)}
                      className="px-2 py-1 text-[8px] font-bold text-blue-600 hover:bg-blue-100 rounded-lg"
                    >
                      AGENT
                    </button>
                  </div>
                )}
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsAdminMode(true)}
                className="p-2 hover:bg-[#F0F0F0] rounded-full transition-colors"
              >
                <Settings className="w-5 h-5 text-[#999]" />
              </button>
            )}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-[#666]"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-white pt-20 px-6 md:hidden"
          >
            <nav className="space-y-6">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id as Section);
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-4 py-4 border-b border-[#F0F0F0] text-lg font-semibold"
                >
                  <item.icon className={`w-6 h-6 ${activeSection === item.id ? 'text-green-700' : 'text-[#999]'}`} />
                  <span className={activeSection === item.id ? 'text-green-700' : 'text-[#1A1A1A]'}>{item.label}</span>
                </button>
              ))}
              {currentUser && (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-4 py-4 border-b border-[#F0F0F0] text-lg font-semibold text-red-600"
                >
                  <LogOut className="w-6 h-6" />
                  <span>Logout</span>
                </button>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className={`w-full max-w-[1920px] mx-auto pt-24 pb-32 px-4 sm:px-6 lg:px-8 min-h-screen flex flex-col ${isDarkMode ? 'text-white' : 'text-[#1A1A1A]'}`}>
        <div className="flex-1 w-full h-full">
          <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.98 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                onPanEnd={(_, info) => {
                  const threshold = 50;
                  const currentIndex = navItems.findIndex(item => item.id === activeSection);
                  if (info.offset.y < -threshold && currentIndex < navItems.length - 1) {
                    setActiveSection(navItems[currentIndex + 1].id as Section);
                  } else if (info.offset.y > threshold && currentIndex > 0) {
                    setActiveSection(navItems[currentIndex - 1].id as Section);
                  }
                }}
              >
                {renderSection()}
              </motion.div>
            </AnimatePresence>
        </div>

        {/* Global Developer Credit */}
        <div className="mt-12 mb-8 text-center space-y-3 opacity-50 hover:opacity-100 transition-opacity">
          <p className={`text-[9px] font-bold ${isDarkMode ? 'text-gray-400' : 'text-[#999]'} uppercase tracking-[0.3em]`}>Official Developer</p>
          <div className="space-y-0.5">
            <p className={`text-[11px] font-black ${isDarkMode ? 'text-white' : 'text-[#1A1A1A]'}`}>DMI GROUP</p>
            <p className={`text-[9px] ${isDarkMode ? 'text-gray-500' : 'text-[#666]'} font-bold`}>Derick Musiyalike • Lusaka, Zambia</p>
          </div>
          <div className="flex justify-center gap-4">
            <a href="mailto:derickmusiyalikeinstitution@gmail.com" className="text-[9px] font-bold text-green-700 hover:underline">EMAIL</a>
            <a href="https://wa.me/260774218141" className="text-[9px] font-bold text-green-700 hover:underline">WHATSAPP</a>
          </div>
        </div>
      </main>

      {/* Support Chat */}
      {activeSection !== 'developer' && config && <SupportChat currentUser={currentUser} config={config} />}

      {/* Location Tracker */}
      {config && <LocationTracker currentUser={currentUser} config={config} />}

      {/* Notifications Panel */}
      <NotificationsPanel 
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAsRead={markNotificationAsRead}
        onClearAll={clearAllNotifications}
      />

      {/* Agent Login Modal */}
      <AnimatePresence>
        {showAgentLogin && (
          <AgentLogin 
            onLogin={handleAgentLogin}
            onCancel={() => setShowAgentLogin(false)}
            appConfig={{ name: config?.appName || 'MONEYLINK ADMIN', logo: config?.appLogo || logo }}
          />
        )}
      </AnimatePresence>

      {/* System Update Modal */}
      <AnimatePresence>
      </AnimatePresence>

      {/* Lock Screen Removed */}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-[#F0F0F0] z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between gap-1 sm:gap-4">
          {navItems.map((item) => (
            <NavButton 
              key={item.id}
              id={item.id}
              active={activeSection === item.id || (item.id === 'apply-loan' && activeSection === 'my-loans')} 
              icon={item.icon} 
              label={item.label} 
              onClick={() => setActiveSection(item.id as Section)} 
              isDarkMode={isDarkMode}
            />
          ))}
        </div>
      </nav>
    </div>
  );
};

interface NavButtonProps {
  id: string;
  active: boolean;
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}

const NavButton: React.FC<NavButtonProps & { isDarkMode: boolean }> = ({ id, active, icon: Icon, label, onClick, isDarkMode }) => (
  <button 
    id={`nav-${id}`}
    onClick={onClick}
    className={`flex flex-col items-center gap-1.5 transition-all relative group ${active ? 'text-green-700' : isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-[#999] hover:text-[#666]'}`}
  >
    <div className={`p-2.5 rounded-2xl transition-all duration-300 ${
      active 
        ? 'bg-green-700 text-white shadow-lg shadow-green-700/20 scale-110' 
        : isDarkMode ? 'bg-transparent group-hover:bg-gray-800 group-hover:scale-105' : 'bg-transparent group-hover:bg-[#F0F0F0] group-hover:scale-105'
    }`}>
      <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5px]' : 'stroke-2'}`} />
    </div>
    <span className={`text-[9px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${
      active ? 'opacity-100 translate-y-0' : 'opacity-40 group-hover:opacity-70'
    }`}>
      {label}
    </span>
    {active && (
      <motion.div 
        layoutId="nav-indicator"
        className="absolute -bottom-4 w-1 h-1 bg-green-700 rounded-full"
      />
    )}
  </button>
);

export default App;
