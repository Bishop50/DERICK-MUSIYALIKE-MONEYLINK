import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, ChatMessage, Agent, SystemConfig, Task, LoanRequest } from '../types';
import SupportChat from './SupportChat';
import LiveMeeting from './LiveMeeting';
import AIServicesSection from './AIServicesSection';
import { toast } from 'sonner';

import { 
  Users, 
  MessageSquare, 
  Shield, 
  LogOut, 
  Search, 
  Plus, 
  Trash2, 
  Wrench, 
  CheckCircle, 
  XCircle,
  Headphones,
  UserPlus,
  FileText,
  Save,
  Video,
  ArrowLeft,
  Image as ImageIcon,
  MapPin,
  Database,
  Calendar,
  LayoutDashboard,
  TrendingUp,
  Activity,
  Clock,
  ArrowRight,
  Bell,
  Download,
  FileDown,
  Brain
} from 'lucide-react';

interface AgentPanelProps {
  currentUser: User | null;
  onLogout: () => void;
  agentId: string;
  isDeveloper?: boolean;
  onBack?: () => void;
  onOpenNotifications?: () => void;
  hasUnreadNotifications?: boolean;
  appConfig?: { name: string, logo: string };
}

const AgentPanel: React.FC<AgentPanelProps> = ({ currentUser, onLogout, agentId, isDeveloper, onBack, onOpenNotifications, hasUnreadNotifications, appConfig }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium' as 'low' | 'medium' | 'high' });

  const addTask = async () => {
    if (!newTask.title || !newTask.description) return;
    const task: Task = {
      id: Math.random().toString(36).substr(2, 9),
      ...newTask,
      status: 'pending',
      assignedTo: agentId,
      createdAt: new Date().toISOString()
    };
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      });
      if (res.ok) {
        const savedTask = await res.json();
        const updatedTasks = [...tasks, savedTask];
        setTasks(updatedTasks);
        localStorage.setItem('moneylink_tasks', JSON.stringify(updatedTasks));
        setNewTask({ title: '', description: '', priority: 'medium' });
      }
    } catch (error) {
      console.error('Failed to add task:', error);
      // Fallback to local storage
      const updatedTasks = [...tasks, task];
      setTasks(updatedTasks);
      localStorage.setItem('moneylink_tasks', JSON.stringify(updatedTasks));
      setNewTask({ title: '', description: '', priority: 'medium' });
    }
  };

  const updateTaskStatus = async (id: string, status: 'pending' | 'in progress' | 'completed') => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        const updatedTask = await res.json();
        const updatedTasks = tasks.map(t => t.id === id ? updatedTask : t);
        setTasks(updatedTasks);
        localStorage.setItem('moneylink_tasks', JSON.stringify(updatedTasks));
      }
    } catch (error) {
      console.error('Failed to update task:', error);
      // Fallback to local storage
      const updatedTasks = tasks.map(t => t.id === id ? { ...t, status } : t);
      setTasks(updatedTasks);
      localStorage.setItem('moneylink_tasks', JSON.stringify(updatedTasks));
    }
  };
  const [loanRequests, setLoanRequests] = useState<LoanRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'chat' | 'tasks' | 'meeting' | 'storage' | 'loan-requests' | 'dashboard' | 'ai'>(() => {
    return (localStorage.getItem('moneylink_agent_active_tab') as any) || 'dashboard';
  });

  useEffect(() => {
    localStorage.setItem('moneylink_agent_active_tab', activeTab);
  }, [activeTab]);
  const [searchTerm, setSearchTerm] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecentSearches, setShowRecentSearches] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('moneylink_agent_recent_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.trim() && !recentSearches.includes(term.trim())) {
      const updated = [term.trim(), ...recentSearches].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('moneylink_agent_recent_searches', JSON.stringify(updated));
    }
  };
  const [selectedUserForChat, setSelectedUserForChat] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [files, setFiles] = useState<{ id: string, name: string, size: string, type: string, date: string, content?: string, folderId?: string | null }[]>([]);
  const [folders, setFolders] = useState<{ id: string, name: string, parentId: string | null }[]>([]);
  
  const playNotificationSound = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(e => console.warn('Audio playback failed:', e));
  };

  useEffect(() => {
    if (tasks.length > 0) {
      const last = tasks[0];
      if (last.status === 'pending') {
        playNotificationSound();
      }
    }
  }, [tasks.length]);

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [showDocModal, setShowDocModal] = useState<{ type: string, url: string } | null>(null);
  const [showMapModal, setShowMapModal] = useState<{ lat: number, lng: number } | null>(null);
  const [config, setConfig] = useState<SystemConfig>({
    appName: 'MONEYLINK ADMIN',
    appLogo: '',
    aiPrompt: '',
    primaryColor: '',
    maintenanceMode: false,
    twoFactorEnabled: true,
    biometricEnabled: true
  });

  const fetchData = useCallback(async () => {
    try {
      const [usersRes, agentsRes, configRes, loansRes, tasksRes] = await Promise.all([
        fetch(`/api/users`),
        fetch('/api/agents'),
        fetch('/api/system-config'),
        fetch('/api/loan-requests'),
        fetch('/api/tasks')
      ]);
      
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data);
      } else {
        const storedUsers = JSON.parse(localStorage.getItem('moneylink_users') || '[]');
        setUsers(storedUsers);
      }

      if (loansRes.ok) {
        setLoanRequests(await loansRes.json());
      }

      if (tasksRes.ok) {
        setTasks(await tasksRes.json());
      }

      if (agentsRes.ok) {
        const data = await agentsRes.json();
        const agent = data.find((a: Agent) => a.id === agentId);
        setCurrentAgent(agent || null);
      } else {
        const storedAgents = JSON.parse(localStorage.getItem('moneylink_agents') || '[]');
        const agent = storedAgents.find((a: Agent) => a.id === agentId);
        setCurrentAgent(agent || null);
      }

      if (configRes.ok) {
        const data = await configRes.json();
        if (Object.keys(data).length > 0) {
          setConfig(prev => ({ ...prev, ...data }));
        }
      } else {
        const storedConfig = JSON.parse(localStorage.getItem('moneylink_config') || '{}');
        if (Object.keys(storedConfig).length > 0) {
          setConfig(prev => ({ ...prev, ...storedConfig }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch data via API, falling back to local storage', error);
      const storedUsers = JSON.parse(localStorage.getItem('moneylink_users') || '[]');
      setUsers(storedUsers);
      
      const storedAgents = JSON.parse(localStorage.getItem('moneylink_agents') || '[]');
      const agent = storedAgents.find((a: Agent) => a.id === agentId);
      setCurrentAgent(agent || null);

      const storedConfig = JSON.parse(localStorage.getItem('moneylink_config') || '{}');
      if (Object.keys(storedConfig).length > 0) {
        setConfig(prev => ({ ...prev, ...storedConfig }));
      }
    }
    
    const storedFiles = JSON.parse(localStorage.getItem('moneylink_agent_files') || '[]');
    setFiles(storedFiles);
    const storedFolders = JSON.parse(localStorage.getItem('moneylink_agent_folders') || '[]');
    setFolders(storedFolders);
  }, [agentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const createFolder = (name: string) => {
    const newFolder = { id: Math.random().toString(36).substr(2, 9), name, parentId: currentFolderId };
    const updatedFolders = [...folders, newFolder];
    setFolders(updatedFolders);
    localStorage.setItem('moneylink_agent_folders', JSON.stringify(updatedFolders));
  };

  const deleteFolder = (id: string) => {
    const updatedFolders = folders.filter(f => f.id !== id);
    setFolders(updatedFolders);
    localStorage.setItem('moneylink_agent_folders', JSON.stringify(updatedFolders));
    const updatedFiles = files.filter(f => f.folderId !== id);
    setFiles(updatedFiles);
    localStorage.setItem('moneylink_agent_files', JSON.stringify(updatedFiles));
  };

  const downloadData = (type: 'users' | 'loans') => {
    const data = type === 'users' ? users : loanRequests;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent_${type}_export_${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const newFile = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: (file.size / 1024).toFixed(2) + ' KB',
        type: file.type,
        date: new Date().toLocaleDateString(),
        content: event.target?.result as string,
        folderId: currentFolderId
      };
      const updatedFiles = [newFile, ...files];
      setFiles(updatedFiles);
      localStorage.setItem('moneylink_agent_files', JSON.stringify(updatedFiles));
    };
    reader.readAsDataURL(file);
  };

  const deleteFile = (id: string) => {
    const updatedFiles = files.filter(f => f.id !== id);
    setFiles(updatedFiles);
    localStorage.setItem('moneylink_agent_files', JSON.stringify(updatedFiles));
  };

  const downloadFile = (file: any) => {
    const a = document.createElement('a');
    a.href = file.content;
    a.download = file.name;
    a.click();
  };

  const handleApproveLoan = async (id: string) => {
    const loan = loanRequests.find(l => l.id === id);
    if (!loan) return;
    
    try {
      // Generate Repayment Schedule
      const interestRate = loan.interestRate || 25;
      const totalAmount = loan.amount * (1 + interestRate / 100);
      const isWeekly = loan.tenure === '1 week' || loan.type === 'Weekly';
      const installments = isWeekly ? 4 : 1; // 4 weekly installments or 1 monthly
      const installmentAmount = totalAmount / installments;
      const schedule = [];
      let remainingBalance = totalAmount;

      for (let i = 1; i <= installments; i++) {
        const dueDate = new Date();
        if (isWeekly) {
          dueDate.setDate(dueDate.getDate() + (i * 7));
        } else {
          dueDate.setMonth(dueDate.getMonth() + i);
        }
        remainingBalance -= installmentAmount;
        schedule.push({
          dueDate: dueDate.toISOString(),
          amount: installmentAmount,
          remainingBalance: Math.max(0, remainingBalance)
        });
      }

      const res = await fetch(`/api/loan-requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'approved',
          repaymentSchedule: schedule
        })
      });
      
      if (res.ok) {
        const updatedLoan = await res.json();
        setLoanRequests(prev => prev.map(l => l.id === id ? updatedLoan : l));
        
        // Refresh users to get updated balance
        const usersRes = await fetch('/api/users');
        if (usersRes.ok) {
          const allUsers = await usersRes.json();
          setUsers(allUsers);
        }
        
        toast.success(`Loan of K ${loan.amount} approved for ${loan.userName}.`);
      }
    } catch (error) {
      console.error('Failed to approve loan:', error);
      toast.error('Failed to approve loan. Please try again.');
    }
  };

  const handleRejectLoan = async (id: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason === null) return;

    try {
      const res = await fetch(`/api/loan-requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', rejectionReason: reason })
      });
      
      if (res.ok) {
        const updatedLoan = await res.json();
        setLoanRequests(prev => prev.map(l => l.id === id ? updatedLoan : l));
        
        // Add Notification via API
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: updatedLoan.userId,
            title: 'Loan Rejected',
            message: `Your loan request for K ${updatedLoan.amount} has been rejected. Reason: ${reason}`,
            isRead: false,
            type: 'loan'
          })
        });

        toast.success('Loan request rejected.');
      }
    } catch (error) {
      console.error('Failed to reject loan:', error);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTasks(tasks.filter(t => t.id !== id));
        toast.success('Task deleted');
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('Failed to delete task');
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      await fetch(`/api/users/${updatedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser)
      });
      const updatedUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
      setUsers(updatedUsers);
      setEditingUser(null);
    } catch (error) {
      console.error('Failed to update user via API, falling back to local storage', error);
      const updatedUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
      setUsers(updatedUsers);
      localStorage.setItem('moneylink_users', JSON.stringify(updatedUsers));
      setEditingUser(null);
    }
  };

  const handleDeleteUser = async (id: string) => {
    toast.error('Agents are not permitted to delete user accounts.');
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.phone.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 md:p-8">
      {/* Developer Actions Overlay */}
      {isDeveloper && (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
          <button 
            onClick={() => {
              let dataToDownload: any = [];
              let filename = 'data.json';
              switch (activeTab) {
                case 'users': dataToDownload = users; filename = 'users.json'; break;
                case 'tasks': dataToDownload = tasks; filename = 'tasks.json'; break;
                case 'loan-requests': dataToDownload = loanRequests; filename = 'loan-requests.json'; break;
                default: dataToDownload = { users, tasks, loanRequests }; filename = 'all-data.json';
              }
              const blob = new Blob([JSON.stringify(dataToDownload, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = filename;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="p-4 bg-black text-white rounded-full shadow-2xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
            title="Developer: Download Current Data"
          >
            <FileDown className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {appConfig?.logo ? (
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-purple-600/20 overflow-hidden border border-purple-100">
                <img 
                  src={appConfig.logo} 
                  alt="Logo" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://placehold.co/100x100/9333ea/ffffff?text=Agent";
                  }}
                />
              </div>
            ) : (
              <div className="w-12 h-12 bg-purple-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-purple-600/20">
                <Headphones className="w-6 h-6" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-black text-[#1A1A1A]">AGENT_PANEL</h1>
              <p className="text-[10px] font-bold text-[#999] uppercase tracking-widest">
                {currentAgent?.name || 'Customer Service Agent'} • ID: {agentId}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {onOpenNotifications && (
              <button 
                onClick={onOpenNotifications}
                className="p-3 bg-white border border-[#E5E5E5] rounded-2xl hover:bg-gray-50 transition-all relative"
              >
                <Bell className="w-5 h-5 text-[#666]" />
                {hasUnreadNotifications && (
                  <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>
            )}
            {onBack && (
              <button 
                onClick={onBack}
                className="px-6 py-3 bg-blue-50 text-blue-600 rounded-2xl font-bold text-xs flex items-center gap-2 hover:bg-blue-600 hover:text-white transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                BACK_TO_APP
              </button>
            )}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => downloadData('users')}
                className="px-4 py-3 bg-white border border-[#E5E5E5] rounded-2xl text-[10px] font-bold hover:bg-purple-50 hover:text-purple-600 transition-all flex items-center gap-2"
              >
                <Download className="w-3 h-3" /> EXPORT_USERS
              </button>
              <button 
                onClick={() => downloadData('loans')}
                className="px-4 py-3 bg-white border border-[#E5E5E5] rounded-2xl text-[10px] font-bold hover:bg-purple-50 hover:text-purple-600 transition-all flex items-center gap-2"
              >
                <Download className="w-3 h-3" /> EXPORT_LOANS
              </button>
              <button 
                onClick={onLogout}
                className="px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-bold text-xs flex items-center gap-2 hover:bg-red-600 hover:text-white transition-all"
              >
                <LogOut className="w-4 h-4" />
                LOGOUT
              </button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-4 p-1 bg-[#F0F0F0] rounded-2xl w-full max-w-2xl overflow-x-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === 'dashboard' ? 'bg-white shadow-sm text-purple-600' : 'text-[#666]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            DASHBOARD
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === 'users' ? 'bg-white shadow-sm text-purple-600' : 'text-[#666]'
            }`}
          >
            <Users className="w-4 h-4" />
            USERS
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'chat' ? 'bg-white shadow-sm text-purple-600' : 'text-[#666]'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            CHAT
          </button>
          <button
            onClick={() => setActiveTab('loan-requests')}
            className={`px-6 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'loan-requests' ? 'bg-purple-600 text-white shadow-lg' : 'text-[#666] hover:text-purple-600'
            }`}
          >
            <FileText className="w-4 h-4" />
            LOAN_REQUESTS
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'tasks' ? 'bg-white shadow-sm text-purple-600' : 'text-[#666]'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            TASKS
          </button>
          <button
            onClick={() => setActiveTab('meeting')}
            className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'meeting' ? 'bg-white shadow-sm text-purple-600' : 'text-[#666]'
            }`}
          >
            <Video className="w-4 h-4" />
            MEETING
          </button>
          <button
            onClick={() => setActiveTab('storage')}
            className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'storage' ? 'bg-white shadow-sm text-purple-600' : 'text-[#666]'
            }`}
          >
            <FileText className="w-4 h-4" />
            STORAGE
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'ai' ? 'bg-white shadow-sm text-purple-600' : 'text-[#666]'
            }`}
          >
            <Brain className="w-4 h-4" />
            AI_LAB
          </button>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-[2.5rem] border border-[#E5E5E5] shadow-xl overflow-hidden min-h-[600px]">
          {activeTab === 'dashboard' && (
            <div className="p-8 space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Agent Dashboard</h2>
                  <p className="text-[#666] text-sm">Welcome back, {currentAgent?.name || 'Agent'}</p>
                </div>
                <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-xl border border-purple-100">
                  <Activity className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-bold text-purple-700 uppercase tracking-widest">Live Status</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="p-6 bg-[#F8F9FA] border border-[#E5E5E5] rounded-3xl space-y-2">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <p className="text-[10px] font-bold text-[#999] uppercase tracking-widest">Total Users</p>
                  <p className="text-2xl font-black">{users.length}</p>
                </div>
                <div className="p-6 bg-[#F8F9FA] border border-[#E5E5E5] rounded-3xl space-y-2">
                  <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <p className="text-[10px] font-bold text-[#999] uppercase tracking-widest">Active Loans</p>
                  <p className="text-2xl font-black">{loanRequests.filter(r => r.status === 'approved').length}</p>
                </div>
                <div className="p-6 bg-[#F8F9FA] border border-[#E5E5E5] rounded-3xl space-y-2">
                  <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <p className="text-[10px] font-bold text-[#999] uppercase tracking-widest">Pending Tasks</p>
                  <p className="text-2xl font-black">{tasks.filter(t => t.assignedTo === agentId && t.status === 'pending').length}</p>
                </div>
                <div className="p-6 bg-[#F8F9FA] border border-[#E5E5E5] rounded-3xl space-y-2">
                  <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <p className="text-[10px] font-bold text-[#999] uppercase tracking-widest">New Messages</p>
                  <p className="text-2xl font-black">0</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-[2rem] p-8 text-white relative overflow-hidden">
                <div className="relative z-10 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold">Daily Summary</h3>
                    <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-widest">Today</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-1">
                      <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Approvals</p>
                      <p className="text-3xl font-black">{loanRequests.filter(r => r.status === 'approved' && new Date(r.date).toDateString() === new Date().toDateString()).length}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">New Users</p>
                      <p className="text-3xl font-black">{users.filter(u => new Date(u.id).toDateString() === new Date().toDateString()).length}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Tasks Done</p>
                      <p className="text-3xl font-black">{tasks.filter(t => t.assignedTo === agentId && t.status === 'completed' && new Date().toDateString() === new Date().toDateString()).length}</p>
                    </div>
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-400/20 rounded-full -ml-24 -mb-24 blur-2xl"></div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-blue-600" />
                  Quick Actions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <button 
                    onClick={() => setActiveTab('users')}
                    className="p-6 bg-blue-50 border border-blue-100 rounded-3xl text-left hover:bg-blue-100 transition-all group"
                  >
                    <UserPlus className="w-6 h-6 text-blue-600 mb-2" />
                    <p className="font-bold text-sm">Register New User</p>
                    <p className="text-[10px] text-blue-700">Add a new client to the system</p>
                  </button>
                  <button 
                    onClick={() => setActiveTab('loan-requests')}
                    className="p-6 bg-green-50 border border-green-100 rounded-3xl text-left hover:bg-green-100 transition-all group"
                  >
                    <FileText className="w-6 h-6 text-green-600 mb-2" />
                    <p className="font-bold text-sm">Review Loans</p>
                    <p className="text-[10px] text-green-700">Check pending loan applications</p>
                  </button>
                  <button 
                    onClick={() => setActiveTab('chat')}
                    className="p-6 bg-purple-50 border border-purple-100 rounded-3xl text-left hover:bg-purple-100 transition-all group"
                  >
                    <MessageSquare className="w-6 h-6 text-purple-600 mb-2" />
                    <p className="font-bold text-sm">Support Chat</p>
                    <p className="text-[10px] text-purple-700">Respond to user inquiries</p>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-600" />
                    Recent Activity
                  </h3>
                  <div className="space-y-3">
                    {loanRequests.slice(0, 5).map(req => (
                      <div key={req.id} className="p-4 bg-white border border-[#F0F0F0] rounded-2xl flex items-center justify-between hover:border-purple-200 transition-all cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center font-bold text-xs">
                            {req.userName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-bold">{req.userName}</p>
                            <p className="text-[10px] text-[#999]">Loan Request: K {req.amount}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase ${
                            req.status === 'approved' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {req.status}
                          </span>
                          <ArrowRight className="w-3 h-3 text-[#999] group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Priority Tasks
                  </h3>
                  <div className="space-y-3">
                    {tasks.filter(t => t.status === 'pending').slice(0, 5).map(task => (
                      <div key={task.id} className="p-4 bg-white border border-[#F0F0F0] rounded-2xl flex items-center justify-between hover:border-green-200 transition-all cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                            <Wrench className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold">{task.title}</p>
                            <p className="text-[10px] text-[#999]">{task.description.substring(0, 40)}...</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setActiveTab('tasks')}
                          className="p-2 hover:bg-green-50 text-green-600 rounded-lg transition-colors"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {tasks.filter(t => t.status === 'pending').length === 0 && (
                      <div className="p-8 text-center bg-[#F8F9FA] rounded-3xl border border-dashed border-[#E5E5E5]">
                        <CheckCircle className="w-8 h-8 text-green-200 mx-auto mb-2" />
                        <p className="text-xs text-[#999] font-bold">All caught up!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <AIServicesSection 
              onBack={() => setActiveTab('dashboard')} 
              config={config} 
              role="admin" // Agents get admin-level AI access for now
            />
          )}

          {activeTab === 'users' && (
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">User Management</h2>
                <div className="relative w-64">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
                  <input 
                    type="text" 
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setShowRecentSearches(true)}
                    onBlur={() => setTimeout(() => setShowRecentSearches(false), 200)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch(searchTerm);
                        setShowRecentSearches(false);
                      }
                    }}
                    className="w-full pl-10 pr-4 py-3 bg-[#F8F9FA] border border-[#E5E5E5] rounded-xl text-xs outline-none focus:border-purple-600"
                  />
                  {showRecentSearches && recentSearches.length > 0 && (
                    <div className="absolute top-full left-0 mt-2 w-full bg-white border border-[#E5E5E5] rounded-xl shadow-lg z-50 overflow-hidden">
                      <div className="px-4 py-2 bg-[#F8F9FA] border-b border-[#E5E5E5] text-[10px] font-bold text-[#999] flex justify-between items-center">
                        RECENT SEARCHES
                        <button 
                          onClick={() => {
                            setRecentSearches([]);
                            localStorage.removeItem('moneylink_agent_recent_searches');
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          Clear
                        </button>
                      </div>
                      {recentSearches.map((term, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setSearchTerm(term);
                            setShowRecentSearches(false);
                          }}
                          className="w-full text-left px-4 py-3 text-sm hover:bg-[#F8F9FA] transition-colors flex items-center gap-2"
                        >
                          <Search className="w-3 h-3 text-[#999]" />
                          {term}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.map(user => (
                  <div key={`agent-user-${user.id}`} className="p-6 bg-[#F8F9FA] border border-[#E5E5E5] rounded-3xl space-y-4 hover:border-purple-600 transition-all group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{user.name}</p>
                          <p className="text-[10px] text-[#999]">{user.phone}</p>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded-lg text-[8px] font-bold uppercase ${user.isVerified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {user.isVerified ? 'Verified' : 'Pending'}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {user.nrcFront && (
                        <button 
                          onClick={() => setShowDocModal({ type: 'NRC Front', url: user.nrcFront! })}
                          className="p-2 bg-gray-100 rounded-xl hover:bg-purple-100 transition-all"
                          title="NRC Front"
                        >
                          <ImageIcon className="w-4 h-4" />
                        </button>
                      )}
                      {user.selfiePhoto && (
                        <button 
                          onClick={() => setShowDocModal({ type: 'Selfie', url: user.selfiePhoto! })}
                          className="p-2 bg-gray-100 rounded-xl hover:bg-purple-100 transition-all"
                          title="Selfie"
                        >
                          <ImageIcon className="w-4 h-4" />
                        </button>
                      )}
                      {user.passportPhoto && (
                        <button 
                          onClick={() => setShowDocModal({ type: 'Passport', url: user.passportPhoto! })}
                          className="p-2 bg-gray-100 rounded-xl hover:bg-purple-100 transition-all"
                          title="Passport"
                        >
                          <ImageIcon className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => setEditingUser(user)}
                        className="flex-1 py-2 bg-white border border-[#E5E5E5] rounded-xl text-[10px] font-bold hover:bg-purple-50 hover:text-purple-600 transition-all flex items-center justify-center gap-2"
                      >
                        <Wrench className="w-3 h-3" />
                        EDIT
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="flex h-[600px]">
              <div className="w-1/3 border-r border-[#F0F0F0] overflow-y-auto">
                {users.map(user => (
                  <button 
                    key={`agent-chat-user-${user.id}`}
                    onClick={() => setSelectedUserForChat(user)}
                    className={`w-full p-4 flex items-center gap-3 hover:bg-[#F9F9F9] transition-all border-b border-[#F0F0F0] ${selectedUserForChat?.id === user.id ? 'bg-purple-50' : ''}`}
                  >
                    <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm">{user.name}</p>
                      <p className="text-[10px] text-[#999] truncate w-32">Click to chat...</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex-1 flex flex-col bg-[#F8F9FA]">
                {selectedUserForChat ? (
                  <SupportChat 
                    currentUser={currentUser} 
                    role="agent" 
                    config={config} 
                    receiverId={selectedUserForChat.id}
                    inline={true}
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center text-center p-8">
                    <div className="space-y-4">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-xl">
                        <Headphones className="w-10 h-10 text-[#CCC]" />
                      </div>
                      <h3 className="text-lg font-bold text-[#999]">Select a user to start support</h3>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'loan-requests' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black tracking-tighter">LOAN REQUESTS</h2>
                <div className="flex items-center gap-2 bg-[#F0F0F0] p-1 rounded-xl">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-[#666] uppercase">
                    Total: {loanRequests.length}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#F8F9FA] text-[#999] text-[10px] uppercase font-bold tracking-widest">
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F0F0]">
                    {loanRequests.map((req) => (
                      <tr key={`agent-loan-${req.id}`} className="hover:bg-[#F9F9F9] transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-sm">{req.userName}</p>
                          <p className="text-[10px] text-[#999]">ID: {req.userId}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-medium text-[#666]">{req.type}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-sm text-purple-700">K {(req.amount || 0).toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${
                            req.status === 'approved' ? 'bg-green-50 text-green-700' : 
                            req.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {req.status === 'pending' && (
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => handleApproveLoan(req.id)}
                                className="p-2 bg-green-50 text-green-700 rounded-xl hover:bg-green-700 hover:text-white transition-all"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleRejectLoan(req.id)}
                                className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[#E5E5E5]">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black">Agent Tasks</h2>
                  <p className="text-[#666] text-sm">Manage your daily operations and assignments</p>
                </div>
                <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-xl border border-purple-100">
                  <CheckCircle className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-bold text-purple-700 uppercase tracking-widest">
                    {tasks.filter(t => t.status === 'completed').length}/{tasks.length} Completed
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Task Creation Form */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="p-6 bg-[#F8F9FA] rounded-[2rem] border border-[#E5E5E5] space-y-4">
                    <h3 className="font-bold text-sm uppercase tracking-widest text-[#999]">Create New Task</h3>
                    <div className="space-y-3">
                      <input 
                        type="text" 
                        placeholder="Task Title" 
                        value={newTask.title} 
                        onChange={e => setNewTask({...newTask, title: e.target.value})} 
                        className="w-full p-4 bg-white border border-[#E5E5E5] rounded-2xl outline-none focus:border-purple-600 font-bold text-sm" 
                      />
                      <textarea 
                        placeholder="Task Description" 
                        value={newTask.description} 
                        onChange={e => setNewTask({...newTask, description: e.target.value})} 
                        className="w-full p-4 bg-white border border-[#E5E5E5] rounded-2xl outline-none focus:border-purple-600 text-sm min-h-[100px]" 
                      />
                      <select 
                        value={newTask.priority} 
                        onChange={e => setNewTask({...newTask, priority: e.target.value as any})} 
                        className="w-full p-4 bg-white border border-[#E5E5E5] rounded-2xl outline-none focus:border-purple-600 font-bold text-sm"
                      >
                        <option value="low">Low Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="high">High Priority</option>
                      </select>
                      <button 
                        onClick={addTask} 
                        className="w-full bg-purple-600 text-white p-4 rounded-2xl font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Task
                      </button>
                    </div>
                  </div>
                </div>

                {/* Task List */}
                <div className="lg:col-span-2 space-y-4">
                  {tasks.filter(t => t.assignedTo === agentId).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-[#F8F9FA] rounded-[2rem] border border-dashed border-[#E5E5E5]">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <CheckCircle className="w-8 h-8 text-[#CCC]" />
                      </div>
                      <p className="text-[#999] font-bold">No tasks assigned yet.</p>
                    </div>
                  ) : (
                    tasks.filter(t => t.assignedTo === agentId).map(task => (
                      <div key={task.id} className="p-6 bg-white border border-[#E5E5E5] rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-purple-500 transition-all group">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="font-bold text-lg">{task.title}</h3>
                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-bold uppercase tracking-widest ${
                              task.priority === 'high' ? 'bg-red-50 text-red-600' :
                              task.priority === 'medium' ? 'bg-amber-50 text-amber-600' :
                              'bg-green-50 text-green-600'
                            }`}>
                              {task.priority}
                            </span>
                          </div>
                          <p className="text-sm text-[#666] leading-relaxed">{task.description}</p>
                          <div className="flex items-center gap-4 text-[10px] text-[#999] font-bold uppercase tracking-widest">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(task.createdAt).toLocaleDateString()}
                            </span>
                            {task.assignedTo && (
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                Agent: {task.assignedTo}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <select 
                            value={task.status} 
                            onChange={e => updateTaskStatus(task.id, e.target.value as any)} 
                            className={`p-3 border rounded-xl font-bold text-xs outline-none transition-all ${
                              task.status === 'completed' ? 'bg-green-50 border-green-200 text-green-700' :
                              task.status === 'in progress' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                              'bg-gray-50 border-gray-200 text-gray-700'
                            }`}
                          >
                            <option value="pending">Pending</option>
                            <option value="in progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                          <button 
                            onClick={() => deleteTask(task.id)}
                            className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'storage' && (
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[#E5E5E5]">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black">Agent Storage {currentFolderId && `> ${folders.find(f => f.id === currentFolderId)?.name}`}</h2>
                <div className="flex gap-2">
                  {currentFolderId && (
                    <button 
                      onClick={() => setCurrentFolderId(folders.find(f => f.id === currentFolderId)?.parentId || null)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold text-xs hover:bg-gray-200 transition-all flex items-center gap-2"
                    >
                      BACK
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      const name = prompt('Folder name:');
                      if (name) createFolder(name);
                    }}
                    className="px-4 py-2 bg-purple-50 text-purple-600 rounded-xl font-bold text-xs hover:bg-purple-100 transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> NEW_FOLDER
                  </button>
                  <label className="px-4 py-2 bg-purple-600 text-white rounded-xl font-bold text-xs cursor-pointer hover:bg-purple-700 transition-all flex items-center gap-2">
                    <Plus className="w-4 h-4" /> UPLOAD_FILE
                    <input type="file" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {folders.filter(f => f.parentId === currentFolderId).map(folder => (
                  <div key={folder.id} className="bg-white p-6 rounded-[2rem] border border-[#E5E5E5] shadow-sm group relative flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 transition-all" onClick={() => setCurrentFolderId(folder.id)}>
                    <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <FileText className="w-8 h-8 text-purple-600" />
                    </div>
                    <p className="font-bold text-sm truncate">{folder.name}</p>
                    <button onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }} className="absolute top-2 right-2 p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                {files.filter(f => f.folderId === currentFolderId).map(file => (
                  <div key={file.id} className="bg-white p-6 rounded-[2rem] border border-[#E5E5E5] shadow-sm group relative flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <FileText className="w-8 h-8 text-blue-600" />
                    </div>
                    <p className="font-bold text-sm truncate w-full text-center">{file.name}</p>
                    <p className="text-xs text-[#666] mt-1">{file.size} • {file.date}</p>
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => downloadFile(file)} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white">
                        <Save className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteFile(file.id)} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {files.filter(f => f.folderId === currentFolderId).length === 0 && folders.filter(f => f.parentId === currentFolderId).length === 0 && (
                  <div className="col-span-1 sm:col-span-2 md:col-span-3 py-12 text-center border-2 border-dashed border-[#E5E5E5] rounded-[2rem]">
                    <FileText className="w-12 h-12 text-[#CCC] mx-auto mb-4" />
                    <p className="text-sm font-bold text-[#999]">No files or folders in this location</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Edit User Modal */}
        <AnimatePresence>
          {/* Modals */}
      {showDocModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-[#F0F0F0] flex items-center justify-between bg-[#F8F9FA]">
              <h3 className="text-xl font-black tracking-tighter uppercase">{showDocModal.type}</h3>
              <button onClick={() => setShowDocModal(null)} className="p-2 hover:bg-white rounded-full transition-all">
                <XCircle className="w-6 h-6 text-[#999]" />
              </button>
            </div>
            <div className="p-8 flex items-center justify-center bg-[#F0F0F0]">
              <img src={showDocModal.url} alt={showDocModal.type} className="max-w-full max-h-[60vh] rounded-2xl shadow-lg border-4 border-white" />
            </div>
          </div>
        </div>
      )}

      {showMapModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-[#F0F0F0] flex items-center justify-between bg-[#F8F9FA]">
              <h3 className="text-xl font-black tracking-tighter uppercase">User Location</h3>
              <button onClick={() => setShowMapModal(null)} className="p-2 hover:bg-white rounded-full transition-all">
                <XCircle className="w-6 h-6 text-[#999]" />
              </button>
            </div>
            <div className="h-[60vh] bg-[#F0F0F0] relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <MapPin className="w-12 h-12 text-purple-600 mx-auto animate-bounce" />
                  <p className="font-bold text-[#666]">Latitude: {showMapModal.lat}<br/>Longitude: {showMapModal.lng}</p>
                  <div className="p-4 bg-white rounded-2xl shadow-sm border border-[#E5E5E5]">
                    <p className="text-xs text-[#999]">Map visualization would load here in production.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingUser && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setEditingUser(null)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold">Edit User Details</h2>
                  <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-[#F0F0F0] rounded-xl">
                    <XCircle className="w-6 h-6 text-[#999]" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#999] uppercase ml-4">Full Name</label>
                    <input 
                      type="text"
                      value={editingUser.name}
                      onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                      className="w-full px-6 py-4 bg-[#F8F9FA] border border-[#E5E5E5] rounded-2xl text-sm font-bold outline-none focus:border-purple-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#999] uppercase ml-4">Phone Number</label>
                    <input 
                      type="text"
                      value={editingUser.phone}
                      onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                      className="w-full px-6 py-4 bg-[#F8F9FA] border border-[#E5E5E5] rounded-2xl text-sm font-bold outline-none focus:border-purple-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#999] uppercase ml-4">NRC Number</label>
                    <input 
                      type="text"
                      value={editingUser.nrc || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, nrc: e.target.value })}
                      className="w-full px-6 py-4 bg-[#F8F9FA] border border-[#E5E5E5] rounded-2xl text-sm font-bold outline-none focus:border-purple-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#999] uppercase ml-4">Password</label>
                    <input 
                      type="text"
                      value={editingUser.password || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                      className="w-full px-6 py-4 bg-[#F8F9FA] border border-[#E5E5E5] rounded-2xl text-sm font-bold outline-none focus:border-purple-600"
                      placeholder="Leave blank to keep current password"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-purple-600" />
                      <span className="text-xs font-bold text-purple-700">Verification Status</span>
                    </div>
                    <button 
                      onClick={() => setEditingUser({ ...editingUser, isVerified: !editingUser.isVerified })}
                      className={`w-12 h-6 rounded-full transition-all relative ${editingUser.isVerified ? 'bg-green-600' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${editingUser.isVerified ? 'right-1' : 'left-1'}`}></div>
                    </button>
                  </div>

                  <button 
                    onClick={() => handleUpdateUser(editingUser)}
                    className="w-full py-4 bg-purple-600 text-white rounded-2xl font-bold shadow-lg shadow-purple-600/20 hover:bg-purple-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    SAVE_CHANGES
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <SupportChat currentUser={currentUser} role="agent" config={config} />
      </div>
    </div>
  );
};

export default AgentPanel;
