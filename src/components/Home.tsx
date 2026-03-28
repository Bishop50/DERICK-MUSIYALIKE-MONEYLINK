import React, { useState, useEffect } from 'react';
const logo = '/logo.png';
import { 
  Wallet, 
  Search, 
  CreditCard, 
  Smartphone, 
  TrendingUp, 
  User as UserIcon,
  ChevronRight,
  ArrowUpRight,
  Shield,
  FileText,
  Phone,
  Plus,
  Gift,
  Target,
  Users,
  Headphones,
  Video,
  Sparkles,
  Zap,
  Bell,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Section, Transaction, User, LoanRequest, SystemConfig, RepaymentRequest } from '../types';
import { toast } from 'sonner';
import DataList from './DataList';
import QuickActionButton from './QuickActionButton';
import LiveMeeting from './LiveMeeting';
import SupportChat from './SupportChat';

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

interface HomeProps {
  onNavigate: (section: Section) => void;
  currentUser: User | null;
  onRegister: (user: User) => void;
  onLogin: (user: User) => void;
  onAdminLogin: () => void;
  onAgentLogin: () => void;
  onLogout: () => void;
  config: SystemConfig;
  onShowLogin: () => void;
  onShowRegistration: () => void;
  isDarkMode: boolean;
}

const Home: React.FC<HomeProps> = ({ onNavigate, currentUser, onRegister, onLogin, onAdminLogin, onAgentLogin, onLogout, config, onShowLogin, onShowRegistration, isDarkMode }) => {
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [showLiveMeeting, setShowLiveMeeting] = useState(false);
  const [repayAmount, setRepayAmount] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [loanType, setLoanType] = useState('Personal');

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (currentUser) {
      const fetchTransactions = async () => {
        try {
          const response = await fetch(`/api/transactions?userId=${currentUser.id}`);
          if (response.ok) {
            const data = await response.json();
            setTransactions(data.slice(0, 5));
          } else {
            throw new Error('Failed to fetch');
          }
        } catch (error) {
          console.error('Failed to fetch transactions:', error);
          const allTransactions: Transaction[] = JSON.parse(localStorage.getItem('moneylink_transactions') || '[]');
          const userTransactions = allTransactions.filter(t => t.userId === currentUser.id);
          setTransactions(userTransactions.slice(0, 5));
        }
      };
      fetchTransactions();
    }
  }, [currentUser]);

  const balance = currentUser ? `K ${(currentUser.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "K 0.00";

  // Mock financial health score logic
  const financialHealthScore = currentUser ? Math.min(100, Math.max(30, (currentUser.balance / 1000) + 65)) : 0;
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-red-600';
  };
  const getHealthLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 50) return 'Good';
    return 'Needs Attention';
  };

  const handleLogin = (user: User) => {
    onLogin(user);
  };

  const handleAdminLogin = () => {
    onAdminLogin();
  };

  const handleReferAndEarn = async () => {
    const url = new URL(window.location.href);
    const shareData = {
      title: config?.appName || 'MONEYLINK ADMIN',
      text: `Join me on ${config?.appName || 'MONEYLINK ADMIN'}! The best financial app for loans and savings.`,
      url: url.toString()
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('App link copied to clipboard! Share it with your friends.');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const handleLoanRequest = async () => {
    if (!currentUser) return;
    
    const newRequest: LoanRequest = {
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      userName: currentUser.name,
      amount: parseFloat(loanAmount),
      type: loanType,
      tenure: loanType === 'Weekly' ? '1 week' : '1 month',
      date: new Date().toLocaleDateString(),
      status: 'pending',
      interestRate: 25 // 25% interest rate
    };

    try {
      await fetch('/api/loan-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRequest)
      });

      // Notify Admin
      if (currentUser && currentUser.name) {
        await fetch('/api/admin-notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'New Loan Request',
            message: `${currentUser.name} requested a ${loanType} loan of K ${parseFloat(loanAmount).toLocaleString()}`,
            userId: currentUser.id,
            type: 'loan',
            isRead: false
          })
        });
      }
    } catch (error) {
      console.error('Failed to submit loan request to API, falling back to local storage', error);
      const existingRequests = JSON.parse(localStorage.getItem('moneylink_loan_requests') || '[]');
      localStorage.setItem('moneylink_loan_requests', JSON.stringify([...existingRequests, newRequest]));
      
      if (currentUser && currentUser.name) {
        const adminNotifications = JSON.parse(localStorage.getItem('moneylink_admin_notifications') || '[]');
        adminNotifications.push({
          id: Math.random().toString(36).substr(2, 9),
          title: 'New Loan Request',
          message: `${currentUser.name} requested a ${loanType} loan of K ${parseFloat(loanAmount).toLocaleString()}`,
          time: new Date().toLocaleString(),
          isRead: false,
          userId: currentUser.id,
          type: 'loan'
        });
        localStorage.setItem('moneylink_admin_notifications', JSON.stringify(adminNotifications));
      }
    }

    setShowLoanModal(false);
    setLoanAmount('');
    toast.success('Loan request submitted successfully! Admin will review it shortly.');
  };

  const handleRepay = async () => {
    if (!currentUser || !repayAmount) return;
    const amount = parseFloat(repayAmount);
    if (amount > currentUser.balance) {
      toast.error('Insufficient balance to repay loan.');
      return;
    }

    try {
      // Add Repayment Request via API
      const newRepaymentRequest = {
        userId: currentUser.id,
        userName: currentUser.name,
        amount: amount,
        status: 'pending'
      };
      
      await fetch('/api/repayment-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRepaymentRequest)
      });

      // Notify Admin via API
      if (currentUser && currentUser.name) {
        await fetch('/api/admin-notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Loan Repayment Pending',
            message: `${currentUser.name} requested to repay K ${amount.toLocaleString()} towards their loan. Pending approval.`,
            userId: currentUser.id,
            type: 'loan',
            isRead: false
          })
        });
      }
    } catch (error) {
      console.error('Failed to process repayment via API, falling back to local storage', error);

      const newRepaymentRequest: RepaymentRequest = {
        id: Math.random().toString(36).substr(2, 9),
        userId: currentUser.id,
        userName: currentUser.name,
        amount: amount,
        date: new Date().toISOString(),
        status: 'pending'
      };
      const repaymentRequests = JSON.parse(localStorage.getItem('moneylink_repayment_requests') || '[]');
      localStorage.setItem('moneylink_repayment_requests', JSON.stringify([newRepaymentRequest, ...repaymentRequests]));

      if (currentUser && currentUser.name) {
        const adminNotifications = JSON.parse(localStorage.getItem('moneylink_admin_notifications') || '[]');
        adminNotifications.push({
          id: Math.random().toString(36).substr(2, 9),
          title: 'Loan Repayment Pending',
          message: `${currentUser.name} requested to repay K ${amount.toLocaleString()} towards their loan. Pending approval.`,
          time: new Date().toLocaleString(),
          isRead: false,
          userId: currentUser.id,
          type: 'loan'
        });
        localStorage.setItem('moneylink_admin_notifications', JSON.stringify(adminNotifications));
      }
    }

    // Refresh transactions list
    const fetchTransactions = async () => {
      if (!currentUser) return;
      try {
        const response = await fetch(`/api/transactions?userId=${currentUser.id}`);
        if (response.ok) {
          const data = await response.json();
          setTransactions(data.slice(0, 5));
        }
      } catch (error) {
        const allTransactions: Transaction[] = JSON.parse(localStorage.getItem('moneylink_transactions') || '[]');
        const userTransactions = allTransactions.filter(t => t.userId === currentUser.id);
        setTransactions(userTransactions.slice(0, 5));
      }
    };
    fetchTransactions();

    setShowRepayModal(false);
    setRepayAmount('');
    toast.success('Loan repayment request submitted! Pending admin approval.');
  };

  const primaryActions = [
    { id: 'apply-loan', label: 'Apply for Loan', icon: Wallet, color: 'bg-green-700', textColor: 'text-white', onClick: () => currentUser ? setShowLoanModal(true) : onShowLogin() },
    { id: 'check-status', label: 'Check Loan Status', icon: Search, color: 'bg-white', textColor: 'text-[#1A1A1A]', onClick: () => onNavigate('my-loans') },
    { id: 'repay-loan', label: 'Repay Loan', icon: CreditCard, color: 'bg-white', textColor: 'text-[#1A1A1A]', onClick: () => currentUser ? setShowRepayModal(true) : onShowLogin() },
    { id: 'agent', label: 'Agent Access', icon: Headphones, color: 'bg-white', textColor: 'text-[#1A1A1A]', onClick: onAgentLogin },
    { id: 'mobile-money', label: 'Mobile Money', icon: Smartphone, color: 'bg-white', textColor: 'text-[#1A1A1A]', onClick: () => onNavigate('digital-services') },
    { id: 'rewards', label: 'Loyalty Rewards', icon: Gift, color: 'bg-white', textColor: 'text-[#1A1A1A]', onClick: () => toast.info('Rewards Points: 250 DMI Points') },
    { id: 'digital-services', label: 'Invest with Us', icon: TrendingUp, color: 'bg-white', textColor: 'text-[#1A1A1A]', onClick: () => onNavigate('digital-services') },
    { id: 'live-meeting', label: 'Live Support', icon: Video, color: 'bg-white', textColor: 'text-[#1A1A1A]', onClick: () => currentUser ? setShowLiveMeeting(true) : onShowLogin() },
    { id: 'ai-lab', label: 'Gemini AI Lab', icon: Sparkles, color: 'bg-emerald-50', textColor: 'text-emerald-700', onClick: () => onNavigate('ai-lab') },
    { id: 'account', label: 'My Account', icon: UserIcon, color: 'bg-white', textColor: 'text-[#1A1A1A]', onClick: () => onNavigate('account') },
  ];

  const chartData = [
    { name: 'Jan', balance: 4000, savings: 2400 },
    { name: 'Feb', balance: 3000, savings: 1398 },
    { name: 'Mar', balance: 2000, savings: 9800 },
    { name: 'Apr', balance: 2780, savings: 3908 },
    { name: 'May', balance: 1890, savings: 4800 },
    { name: 'Jun', balance: 2390, savings: 3800 },
  ];

  if (!config) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-green-700 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-8 pb-24 ${isDarkMode ? 'text-white' : 'text-[#1A1A1A]'}`}>
      {/* Live Meeting Component */}
      {showLiveMeeting && currentUser && (
        <LiveMeeting 
          userId={currentUser.id}
          userName={currentUser.name}
          onLeave={() => setShowLiveMeeting(false)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">
            {currentUser ? `Hello, ${currentUser.name.split(' ')[0]}` : 'Welcome'}
          </h1>
          <p className="text-[#666] text-sm mt-1">Your financial overview for today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onNavigate('notifications')}
            className={`p-3 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#E5E5E5]'} border rounded-2xl hover:opacity-80 transition-all relative`}
          >
            <Bell className={`w-5 h-5 ${isDarkMode ? 'text-gray-300' : 'text-[#666]'}`} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <button 
            onClick={() => onNavigate('account')}
            className="w-12 h-12 bg-green-700 text-white rounded-2xl flex items-center justify-center font-bold shadow-lg shadow-green-700/20"
          >
            {currentUser ? currentUser.name.charAt(0) : <UserIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Financial Health & Stats */}
      {currentUser && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#E5E5E5]'} p-8 rounded-[2.5rem] border shadow-sm flex flex-col md:flex-row gap-8 items-center`}>
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className={isDarkMode ? 'text-gray-700' : 'text-gray-100'}
                />
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={364.4}
                  strokeDashoffset={364.4 - (364.4 * financialHealthScore) / 100}
                  className={`${getHealthColor(financialHealthScore)} transition-all duration-1000 ease-out`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-[#1A1A1A]'}`}>{Math.round(financialHealthScore)}</span>
                <span className="text-[8px] font-bold text-[#999] uppercase tracking-widest">Score</span>
              </div>
            </div>
            <div className="flex-1 space-y-2 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-[#1A1A1A]'}`}>Financial Health: <span className={getHealthColor(financialHealthScore)}>{getHealthLabel(financialHealthScore)}</span></h3>
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-[#666]'} leading-relaxed`}>
                Your score is based on your balance, repayment history, and account activity. Keep it above 80 to unlock lower interest rates!
              </p>
              <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-3">
                <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-wider">Verified Account</span>
                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-wider">Active Member</span>
              </div>
            </div>
          </div>

          <div className="bg-green-700 p-8 rounded-[2.5rem] text-white shadow-xl shadow-green-700/20 flex flex-col justify-between relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-green-200 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Available Balance</p>
              <h2 className="text-4xl font-black tracking-tighter mb-4">{balance}</h2>
              <div className="flex items-center gap-2 text-green-200 text-xs font-bold">
                <TrendingUp className="w-4 h-4" />
                <span>+12.5% from last month</span>
              </div>
            </div>
            <button 
              onClick={() => onNavigate('digital-services')}
              className="relative z-10 mt-6 w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 border border-white/10"
            >
              Manage Funds
              <ArrowUpRight className="w-4 h-4" />
            </button>
            
            {/* Decorative elements */}
            <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-32 h-32 bg-green-900/40 rounded-full blur-2xl"></div>
          </div>
        </div>
      )}

      {/* Quick Stats Row */}
      {currentUser && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#E5E5E5]'} p-6 rounded-3xl border shadow-sm space-y-1`}>
            <p className="text-[10px] font-bold text-[#999] uppercase tracking-widest">Active Loans</p>
            <p className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-[#1A1A1A]'}`}>1</p>
          </div>
          <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#E5E5E5]'} p-6 rounded-3xl border shadow-sm space-y-1`}>
            <p className="text-[10px] font-bold text-[#999] uppercase tracking-widest">Total Savings</p>
            <p className="text-xl font-black text-green-700">K 2,450</p>
          </div>
          <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#E5E5E5]'} p-6 rounded-3xl border shadow-sm space-y-1`}>
            <p className="text-[10px] font-bold text-[#999] uppercase tracking-widest">Next Payment</p>
            <p className="text-xl font-black text-amber-600">Mar 25</p>
          </div>
          <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#E5E5E5]'} p-6 rounded-3xl border shadow-sm space-y-1`}>
            <p className="text-[10px] font-bold text-[#999] uppercase tracking-widest">DMI Points</p>
            <p className="text-xl font-black text-purple-600">850</p>
          </div>
        </div>
      )}

      {/* Registration/Login Prompt */}
      {!currentUser && (
        <div className="space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 p-6 rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-700 text-white rounded-2xl flex items-center justify-center shadow-lg shrink-0 overflow-hidden">
                <img src={config.appLogo || logo} alt="Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <h4 className="font-bold text-lg text-green-900">Join {config.appName}</h4>
                <p className="text-sm text-green-700 mt-0.5">Register now to unlock financial freedom and instant loans.</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button 
                onClick={onShowLogin}
                className="flex-1 sm:flex-none bg-white text-green-700 border border-green-700 px-6 py-3 rounded-xl text-sm font-bold hover:bg-green-50 transition-colors text-center"
              >
                Log In
              </button>
              <button 
                onClick={onShowRegistration}
                className="flex-1 sm:flex-none bg-green-700 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-green-800 transition-colors text-center shadow-md"
              >
                Register
              </button>
              <button 
                onClick={() => onNavigate('digital-services')}
                className="flex-1 sm:flex-none bg-gray-100 text-[#666] px-6 py-3 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors text-center"
              >
                Browse as Guest
              </button>
            </div>
          </motion.div>

          {/* App Pitch / Graphics Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-8 rounded-[2rem] border border-[#E5E5E5] shadow-sm flex flex-col items-center text-center group hover:border-green-500 transition-colors"
            >
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold mb-3">Fast Collateral Loans</h3>
              <p className="text-[#666] leading-relaxed">Borrow from K200 to K50,000+ with quick same-day approval secured by your collateral.</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-8 rounded-[2rem] border border-[#E5E5E5] shadow-sm flex flex-col items-center text-center group hover:border-green-500 transition-colors"
            >
              <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold mb-3">Secure & Reliable</h3>
              <p className="text-[#666] leading-relaxed">Bank-grade security ensures your data and money are always protected with us.</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white p-8 rounded-[2rem] border border-[#E5E5E5] shadow-sm flex flex-col items-center text-center group hover:border-green-500 transition-colors"
            >
              <div className="w-20 h-20 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold mb-3">Flexible Interest</h3>
              <p className="text-[#666] leading-relaxed">Choose terms that work for you: 1 Week (15%), 2 Weeks (25%), 3 Weeks (35%), or 4 Weeks (45%).</p>
            </motion.div>
          </div>
        </div>
      )}

      {/* Quick Actions Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            QUICK_ACTIONS
          </h3>
          <button className="text-[10px] font-bold text-green-700 uppercase tracking-widest hover:underline">View All</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {primaryActions.map((action) => (
            <QuickActionButton
              key={action.id}
              label={action.label}
              icon={action.icon}
              onClick={action.onClick}
            />
          ))}
        </div>
      </div>

      {/* Loan Request Modal */}
      <AnimatePresence>
        {showLoanModal && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setShowLoanModal(false)}
                className="absolute top-6 right-6 p-2 hover:bg-[#F0F0F0] rounded-full transition-colors"
              >
                <XCircle className="w-5 h-5 text-[#999]" />
              </button>
              
              <div className="space-y-6">
                <div className="w-16 h-16 bg-green-50 text-green-700 rounded-2xl flex items-center justify-center overflow-hidden">
                  <img src={config.appLogo || logo} alt="Logo" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Request a Loan</h2>
                  <p className="text-[#666] text-sm mt-2">Enter the amount you wish to borrow.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-[#999] uppercase tracking-widest ml-1">Loan Amount (K)</label>
                    <input 
                      type="number"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(e.target.value)}
                      className="w-full px-4 py-4 bg-[#F8F9FA] border border-[#E5E5E5] rounded-2xl text-2xl font-black focus:outline-none focus:border-green-700"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#999] uppercase tracking-widest ml-1">Loan Type</label>
                    <select 
                      value={loanType}
                      onChange={(e) => setLoanType(e.target.value)}
                      className="w-full px-4 py-4 bg-[#F8F9FA] border border-[#E5E5E5] rounded-2xl text-sm font-bold focus:outline-none focus:border-green-700 appearance-none"
                    >
                      <option value="Fast Collateral">Fast Collateral Loan</option>
                      <option value="Personal">Personal Loan</option>
                      <option value="Business">Business Loan</option>
                      <option value="Emergency">Emergency Loan</option>
                      <option value="Education">Education Loan</option>
                      <option value="Salary">Salary Advance</option>
                      <option value="Agri">Agricultural Loan</option>
                      <option value="Asset">Asset Financing</option>
                      <option value="Home">Home Improvement</option>
                    </select>
                  </div>
                </div>

                <button 
                  onClick={handleLoanRequest}
                  disabled={!loanAmount || parseFloat(loanAmount) <= 0}
                  className="w-full bg-green-700 disabled:bg-gray-300 hover:bg-green-800 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-green-700/20"
                >
                  Submit Request
                  <ArrowUpRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Repay Loan Modal */}
      <AnimatePresence>
        {showRepayModal && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setShowRepayModal(false)}
                className="absolute top-6 right-6 p-2 hover:bg-[#F0F0F0] rounded-full transition-colors"
              >
                <XCircle className="w-5 h-5 text-[#999]" />
              </button>
              
              <div className="space-y-6">
                <div className="w-16 h-16 bg-green-50 text-green-700 rounded-2xl flex items-center justify-center">
                  <CreditCard className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Repay Loan</h2>
                  <p className="text-[#666] text-sm mt-2">Enter the amount you wish to repay from your balance.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-[#999] uppercase tracking-widest ml-1">Repayment Amount (K)</label>
                    <input 
                      type="number"
                      value={repayAmount}
                      onChange={(e) => setRepayAmount(e.target.value)}
                      className="w-full px-4 py-4 bg-[#F8F9FA] border border-[#E5E5E5] rounded-2xl text-2xl font-black focus:outline-none focus:border-green-700"
                      placeholder="0.00"
                    />
                    <p className="text-[10px] text-[#999] mt-2 ml-1">Available Balance: K {(currentUser?.balance || 0).toLocaleString()}</p>
                  </div>
                </div>

                <button 
                  onClick={handleRepay}
                  disabled={!repayAmount || parseFloat(repayAmount) <= 0 || parseFloat(repayAmount) > (currentUser?.balance || 0)}
                  className="w-full bg-green-700 disabled:bg-gray-300 hover:bg-green-800 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-green-700/20"
                >
                  Confirm Repayment
                  <ArrowUpRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <QuickActionButton icon={Smartphone} label="Scan to Pay" onClick={() => onNavigate('digital-services')} />
        <QuickActionButton icon={Wallet} label="Top Up Wallet" onClick={() => onNavigate('account')} />
        <QuickActionButton icon={Target} label="Share & Earn" onClick={handleReferAndEarn} />
      </div>

      {/* Agent Support Panel Card */}
      <div className="bg-purple-50 rounded-[2.5rem] p-6 flex items-center justify-between border border-purple-100 shadow-sm relative overflow-hidden group">
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 bg-purple-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-purple-600/20">
            <Headphones className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-black text-purple-900">Agent Support Panel</h3>
            <p className="text-xs text-purple-700 font-medium max-w-[150px]">Manage users and support requests.</p>
          </div>
        </div>
        <button 
          onClick={onAgentLogin}
          className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold text-xs shadow-lg shadow-purple-600/20 hover:bg-purple-700 transition-all relative z-10"
        >
          Enter Panel
        </button>
        
        {/* Decorative background */}
        <div className="absolute right-0 top-0 w-32 h-32 bg-purple-200/50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
      </div>

      {/* Welcome Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.01 }}
        className="bg-[#1A1A1A] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl border border-white/5"
      >
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-green-400 font-bold text-[10px] uppercase tracking-[0.2em]">Premium Account</p>
                {currentUser?.isVerified && (
                  <span className="bg-white/20 text-white text-[8px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Shield className="w-2 h-2" /> VERIFIED
                  </span>
                )}
              </div>
              <h2 className="text-3xl font-black tracking-tight">Hello, {currentUser ? currentUser.name : 'Guest'}</h2>
            </div>
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10">
              <Shield className="w-6 h-6 text-green-400" />
            </div>
          </div>
          
          {currentUser && (
            <div className="flex flex-wrap gap-3 mb-8">
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/10">
                <Phone className="w-3 h-3 text-green-400" />
                <span className="text-[10px] font-bold tracking-wider">+260 {currentUser.phone}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/10">
                <FileText className="w-3 h-3 text-green-400" />
                <span className="text-[10px] font-bold tracking-wider">NRC: {currentUser.nrc}</span>
              </div>
            </div>
          )}

          <div className="flex items-end justify-between">
            <div>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">Available Balance</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-green-400">K</span>
                <p className="text-5xl font-black tracking-tighter">{(currentUser?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowRepayModal(true)}
              className="bg-green-700 hover:bg-green-600 text-white px-5 py-3 rounded-2xl text-xs font-black flex items-center gap-2 transition-all shadow-xl shadow-green-900/40 border border-green-600/50"
            >
              REPAY LOAN <CreditCard className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-green-700/30 rounded-full blur-[80px]"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-48 h-48 bg-green-400/20 rounded-full blur-[60px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>
      </motion.div>

      {/* Primary Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {primaryActions.map((action) => (
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            key={action.id}
            onClick={action.onClick || (() => onNavigate(action.id as Section))}
            className={`${action.color} ${action.textColor} p-6 rounded-[2rem] border border-[#E5E5E5] shadow-sm hover:shadow-md transition-all flex flex-col items-start text-left group`}
          >
            <div className={`p-3 rounded-2xl mb-4 ${action.id === 'apply-loan' ? 'bg-white/20' : 'bg-green-50 text-green-700'}`}>
              <action.icon className="w-6 h-6" />
            </div>
            <span className="font-bold text-sm leading-tight">{action.label}</span>
            <ChevronRight className={`w-4 h-4 mt-2 opacity-0 group-hover:opacity-100 transition-all ${action.id === 'apply-loan' ? 'text-white' : 'text-green-700'}`} />
          </motion.button>
        ))}
      </div>

      {/* Recent Activity List */}
      <DataList transactions={transactions} title="Recent Transactions" />

      {/* WhatsApp Support */}
      <div className="pt-8 pb-8 text-center">
        <a href="https://wa.me/260777382032" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-6 py-3 rounded-2xl font-bold text-sm hover:bg-green-100 transition-colors">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          WhatsApp: +260 777382032
        </a>
      </div>
    </div>
  );
};

export default Home;
