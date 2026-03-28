import React, { useState, useEffect, useCallback } from 'react';
const logo = '/logo.png';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  FileText, 
  CheckCircle, 
  XCircle, 
  LogOut, 
  Shield, 
  Lock, 
  ArrowRight,
  Trash2,
  RefreshCw,
  Search,
  Download,
  Image as ImageIcon,
  Info,
  Link as LinkIcon,
  Copy,
  Database,
  MessageSquare,
  Eye,
  FileDown,
  Settings,
  Save,
  Zap,
  MapPin,
  TrendingUp,
  Wallet,
  Video,
  Play,
  Plus,
  UserPlus,
  Briefcase,
  Globe,
  Smartphone,
  Check,
  X,
  Filter,
  Bell,
  ClipboardList,
  ShieldCheck
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { toast } from 'sonner';

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import { User, LoanRequest, ChatMessage, Agent, Meeting, StreamingApp, AppRequest, Admin, Transaction, Task, RepaymentRequest } from '../types';
import { saveUserToLocalStorage, getUserFromLocalStorage } from '../utils/storage';

import SupportChat from './SupportChat';
import LiveMeeting from './LiveMeeting';

interface AdminPanelProps {
  currentUser: User | null;
  onLogout: () => void;
  isDeveloper?: boolean;
  onBack?: () => void;
  onOpenNotifications?: () => void;
  hasUnreadNotifications?: boolean;
  appConfig?: { name: string, logo: string };
}

import { sendPushNotification } from '../utils/notifications';

const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser, onLogout, isDeveloper, onBack, onOpenNotifications, hasUnreadNotifications, appConfig }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(isDeveloper || false);
  const [adminUser, setAdminUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loanRequests, setLoanRequests] = useState<LoanRequest[]>([]);
  const [repaymentRequests, setRepaymentRequests] = useState<RepaymentRequest[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [streamingApps, setStreamingApps] = useState<StreamingApp[]>([]);
  const [agentRequests, setAgentRequests] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'requests' | 'users' | 'services' | 'system' | 'workplace' | 'storage' | 'chat' | 'agents' | 'meetings' | 'streaming' | 'live-meeting' | 'transactions' | 'agent-requests' | 'servers' | 'tools' | 'app-requests' | 'tasks' | 'loan-requests' | 'recurring-payments' | 'repayment-requests' | 'deleted-files'>(() => {
    return (localStorage.getItem('moneylink_admin_active_tab') as any) || 'dashboard';
  });

  useEffect(() => {
    localStorage.setItem('moneylink_admin_active_tab', activeTab);
  }, [activeTab]);
  const [deletedItems, setDeletedItems] = useState<any[]>([]);

  const handleRestoreItem = async (id: string) => {
    try {
      const res = await fetch(`/api/deleted-items/restore/${id}`, { method: 'POST' });
      if (res.ok) {
        setDeletedItems(prev => prev.filter(item => item.id !== id));
        toast.success('Item restored successfully');
      }
    } catch (error) {
      console.error('Failed to restore item:', error);
    }
  };

  const handlePermanentDelete = async (id: string) => {
    try {
      await fetch(`/api/deleted-items/${id}`, { method: 'DELETE' });
      setDeletedItems(prev => prev.filter(item => item.id !== id));
      toast.success('Item permanently deleted');
    } catch (error) {
      console.error('Failed to permanently delete item:', error);
      toast.error('Failed to permanently delete item');
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'frozen' | 'verified' | 'pending'>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecentSearches, setShowRecentSearches] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('moneylink_recent_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.trim() && !recentSearches.includes(term.trim())) {
      const updated = [term.trim(), ...recentSearches].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('moneylink_recent_searches', JSON.stringify(updated));
    }
  };
  const [selectedUserForChat, setSelectedUserForChat] = useState<User | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [adminNotifications, setAdminNotifications] = useState<any[]>([]);
  
  const playNotificationSound = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(e => console.warn('Audio playback failed:', e));
  };

  useEffect(() => {
    if (adminNotifications.length > 0) {
      const last = adminNotifications[0];
      if (!last.isRead) {
        playNotificationSound();
      }
    }
  }, [adminNotifications.length]);

  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showRecruitAgentModal, setShowRecruitAgentModal] = useState(false);
  const [showAssignTaskModal, setShowAssignTaskModal] = useState(false);
  const [selectedAgentForTask, setSelectedAgentForTask] = useState<Agent | null>(null);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium' as 'low' | 'medium' | 'high' });
  const [showDocModal, setShowDocModal] = useState<{ type: string, url: string } | null>(null);
  const [showMapModal, setShowMapModal] = useState<{ lat: number, lng: number } | null>(null);
  const [newUser, setNewUser] = useState({ name: '', phone: '', nrc: '', password: '' });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [recurringPayments, setRecurringPayments] = useState<any[]>([]);
  
  const handleCreateUser = async () => {
    const user: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: newUser.name,
      phone: newUser.phone,
      nrc: newUser.nrc,
      password: newUser.password,
      isRegistered: true,
      balance: 0,
      isVerified: false,
    };

    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });
      setUsers([...users, user]);
      localStorage.setItem('moneylink_users', JSON.stringify([...users, user]));
      setShowCreateUserModal(false);
      setNewUser({ name: '', phone: '', nrc: '', password: '' });
      toast.success('User created successfully!');
    } catch (error) {
      console.error('Failed to create user:', error);
      toast.error('Failed to create user. Please try again.');
    }
  };
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);
  const [requestedAppName, setRequestedAppName] = useState('');
  const [appIcon, setAppIcon] = useState<string | null>(null); // New state
  const [desiredUsername, setDesiredUsername] = useState('');
  const [desiredPassword, setDesiredPassword] = useState('');
  const [myAppRequests, setMyAppRequests] = useState<AppRequest[]>([]);
  const [files, setFiles] = useState<{ id: string, name: string, size: string, type: string, date: string, content?: string, folderId?: string | null }[]>([]);
  const [folders, setFolders] = useState<{ id: string, name: string, parentId: string | null }[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  const createFolder = (name: string) => {
    const newFolder = { id: Math.random().toString(36).substr(2, 9), name, parentId: currentFolderId };
    const updatedFolders = [...folders, newFolder];
    setFolders(updatedFolders);
    localStorage.setItem('moneylink_admin_folders', JSON.stringify(updatedFolders));
  };

  const deleteFolder = (id: string) => {
    const updatedFolders = folders.filter(f => f.id !== id);
    setFolders(updatedFolders);
    localStorage.setItem('moneylink_admin_folders', JSON.stringify(updatedFolders));
    
    const updatedFiles = files.filter(f => f.folderId !== id);
    setFiles(updatedFiles);
    localStorage.setItem('moneylink_admin_files', JSON.stringify(updatedFiles));
  };
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txFilterType, setTxFilterType] = useState<string>('all');
  const [txDateRange, setTxDateRange] = useState<string>('all');
  const [config, setConfig] = useState<any>({
    appName: 'MONEYLINK ADMIN',
    appLogo: logo,
    maintenanceMode: false,
    twoFactorEnabled: true,
    biometricEnabled: true
  });

  const exportToJson = () => {
    const data = {
      users,
      loanRequests,
      exportDate: new Date().toISOString(),
      system: `${config.appName} Banking System`
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moneylink_data_export_${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToSvg = () => {
    const totalDisbursed = loanRequests.filter(r => r.status === 'approved').reduce((acc, curr) => acc + curr.amount, 0);
    const pendingLoans = loanRequests.filter(r => r.status === 'pending').length;
    
    const svgContent = `
      <svg width="600" height="400" viewBox="0 0 600 400" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="600" height="400" rx="40" fill="#F8F9FA"/>
        <rect x="40" y="40" width="520" height="320" rx="30" fill="white" stroke="#E5E5E5" stroke-width="2"/>
        
        <text x="70" y="90" fill="#1A1A1A" font-family="Arial" font-size="24" font-weight="bold">{config.appName} System Report</text>
        <text x="70" y="120" fill="#666" font-family="Arial" font-size="14">Generated on: ${new Date().toLocaleDateString()}</text>
        
        <rect x="70" y="160" width="140" height="80" rx="20" fill="#F0FDF4"/>
        <text x="85" y="185" fill="#15803D" font-family="Arial" font-size="10" font-weight="bold">TOTAL USERS</text>
        <text x="85" y="220" fill="#14532D" font-family="Arial" font-size="24" font-weight="black">${users.length}</text>
        
        <rect x="230" y="160" width="140" height="80" rx="20" fill="#EFF6FF"/>
        <text x="245" y="185" fill="#1D4ED8" font-family="Arial" font-size="10" font-weight="bold">PENDING LOANS</text>
        <text x="245" y="220" fill="#1E3A8A" font-family="Arial" font-size="24" font-weight="black">${pendingLoans}</text>
        
        <rect x="390" y="160" width="140" height="80" rx="20" fill="#FFFBEB"/>
        <text x="405" y="185" fill="#B45309" font-family="Arial" font-size="10" font-weight="bold">DISBURSED (K)</text>
        <text x="405" y="220" fill="#78350F" font-family="Arial" font-size="20" font-weight="black">${(totalDisbursed || 0).toLocaleString()}</text>
        
        <path d="M70 300 L530 300" stroke="#F0F0F0" stroke-width="2"/>
        <text x="70" y="335" fill="#999" font-family="Arial" font-size="12">© 2026 {config.appName} Banking System - Secure & Regulated</text>
      </svg>
    `;
    
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moneylink_report_${new Date().getTime()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('MONEYLINK ADMIN System Report', 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    const tableData = users.map(u => [u.name, u.phone, u.nrc, `K ${u.balance || 0}`]);
    (doc as any).autoTable({
      head: [['Name', 'Phone', 'NRC', 'Balance']],
      body: tableData,
      startY: 40,
    });

    doc.save(`moneylink_report_${new Date().getTime()}.pdf`);
  };

  const [isConnectionActive, setIsConnectionActive] = useState(true);

  const loadData = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      // Fetch from backend - Main Admin sees everything
      // const adminIdParam = currentAdminId === 'main-admin' ? '' : (currentAdminId ? `?adminId=${currentAdminId}` : '');
      const adminIdParam = ''; // Give full access to all admins
      
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

      const [
        backendUsers, backendAgents, backendMeetings, backendStreaming, 
        allRequests, backendConfig, backendTransactions, backendLoanRequests,
        backendChatMessages, backendAdminNotifications, backendRecurringPayments,
        backendAgentRequests, backendTasks, backendRepaymentRequests,
        backendDeletedItems
      ] = await Promise.all([
        fetchWithFallback(`/api/users${adminIdParam}`),
        fetchWithFallback(`/api/agents${adminIdParam}`),
        fetchWithFallback('/api/meetings'),
        fetchWithFallback('/api/streaming-apps?category=admin'),
        fetchWithFallback('/api/app-requests'),
        fetchWithFallback('/api/system-config', {}),
        fetchWithFallback('/api/transactions'),
        fetchWithFallback(`/api/loan-requests${adminIdParam}`),
        fetchWithFallback(`/api/chat-messages${adminIdParam}`),
        fetchWithFallback('/api/admin-notifications'),
        fetchWithFallback('/api/recurring-payments'),
        fetchWithFallback('/api/agent-requests'),
        fetchWithFallback('/api/tasks'),
        fetchWithFallback(`/api/repayment-requests${adminIdParam}`),
        fetchWithFallback('/api/deleted-items')
      ]);
      
      setUsers(backendUsers);
      setAgents(backendAgents);
      setMeetings(backendMeetings);
      setStreamingApps(backendStreaming);
      setMyAppRequests(currentAdminId === 'main-admin' ? allRequests : allRequests.filter((r: any) => r.adminId === currentAdminId));
      setTransactions(backendTransactions);
      setLoanRequests(backendLoanRequests);
      setRepaymentRequests(backendRepaymentRequests);
      setTasks(backendTasks || []);
      setAdminNotifications(backendAdminNotifications);
      setRecurringPayments(backendRecurringPayments);
      setAgentRequests(backendAgentRequests);
      setDeletedItems(backendDeletedItems || []);
      
      if (backendConfig && Object.keys(backendConfig).length > 0) {
        setConfig(prev => ({ ...prev, ...backendConfig }));
      }

      const storedConfig = JSON.parse(localStorage.getItem('moneylink_config') || '{}');
      if (Object.keys(storedConfig).length > 0) setConfig(storedConfig);
      
      setIsConnectionActive(true);
      setTimeout(() => setIsConnectionActive(false), 1000); // Visual pulse
    } catch (error) {
      console.error('Failed to load data from backend:', error);
    }
  }, [isLoggedIn, currentAdminId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isPartner = params.get('mode') === 'dmi';
    
    const directLogin = localStorage.getItem('moneylink_admin_direct_login');
    if (directLogin === 'true') {
      setIsLoggedIn(true);
      localStorage.removeItem('moneylink_admin_direct_login'); // Use once
    }
    
    const storedConfig = JSON.parse(localStorage.getItem('moneylink_config') || '{}');
    const defaultConfig = {
      appName: isPartner ? 'DERICK MUSIYALIKE INSTITUTION (DMI)' : 'MONEYLINK ADMIN',
      appLogo: logo,
      maintenanceMode: false,
      twoFactorEnabled: true,
      biometricEnabled: true
    };
    
    if (isPartner) {
      setConfig(defaultConfig);
    } else if (storedConfig.appName) {
      setConfig((prev: any) => ({ ...prev, ...storedConfig }));
    }
    
    if (isLoggedIn) {
      loadData();
      const interval = setInterval(loadData, 3000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, currentAdminId]);

  const handleLogin = async () => {
    // 1. Check Hardcoded Main Admin
    if (adminUser === '709580' && password === '709580') {
      setIsLoggedIn(true);
      setCurrentAdminId('main-admin');
      setCurrentAdmin({
        id: 'main-admin',
        username: '709580',
        companyName: 'DERICK MUSIYALIKE INSTITUTION (DMI)',
        isMainAdmin: true,
        isApproved: true,
        createdAt: new Date().toISOString(),
        status: 'active'
      });
      setError('');
      return;
    }

    // 2. Check Created Admins (from API or LocalStorage)
    try {
      let adminsList: Admin[] = [];
      
      // Try API first
      try {
        const res = await fetch('/api/admins');
        if (res.ok) {
          adminsList = await res.json();
        }
      } catch (e) {
        console.warn('Failed to fetch admins from API, checking local storage');
      }

      // Fallback to local storage
      if (adminsList.length === 0) {
        const storedAdmins = localStorage.getItem('moneylink_admins');
        if (storedAdmins) {
          adminsList = JSON.parse(storedAdmins);
        }
      }

      const matchedAdmin = adminsList.find(a => a.username === adminUser && a.password === password);
      
      if (matchedAdmin) {
        setIsLoggedIn(true);
        setCurrentAdminId(matchedAdmin.id);
        setCurrentAdmin({ ...matchedAdmin, isApproved: true, isMainAdmin: true }); // Grant full access
        setError('');
        return;
      }
    } catch (e) {
      console.error('Admin login check failed:', e);
    }
    
    setError('Invalid Admin Credentials. Only authorized admins can access this panel.');
  };

  const submitAppRequest = async () => {
    if (!requestedAppName.trim() || !desiredUsername.trim() || !desiredPassword.trim()) {
      toast.error('Please fill in all fields (App Name, Username, Password)');
      return;
    }
    
    const newRequest: AppRequest = {
      id: Date.now().toString(),
      adminId: currentAdminId || 'unknown',
      requestedName: requestedAppName,
      appIcon: appIcon || undefined, // Add icon
      status: 'pending',
      createdBy: adminUser,
      createdAt: new Date().toISOString(),
      desiredUsername: desiredUsername,
      desiredPassword: desiredPassword
    };
    
    await fetch('/api/app-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRequest)
    });
    
    setMyAppRequests(prev => [newRequest, ...prev]);
    setRequestedAppName('');
    setAppIcon(null); // Reset
    setDesiredUsername('');
    setDesiredPassword('');
    toast.success('App Name Request submitted to Developer for approval!');
  };

  const recruitAgent = () => setShowRecruitAgentModal(true);

  const addUser = () => setShowCreateUserModal(true);

  const saveConfig = () => {
    localStorage.setItem('moneylink_config', JSON.stringify(config));
    toast.success('System Configuration Updated!');
  };

  const deleteRecurring = async (id: string) => {
    try {
      await fetch(`/api/recurring-payments/${id}`, { method: 'DELETE' });
      setRecurringPayments(prev => prev.filter(p => p.id !== id));
      toast.success('Recurring payment cancelled');
    } catch (error) {
      console.error('Failed to delete recurring payment via API', error);
      const updated = recurringPayments.filter(p => p.id !== id);
      setRecurringPayments(updated);
      localStorage.setItem('moneylink_recurring_payments', JSON.stringify(updated));
      toast.error('Failed to cancel recurring payment');
    }
  };

  const markNotificationsAsRead = async (type?: string) => {
    try {
      const updated = adminNotifications.map(n => {
        if (!type || n.type === type || n.userId) return { ...n, isRead: true };
        return n;
      });
      
      // Update each notification via API
      await Promise.all(updated.filter(n => n.isRead).map(n => 
        fetch(`/api/admin-notifications/${n.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(n)
        })
      ));
      
      setAdminNotifications(updated);
    } catch (error) {
      console.error('Failed to mark notifications as read via API', error);
      const updated = adminNotifications.map(n => {
        if (!type || n.type === type || n.userId) return { ...n, isRead: true };
        return n;
      });
      setAdminNotifications(updated);
      localStorage.setItem('moneylink_admin_notifications', JSON.stringify(updated));
    }
  };

  const downloadAllUsersPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text('MONEYLINK ADMIN Master User Database', 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Total Users: ${users.length}`, 14, 35);
    
    doc.line(14, 40, 196, 40);

    const tableData = users.map(u => [
      u.name, 
      `+260 ${u.phone}`, 
      u.nrc, 
      `K ${u.balance || 0}`,
      u.isVerified ? 'VERIFIED' : 'PENDING',
      u.isFrozen ? 'FROZEN' : 'ACTIVE'
    ]);

    (doc as any).autoTable({
      head: [['Name', 'Phone', 'NRC', 'Balance', 'Status', 'Account']],
      body: tableData,
      startY: 45,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [21, 128, 61] }
    });

    // Add detailed pages for each user
    users.forEach((user, index) => {
      doc.addPage();
      doc.setFontSize(18);
      doc.text(`User Profile: ${user.name}`, 14, 22);
      doc.line(14, 25, 196, 25);
      
      doc.setFontSize(10);
      let y = 35;
      doc.text(`System ID: ${user.id}`, 14, y); y += 7;
      doc.text(`Full Name: ${user.name}`, 14, y); y += 7;
      doc.text(`Phone Number: +260 ${user.phone}`, 14, y); y += 7;
      doc.text(`NRC Number: ${user.nrc}`, 14, y); y += 7;
      doc.text(`Current Balance: K ${user.balance || 0}`, 14, y); y += 7;
      doc.text(`Verification Status: ${user.isVerified ? 'VERIFIED' : 'PENDING'}`, 14, y); y += 7;
      doc.text(`Account Status: ${user.isFrozen ? 'FROZEN' : 'ACTIVE'}`, 14, y); y += 15;
      
      doc.setFontSize(14);
      doc.text('Identity Documents', 14, y); y += 10;
      
      const imgWidth = 80;
      const imgHeight = 50;
      let imgY = y;
      
      // Row 1: NRC Front & Back
      if (user.nrcFront) {
        doc.setFontSize(10);
        doc.text('NRC Front View:', 14, imgY);
        try {
          doc.addImage(user.nrcFront, 'JPEG', 14, imgY + 5, imgWidth, imgHeight);
        } catch (e) {
          doc.setTextColor(255, 0, 0);
          doc.text('Image Load Error', 14, imgY + 20);
          doc.setTextColor(0, 0, 0);
        }
      } else {
        doc.text('NRC Front: Not Uploaded', 14, imgY);
      }

      if (user.nrcBack) {
        doc.text('NRC Back View:', 110, imgY);
        try {
          doc.addImage(user.nrcBack, 'JPEG', 110, imgY + 5, imgWidth, imgHeight);
        } catch (e) {
          doc.setTextColor(255, 0, 0);
          doc.text('Image Load Error', 110, imgY + 20);
          doc.setTextColor(0, 0, 0);
        }
      } else {
        doc.text('NRC Back: Not Uploaded', 110, imgY);
      }

      imgY += 70; // Move to next row

      // Row 2: Selfie & Passport
      if (user.selfiePhoto) {
        doc.text('Selfie Verification:', 14, imgY);
        try {
          doc.addImage(user.selfiePhoto, 'JPEG', 14, imgY + 5, imgWidth, imgHeight);
        } catch (e) {
          doc.setTextColor(255, 0, 0);
          doc.text('Image Load Error', 14, imgY + 20);
          doc.setTextColor(0, 0, 0);
        }
      } else {
        doc.text('Selfie: Not Uploaded', 14, imgY);
      }

      if (user.passportPhoto) {
        doc.text('Passport Photo:', 110, imgY);
        try {
          doc.addImage(user.passportPhoto, 'JPEG', 110, imgY + 5, imgWidth, imgHeight);
        } catch (e) {
          doc.setTextColor(255, 0, 0);
          doc.text('Image Load Error', 110, imgY + 20);
          doc.setTextColor(0, 0, 0);
        }
      } else {
        doc.text('Passport Photo: Not Uploaded', 110, imgY);
      }
    });

    doc.save(`moneylink_master_database_${new Date().getTime()}.pdf`);
    toast.success('Master User Database PDF generated successfully! All images included.');
  };

  useEffect(() => {
    const storedFiles = JSON.parse(localStorage.getItem('moneylink_admin_files') || '[]');
    setFiles(storedFiles);
    const storedFolders = JSON.parse(localStorage.getItem('moneylink_admin_folders') || '[]');
    setFolders(storedFolders);
  }, []);

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
      localStorage.setItem('moneylink_admin_files', JSON.stringify(updatedFiles));
    };
    reader.readAsDataURL(file);
  };

  const deleteFile = (id: string) => {
    const updatedFiles = files.filter(f => f.id !== id);
    setFiles(updatedFiles);
    localStorage.setItem('moneylink_admin_files', JSON.stringify(updatedFiles));
  };

  const downloadFile = (file: any) => {
    const a = document.createElement('a');
    a.href = file.content;
    a.download = file.name;
    a.click();
  };

  const downloadDossier = (user: User) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text('MONEYLINK ADMIN User Dossier', 14, 22);
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    
    doc.line(14, 35, 196, 35);
    
    doc.setFontSize(14);
    doc.text('Personal Information', 14, 45);
    doc.setFontSize(10);
    doc.text(`Name: ${user.name}`, 14, 55);
    doc.text(`Phone: +260 ${user.phone}`, 14, 62);
    doc.text(`NRC Number: ${user.nrc}`, 14, 69);
    doc.text(`Current Balance: K ${user.balance || 0}`, 14, 76);
    doc.text(`Verification Status: ${user.isVerified ? 'VERIFIED' : 'PENDING'}`, 14, 83);
    
    doc.text('System ID: ' + user.id, 14, 95);
    
    doc.setFontSize(14);
    doc.text('Identity Documents', 14, 110);
    
    const imgWidth = 80;
    const imgHeight = 50;
    let imgY = 120;
    
    // Row 1: NRC Front & Back
    if (user.nrcFront) {
      doc.setFontSize(10);
      doc.text('NRC Front View:', 14, imgY);
      try {
        doc.addImage(user.nrcFront, 'JPEG', 14, imgY + 5, imgWidth, imgHeight);
      } catch (e) {
        doc.setTextColor(255, 0, 0);
        doc.text('Image Load Error', 14, imgY + 20);
        doc.setTextColor(0, 0, 0);
      }
    } else {
      doc.text('NRC Front: Not Uploaded', 14, imgY);
    }

    if (user.nrcBack) {
      doc.text('NRC Back View:', 110, imgY);
      try {
        doc.addImage(user.nrcBack, 'JPEG', 110, imgY + 5, imgWidth, imgHeight);
      } catch (e) {
        doc.setTextColor(255, 0, 0);
        doc.text('Image Load Error', 110, imgY + 20);
        doc.setTextColor(0, 0, 0);
      }
    } else {
      doc.text('NRC Back: Not Uploaded', 110, imgY);
    }

    imgY += 70; // Move to next row

    // Row 2: Selfie & Passport
    if (user.selfiePhoto) {
      doc.text('Selfie Verification:', 14, imgY);
      try {
        doc.addImage(user.selfiePhoto, 'JPEG', 14, imgY + 5, imgWidth, imgHeight);
      } catch (e) {
        doc.setTextColor(255, 0, 0);
        doc.text('Image Load Error', 14, imgY + 20);
        doc.setTextColor(0, 0, 0);
      }
    } else {
      doc.text('Selfie: Not Uploaded', 14, imgY);
    }

    if (user.passportPhoto) {
      doc.text('Passport Photo:', 110, imgY);
      try {
        doc.addImage(user.passportPhoto, 'JPEG', 110, imgY + 5, imgWidth, imgHeight);
      } catch (e) {
        doc.setTextColor(255, 0, 0);
        doc.text('Image Load Error', 110, imgY + 20);
        doc.setTextColor(0, 0, 0);
      }
    } else {
      doc.text('Passport Photo: Not Uploaded', 110, imgY);
    }
    
    doc.setFontSize(8);
    doc.text(`${config.appName} Banking System - Confidential Document`, 14, 280);
    
    doc.save(`${config.appName.toLowerCase().replace(/\s+/g, '_')}_dossier_${user.name.replace(/\s+/g, '_')}.pdf`);
  };

  const downloadLoanApproval = (request: LoanRequest) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text('Loan Approval Certificate', 14, 22);
    doc.setFontSize(12);
    doc.text(`Date: ${new Date().toLocaleString()}`, 14, 30);
    
    doc.line(14, 35, 196, 35);
    
    doc.setFontSize(14);
    doc.text('Loan Details', 14, 45);
    doc.setFontSize(10);
    doc.text(`Borrower: ${request.userName}`, 14, 55);
    doc.text(`Loan Type: ${request.type}`, 14, 62);
    doc.text(`Amount Approved: K ${request.amount}`, 14, 69);
    doc.text(`Request ID: ${request.id}`, 14, 76);
    doc.text(`Status: APPROVED`, 14, 83);
    
    doc.rect(14, 95, 182, 40);
    doc.text('Terms and Conditions:', 18, 105);
    doc.text('1. This loan is subject to the agreed interest rates.', 18, 112);
    doc.text('2. Repayment must be made within the specified period.', 18, 119);
    doc.text('3. Late payments may incur additional charges.', 18, 126);
    
    doc.text('Authorized Signature: _______________________', 14, 160);
    doc.text(`${config.appName} Administration`, 14, 167);
    
    doc.save(`${config.appName.toLowerCase().replace(/\s+/g, '_')}_loan_approval_${request.id}.pdf`);
  };

  const handleAssignTask = async () => {
    if (!selectedAgentForTask || !newTask.title) return;

    const taskData = {
      title: newTask.title,
      description: newTask.description,
      priority: newTask.priority,
      status: 'pending',
      assignedTo: selectedAgentForTask.id,
      createdAt: new Date().toISOString()
    };

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });

      if (res.ok) {
        toast.success(`Task assigned to ${selectedAgentForTask.name}`);
        setShowAssignTaskModal(false);
        setNewTask({ title: '', description: '', priority: 'medium' });
        setSelectedAgentForTask(null);
      }
    } catch (error) {
      console.error('Failed to assign task:', error);
      toast.error('Failed to assign task. Please try again.');
    }
  };

  const handleApprove = async (requestId: string) => {
    const request = loanRequests.find(r => r.id === requestId);
    if (!request) return;

    if (currentAdminId === 'main-admin') {
      // Direct approval logic for main admin
      try {
        // Generate Repayment Schedule
        const interestRate = request.interestRate || 25;
        const totalAmount = request.amount * (1 + interestRate / 100);
        const isWeekly = request.tenure === '1 week' || request.type === 'Weekly';
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

        const updatedRequest = { 
          ...request, 
          status: 'approved' as const,
          repaymentSchedule: schedule
        };
        await fetch(`/api/loan-requests/${requestId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedRequest)
        });
        
        const updatedRequests = loanRequests.map(req => 
          req.id === requestId ? updatedRequest : req
        );
        setLoanRequests(updatedRequests);

        // Update User Balance via API
        const userToUpdate = users.find(u => u.id === request.userId);
        if (userToUpdate) {
          const updatedUser = { ...userToUpdate, balance: (userToUpdate.balance || 0) + request.amount };
          await fetch(`/api/users/${request.userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedUser)
          });
          
          setUsers(users.map(u => u.id === request.userId ? updatedUser : u));
        }

        // Add Notification via API
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: request.userId,
            title: 'Loan Approved',
            message: `Your loan of K ${request.amount} has been approved and added to your balance.`,
            isRead: false,
            type: 'loan'
          })
        });

        // Send Notification to User
        if (userToUpdate) {
          const userNotifications = JSON.parse(localStorage.getItem('moneylink_notifications') || '[]');
          userNotifications.push({
            id: Math.random().toString(36).substr(2, 9),
            userId: request.userId,
            title: 'Loan Approved',
            message: `Your loan of K ${request.amount} has been approved and added to your balance.`,
            date: new Date().toLocaleString(),
            isRead: false,
            type: 'loan'
          });
          localStorage.setItem('moneylink_notifications', JSON.stringify(userNotifications));
        }
        
        downloadLoanApproval(request);
        toast.success(`Loan of K ${request.amount} approved for ${request.userName} (Main Admin Override).`);
      } catch (error) {
        console.error('Failed to approve loan via API', error);
        toast.error('Failed to approve loan. Please try again.');
      }
      return;
    }

    try {
      // Generate Repayment Schedule
      const interestRate = request.interestRate || 25;
      const totalAmount = request.amount * (1 + interestRate / 100);
      const isWeekly = request.tenure === '1 week' || request.type === 'Weekly';
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

      // Update Request Status via API
      const updatedRequest = { 
        ...request, 
        status: 'approved' as const,
        repaymentSchedule: schedule
      };
      await fetch(`/api/loan-requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRequest)
      });

      const updatedRequests = loanRequests.map(req => 
        req.id === requestId ? updatedRequest : req
      );
      setLoanRequests(updatedRequests);

      // Update User Balance in local state (server handles the actual DB update)
      const userToUpdate = users.find(u => u.id === request.userId);
      if (userToUpdate) {
        const updatedUser = { ...userToUpdate, balance: (userToUpdate.balance || 0) + request.amount };
        
        setUsers(users.map(u => u.id === request.userId ? updatedUser : u));
        
        // Update current user if they are the one logged in
        const localCurrentUser = getUserFromLocalStorage();
        if (localCurrentUser && localCurrentUser.id === request.userId) {
          saveUserToLocalStorage(updatedUser);
        }

        // Add transaction to state
        const newTransaction: Transaction = {
          id: Date.now().toString(),
          userId: request.userId,
          type: 'loan',
          title: 'Loan Approved',
          amount: request.amount,
          date: new Date().toISOString(),
          status: 'completed'
        };
        setTransactions([newTransaction, ...transactions]);
      }
      
      // Trigger PDF Download
      downloadLoanApproval(request);
      sendPushNotification('Loan Approved', { body: `Loan of K ${request.amount} approved for ${request.userName}.` });
      
      toast.success(`Loan of K ${request.amount} approved for ${request.userName}. Approval PDF downloaded.`);
    } catch (error) {
      console.error('Failed to approve loan via API, falling back to local storage', error);
      // Fallback to local storage
      const updatedRequests = loanRequests.map(req => 
        req.id === requestId ? { ...req, status: 'approved' as const } : req
      );
      setLoanRequests(updatedRequests);
      localStorage.setItem('moneylink_loan_requests', JSON.stringify(updatedRequests));

      // Update User Balance
      const storedUsers: User[] = JSON.parse(localStorage.getItem('moneylink_users') || '[]');
      const updatedUsers = storedUsers.map(u => {
        if (u.id === request.userId) {
          return { ...u, balance: (u.balance || 0) + request.amount };
        }
        return u;
      });
      setUsers(updatedUsers);
      localStorage.setItem('moneylink_users', JSON.stringify(updatedUsers));

      // Update current user if they are the one logged in
      const localCurrentUser = getUserFromLocalStorage();
      if (localCurrentUser && localCurrentUser.id === request.userId) {
        const updatedCurrentUser = { ...localCurrentUser, balance: (localCurrentUser.balance || 0) + request.amount };
        saveUserToLocalStorage(updatedCurrentUser);
      }

      // Send Notification
      const notifications = JSON.parse(localStorage.getItem('moneylink_notifications') || '[]');
      notifications.push({
        id: Math.random().toString(36).substr(2, 9),
        userId: request.userId,
        title: 'Loan Approved',
        message: `Your loan of K ${request.amount} has been approved and added to your balance.`,
        date: new Date().toLocaleString(),
        isRead: false,
        type: 'loan'
      });
      localStorage.setItem('moneylink_notifications', JSON.stringify(notifications));
      
      // Trigger PDF Download
      downloadLoanApproval(request);
      sendPushNotification('Loan Approved', { body: `Loan of K ${request.amount} approved for ${request.userName}.` });
      
      toast.success(`Loan of K ${request.amount} approved for ${request.userName}. Approval PDF downloaded.`);
    }
  };

  const handleReject = async (requestId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason === null) return; // Cancelled

    if (currentAdminId === 'main-admin') {
      const request = loanRequests.find(r => r.id === requestId);
      if (!request) return;
      
      const updatedRequest = { ...request, status: 'rejected' as const, rejectionReason: reason };
      const updatedRequests = loanRequests.map(req => 
        req.id === requestId ? updatedRequest : req
      );
      setLoanRequests(updatedRequests);
      
      // Add Notification via API
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: request.userId,
          title: 'Loan Rejected',
          message: `Your loan request for K ${request.amount} has been rejected. Reason: ${reason}`,
          isRead: false,
          type: 'loan'
        })
      });

      toast.success(`Loan request ${requestId} has been rejected (Main Admin Override).`);
      return;
    }

    try {
      const request = loanRequests.find(r => r.id === requestId);
      if (!request) return;
      
      const updatedRequest = { ...request, status: 'rejected' as const, rejectionReason: reason };
      await fetch(`/api/loan-requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRequest)
      });
      
      const updatedRequests = loanRequests.map(req => 
        req.id === requestId ? updatedRequest : req
      );
      setLoanRequests(updatedRequests);

      // Send Notification to User
      const userNotifications = JSON.parse(localStorage.getItem('moneylink_notifications') || '[]');
      userNotifications.push({
        id: Math.random().toString(36).substr(2, 9),
        userId: request.userId,
        title: 'Loan Rejected',
        message: `Your loan request for K ${request.amount} has been rejected. Reason: ${reason}`,
        date: new Date().toLocaleString(),
        isRead: false,
        type: 'loan'
      });
      localStorage.setItem('moneylink_notifications', JSON.stringify(userNotifications));

      sendPushNotification('Loan Rejected', { body: `Loan request ${requestId} has been rejected.` });
    } catch (error) {
      console.error('Failed to reject loan via API, falling back to local storage', error);
      const updatedRequests = loanRequests.map(req => 
        req.id === requestId ? { ...req, status: 'rejected' as const } : req
      );
      setLoanRequests(updatedRequests);
      localStorage.setItem('moneylink_loan_requests', JSON.stringify(updatedRequests));
    }
  };

  const handleApproveRepayment = async (requestId: string) => {
    const request = repaymentRequests.find(r => r.id === requestId);
    if (!request) return;

    try {
      const updatedRequest = { ...request, status: 'approved' as const };
      await fetch(`/api/repayment-requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRequest)
      });
      
      const updatedRequests = repaymentRequests.map(req => 
        req.id === requestId ? updatedRequest : req
      );
      setRepaymentRequests(updatedRequests);

      // Update User Balance in local state (server handles the actual DB update)
      const userToUpdate = users.find(u => u.id === request.userId);
      if (userToUpdate) {
        const updatedUser = { ...userToUpdate, balance: (userToUpdate.balance || 0) - request.amount };
        
        setUsers(users.map(u => u.id === request.userId ? updatedUser : u));
        
        // Update current user if they are the one logged in
        const localCurrentUser = getUserFromLocalStorage();
        if (localCurrentUser && localCurrentUser.id === request.userId) {
          saveUserToLocalStorage(updatedUser);
        }

        // Add transaction to state
        const newTransaction: Transaction = {
          id: Date.now().toString(),
          userId: request.userId,
          type: 'payment',
          title: 'Loan Repayment Approved',
          amount: -request.amount,
          date: new Date().toISOString(),
          status: 'completed'
        };
        setTransactions([newTransaction, ...transactions]);
      }

      toast.success('Repayment approved successfully!');
    } catch (error) {
      console.error('Failed to approve repayment via API, falling back to local storage', error);
      
      const updatedRequest = { ...request, status: 'approved' as const };
      const updatedRequests = repaymentRequests.map(req => 
        req.id === requestId ? updatedRequest : req
      );
      setRepaymentRequests(updatedRequests);
      localStorage.setItem('moneylink_repayment_requests', JSON.stringify(updatedRequests));

      // Update user balance
      const storedUsers: User[] = JSON.parse(localStorage.getItem('moneylink_users') || '[]');
      const updatedUsers = storedUsers.map(u => {
        if (u.id === request.userId) {
          return { ...u, balance: (u.balance || 0) - request.amount };
        }
        return u;
      });
      setUsers(updatedUsers);
      localStorage.setItem('moneylink_users', JSON.stringify(updatedUsers));

      // Update current user if they are the one logged in
      const localCurrentUser = getUserFromLocalStorage();
      if (localCurrentUser && localCurrentUser.id === request.userId) {
        const updatedCurrentUser = { ...localCurrentUser, balance: (localCurrentUser.balance || 0) - request.amount };
        saveUserToLocalStorage(updatedCurrentUser);
      }

      // Add transaction
      const newTransaction: Transaction = {
        id: Math.random().toString(36).substr(2, 9),
        userId: request.userId,
        type: 'payment',
        title: 'Loan Repayment Approved',
        amount: -request.amount,
        date: new Date().toISOString(),
        status: 'completed'
      };
      const storedTransactions = JSON.parse(localStorage.getItem('moneylink_transactions') || '[]');
      localStorage.setItem('moneylink_transactions', JSON.stringify([newTransaction, ...storedTransactions]));

      toast.success('Repayment approved successfully (offline mode)!');
    }
  };

  const handleRejectRepayment = async (requestId: string) => {
    const request = repaymentRequests.find(r => r.id === requestId);
    if (!request) return;

    try {
      const updatedRequest = { ...request, status: 'rejected' as const };
      await fetch(`/api/repayment-requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRequest)
      });
      
      const updatedRequests = repaymentRequests.map(req => 
        req.id === requestId ? updatedRequest : req
      );
      setRepaymentRequests(updatedRequests);
      toast.success('Repayment rejected successfully!');
    } catch (error) {
      console.error('Failed to reject repayment via API, falling back to local storage', error);
      
      const updatedRequest = { ...request, status: 'rejected' as const };
      const updatedRequests = repaymentRequests.map(req => 
        req.id === requestId ? updatedRequest : req
      );
      setRepaymentRequests(updatedRequests);
      localStorage.setItem('moneylink_repayment_requests', JSON.stringify(updatedRequests));
      
      toast.success('Repayment rejected successfully (offline mode)!');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentAdminId) {
      toast.error('You cannot delete your own admin profile.');
      return;
    }
    try {
      await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      const updatedUsers = users.filter(u => u.id !== userId);
      setUsers(updatedUsers);
      localStorage.setItem('moneylink_users', JSON.stringify(updatedUsers));
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleApproveTransaction = async (tx: Transaction) => {
    try {
      // Find user
      const user = users.find(u => u.id === tx.userId);
      if (!user) {
        toast.error('User not found.');
        return;
      }

      // Update transaction
      const updatedTx = { ...tx, status: 'completed' as const };
      await fetch(`/api/transactions/${tx.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTx)
      });

      // Update user balance
      const updatedUser = { ...user, balance: user.balance + tx.amount };
      await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser)
      });

      // Update local state
      setTransactions(transactions.map(t => t.id === tx.id ? updatedTx : t));
      setUsers(users.map(u => u.id === user.id ? updatedUser : u));

      toast.success('Transaction approved and balance updated.');
    } catch (error) {
      console.error('Failed to approve transaction:', error);
      toast.error('Failed to approve transaction.');
    }
  };

  const handleRejectTransaction = async (tx: Transaction) => {
    try {
      const updatedTx = { ...tx, status: 'failed' as const };
      await fetch(`/api/transactions/${tx.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTx)
      });

      setTransactions(transactions.map(t => t.id === tx.id ? updatedTx : t));
      toast.success('Transaction rejected.');
    } catch (error) {
      console.error('Failed to reject transaction:', error);
      toast.error('Failed to reject transaction.');
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      const originalUser = users.find(u => u.id === updatedUser.id);
      
      await fetch(`/api/users/${updatedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser)
      });
      
      const updatedUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
      setUsers(updatedUsers);
      localStorage.setItem('moneylink_users', JSON.stringify(updatedUsers));
      
      // Update current user if they are the one being edited
      const localCurrentUser = getUserFromLocalStorage();
      if (localCurrentUser && localCurrentUser.id === updatedUser.id) {
        saveUserToLocalStorage(updatedUser);
      }
      
      // Check if isVerified or balance changed
      if (originalUser) {
        let messageText = '';
        if (!originalUser.isVerified && updatedUser.isVerified) {
          messageText += 'Your profile has been verified. ';
        }
        if (originalUser.balance !== updatedUser.balance) {
          messageText += `Your balance has been updated to K ${(updatedUser.balance || 0).toLocaleString()}. `;
        }
        
        if (messageText) {
          const msg: ChatMessage = {
            id: Date.now().toString(),
            senderId: 'admin',
            receiverId: updatedUser.id,
            text: messageText.trim(),
            timestamp: new Date().toISOString(),
            isAdmin: true
          };
          
          try {
            await fetch('/api/chats', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(msg)
            });
          } catch (e) {
            const userChats = JSON.parse(localStorage.getItem(`moneylink_chats_${updatedUser.id}`) || '[]');
            localStorage.setItem(`moneylink_chats_${updatedUser.id}`, JSON.stringify([...userChats, msg]));
          }
          
          // Send Notification to User
          const userNotifications = JSON.parse(localStorage.getItem('moneylink_notifications') || '[]');
          userNotifications.push({
            id: Math.random().toString(36).substr(2, 9),
            userId: updatedUser.id,
            title: 'Profile Updated',
            message: messageText.trim(),
            date: new Date().toLocaleString(),
            isRead: false,
            type: 'system'
          });
          localStorage.setItem('moneylink_notifications', JSON.stringify(userNotifications));
        }
      }
      
      setEditingUser(null);
      toast.success('User profile updated successfully!');
    } catch (error) {
      console.error('Failed to update user:', error);
      toast.error('Failed to update user profile.');
    }
  };

  const handleUpdateAgent = async (agent: Agent) => {
    try {
      await fetch(`/api/agents/${agent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agent)
      });
      
      const updatedAgents = agents.map(a => a.id === agent.id ? agent : a);
      setAgents(updatedAgents);
      localStorage.setItem('moneylink_agents', JSON.stringify(updatedAgents));
      setEditingAgent(null);
      toast.success('Agent profile updated successfully.');
    } catch (error) {
      console.error('Failed to update agent:', error);
      toast.error('Failed to update agent profile.');
    }
  };

  const handleRecruitAgent = async (agentData: Partial<Agent>) => {
    try {
      const newAgent: Agent = {
        id: Date.now().toString(),
        adminId: currentAdminId || 'unknown',
        name: agentData.name || 'New Agent',
        phone: agentData.phone || '',
        status: 'active',
        taxId: `TAX_${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        joinedAt: new Date().toISOString(),
        ...agentData
      };

      await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAgent)
      });

      const updatedAgents = [...agents, newAgent];
      setAgents(updatedAgents);
      localStorage.setItem('moneylink_agents', JSON.stringify(updatedAgents));
      
      // Create folder for agent
      const storedFolders = JSON.parse(localStorage.getItem('moneylink_admin_folders') || '[]');
      storedFolders.push({
        id: Math.random().toString(36).substr(2, 9),
        name: `Agent: ${newAgent.name}`,
        parentId: null
      });
      localStorage.setItem('moneylink_admin_folders', JSON.stringify(storedFolders));
      
      setShowRecruitAgentModal(false);
      toast.success('Agent recruited successfully.');
    } catch (error) {
      console.error('Failed to recruit agent:', error);
      toast.error('Failed to recruit agent.');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-[#E5E5E5]"
        >
          <div className="text-center space-y-6">
            <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center mx-auto border-4 border-green-100 shadow-xl overflow-hidden">
              <img 
                src={config.appLogo} 
                alt="App Logo" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = logo;
                }}
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Admin Portal</h2>
              <p className="text-[#666] text-sm mt-2">Enter the admin credentials to access the dashboard.</p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#999]">
                  <Users className="w-5 h-5" />
                </div>
                <input 
                  type="text"
                  value={adminUser}
                  onChange={(e) => setAdminUser(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-[#F8F9FA] border border-[#E5E5E5] rounded-2xl text-lg font-bold focus:outline-none focus:border-green-700 transition-colors"
                  placeholder="Admin Username"
                />
              </div>

              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#999]">
                  <Lock className="w-5 h-5" />
                </div>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-[#F8F9FA] border border-[#E5E5E5] rounded-2xl text-lg font-bold focus:outline-none focus:border-green-700 transition-colors"
                  placeholder="Admin Password"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
            </div>

            <button 
              onClick={handleLogin}
              className="w-full bg-green-700 hover:bg-green-800 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-green-700/20"
            >
              Access Dashboard
              <ArrowRight className="w-5 h-5" />
            </button>
            
            <button 
              onClick={onLogout}
              className="text-sm text-[#999] font-bold hover:text-green-700 transition-colors"
            >
              Back to App
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      {/* Developer Actions Overlay */}
      {isDeveloper && (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
          <button 
            onClick={() => {
              let dataToDownload: any = [];
              let filename = 'data.json';
              switch (activeTab) {
                case 'users': dataToDownload = users; filename = 'users.json'; break;
                case 'agents': dataToDownload = agents; filename = 'agents.json'; break;
                case 'loan-requests': dataToDownload = loanRequests; filename = 'loan-requests.json'; break;
                case 'transactions': dataToDownload = transactions; filename = 'transactions.json'; break;
                case 'meetings': dataToDownload = meetings; filename = 'meetings.json'; break;
                case 'streaming': dataToDownload = streamingApps; filename = 'streaming-apps.json'; break;
                case 'app-requests': dataToDownload = myAppRequests; filename = 'app-requests.json'; break;
                case 'tasks': dataToDownload = tasks; filename = 'tasks.json'; break;
                case 'recurring-payments': dataToDownload = recurringPayments; filename = 'recurring-payments.json'; break;
                case 'agent-requests': dataToDownload = agentRequests; filename = 'agent-requests.json'; break;
                default: dataToDownload = { users, agents, loanRequests, transactions }; filename = 'all-data.json';
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

      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-[#E5E5E5] flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-[#E5E5E5]">
          <div className="flex items-center gap-3">
            {appConfig?.logo ? (
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm overflow-hidden border border-gray-100">
                <img 
                  src={appConfig.logo} 
                  alt="Logo" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://placehold.co/100x100/15803d/ffffff?text=Admin";
                  }}
                />
              </div>
            ) : (
              <div className="w-10 h-10 bg-green-700 text-white rounded-xl flex items-center justify-center shadow-sm">
                <Shield className="w-5 h-5" />
              </div>
            )}
            <div>
              <h1 className="text-sm font-bold leading-tight">
                {currentAdmin?.isMainAdmin ? 'DMI Admin' : currentAdmin?.companyName || 'Admin'}
              </h1>
              <div className="flex items-center gap-1.5 mt-1">
                <div className={`w-1.5 h-1.5 rounded-full ${isConnectionActive ? 'bg-green-500 animate-pulse' : 'bg-green-500'}`}></div>
                <span className="text-[8px] font-bold text-green-700 uppercase tracking-widest">Active</span>
              </div>
            </div>
            {onOpenNotifications && (
              <button 
                onClick={onOpenNotifications}
                className="ml-auto relative p-2 hover:bg-gray-100 rounded-xl transition-all"
              >
                <Bell className="w-4 h-4 text-gray-600" />
                {hasUnreadNotifications && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                )}
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-1 px-3">
          <div className="text-[10px] font-bold text-[#999] uppercase tracking-widest px-4 mt-2 mb-2">Main</div>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-green-700 text-white shadow-lg shadow-green-700/20' : 'text-[#666] hover:bg-gray-50'}`}
          >
            <TrendingUp className="w-4 h-4" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('workplace')}
            className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center gap-3 ${
              activeTab === 'workplace' ? 'bg-green-50 text-green-700' : 'text-[#666] hover:bg-gray-50'
            }`}
          >
            <Shield className="w-4 h-4" />
            Workplace
          </button>

          <div className="text-[10px] font-bold text-[#999] uppercase tracking-widest px-4 mt-6 mb-2">Communication & Loans</div>
          <button
            onClick={() => setActiveTab('chat')}
            className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center gap-3 ${
              activeTab === 'chat' ? 'bg-green-50 text-green-700' : 'text-[#666] hover:bg-gray-50'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Chat
          </button>
          <button
            onClick={() => {
              setActiveTab('requests');
              markNotificationsAsRead('loan');
            }}
            className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center gap-3 relative ${
              activeTab === 'requests' ? 'bg-green-50 text-green-700' : 'text-[#666] hover:bg-gray-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            Requests
            {loanRequests.some(r => r.status === 'pending') && (
              <span className="absolute top-1/2 -translate-y-1/2 right-4 w-2 h-2 bg-amber-500 rounded-full"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('repayment-requests')}
            className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center gap-3 relative ${
              activeTab === 'repayment-requests' ? 'bg-green-50 text-green-700' : 'text-[#666] hover:bg-gray-50'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Repayment Requests
            {repaymentRequests.some(r => r.status === 'pending') && (
              <span className="absolute top-1/2 -translate-y-1/2 right-4 w-2 h-2 bg-amber-500 rounded-full"></span>
            )}
          </button>

          <div className="text-[10px] font-bold text-[#999] uppercase tracking-widest px-4 mt-6 mb-2">Financial</div>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center gap-3 ${
              activeTab === 'transactions' ? 'bg-green-50 text-green-700' : 'text-[#666] hover:bg-gray-50'
            }`}
          >
            <Wallet className="w-4 h-4" />
            Transactions
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center gap-3 ${
              activeTab === 'services' ? 'bg-green-50 text-green-700' : 'text-[#666] hover:bg-gray-50'
            }`}
          >
            <Zap className="w-4 h-4" />
            Services
          </button>

          <div className="text-[10px] font-bold text-[#999] uppercase tracking-widest px-4 mt-6 mb-2">Management</div>
          <button
            onClick={() => setActiveTab('users')}
            className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center gap-3 ${
              activeTab === 'users' ? 'bg-green-50 text-green-700' : 'text-[#666] hover:bg-gray-50'
            }`}
          >
            <Users className="w-4 h-4" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('agents')}
            className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center gap-3 ${
              activeTab === 'agents' ? 'bg-green-50 text-green-700' : 'text-[#666] hover:bg-gray-50'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Agents
          </button>
          <button
            onClick={() => setActiveTab('agent-requests')}
            className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center gap-3 relative ${
              activeTab === 'agent-requests' ? 'bg-green-50 text-green-700' : 'text-[#666] hover:bg-gray-50'
            }`}
          >
            <Users className="w-4 h-4" />
            Agent Requests
            {agentRequests.filter(r => r.status === 'pending').length > 0 && (
              <span className="absolute top-1/2 -translate-y-1/2 right-4 w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('tasks' as any)}
            className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center gap-3 ${
              activeTab === ('tasks' as any) ? 'bg-green-50 text-green-700' : 'text-[#666] hover:bg-gray-50'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Tasks
          </button>

          <div className="text-[10px] font-bold text-[#999] uppercase tracking-widest px-4 mt-6 mb-2">System & Tools</div>
          <button
            onClick={() => setActiveTab('storage')}
            className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center gap-3 ${
              activeTab === 'storage' ? 'bg-green-50 text-green-700' : 'text-[#666] hover:bg-gray-50'
            }`}
          >
            <Database className="w-4 h-4" />
            Storage
          </button>
          <button
            onClick={() => setActiveTab('meetings')}
            className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center gap-3 relative ${
              activeTab === 'meetings' ? 'bg-green-50 text-green-700' : 'text-[#666] hover:bg-gray-50'
            }`}
          >
            <Video className="w-4 h-4" />
            Meetings
            {meetings.some(m => m.status === 'live') && (
              <span className="absolute top-1/2 -translate-y-1/2 right-4 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('streaming')}
            className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center gap-3 ${
              activeTab === 'streaming' ? 'bg-green-50 text-green-700' : 'text-[#666] hover:bg-gray-50'
            }`}
          >
            <Play className="w-4 h-4" />
            Streaming
          </button>
          <button
            onClick={() => setActiveTab('servers')}
            className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center gap-3 ${
              activeTab === 'servers' ? 'bg-green-50 text-green-700' : 'text-[#666] hover:bg-gray-50'
            }`}
          >
            <Database className="w-4 h-4" />
            Servers
          </button>
          <button
            onClick={() => setActiveTab('tools')}
            className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center gap-3 ${
              activeTab === 'tools' ? 'bg-green-50 text-green-700' : 'text-[#666] hover:bg-gray-50'
            }`}
          >
            <Zap className="w-4 h-4" />
            Tools
          </button>
          <button
            onClick={() => setActiveTab('app-requests')}
            className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center gap-3 ${
              activeTab === 'app-requests' ? 'bg-green-50 text-green-700' : 'text-[#666] hover:bg-gray-50'
            }`}
          >
            <Globe className="w-4 h-4" />
            App Requests
          </button>
          {isDeveloper && (
            <button
              onClick={() => setActiveTab('deleted-files')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'deleted-files' ? 'bg-green-50 text-green-700' : 'text-[#666] hover:bg-gray-50'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              DELETED_FILES
            </button>
          )}
          <button
            onClick={() => setActiveTab('system')}
            className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center gap-3 ${
              activeTab === 'system' ? 'bg-green-50 text-green-700' : 'text-[#666] hover:bg-gray-50'
            }`}
          >
            <Settings className="w-4 h-4" />
            System
          </button>
        </div>

        <div className="p-4 border-t border-[#E5E5E5] space-y-4">
          <p className="text-[10px] text-center text-[#999] font-bold">Developed By Derick Musiyalike</p>
          <button 
            onClick={() => setIsLoggedIn(false)}
            className="w-full p-3 bg-white border border-[#E5E5E5] text-[#666] rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all flex items-center justify-center gap-2 font-bold text-sm"
          >
            <LogOut className="w-4 h-4" />
            Exit Admin
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold capitalize">{activeTab.replace('-', ' ')}</h2>
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
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-[#E5E5E5] shadow-sm overflow-hidden">
            {activeTab !== 'workplace' && (
              <div className="p-6 border-b border-[#F0F0F0] flex items-center gap-4 relative">
                <Search className="w-5 h-5 text-[#999]" />
                <input 
                  type="text"
                  placeholder="Search..."
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
                className="flex-1 bg-transparent border-none outline-none text-sm font-medium"
              />
              {showRecentSearches && recentSearches.length > 0 && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-[#E5E5E5] rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="px-4 py-2 bg-[#F8F9FA] border-b border-[#E5E5E5] text-[10px] font-bold text-[#999] flex justify-between items-center">
                    RECENT SEARCHES
                    <button 
                      onClick={() => {
                        setRecentSearches([]);
                        localStorage.removeItem('moneylink_recent_searches');
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
              {activeTab === 'users' && (
                <div className="flex gap-2">
                  <button 
                    onClick={addUser}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                  >
                    <Plus className="w-4 h-4" />
                    ADD_USER
                  </button>
                  <button 
                    onClick={downloadAllUsersPdf}
                    className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-xl text-[10px] font-bold hover:bg-green-800 transition-all shadow-lg shadow-green-700/20"
                  >
                    <FileDown className="w-4 h-4" />
                    DOWNLOAD_MASTER_PDF
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="p-6">
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-[#F8F9FA] p-6 rounded-3xl border border-[#E5E5E5] space-y-4">
                    <div className="w-12 h-12 bg-green-50 text-green-700 rounded-2xl flex items-center justify-center">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#999] uppercase tracking-widest">Total Users</p>
                      <h3 className="text-2xl font-black">{users.length}</h3>
                    </div>
                  </div>
                  <div className="bg-[#F8F9FA] p-6 rounded-3xl border border-[#E5E5E5] space-y-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-700 rounded-2xl flex items-center justify-center">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#999] uppercase tracking-widest">Loan Requests</p>
                      <h3 className="text-2xl font-black">{loanRequests.length}</h3>
                    </div>
                  </div>
                  <div className="bg-[#F8F9FA] p-6 rounded-3xl border border-[#E5E5E5] space-y-4">
                    <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center">
                      <Wallet className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#999] uppercase tracking-widest">Total Disbursed</p>
                      <h3 className="text-2xl font-black">K {loanRequests.filter(r => r.status === 'approved').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}</h3>
                    </div>
                  </div>
                  <div className="bg-[#F8F9FA] p-6 rounded-3xl border border-[#E5E5E5] space-y-4">
                    <div className="w-12 h-12 bg-purple-50 text-purple-700 rounded-2xl flex items-center justify-center">
                      <Zap className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#999] uppercase tracking-widest">Active Agents</p>
                      <h3 className="text-2xl font-black">{agents.length}</h3>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-700 to-emerald-800 rounded-[2rem] p-8 text-white relative overflow-hidden">
                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold">System Performance</h3>
                      <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-widest">Today</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                      <div className="space-y-1">
                        <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">New Registrations</p>
                        <p className="text-3xl font-black">{users.filter(u => new Date(u.id).toDateString() === new Date().toDateString()).length}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Loan Approvals</p>
                        <p className="text-3xl font-black">{loanRequests.filter(r => r.status === 'approved' && new Date(r.date).toDateString() === new Date().toDateString()).length}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Total Volume</p>
                        <p className="text-3xl font-black">K {loanRequests.filter(r => r.status === 'approved' && new Date(r.date).toDateString() === new Date().toDateString()).reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">System Health</p>
                        <p className="text-3xl font-black">99.9%</p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-green-400/20 rounded-full -ml-24 -mb-24 blur-2xl"></div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-6 rounded-3xl border border-[#E5E5E5]">
                    <h3 className="text-sm font-bold mb-6 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-700" />
                      USER_GROWTH
                    </h3>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={[
                          { name: 'Jan', users: 400 },
                          { name: 'Feb', users: 600 },
                          { name: 'Mar', users: 800 },
                          { name: 'Apr', users: 1100 },
                          { name: 'May', users: 1400 },
                          { name: 'Jun', users: users.length },
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#999' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#999' }} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Line type="monotone" dataKey="users" stroke="#15803D" strokeWidth={4} dot={{ r: 6, fill: '#15803D', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-[#E5E5E5]">
                    <h3 className="text-sm font-bold mb-6 flex items-center gap-2">
                      <BarChart className="w-4 h-4 text-blue-700" />
                      LOAN_DISTRIBUTION
                    </h3>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: 'Personal', amount: 45000 },
                          { name: 'Business', amount: 85000 },
                          { name: 'Weekly', amount: 25000 },
                          { name: 'Emergency', amount: 15000 },
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#999' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#999' }} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Bar dataKey="amount" fill="#15803D" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white p-6 rounded-3xl border border-[#E5E5E5]">
                  <h3 className="text-sm font-bold mb-4">RECENT_ACTIVITY</h3>
                  <div className="space-y-4">
                    {loanRequests.slice(0, 5).map((req, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-[#F8F9FA] rounded-2xl border border-[#F0F0F0]">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${req.status === 'approved' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold">Loan Request: {req.userName}</p>
                            <p className="text-[10px] text-[#999]">{new Date(req.date).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black">K {req.amount.toLocaleString()}</p>
                          <p className={`text-[10px] font-bold uppercase tracking-widest ${req.status === 'approved' ? 'text-green-600' : 'text-amber-600'}`}>{req.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'agents' ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Agent Management</h2>
                  <button onClick={() => setShowRecruitAgentModal(true)} className="px-4 py-2 bg-green-700 text-white rounded-xl text-[10px] font-bold flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    RECRUIT_AGENT
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {agents.map(agent => (
                    <div key={agent.id} className="p-6 bg-[#F8F9FA] border border-[#E5E5E5] rounded-2xl flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm">{agent.name}</p>
                        <p className="text-[10px] text-[#999]">Phone: {agent.phone}</p>
                        <p className="text-[10px] text-[#999]">Tax ID: {agent.taxId}</p>
                        <p className="text-[10px] text-green-700 font-bold mt-1">STATUS: {agent.status.toUpperCase()}</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            localStorage.setItem('moneylink_agent_direct_login', 'true');
                            localStorage.setItem('moneylink_current_agent_id', agent.id);
                            window.open(`/?mode=agent&id=${agent.id}`, '_blank');
                          }}
                          className="p-2 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-600 hover:text-white transition-all"
                          title="Login as Agent"
                        >
                          <LogOut className="w-4 h-4 rotate-180" />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedAgentForTask(agent);
                            setShowAssignTaskModal(true);
                          }}
                          className="p-2 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white transition-all"
                          title="Assign Task"
                        >
                          <ClipboardList className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setEditingAgent(agent)}
                          className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg"
                          title="Edit Agent"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : activeTab === ('tasks' as any) ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">All Agent Tasks</h2>
                  <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">{tasks.length} Total Tasks</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {tasks.length === 0 ? (
                    <div className="text-center py-20 bg-[#F8F9FA] rounded-[2rem] border border-dashed border-[#E5E5E5]">
                      <ClipboardList className="w-12 h-12 text-[#CCC] mx-auto mb-4" />
                      <p className="text-[#999] font-bold">No tasks have been assigned yet.</p>
                    </div>
                  ) : (
                    tasks.map(task => (
                      <div key={task.id} className="p-6 bg-white border border-[#E5E5E5] rounded-2xl flex items-center justify-between hover:border-blue-500 transition-all">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-bold">{task.title}</h3>
                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-bold uppercase ${
                              task.priority === 'high' ? 'bg-red-50 text-red-600' :
                              task.priority === 'medium' ? 'bg-amber-50 text-amber-600' :
                              'bg-green-50 text-green-600'
                            }`}>
                              {task.priority}
                            </span>
                          </div>
                          <p className="text-xs text-[#666]">{task.description}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <p className="text-[10px] text-[#999] font-bold uppercase">Assigned To: {agents.find(a => a.id === task.assignedTo)?.name || 'Unknown Agent'}</p>
                            <p className="text-[10px] text-[#999] font-bold uppercase">Status: <span className={`ml-1 ${
                              task.status === 'completed' ? 'text-green-600' :
                              task.status === 'in progress' ? 'text-blue-600' :
                              'text-amber-600'
                            }`}>{task.status}</span></p>
                          </div>
                        </div>
                        <button 
                          onClick={async () => {
                            try {
                              await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
                              setTasks(tasks.filter(t => t.id !== task.id));
                              toast.success('Task deleted');
                            } catch (error) {
                              console.error('Failed to delete task:', error);
                              toast.error('Failed to delete task');
                            }
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : activeTab === 'meetings' ? (
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-[#F0F0F0] pb-4">
                  <Video className="w-5 h-5 text-red-600" />
                  <h2 className="text-xl font-bold">Live Meetings</h2>
                </div>
                <div className="space-y-4">
                  {meetings.filter(m => m.status === 'live').map(meeting => (
                    <div key={meeting.id} className="p-6 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm">{meeting.title}</p>
                        <p className="text-[10px] text-[#999]">Host: {meeting.hostId}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                          <span className="text-[10px] font-bold text-red-600 uppercase">LIVE NOW</span>
                        </div>
                        {meeting.socialLinks && meeting.socialLinks.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {meeting.socialLinks.map((link, idx) => (
                              <a 
                                key={idx} 
                                href={link.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="px-2 py-1 bg-white border border-[#E5E5E5] rounded-lg text-[8px] font-bold text-[#666] hover:border-blue-500 hover:text-blue-600 transition-all"
                              >
                                {link.platform.toUpperCase()}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                      <a href={meeting.streamUrl} target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-red-600 text-white rounded-xl text-xs font-bold">JOIN_MEETING</a>
                    </div>
                  ))}
                  {meetings.filter(m => m.status === 'live').length === 0 && (
                    <div className="text-center py-12 text-[#999]">
                      <Video className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p className="text-sm font-medium">No live meetings at the moment.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : activeTab === 'streaming' ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Streaming Apps & Systems</h2>
                  <span className="text-[10px] font-bold text-green-700">{streamingApps.length} APPS AVAILABLE</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {streamingApps.map((app) => (
                    <a 
                      key={app.id} 
                      href={app.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="aspect-video bg-[#F8F9FA] border border-[#E5E5E5] rounded-[2rem] flex flex-col items-center justify-center gap-4 hover:border-green-700 transition-all cursor-pointer group p-6 text-center"
                    >
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <Smartphone className="w-8 h-8 text-green-700" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{app.name}</p>
                        <span className={`text-[10px] font-bold uppercase ${app.status === 'online' ? 'text-green-600' : 'text-red-600'}`}>
                          {app.status}
                        </span>
                      </div>
                    </a>
                  ))}
                  {streamingApps.length === 0 && (
                    <div className="col-span-full text-center py-12 text-[#999]">
                      <Play className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p className="text-sm font-medium">No streaming apps found.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : activeTab === 'agent-requests' ? (
              <div className="space-y-6 p-6">
                <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-4">
                  <h2 className="text-xl font-bold">Agent Requests</h2>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-md">
                    {agentRequests.filter(r => r.status === 'pending').length} PENDING
                  </span>
                </div>
                <div className="space-y-4">
                  {agentRequests.filter(r => r.status === 'pending').map(req => (
                    <div key={req.id} className="p-6 bg-[#F8F9FA] border border-[#E5E5E5] rounded-2xl flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm">{req.name}</p>
                        <p className="text-[10px] text-[#999]">{req.email} | {req.phone}</p>
                        <p className="text-[10px] text-amber-600 font-bold mt-1 uppercase">Status: {req.status}</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={async () => {
                            await fetch(`/api/agent-requests/${req.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ status: 'approved' })
                            });
                            
                            const newAgent: Agent = {
                              id: Date.now().toString(),
                              adminId: currentAdminId || 'unknown',
                              name: req.name,
                              phone: req.phone,
                              status: 'active',
                              taxId: `TAX_${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
                              joinedAt: new Date().toISOString()
                            };
                            
                            await fetch('/api/agents', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(newAgent)
                            });
                            
                            setAgents([...agents, newAgent]);
                            setAgentRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'approved' } : r));
                            toast.success('Agent Approved!');
                          }}
                          className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={async () => {
                            await fetch(`/api/agent-requests/${req.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ status: 'rejected' })
                            });
                            setAgentRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'rejected' } : r));
                          }}
                          className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {agentRequests.filter(r => r.status === 'pending').length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-[#999] text-sm italic">No pending agent requests.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : activeTab === 'live-meeting' ? (
              <div className="h-[600px] relative">
                <LiveMeeting 
                  userId={currentAdminId || 'admin'}
                  userName={currentAdmin?.companyName || 'Admin'}
                  onLeave={() => setActiveTab('requests')}
                />
              </div>
            ) : activeTab === 'transactions' ? (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#F8F9FA] p-4 rounded-2xl border border-[#E5E5E5]">
                  <div className="flex items-center gap-2 text-[#666] font-bold text-sm">
                    <Filter className="w-4 h-4" />
                    Filters
                  </div>
                  <div className="flex flex-wrap gap-4 w-full md:w-auto">
                    <select 
                      value={txFilterType}
                      onChange={(e) => setTxFilterType(e.target.value)}
                      className="flex-1 md:flex-none bg-white border border-[#E5E5E5] rounded-xl px-4 py-2 text-sm font-medium outline-none focus:border-blue-600"
                    >
                      <option value="all">All Types</option>
                      <option value="deposit">Deposit</option>
                      <option value="withdrawal">Withdrawal</option>
                      <option value="payment">Payment</option>
                      <option value="loan">Loan</option>
                      <option value="investment">Investment</option>
                      <option value="bill">Bill</option>
                    </select>

                    <select 
                      value={txDateRange}
                      onChange={(e) => setTxDateRange(e.target.value)}
                      className="flex-1 md:flex-none bg-white border border-[#E5E5E5] rounded-xl px-4 py-2 text-sm font-medium outline-none focus:border-blue-600"
                    >
                      <option value="all">All Time</option>
                      <option value="last7days">Last 7 Days</option>
                      <option value="last30days">Last 30 Days</option>
                      <option value="thisMonth">This Month</option>
                    </select>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-[#F8F9FA] text-[#999] text-[10px] uppercase font-bold tracking-widest">
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">User ID</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4">Description</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F0F0]">
                      {transactions.filter(tx => {
                        if (txFilterType !== 'all' && tx.type !== txFilterType) return false;
                        if (txDateRange !== 'all') {
                          const txDate = new Date(tx.date);
                          const now = new Date();
                          if (txDateRange === 'last7days') {
                            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                            if (txDate < sevenDaysAgo) return false;
                          } else if (txDateRange === 'last30days') {
                            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                            if (txDate < thirtyDaysAgo) return false;
                          } else if (txDateRange === 'thisMonth') {
                            if (txDate.getMonth() !== now.getMonth() || txDate.getFullYear() !== now.getFullYear()) {
                              return false;
                            }
                          }
                        }
                        return true;
                      }).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-[#999] text-xs">No transactions found.</td>
                        </tr>
                      ) : (
                        transactions.filter(tx => {
                          if (txFilterType !== 'all' && tx.type !== txFilterType) return false;
                          if (txDateRange !== 'all') {
                            const txDate = new Date(tx.date);
                            const now = new Date();
                            if (txDateRange === 'last7days') {
                              const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                              if (txDate < sevenDaysAgo) return false;
                            } else if (txDateRange === 'last30days') {
                              const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                              if (txDate < thirtyDaysAgo) return false;
                            } else if (txDateRange === 'thisMonth') {
                              if (txDate.getMonth() !== now.getMonth() || txDate.getFullYear() !== now.getFullYear()) {
                                return false;
                              }
                            }
                          }
                          return true;
                        }).map((tx) => (
                          <tr key={tx.id} className="hover:bg-[#F9F9F9] transition-colors">
                            <td className="px-6 py-4 text-xs text-[#666]">{tx.date}</td>
                            <td className="px-6 py-4 text-xs font-mono text-[#666]">{tx.userId}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                tx.type === 'deposit' ? 'bg-green-50 text-green-700' :
                                tx.type === 'withdrawal' ? 'bg-red-50 text-red-700' :
                                'bg-blue-50 text-blue-700'
                              }`}>
                                {tx.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm font-medium">{tx.title}</td>
                            <td className="px-6 py-4 font-bold text-sm">
                              <span className={tx.amount > 0 ? 'text-green-700' : 'text-red-700'}>
                                {tx.amount > 0 ? '+' : ''}K {Math.abs(tx.amount).toLocaleString()}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-[10px] font-bold uppercase ${
                                tx.status === 'completed' ? 'text-green-700' :
                                tx.status === 'failed' ? 'text-red-700' :
                                'text-amber-700'
                              }`}>
                                {tx.status || 'COMPLETED'}
                              </span>
                              {tx.status === 'pending' && (
                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={() => handleApproveTransaction(tx)}
                                    className="px-2 py-1 bg-green-50 text-green-700 rounded text-[10px] font-bold hover:bg-green-100"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleRejectTransaction(tx)}
                                    className="px-2 py-1 bg-red-50 text-red-700 rounded text-[10px] font-bold hover:bg-red-100"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : activeTab === 'requests' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#F8F9FA] text-[#999] text-[10px] uppercase font-bold tracking-widest">
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Tenure</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F0F0]">
                  {loanRequests.filter(req => req.userName.toLowerCase().includes(searchTerm.toLowerCase())).map((req) => (
                    <tr key={`admin-loan-${req.id}`} className="hover:bg-[#F9F9F9] transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-sm">{req.userName}</p>
                        <p className="text-[10px] text-[#999]">ID: {req.userId}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-[#666]">{req.type}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-blue-600">{req.tenure || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-sm text-green-700">K {(req.amount || 0).toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-[#999]">{req.date}</span>
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
                              onClick={() => handleApprove(req.id)}
                              className="p-2 bg-green-50 text-green-700 rounded-xl hover:bg-green-700 hover:text-white transition-all"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleReject(req.id)}
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
            ) : activeTab === 'repayment-requests' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#F8F9FA] text-[#999] text-[10px] uppercase font-bold tracking-widest">
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Loan ID</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F0F0]">
                  {repaymentRequests.filter(req => req.userName.toLowerCase().includes(searchTerm.toLowerCase())).map((req) => (
                    <tr key={`admin-repayment-${req.id}`} className="hover:bg-[#F9F9F9] transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-sm">{req.userName}</p>
                        <p className="text-[10px] text-[#999]">ID: {req.userId}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-[#666]">{req.loanId}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-sm text-green-700">K {(req.amount || 0).toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-[#999]">{req.date}</span>
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
                              onClick={() => handleApproveRepayment(req.id)}
                              className="p-2 bg-green-50 text-green-700 rounded-xl hover:bg-green-700 hover:text-white transition-all"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleRejectRepayment(req.id)}
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
            ) : activeTab === 'users' ? (
              <div className="overflow-x-auto">
                <div className="p-6 border-b border-[#F0F0F0] flex justify-between items-center">
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="px-4 py-2 bg-[#F8F9FA] border border-[#E5E5E5] rounded-xl text-sm font-bold">
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="frozen">Frozen</option>
                    <option value="verified">Verified</option>
                    <option value="pending">Pending Verification</option>
                  </select>
                  <button onClick={() => setShowCreateUserModal(true)} className="px-4 py-2 bg-green-700 text-white rounded-xl text-sm font-bold flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    CREATE USER
                  </button>
                </div>
                <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#F8F9FA] text-[#999] text-[10px] uppercase font-bold tracking-widest">
                    <th className="px-6 py-4">User Details</th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4">NRC Number</th>
                    <th className="px-6 py-4">Balance</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F0F0]">
                  {users.filter(u => {
                    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                          u.phone.includes(searchTerm);
                    const matchesStatus = statusFilter === 'all' ||
                                          (statusFilter === 'active' && !u.isFrozen) ||
                                          (statusFilter === 'frozen' && u.isFrozen) ||
                                          (statusFilter === 'verified' && u.isVerified) ||
                                          (statusFilter === 'pending' && !u.isVerified);
                    return matchesSearch && matchesStatus;
                  }).map((user) => (
                    <tr key={`admin-user-${user.id}`} className="hover:bg-[#F9F9F9] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold text-xs">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-sm flex items-center gap-2">
                              {user.name}
                              {user.isVerified && (
                                <ShieldCheck className="w-3 h-3 text-green-600" />
                              )}
                              {loanRequests.some(r => r.userId === user.id && r.status === 'approved') && (
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[8px] uppercase tracking-widest">
                                  Has Loan
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-[#666]">{user.phone}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-[#666]">{user.nrc}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-sm text-green-700">K {(user.balance || 0).toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        {user.location ? (
                          <button 
                            onClick={() => setShowMapModal({ lat: user.location!.lat, lng: user.location!.lng })}
                            className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:underline"
                          >
                            <MapPin className="w-3 h-3" />
                            VIEW_MAP
                          </button>
                        ) : (
                          <span className="text-[10px] text-[#999] font-bold">NO_DATA</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {user.nrcFront && <button onClick={() => setShowDocModal({ type: 'NRC Front', url: user.nrcFront! })} className="p-2 bg-gray-100 rounded-xl" title="NRC Front"><ImageIcon className="w-4 h-4" /></button>}
                          {user.selfiePhoto && <button onClick={() => setShowDocModal({ type: 'Selfie', url: user.selfiePhoto! })} className="p-2 bg-gray-100 rounded-xl" title="Selfie"><ImageIcon className="w-4 h-4" /></button>}
                          {user.passportPhoto && <button onClick={() => setShowDocModal({ type: 'Passport', url: user.passportPhoto! })} className="p-2 bg-gray-100 rounded-xl" title="Passport"><ImageIcon className="w-4 h-4" /></button>}
                          <button 
                            onClick={() => setEditingUser(user)}
                            className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                            title="Edit User"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => downloadDossier(user)}
                            className="p-2 bg-green-50 text-green-700 rounded-xl hover:bg-green-700 hover:text-white transition-all"
                            title="Download Dossier"
                          >
                            <FileDown className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedUserForChat(user);
                              setShowChatModal(true);
                            }}
                            className="p-2 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-600 hover:text-white transition-all"
                            title="Chat with User"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={async () => {
                              const updatedUser = { ...user, isVerified: !user.isVerified };
                              const updatedUsers = users.map(u => u.id === user.id ? updatedUser : u);
                              
                              try {
                                await fetch(`/api/users/${user.id}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify(updatedUser)
                                });
                                setUsers(updatedUsers);
                                localStorage.setItem('moneylink_users', JSON.stringify(updatedUsers));
                                toast.success(`User account ${user.isVerified ? 'unverified' : 'verified'} successfully.`);
                              } catch (error) {
                                console.error('Failed to update user verification status:', error);
                                toast.error('Failed to update verification status. Please try again.');
                              }
                            }}
                            className={`p-2 rounded-xl transition-all ${
                              user.isVerified ? 'bg-green-50 text-green-700 hover:bg-green-700 hover:text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'
                            }`}
                            title={user.isVerified ? "Unverify User" : "Verify User"}
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={async () => {
                              const updatedUser = { ...user, isFrozen: !user.isFrozen };
                              const updatedUsers = users.map(u => u.id === user.id ? updatedUser : u);
                              
                              try {
                                await fetch(`/api/users/${user.id}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify(updatedUser)
                                });
                                setUsers(updatedUsers);
                                localStorage.setItem('moneylink_users', JSON.stringify(updatedUsers));
                                toast.success(`User account ${user.isFrozen ? 'unfrozen' : 'frozen'} successfully.`);
                              } catch (error) {
                                console.error('Failed to update user freeze status:', error);
                                toast.error('Failed to update freeze status. Please try again.');
                              }
                            }}
                            className={`p-2 rounded-xl transition-all ${
                              user.isFrozen ? 'bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white' : 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white'
                            }`}
                            title={user.isFrozen ? "Unfreeze Account" : "Freeze Account"}
                          >
                            <Lock className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            ) : activeTab === 'deleted-files' ? (
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">Deleted Files</h3>
                    <p className="text-[#666] text-sm">Manage items that were deleted from the system</p>
                  </div>
                  <div className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold">
                    {deletedItems.length} ITEMS_PENDING
                  </div>
                </div>

                <div className="grid gap-4">
                  {deletedItems.map((item) => (
                    <div key={item.id} className="p-6 bg-white border border-[#E5E5E5] rounded-3xl flex items-center justify-between hover:border-red-200 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold">{item.name || item.title || item.id}</p>
                            <span className="px-2 py-0.5 bg-gray-100 text-[#666] rounded-full text-[8px] font-bold uppercase">
                              {item.originalCollection}
                            </span>
                          </div>
                          <p className="text-xs text-[#999]">Deleted on: {new Date(item.deletedAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRestoreItem(item.id)}
                          className="px-4 py-2 bg-green-50 text-green-600 rounded-xl text-xs font-bold hover:bg-green-600 hover:text-white transition-all flex items-center gap-2"
                        >
                          <RefreshCw className="w-3 h-3" /> RESTORE
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(item.id)}
                          className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-600 hover:text-white transition-all flex items-center gap-2"
                        >
                          <Trash2 className="w-3 h-3" /> PURGE
                        </button>
                      </div>
                    </div>
                  ))}
                  {deletedItems.length === 0 && (
                    <div className="p-12 text-center bg-[#F8F9FA] rounded-[2.5rem] border border-dashed border-[#E5E5E5]">
                      <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <Trash2 className="w-8 h-8 text-[#CCC]" />
                      </div>
                      <h4 className="font-bold text-[#333]">No Deleted Items</h4>
                      <p className="text-[#999] text-sm max-w-xs mx-auto mt-2">
                        Items deleted from the system will appear here for recovery or permanent removal.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : activeTab === 'system' ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] border border-[#E5E5E5] p-8 space-y-8"
              >
                <div className="flex items-center gap-3 border-b border-[#F0F0F0] pb-4">
                  <Shield className="w-5 h-5 text-green-700" />
                  <h2 className="text-xl font-bold">Admin Controls</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-6 bg-amber-50 border border-amber-100 rounded-3xl space-y-4">
                    <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Restricted Access
                    </h3>
                    <p className="text-[10px] text-amber-700 leading-relaxed">
                      System-level configurations (App Name, Logo, AI Core) are restricted to the **Developer Panel**. Administrators can only manage users, loans, and operational status.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-[#999] uppercase tracking-widest ml-1">Maintenance Mode</label>
                    <div className="flex items-center gap-4 p-3 bg-[#F8F9FA] rounded-xl border border-[#E5E5E5]">
                      <button 
                        onClick={() => {
                          const newConfig = { ...config, maintenanceMode: !config.maintenanceMode };
                          setConfig(newConfig);
                          localStorage.setItem('moneylink_config', JSON.stringify(newConfig));
                        }}
                        className={`w-12 h-6 rounded-full transition-all relative ${config.maintenanceMode ? 'bg-red-600' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${config.maintenanceMode ? 'right-1' : 'left-1'}`}></div>
                      </button>
                      <span className="text-xs font-bold">{config.maintenanceMode ? 'ACTIVE' : 'INACTIVE'}</span>
                    </div>
                  </div>
                </div>

                {/* Published App Download Section */}
                {config.downloadUrl && (
                  <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl space-y-4">
                    <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Published Application
                    </h3>
                    <p className="text-[10px] text-blue-700 leading-relaxed">
                      The developer has published a new version of the application. You can download it below.
                    </p>
                    <a 
                      href={config.downloadUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                    >
                      <Download className="w-4 h-4" />
                      DOWNLOAD_PUBLISHED_APP
                    </a>
                  </div>
                )}

                <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl space-y-4">
                  <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Admin Responsibilities
                  </h3>
                  <ul className="text-[10px] text-blue-700 space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3" />
                      Verify user identities via NRC documents.
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3" />
                      Approve or reject loan requests based on creditworthiness.
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3" />
                      Manage user balances and resolve transaction disputes.
                    </li>
                  </ul>
                </div>
              </motion.div>
            ) : activeTab === 'workplace' ? (
              <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-[2rem] border border-[#E5E5E5] shadow-sm">
                    <p className="text-[10px] font-bold text-[#999] uppercase tracking-widest mb-1">Total Disbursed</p>
                    <h3 className="text-3xl font-black text-green-700">K {loanRequests.filter(r => r.status === 'approved').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}</h3>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-green-600">
                      <TrendingUp className="w-3 h-3" />
                      +12.5% from last month
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-[2rem] border border-[#E5E5E5] shadow-sm">
                    <p className="text-[10px] font-bold text-[#999] uppercase tracking-widest mb-1">Active Users</p>
                    <h3 className="text-3xl font-black text-blue-700">{users.length}</h3>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-blue-600">
                      <Users className="w-3 h-3" />
                      {users.filter(u => u.isVerified).length} Verified
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-[2rem] border border-[#E5E5E5] shadow-sm">
                    <p className="text-[10px] font-bold text-[#999] uppercase tracking-widest mb-1">Pending Requests</p>
                    <h3 className="text-3xl font-black text-amber-700">{loanRequests.filter(r => r.status === 'pending').length}</h3>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-amber-600">
                      <Zap className="w-3 h-3" />
                      Requires immediate action
                    </div>
                  </div>
                </div>

                {/* Company Tax Section */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-[#E5E5E5] shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-green-700" />
                      Company Tax & Compliance
                    </h3>
                    <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-bold uppercase">
                      Status: COMPLIANT
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 bg-[#F8F9FA] rounded-2xl border border-[#E5E5E5]">
                      <p className="text-[10px] font-bold text-[#999] uppercase tracking-widest mb-1">Tax ID</p>
                      <p className="font-mono font-bold text-sm">{currentAdmin?.id ? `TAX-${currentAdmin.id.substring(0, 8).toUpperCase()}` : 'PENDING'}</p>
                    </div>
                    <div className="p-4 bg-[#F8F9FA] rounded-2xl border border-[#E5E5E5]">
                      <p className="text-[10px] font-bold text-[#999] uppercase tracking-widest mb-1">Next Filing Due</p>
                      <p className="font-bold text-sm">{new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                    </div>
                    <button 
                      onClick={() => {
                        const confirmFiling = true;
                        if (confirmFiling) {
                          toast.success('Monthly return filed successfully! Compliance certificate generated.');
                        }
                      }}
                      className="p-4 bg-green-700 text-white rounded-2xl font-bold text-xs hover:bg-green-800 transition-all shadow-lg shadow-green-700/20"
                    >
                      FILE_MONTHLY_RETURN
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-[2.5rem] border border-[#E5E5E5] shadow-sm">
                    <h3 className="text-lg font-bold mb-6">Loan Requests by Type</h3>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <BarChart
                          data={[
                            { name: 'Personal', count: loanRequests.filter(r => r.type === 'Personal').length },
                            { name: 'Business', count: loanRequests.filter(r => r.type === 'Business').length },
                            { name: 'Emergency', count: loanRequests.filter(r => r.type === 'Emergency').length },
                            { name: 'Education', count: loanRequests.filter(r => r.type === 'Education').length },
                            { name: 'Salary', count: loanRequests.filter(r => r.type === 'Salary').length },
                          ]}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                            cursor={{ fill: '#F8F9FA' }}
                          />
                          <Bar dataKey="count" fill="#15803D" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-[2.5rem] border border-[#E5E5E5] shadow-sm">
                    <h3 className="text-lg font-bold mb-6">User Verification Status</h3>
                    <div className="h-[300px] w-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Verified', value: users.filter(u => u.isVerified).length },
                              { name: 'Pending', value: users.filter(u => !u.isVerified).length },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            <Cell fill="#15803D" />
                            <Cell fill="#E5E5E5" />
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-[#E5E5E5] shadow-sm">
                  <h3 className="text-lg font-bold mb-6">Recent System Activity</h3>
                  <div className="space-y-4">
                    {adminNotifications.slice(0, 5).map((notif, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-4 hover:bg-[#F8F9FA] rounded-2xl transition-all border border-transparent hover:border-[#F0F0F0]">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          notif.type === 'loan' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-700'
                        }`}>
                          {notif.type === 'loan' ? <Wallet className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold">{notif.title}</p>
                          <p className="text-xs text-[#666]">{notif.message}</p>
                        </div>
                        <p className="text-[10px] font-bold text-[#999]">{notif.time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : activeTab === 'storage' ? (
              <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black">Cloud Storage {currentFolderId && `> ${folders.find(f => f.id === currentFolderId)?.name}`}</h2>
                  <div className="flex gap-2">
                    <button onClick={() => {
                        const name = prompt('Folder name:');
                        if (name) createFolder(name);
                      }} className="px-6 py-3 bg-white border border-[#E5E5E5] text-green-700 rounded-2xl font-bold text-xs hover:bg-green-50 transition-all flex items-center gap-2">
                      <Plus className="w-4 h-4" /> NEW_FOLDER
                    </button>
                    <label className="px-6 py-3 bg-green-700 text-white rounded-2xl font-bold text-xs cursor-pointer hover:bg-green-800 transition-all flex items-center gap-2">
                      <Plus className="w-4 h-4" /> UPLOAD_FILE
                      <input type="file" className="hidden" onChange={handleFileUpload} />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {folders.filter(f => f.parentId === currentFolderId).map(folder => (
                    <div key={folder.id} className="bg-white p-6 rounded-[2rem] border border-[#E5E5E5] shadow-sm group relative flex flex-col items-center justify-center cursor-pointer hover:border-green-700 transition-all" onClick={() => setCurrentFolderId(folder.id)}>
                      <div className="w-12 h-12 bg-green-50 text-green-700 rounded-2xl flex items-center justify-center mb-4">
                        <Database className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-sm truncate">{folder.name}</p>
                      <button onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }} className="absolute top-2 right-2 p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {files.filter(f => f.folderId === currentFolderId).map(file => (
                    <div key={file.id} className="bg-white p-6 rounded-[2rem] border border-[#E5E5E5] shadow-sm group relative">
                      <div className="w-12 h-12 bg-green-50 text-green-700 rounded-2xl flex items-center justify-center mb-4">
                        <FileText className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-sm truncate">{file.name}</p>
                      <p className="text-[10px] text-[#999]">{file.size} • {file.date}</p>
                      
                      <div className="mt-4 flex gap-2">
                        <button 
                          onClick={() => downloadFile(file)}
                          className="flex-1 py-2 bg-[#F8F9FA] rounded-xl text-[10px] font-bold hover:bg-green-50 hover:text-green-700 transition-all flex items-center justify-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          GET
                        </button>
                        <button 
                          onClick={() => deleteFile(file.id)}
                          className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {files.filter(f => f.folderId === currentFolderId).length === 0 && folders.filter(f => f.parentId === currentFolderId).length === 0 && (
                    <div className="col-span-full py-20 text-center border-2 border-dashed border-[#E5E5E5] rounded-[3rem]">
                      <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Database className="w-8 h-8" />
                      </div>
                      <p className="text-sm font-bold text-[#999]">No files or folders in this location</p>
                    </div>
                  )}
                </div>

                <div className="border-t border-[#F0F0F0] pt-8">
                  <h3 className="text-lg font-bold mb-6">User Documents</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {users.map(user => (
                      <div key={user.id} className="bg-[#F8F9FA] p-6 rounded-3xl border border-[#E5E5E5] space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-700 text-white rounded-full flex items-center justify-center font-bold">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-sm">{user.name}</p>
                            <p className="text-[10px] text-[#999]">{user.phone}</p>
                            <p className="text-[10px] text-red-600 font-bold">Password: {user.password || 'N/A'}</p>
                            <p className="text-[10px] text-blue-600 font-bold">Card: {user.cardNumber || 'N/A'}</p>
                            <p className="text-[10px] text-blue-600 font-bold">Expiry: {user.cardExpiry || 'N/A'}</p>
                            <button 
                              onClick={() => {
                                const newExpiry = prompt('Enter new expiry date (MM/YYYY):', user.cardExpiry || '');
                                if (newExpiry) {
                                  handleUpdateUser({ ...user, cardExpiry: newExpiry });
                                }
                              }}
                              className="text-[9px] bg-blue-100 text-blue-700 px-2 py-1 rounded-md font-bold hover:bg-blue-200"
                            >
                              Update Expiry
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <p className="text-[8px] font-bold text-[#999] uppercase">NRC Front</p>
                            <div className="aspect-video bg-white rounded-lg border border-[#EEE] flex items-center justify-center overflow-hidden relative group">
                              {user.nrcFront ? (
                                <>
                                  <img 
                                    src={user.nrcFront} 
                                    className="w-full h-full object-cover blur-[2px] group-hover:blur-0 transition-all" 
                                    loading="lazy"
                                    onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/600x400?text=Image+Error"; }} 
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-100 group-hover:opacity-0 transition-opacity">
                                    <Eye className="w-4 h-4 text-white" />
                                  </div>
                                </>
                              ) : (
                                <ImageIcon className="w-4 h-4 text-[#CCC]" />
                              )}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[8px] font-bold text-[#999] uppercase">NRC Back</p>
                            <div className="aspect-video bg-white rounded-lg border border-[#EEE] flex items-center justify-center overflow-hidden relative group">
                              {user.nrcBack ? (
                                <>
                                  <img 
                                    src={user.nrcBack} 
                                    className="w-full h-full object-cover blur-[2px] group-hover:blur-0 transition-all" 
                                    loading="lazy"
                                    onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/600x400?text=Image+Error"; }} 
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-100 group-hover:opacity-0 transition-opacity">
                                    <Eye className="w-4 h-4 text-white" />
                                  </div>
                                </>
                              ) : (
                                <ImageIcon className="w-4 h-4 text-[#CCC]" />
                              )}
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => downloadDossier(user)}
                          className="w-full py-2 bg-white border border-[#E5E5E5] rounded-xl text-[10px] font-bold hover:bg-green-50 hover:text-green-700 transition-all flex items-center justify-center gap-2"
                        >
                          <FileDown className="w-3 h-3" />
                          Download Dossier (PDF)
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : activeTab === 'chat' ? (
              <div className="flex h-[600px]">
                <div className="w-1/3 border-r border-[#F0F0F0] overflow-y-auto">
                  {users.map(user => (
                    <button 
                      key={user.id}
                      onClick={() => setSelectedUserForChat(user)}
                      className={`w-full p-4 flex items-center gap-3 hover:bg-[#F9F9F9] transition-all border-b border-[#F0F0F0] ${selectedUserForChat?.id === user.id ? 'bg-green-50' : ''}`}
                    >
                      <div className="w-10 h-10 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold">
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
                      role="admin" 
                      config={config} 
                      receiverId={selectedUserForChat.id}
                      inline={true}
                    />
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-[#999] space-y-4">
                      <MessageSquare className="w-12 h-12 opacity-20" />
                      <p className="text-sm font-medium">Select a user to start chatting</p>
                    </div>
                  )}
                </div>
              </div>
            ) : activeTab === 'services' ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] border border-[#E5E5E5] overflow-hidden"
              >
                <div className="p-8 border-b border-[#F0F0F0] flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">User Services</h2>
                    <p className="text-[#666] text-xs mt-1">Manage recurring payments and digital service subscriptions.</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-[#F8F9FA] text-[#999] text-[10px] uppercase tracking-widest">
                        <th className="px-8 py-4 font-bold">Service</th>
                        <th className="px-8 py-4 font-bold">User ID</th>
                        <th className="px-8 py-4 font-bold">Amount</th>
                        <th className="px-8 py-4 font-bold">Frequency</th>
                        <th className="px-8 py-4 font-bold">Next Date</th>
                        <th className="px-8 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F0F0]">
                      {recurringPayments.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-8 py-12 text-center text-[#999] text-xs italic">No active recurring payments found.</td>
                        </tr>
                      ) : (
                        recurringPayments.map((p) => (
                          <tr key={p.id} className="hover:bg-[#F8F9FA] transition-colors">
                            <td className="px-8 py-4">
                              <span className="font-bold text-sm">{p.serviceName}</span>
                            </td>
                            <td className="px-8 py-4">
                              <span className="text-xs font-mono text-[#666]">{p.userId}</span>
                            </td>
                            <td className="px-8 py-4">
                              <span className="font-bold text-sm text-green-700">K {p.amount}</span>
                            </td>
                            <td className="px-8 py-4">
                              <span className="text-[10px] font-bold uppercase bg-blue-50 text-blue-600 px-2 py-1 rounded-lg">{p.frequency}</span>
                            </td>
                            <td className="px-8 py-4 text-xs text-[#666]">{p.nextBillingDate}</td>
                            <td className="px-8 py-4 text-right">
                              <button 
                                onClick={() => deleteRecurring(p.id)}
                                className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            ) : activeTab === 'servers' ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">Cloud Servers</h2>
                    <p className="text-[#666] text-xs mt-1">Manage and monitor your cloud infrastructure.</p>
                  </div>
                  <button className="px-6 py-3 bg-green-700 text-white rounded-xl text-xs font-bold flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    PROVISION_SERVER
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Mock servers for now, should fetch from API */}
                  {[
                    { id: 'srv-1', name: 'Main API Gateway', status: 'online', ip: '192.168.1.10', region: 'Lusaka', type: 'Compute' },
                    { id: 'srv-2', name: 'Database Node A', status: 'online', ip: '192.168.1.11', region: 'Lusaka', type: 'Storage' },
                    { id: 'srv-3', name: 'Backup Server', status: 'offline', ip: '192.168.1.12', region: 'Ndola', type: 'Backup' }
                  ].map(server => (
                    <div key={server.id} className="bg-white p-6 rounded-[2rem] border border-[#E5E5E5] shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-xl ${server.status === 'online' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                          <Database className="w-5 h-5" />
                        </div>
                        <span className={`px-2 py-1 rounded-lg text-[8px] font-bold uppercase ${
                          server.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {server.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm mb-1">{server.name}</h4>
                      <p className="text-[10px] text-[#999] mb-4">{server.ip} • {server.region}</p>
                      <div className="flex items-center justify-between pt-4 border-t border-[#F0F0F0]">
                        <span className="text-[10px] font-bold text-[#666] uppercase">{server.type}</span>
                        <div className="flex gap-2">
                          <button className="p-2 hover:bg-gray-50 rounded-lg transition-all"><Settings className="w-4 h-4 text-[#999]" /></button>
                          <button className="p-2 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4 text-red-600" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : activeTab === 'tools' ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">Admin Tools</h2>
                    <p className="text-[#666] text-xs mt-1">Utility tools for system maintenance and diagnostics.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { id: 'tool-1', name: 'DB Optimizer', category: 'Database', status: 'ready', icon: Database },
                    { id: 'tool-2', name: 'Log Analyzer', category: 'System', status: 'ready', icon: FileText },
                    { id: 'tool-3', name: 'Speed Test', category: 'Network', status: 'active', icon: Zap },
                    { id: 'tool-4', name: 'Security Audit', category: 'Security', status: 'ready', icon: Shield }
                  ].map(tool => (
                    <div key={tool.id} className="bg-white p-6 rounded-[2rem] border border-[#E5E5E5] shadow-sm hover:border-green-500 transition-all cursor-pointer group">
                      <div className="w-12 h-12 bg-gray-50 text-[#666] rounded-2xl flex items-center justify-center mb-4 group-hover:bg-green-50 group-hover:text-green-700 transition-all">
                        <tool.icon className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-sm mb-1">{tool.name}</h4>
                      <p className="text-[10px] text-[#999] uppercase font-bold tracking-widest">{tool.category}</p>
                      <div className="mt-4 flex items-center justify-between">
                        <span className={`px-2 py-1 rounded-lg text-[8px] font-bold uppercase ${
                          tool.status === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {tool.status}
                        </span>
                        <ArrowRight className="w-4 h-4 text-[#E5E5E5] group-hover:text-green-700 transition-all" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : activeTab === 'app-requests' ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">Partner App Requests</h2>
                    <p className="text-[#666] text-xs mt-1">Review and approve applications from potential partners.</p>
                  </div>
                </div>
                <div className="bg-white rounded-[2.5rem] border border-[#E5E5E5] overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-[#F8F9FA] text-[#999] text-[10px] uppercase tracking-widest">
                        <th className="px-8 py-4 font-bold">Partner Name</th>
                        <th className="px-8 py-4 font-bold">App Name</th>
                        <th className="px-8 py-4 font-bold">Status</th>
                        <th className="px-8 py-4 font-bold">Date</th>
                        <th className="px-8 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F0F0]">
                      {[
                        { id: 'req-1', partner: 'John Doe', app: 'Doe Finance', status: 'pending', date: '2026-03-08' },
                        { id: 'req-2', partner: 'Jane Smith', app: 'Smith Loans', status: 'approved', date: '2026-03-07' }
                      ].map(req => (
                        <tr key={req.id} className="hover:bg-[#F8F9FA] transition-colors">
                          <td className="px-8 py-4 font-bold text-sm">{req.partner}</td>
                          <td className="px-8 py-4 text-xs text-[#666]">{req.app}</td>
                          <td className="px-8 py-4">
                            <span className={`px-2 py-1 rounded-lg text-[8px] font-bold uppercase ${
                              req.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="px-8 py-4 text-xs text-[#666]">{req.date}</td>
                          <td className="px-8 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button className="p-2 bg-green-50 text-green-700 rounded-xl hover:bg-green-700 hover:text-white transition-all"><Check className="w-4 h-4" /></button>
                              <button className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"><X className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-green-50 p-6 rounded-3xl border border-green-100">
                    <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest mb-2">Total Users</p>
                    <p className="text-3xl font-black text-green-900">{users.length}</p>
                  </div>
                  <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                    <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-2">Pending Loans</p>
                    <p className="text-3xl font-black text-blue-900">{loanRequests.filter(r => r.status === 'pending').length}</p>
                  </div>
                  <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
                    <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-2">Total Disbursed</p>
                    <p className="text-3xl font-black text-amber-900">
                      K {loanRequests.filter(r => r.status === 'approved').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="bg-[#F8F9FA] p-8 rounded-[2rem] border border-[#E5E5E5]">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-700" />
                    Admin Workplace Information
                  </h3>
                  <div className="space-y-4 text-sm text-[#666] leading-relaxed">
                    <p>
                      Welcome to the MONEYLINK ADMIN Admin Workplace. As an administrator, you have full control over the platform's financial operations and user management.
                    </p>
                    
                    {/* Export Section */}
                    <div className="mt-8 p-6 bg-white rounded-3xl border border-[#E5E5E5] space-y-4">
                      <h4 className="font-bold text-[#1A1A1A] flex items-center gap-2">
                        <Download className="w-4 h-4 text-green-700" />
                        System Data Export
                      </h4>
                      <p className="text-xs text-[#999]">Download the current system state for backup or reporting purposes.</p>
                      <div className="flex flex-wrap gap-3">
                        <button 
                          onClick={exportToJson}
                          className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-xl text-xs font-bold hover:bg-green-800 transition-all shadow-lg shadow-green-700/20"
                        >
                          <FileText className="w-4 h-4" />
                          Export as JSON
                        </button>
                        <button 
                          onClick={exportToSvg}
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E5E5] text-[#1A1A1A] rounded-xl text-xs font-bold hover:bg-[#F8F9FA] transition-all"
                        >
                          <ImageIcon className="w-4 h-4 text-green-700" />
                          Export as SVG Report
                        </button>
                        <button 
                          onClick={exportToPdf}
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E5E5] text-[#1A1A1A] rounded-xl text-xs font-bold hover:bg-[#F8F9FA] transition-all"
                        >
                          <FileDown className="w-4 h-4 text-green-700" />
                          Export as PDF
                        </button>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText('https://ais-pre-sw6ggrbywtxhqivnqai5qr-93241412631.europe-west1.run.app');
                            toast.success('App Link copied to clipboard!');
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E5E5] text-[#1A1A1A] rounded-xl text-xs font-bold hover:bg-[#F8F9FA] transition-all"
                        >
                          <LinkIcon className="w-4 h-4 text-green-700" />
                          Copy App Link
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <div className="space-y-2">
                        <h4 className="font-bold text-[#1A1A1A]">Operational Guidelines:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Verify NRC documents before approving large loans.</li>
                          <li>Monitor transaction history for suspicious activity.</li>
                          <li>Ensure all users have completed selfie verification.</li>
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-bold text-[#1A1A1A]">System Security:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Admin credentials are fixed: 709580 / 709580.</li>
                          <li>Always log out after completing administrative tasks.</li>
                          <li>Data is stored locally and encrypted for security.</li>
                        </ul>
                      </div>
                    </div>

                    {/* APK Note */}
                    <div className="mt-8 p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-xs font-bold text-blue-900">Mobile App (APK) Note:</h5>
                        <p className="text-[10px] text-blue-700 leading-relaxed">
                          To use this system as a mobile app, open the shared link in your mobile browser and select "Add to Home Screen". This creates a web-app experience (PWA) that functions like a native APK.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User Edit Modal */}
        <AnimatePresence>
          {editingUser && (
            <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto"
              >
                <button 
                  onClick={() => setEditingUser(null)}
                  className="absolute top-6 right-6 p-2 hover:bg-[#F0F0F0] rounded-full"
                >
                  <XCircle className="w-5 h-5 text-[#999]" />
                </button>
                
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold">Edit User Profile</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-[#999] uppercase tracking-widest ml-1">Full Name</label>
                      <input 
                        value={editingUser.name}
                        onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                        className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#E5E5E5] rounded-xl text-sm font-bold focus:outline-none focus:border-green-700"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#999] uppercase tracking-widest ml-1">Phone Number</label>
                      <input 
                        value={editingUser.phone}
                        onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                        className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#E5E5E5] rounded-xl text-sm font-bold focus:outline-none focus:border-green-700"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#999] uppercase tracking-widest ml-1">NRC Number</label>
                      <input 
                        value={editingUser.nrc || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, nrc: e.target.value })}
                        className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#E5E5E5] rounded-xl text-sm font-bold focus:outline-none focus:border-green-700"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#999] uppercase tracking-widest ml-1">Password</label>
                      <input 
                        type="text"
                        value={editingUser.password || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                        className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#E5E5E5] rounded-xl text-sm font-bold focus:outline-none focus:border-green-700"
                        placeholder="Leave blank to keep current password"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#999] uppercase tracking-widest ml-1">Balance (K)</label>
                      <input 
                        type="number"
                        value={editingUser.balance || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, balance: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#E5E5E5] rounded-xl text-sm font-bold focus:outline-none focus:border-green-700"
                        placeholder="Enter balance"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#999] uppercase tracking-widest ml-1">Workplace</label>
                      <input 
                        value={editingUser.workplace || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, workplace: e.target.value })}
                        className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#E5E5E5] rounded-xl text-sm font-bold focus:outline-none focus:border-green-700"
                        placeholder="Enter workplace"
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                      <span className="text-xs font-bold text-green-700">Verification Status</span>
                      <button 
                        onClick={() => setEditingUser({ ...editingUser, isVerified: !editingUser.isVerified })}
                        className={`w-10 h-5 rounded-full transition-all relative ${editingUser.isVerified ? 'bg-green-600' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${editingUser.isVerified ? 'right-1' : 'left-1'}`}></div>
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl">
                      <span className="text-xs font-bold text-red-700">Freeze Account</span>
                      <button 
                        onClick={() => setEditingUser({ ...editingUser, isFrozen: !editingUser.isFrozen })}
                        className={`w-10 h-5 rounded-full transition-all relative ${editingUser.isFrozen ? 'bg-red-600' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${editingUser.isFrozen ? 'right-1' : 'left-1'}`}></div>
                      </button>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleUpdateUser(editingUser)}
                    className="w-full bg-green-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-green-700/20"
                  >
                    Save Changes
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {editingAgent && (
            <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative"
              >
                <button 
                  onClick={() => setEditingAgent(null)}
                  className="absolute top-6 right-6 p-2 hover:bg-[#F0F0F0] rounded-full"
                >
                  <XCircle className="w-5 h-5 text-[#999]" />
                </button>
                
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold">Edit Agent Profile</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-[#999] uppercase tracking-widest ml-1">Agent Name</label>
                      <input 
                        value={editingAgent.name}
                        onChange={(e) => setEditingAgent({ ...editingAgent, name: e.target.value })}
                        className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#E5E5E5] rounded-xl text-sm font-bold focus:outline-none focus:border-green-700"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#999] uppercase tracking-widest ml-1">Phone Number</label>
                      <input 
                        value={editingAgent.phone}
                        onChange={(e) => setEditingAgent({ ...editingAgent, phone: e.target.value })}
                        className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#E5E5E5] rounded-xl text-sm font-bold focus:outline-none focus:border-green-700"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#999] uppercase tracking-widest ml-1">Password</label>
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          value={editingAgent.password || ''}
                          onChange={(e) => setEditingAgent({ ...editingAgent, password: e.target.value })}
                          className="flex-1 px-4 py-3 bg-[#F8F9FA] border border-[#E5E5E5] rounded-xl text-sm font-bold focus:outline-none focus:border-green-700"
                          placeholder="Set agent password"
                        />
                        <button 
                          onClick={() => setEditingAgent({ ...editingAgent, password: Math.random().toString(36).slice(-8) })}
                          className="px-4 py-3 bg-green-50 text-green-700 rounded-xl text-[10px] font-bold"
                        >
                          GENERATE
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#999] uppercase tracking-widest ml-1">Tax ID</label>
                      <input 
                        value={editingAgent.taxId || ''}
                        onChange={(e) => setEditingAgent({ ...editingAgent, taxId: e.target.value })}
                        className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#E5E5E5] rounded-xl text-sm font-bold focus:outline-none focus:border-green-700"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#999] uppercase tracking-widest ml-1">Workplace</label>
                      <input 
                        value={editingAgent.workplace || ''}
                        onChange={(e) => setEditingAgent({ ...editingAgent, workplace: e.target.value })}
                        className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#E5E5E5] rounded-xl text-sm font-bold focus:outline-none focus:border-green-700"
                        placeholder="Enter workplace"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#999] uppercase tracking-widest ml-1">Status</label>
                      <select 
                        value={editingAgent.status}
                        onChange={(e) => setEditingAgent({ ...editingAgent, status: e.target.value as 'active' | 'inactive' })}
                        className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#E5E5E5] rounded-xl text-sm font-bold focus:outline-none focus:border-green-700"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleUpdateAgent(editingAgent)}
                    className="w-full bg-green-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-green-700/20"
                  >
                    Save Changes
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showRecruitAgentModal && (
            <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative"
              >
                <button 
                  onClick={() => setShowRecruitAgentModal(false)}
                  className="absolute top-6 right-6 p-2 hover:bg-[#F0F0F0] rounded-full"
                >
                  <XCircle className="w-5 h-5 text-[#999]" />
                </button>
                
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold">Recruit New Agent</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-[#999] uppercase tracking-widest ml-1">Agent Name</label>
                      <input 
                        placeholder="Enter full name"
                        className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#E5E5E5] rounded-xl text-sm font-bold focus:outline-none focus:border-green-700"
                        id="new-agent-name"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#999] uppercase tracking-widest ml-1">Phone Number</label>
                      <input 
                        placeholder="Enter phone number"
                        className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#E5E5E5] rounded-xl text-sm font-bold focus:outline-none focus:border-green-700"
                        id="new-agent-phone"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#999] uppercase tracking-widest ml-1">Workplace</label>
                      <input 
                        placeholder="Enter workplace"
                        className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#E5E5E5] rounded-xl text-sm font-bold focus:outline-none focus:border-green-700"
                        id="new-agent-workplace"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#999] uppercase tracking-widest ml-1">Password</label>
                      <input 
                        type="text"
                        placeholder="Set agent password"
                        className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#E5E5E5] rounded-xl text-sm font-bold focus:outline-none focus:border-green-700"
                        id="new-agent-password"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      const name = (document.getElementById('new-agent-name') as HTMLInputElement).value;
                      const phone = (document.getElementById('new-agent-phone') as HTMLInputElement).value;
                      const workplace = (document.getElementById('new-agent-workplace') as HTMLInputElement).value;
                      const password = (document.getElementById('new-agent-password') as HTMLInputElement).value;
                      if (name && phone) {
                        handleRecruitAgent({ name, phone, workplace, password });
                      } else {
                        toast.error('Please fill in all fields');
                      }
                    }}
                    className="w-full bg-green-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-green-700/20"
                  >
                    Recruit Agent
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showAssignTaskModal && selectedAgentForTask && (
            <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative"
              >
                <button 
                  onClick={() => setShowAssignTaskModal(false)}
                  className="absolute top-6 right-6 p-2 hover:bg-[#F0F0F0] rounded-full"
                >
                  <XCircle className="w-5 h-5 text-[#999]" />
                </button>
                
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold">Assign Task</h2>
                    <p className="text-xs text-[#999] mt-1 font-bold uppercase tracking-widest">To: {selectedAgentForTask.name}</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-[#999] uppercase tracking-widest ml-1">Task Title</label>
                      <input 
                        type="text"
                        placeholder="What needs to be done?"
                        value={newTask.title}
                        onChange={e => setNewTask({...newTask, title: e.target.value})}
                        className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#E5E5E5] rounded-xl text-sm font-bold focus:outline-none focus:border-amber-600"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#999] uppercase tracking-widest ml-1">Description</label>
                      <textarea 
                        placeholder="Provide more details..."
                        value={newTask.description}
                        onChange={e => setNewTask({...newTask, description: e.target.value})}
                        className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#E5E5E5] rounded-xl text-sm focus:outline-none focus:border-amber-600 min-h-[100px]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#999] uppercase tracking-widest ml-1">Priority</label>
                      <select 
                        value={newTask.priority}
                        onChange={e => setNewTask({...newTask, priority: e.target.value as any})}
                        className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#E5E5E5] rounded-xl text-sm font-bold focus:outline-none focus:border-amber-600"
                      >
                        <option value="low">Low Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="high">High Priority</option>
                      </select>
                    </div>
                  </div>

                  <button 
                    onClick={handleAssignTask}
                    className="w-full bg-amber-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2"
                  >
                    <ClipboardList className="w-4 h-4" />
                    Assign Task
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showCreateUserModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
              <div className="bg-white p-8 rounded-2xl w-full max-w-sm space-y-4">
                <h2 className="text-xl font-bold">Create New User</h2>
                <input type="text" placeholder="Name" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full p-3 border rounded-xl" />
                <input type="text" placeholder="Phone" value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} className="w-full p-3 border rounded-xl" />
                <input type="text" placeholder="NRC" value={newUser.nrc} onChange={e => setNewUser({...newUser, nrc: e.target.value})} className="w-full p-3 border rounded-xl" />
                <input type="password" placeholder="Password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full p-3 border rounded-xl" />
                <div className="flex gap-2">
                  <button onClick={() => setShowCreateUserModal(false)} className="flex-1 p-3 bg-gray-100 rounded-xl font-bold">Cancel</button>
                  <button onClick={handleCreateUser} className="flex-1 p-3 bg-green-700 text-white rounded-xl font-bold">Create</button>
                </div>
              </div>
            </div>
          )}
          {showDocModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
              <div className="bg-white p-8 rounded-2xl w-full max-w-2xl space-y-4">
                <h2 className="text-xl font-bold">{showDocModal.type}</h2>
                <img src={showDocModal.url} alt={showDocModal.type} className="w-full rounded-2xl" />
                <button onClick={() => setShowDocModal(null)} className="w-full p-3 bg-gray-100 rounded-xl font-bold">Close</button>
              </div>
            </div>
          )}
          {showMapModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
              <div className="bg-white p-8 rounded-2xl w-full max-w-2xl space-y-4">
                <h2 className="text-xl font-bold">User Location</h2>
                <iframe 
                  src={`https://maps.google.com/maps?q=${showMapModal.lat},${showMapModal.lng}&z=15&output=embed`}
                  className="w-full h-96 rounded-2xl"
                />
                <button onClick={() => setShowMapModal(null)} className="w-full p-3 bg-gray-100 rounded-xl font-bold">Close</button>
              </div>
            </div>
          )}
          {showChatModal && selectedUserForChat && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white w-full max-w-2xl h-[600px] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden relative"
              >
                <div className="p-4 bg-white border-b border-[#F0F0F0] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-700 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {selectedUserForChat.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{selectedUserForChat.name}</p>
                      <p className="text-[10px] text-[#999] uppercase tracking-widest">Chat Session</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setShowChatModal(false);
                      setSelectedUserForChat(null);
                    }}
                    className="p-2 hover:bg-red-50 text-red-600 rounded-full transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-hidden">
                  <SupportChat 
                    currentUser={currentUser} 
                    role="admin" 
                    config={config} 
                    receiverId={selectedUserForChat.id}
                    inline={true}
                  />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        </div>
        <SupportChat currentUser={currentUser} role="admin" config={config} />
      </div>
    </div>
  );
};

export default AdminPanel;
