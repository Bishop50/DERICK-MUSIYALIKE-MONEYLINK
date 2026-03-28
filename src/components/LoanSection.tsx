import React, { useState } from 'react';
import { 
  Briefcase, 
  Shield, 
  Calculator, 
  Upload,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  Sprout,
  Car,
  GraduationCap,
  Home,
  Banknote,
  Zap,
  Sun,
  Droplets,
  Truck,
  User as UserIcon
} from 'lucide-react';
import { LoanRequest, User } from '../types';
import { getUserFromLocalStorage } from '../utils/storage';
import { toast } from 'sonner';

import LoanCalculator from './LoanCalculator';

interface LoanSectionProps {
  onBack: () => void;
  isRegistered: boolean;
  config: any;
}

const LoanSection: React.FC<LoanSectionProps> = ({ onBack, isRegistered, config }) => {
  const [activeTab, setActiveTab] = useState<'apply' | 'my-loans'>('apply');
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showStatusChangeModal, setShowStatusChangeModal] = useState(false);
  const [loanStatusChange, setLoanStatusChange] = useState<{type: string, status: string} | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [tenure, setTenure] = useState('1 week');
  const [loanStatusFilter, setLoanStatusFilter] = useState<string>('all');
  const [loanSortBy, setLoanSortBy] = useState<'date' | 'amount'>('date');
  const [loans, setLoans] = useState<LoanRequest[]>([]);
  const [prevLoans, setPrevLoans] = useState<LoanRequest[]>([]);
  const [documents, setDocuments] = useState<File[]>([]);
  
  React.useEffect(() => {
    const currentUser = getUserFromLocalStorage();
    if (currentUser) {
      fetch(`/api/loan-requests?userId=${currentUser.id}`)
        .then(res => {
          if (!res.ok) throw new Error('Network response was not ok');
          return res.json();
        })
        .then(data => {
            // Check for status changes
            data.forEach((loan: LoanRequest) => {
                const prevLoan = prevLoans.find(p => p.id === loan.id);
                if (prevLoan && prevLoan.status !== loan.status) {
                    setLoanStatusChange({
                        type: loan.type,
                        status: loan.status
                    });
                    setShowStatusChangeModal(true);
                }
            });
            setLoans(data);
            setPrevLoans(data);
        })
        .catch(err => {
          console.error('Failed to fetch loans from API, falling back to local storage', err);
          const allLoans = JSON.parse(localStorage.getItem('moneylink_loan_requests') || '[]');
          const userLoans = allLoans.filter((req: LoanRequest) => req.userId === currentUser.id);
          
          // Check for status changes in local storage
          userLoans.forEach((loan: LoanRequest) => {
              const prevLoan = prevLoans.find(p => p.id === loan.id);
              if (prevLoan && prevLoan.status !== loan.status) {
                  setLoanStatusChange({
                      type: loan.type,
                      status: loan.status
                  });
                  setShowStatusChangeModal(true);
              }
          });
          
          setLoans(userLoans);
          setPrevLoans(userLoans);
        });
    }
  }, [activeTab, showConfirmation]);

  const loanAmount = parseFloat(amount) || 0;
  const tenureWeeks = parseInt(tenure.split(' ')[0]) || 1;
  
  let interestRate = 0.15;
  if (tenureWeeks === 2) interestRate = 0.25;
  if (tenureWeeks === 3) interestRate = 0.35;
  if (tenureWeeks >= 4) interestRate = 0.45;

  const totalRepayment = loanAmount * (1 + interestRate);

  const handleApply = (loan: any) => {
    if (loan.id === 'calculator') {
      setShowCalculator(true);
      return;
    }
    setSelectedLoan(loan);
    setShowApplyForm(true);
  };

  const submitLoan = async () => {
    const currentUser = getUserFromLocalStorage();
    if (!currentUser) return;

    const newRequest: LoanRequest = {
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      userName: currentUser.name,
      amount: loanAmount,
      type: selectedLoan.label,
      tenure: tenure,
      date: new Date().toLocaleDateString(),
      status: 'pending',
      interestRate: interestRate * 100,
      monthlyPayment: totalRepayment // For weekly loans, we just store the total repayment
    };

    try {
      await fetch('/api/loan-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRequest)
      });

      // Notify Admin
      await fetch('/api/admin-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Loan Application',
          message: `${currentUser.name} applied for a K${newRequest.amount} ${newRequest.type} for ${newRequest.tenure}`,
          userId: currentUser.id,
          type: 'loan',
          isRead: false
        })
      });
    } catch (error) {
      console.error('Failed to submit loan via API, falling back to local storage', error);
      const existingRequests = JSON.parse(localStorage.getItem('moneylink_loan_requests') || '[]');
      localStorage.setItem('moneylink_loan_requests', JSON.stringify([...existingRequests, newRequest]));
      
      // Notify Admin
      const adminNotifications = JSON.parse(localStorage.getItem('moneylink_admin_notifications') || '[]');
      adminNotifications.push({
        id: Math.random().toString(36).substr(2, 9),
        title: 'New Loan Application',
        message: `${currentUser.name} applied for a K${newRequest.amount} ${newRequest.type}`,
        time: new Date().toLocaleString(),
        isRead: false,
        type: 'loan',
        userId: currentUser.id
      });
      localStorage.setItem('moneylink_admin_notifications', JSON.stringify(adminNotifications));
    }

    setShowSuccessModal(true);
    setShowApplyForm(false);
    setShowConfirmation(false);
    setAmount('');
    setActiveTab('my-loans');
  };

  const repayLoan = async (loan: LoanRequest) => {
    const currentUser = getUserFromLocalStorage();
    if (!currentUser) return;
    
    if (currentUser.balance < (loan.amount || 0)) {
      toast.error('Insufficient balance');
      return;
    }
    
    try {
      const response = await fetch('/api/repay-loan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          loanId: loan.id,
          amount: loan.amount
        })
      });
      
      if (response.ok) {
        toast.success('Loan repaid successfully');
        // Refresh loans by triggering a re-fetch
        setActiveTab('my-loans');
      } else {
        toast.error('Failed to repay loan');
      }
    } catch (error) {
      console.error('Error repaying loan:', error);
      toast.error('Error repaying loan');
    }
  };

  const applyButtons = [
    { id: 'weekly', label: 'Fast Collateral Loan', icon: Clock, desc: 'Quick cash secured by collateral' },
    { id: 'personal', label: 'Personal Loan', icon: UserIcon, desc: 'For individual needs' },
    { id: 'sme', label: 'SME Loan', icon: Briefcase, desc: 'Grow your business' },
    { id: 'emergency', label: 'Emergency Loan', icon: Zap, desc: 'Quick cash in 24h' },
    { id: 'collateral', label: 'Collateral Loan', icon: Shield, desc: 'Lower interest rates' },
    { id: 'salary', label: 'Salary Advance', icon: Banknote, desc: 'Get paid early' },
    { id: 'agri', label: 'Agricultural Loan', icon: Sprout, desc: 'For farmers & agribusiness' },
    { id: 'asset', label: 'Asset Financing', icon: Truck, desc: 'Vehicle & equipment loans' },
    { id: 'home', label: 'Home Improvement', icon: Home, desc: 'Renovate your space' },
    { id: 'solar', label: 'Solar Loan', icon: Sun, desc: 'Clean energy solutions' },
    { id: 'water', label: 'Water & Sanitation', icon: Droplets, desc: 'Boreholes & plumbing' },
    { id: 'calculator', label: 'Loan Calculator', icon: Calculator, desc: 'Estimate your payments' },
    { id: 'upload', label: 'Upload Documents', icon: Upload, desc: 'Complete your profile' },
  ];

  const myLoansButtons = [
    { id: 'active', label: 'Active Loans', icon: CheckCircle2, count: isRegistered ? 1 : 0 },
    { id: 'schedule', label: 'Payment Schedule', icon: Clock },
    { id: 'statement', label: 'Download Statement', icon: FileText },
  ];

  if (showCalculator) {
    return <LoanCalculator onBack={() => setShowCalculator(false)} />;
  }

  return (
    <div className="space-y-8">
      {!isRegistered && activeTab === 'apply' && (
        <div className="bg-red-50 border border-red-100 p-6 rounded-[2rem] flex items-start gap-4">
          <div className="p-2 bg-red-600 text-white rounded-lg">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-red-900">Registration Required</h4>
            <p className="text-xs text-red-700 leading-relaxed mt-1">
              You must complete your NRC registration and selfie verification before you can apply for any loans. Please return to the home screen to register.
            </p>
          </div>
        </div>
      )}
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-[#E5E5E5]"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Loan Services</h1>
          <p className="text-[#666] text-sm">Flexible financing for Zambian dreams.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-[#F0F0F0] rounded-2xl w-full max-w-md">
        <button
          onClick={() => setActiveTab('apply')}
          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'apply' ? 'bg-white shadow-sm text-green-700' : 'text-[#666]'
          }`}
        >
          Apply for Loan
        </button>
        <button
          onClick={() => setActiveTab('my-loans')}
          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'my-loans' ? 'bg-white shadow-sm text-green-700' : 'text-[#666]'
          }`}
        >
          My Loans
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeTab === 'apply' ? (
          showApplyForm ? (
            <div className="bg-white p-8 rounded-[2rem] border border-[#E5E5E5] shadow-sm space-y-6 col-span-full">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Apply for {selectedLoan?.label}</h3>
                <button onClick={() => setShowApplyForm(false)} className="text-[#999] hover:text-[#666]">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-[#999] uppercase tracking-widest ml-1">Loan Amount (K)</label>
                  <input 
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-4 bg-[#F8F9FA] border border-[#E5E5E5] rounded-2xl text-2xl font-black focus:outline-none focus:border-green-700"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#999] uppercase tracking-widest ml-1">Loan Tenure</label>
                    <select 
                      value={tenure}
                      onChange={(e) => setTenure(e.target.value)}
                      className="w-full px-4 py-4 bg-[#F8F9FA] border border-[#E5E5E5] rounded-2xl text-sm font-bold focus:outline-none focus:border-green-700 appearance-none"
                    >
                      <option value="1 week">1 Week (15%)</option>
                      <option value="2 weeks">2 Weeks (25%)</option>
                      <option value="3 weeks">3 Weeks (35%)</option>
                      <option value="4 weeks">4 Weeks (45%)</option>
                    </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#999] uppercase tracking-widest ml-1">Upload Documents (Proof of Income, Collateral)</label>
                  <input 
                    type="file"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        setDocuments(Array.from(e.target.files));
                      }
                    }}
                    className="w-full px-4 py-4 bg-[#F8F9FA] border border-[#E5E5E5] rounded-2xl text-sm font-bold focus:outline-none focus:border-green-700"
                  />
                  {documents.length > 0 && (
                    <div className="mt-2 text-xs text-green-700 font-bold">
                      {documents.length} document(s) selected
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => setShowConfirmation(true)}
                  disabled={!amount || parseFloat(amount) <= 0}
                  className="w-full bg-green-700 disabled:bg-gray-300 hover:bg-green-800 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-green-700/20"
                >
                  Submit Application
                  <CheckCircle2 className="w-5 h-5" />
                </button>
              </div>
              
              {showConfirmation && (
                <div className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl space-y-6">
                    <h3 className="text-xl font-bold">Confirm Application</h3>
                    <div className="space-y-2 text-sm">
                      <p className="flex justify-between"><span className="text-[#666]">Loan Type:</span> <span className="font-bold">{selectedLoan?.label}</span></p>
                      <p className="flex justify-between"><span className="text-[#666]">Amount:</span> <span className="font-bold">K {loanAmount.toLocaleString()}</span></p>
                      <p className="flex justify-between"><span className="text-[#666]">Tenure:</span> <span className="font-bold">{tenure}</span></p>
                      <p className="flex justify-between"><span className="text-[#666]">Interest Rate:</span> <span className="font-bold">{(interestRate * 100).toFixed(0)}%</span></p>
                      <p className="flex justify-between">
                        <span className="text-[#666]">Total Repayment:</span> 
                        <span className="font-bold">K {totalRepayment.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <button onClick={() => setShowConfirmation(false)} className="flex-1 py-3 bg-[#F0F0F0] rounded-xl font-bold text-sm">Cancel</button>
                      <button onClick={submitLoan} className="flex-1 py-3 bg-green-700 text-white rounded-xl font-bold text-sm">Confirm</button>
                    </div>
                  </div>
                </div>
              )}
              
              {showStatusChangeModal && loanStatusChange && (
                <div className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl space-y-6 text-center">
                    <div className={`w-20 h-20 ${loanStatusChange.status === 'approved' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'} rounded-full flex items-center justify-center mx-auto`}>
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold">Loan {loanStatusChange.status === 'approved' ? 'Approved' : 'Rejected'}!</h3>
                    <p className="text-sm text-[#666]">Your {loanStatusChange.type} loan application has been {loanStatusChange.status}.</p>
                    <button onClick={() => setShowStatusChangeModal(false)} className="w-full py-4 bg-green-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-green-700/20">
                      Close
                    </button>
                  </div>
                </div>
              )}
              
              {showSuccessModal && (
                <div className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl space-y-6 text-center">
                    <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold">Application Submitted!</h3>
                    <p className="text-sm text-[#666]">Your loan application has been submitted successfully. You will receive a notification once it is approved or rejected.</p>
                    <button onClick={() => setShowSuccessModal(false)} className="w-full py-4 bg-green-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-green-700/20">
                      View My Loans
                    </button>
                  </div>
                </div>
              )}
            </div>
            
          ) : (
            applyButtons.map((btn) => (
              <button
                key={btn.id}
                onClick={() => handleApply(btn)}
                disabled={!isRegistered && btn.id !== 'calculator'}
                className={`p-6 rounded-[2rem] border border-[#E5E5E5] shadow-sm transition-all flex items-center gap-4 text-left group ${
                  !isRegistered && btn.id !== 'calculator' 
                    ? 'bg-gray-50 opacity-60 cursor-not-allowed' 
                    : 'bg-white hover:shadow-md hover:scale-[1.01]'
                }`}
              >
                <div className={`p-4 rounded-2xl transition-colors ${
                  !isRegistered && btn.id !== 'calculator'
                    ? 'bg-gray-200 text-gray-400'
                    : 'bg-green-50 text-green-700 group-hover:bg-green-700 group-hover:text-white'
                }`}>
                  <btn.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">{btn.label}</p>
                  <p className="text-[10px] text-[#999] font-medium">{btn.desc}</p>
                </div>
                <ChevronRight className={`w-4 h-4 transition-colors ${
                  !isRegistered && btn.id !== 'calculator' ? 'text-gray-300' : 'text-[#E5E5E5] group-hover:text-green-700'
                }`} />
              </button>
            ))
          )
        ) : (
          <div className="col-span-full space-y-4">
            {/* Filter & Sort Controls */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="flex items-center gap-2 bg-[#F0F0F0] p-1 rounded-xl">
                {['all', 'pending', 'approved', 'rejected'].map(status => (
                  <button
                    key={status}
                    onClick={() => setLoanStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                      loanStatusFilter === status ? 'bg-white text-green-700 shadow-sm' : 'text-[#666]'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 bg-[#F0F0F0] p-1 rounded-xl">
                <button
                  onClick={() => setLoanSortBy('date')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                    loanSortBy === 'date' ? 'bg-white text-green-700 shadow-sm' : 'text-[#666]'
                  }`}
                >
                  Date
                </button>
                <button
                  onClick={() => setLoanSortBy('amount')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                    loanSortBy === 'amount' ? 'bg-white text-green-700 shadow-sm' : 'text-[#666]'
                  }`}
                >
                  Amount
                </button>
              </div>
            </div>

            {loans
              .filter((req: LoanRequest) => {
                const matchesStatus = loanStatusFilter === 'all' || req.status === loanStatusFilter;
                return matchesStatus;
              })
              .sort((a: LoanRequest, b: LoanRequest) => {
                if (loanSortBy === 'amount') return (b.amount || 0) - (a.amount || 0);
                return new Date(b.date).getTime() - new Date(a.date).getTime();
              })
              .map((req: LoanRequest) => (
                <div key={req.id} className="bg-white p-6 rounded-[2rem] border border-[#E5E5E5] shadow-sm flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${
                        req.status === 'approved' ? 'bg-green-50 text-green-700' : 
                        req.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{req.type}</p>
                        <p className="text-[10px] text-[#999]">{req.date} • {req.tenure || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-green-700">K {(req.amount || 0).toLocaleString()}</p>
                      <p className={`text-[10px] font-bold uppercase tracking-tighter ${
                        req.status === 'approved' ? 'text-green-600' : 
                        req.status === 'rejected' ? 'text-red-600' : 'text-amber-600'
                      }`}>{req.status}</p>
                    </div>
                  </div>
                  {req.status === 'rejected' && req.rejectionReason && (
                    <div className="mt-4 pt-4 border-t border-[#E5E5E5]">
                      <h4 className="text-xs font-bold mb-2 text-red-600 uppercase tracking-widest">Reason for Rejection</h4>
                      <p className="text-sm text-[#666] bg-red-50 p-3 rounded-xl border border-red-100">{req.rejectionReason}</p>
                    </div>
                  )}
                  {req.status === 'approved' && req.amount && req.tenure && (
                    <div className="mt-4 pt-4 border-t border-[#E5E5E5]">
                      <button 
                        onClick={() => repayLoan(req)}
                        className="w-full bg-green-700 text-white py-2 rounded-xl font-bold text-xs mb-4 hover:bg-green-800"
                      >
                        Repay Loan
                      </button>
                      <h4 className="text-xs font-bold mb-3 text-[#666] uppercase tracking-widest">Repayment Schedule</h4>
                      <div className="space-y-2">
                        {req.repaymentSchedule ? (
                          req.repaymentSchedule.map((schedule, i) => (
                            <div key={i} className="flex justify-between items-center text-[10px] bg-[#F8F9FA] p-2 rounded-lg">
                              <span className="font-bold text-[#666]">Installment {i + 1} ({new Date(schedule.dueDate).toLocaleDateString()})</span>
                              <div className="text-right">
                                <span className="font-black text-green-700 block">K {schedule.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                <span className="text-[#999]">Bal: K {schedule.remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          Array.from({ length: parseInt(req.tenure) || 1 }).map((_, i) => {
                            const isWeekly = req.tenure?.includes('week');
                            const paymentCount = parseInt(req.tenure!) || 1;
                            const totalWithInterest = (req.amount! * (1 + (req.interestRate! / 100)));
                            const paymentAmount = totalWithInterest / paymentCount;
                            const remaining = totalWithInterest - (paymentAmount * (i + 1));
                            const date = new Date(req.date);
                            if (isWeekly) {
                              date.setDate(date.getDate() + (i + 1) * 7);
                            } else {
                              date.setMonth(date.getMonth() + i + 1);
                            }
                            return (
                              <div key={i} className="flex justify-between items-center text-[10px] bg-[#F8F9FA] p-2 rounded-lg">
                                <span className="font-bold text-[#666]">{isWeekly ? 'Week' : 'Month'} {i + 1} ({date.toLocaleDateString()})</span>
                                <div className="text-right">
                                  <span className="font-black text-green-700 block">K {paymentAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                  <span className="text-[#999]">Bal: K {Math.max(0, remaining).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            
            {myLoansButtons.map((btn) => (
              <button
                key={btn.id}
                className="bg-white p-6 rounded-[2rem] border border-[#E5E5E5] shadow-sm hover:shadow-md hover:scale-[1.01] transition-all flex items-center gap-4 text-left group"
              >
                <div className="p-4 bg-green-50 text-green-700 rounded-2xl group-hover:bg-green-700 group-hover:text-white transition-colors">
                  <btn.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">{btn.label}</p>
                  {btn.count && <p className="text-[10px] text-green-700 font-bold">{btn.count} Active</p>}
                </div>
                <ChevronRight className="w-4 h-4 text-[#E5E5E5] group-hover:text-green-700 transition-colors" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Trust Banner */}
      <div className="bg-green-50 border border-green-100 p-6 rounded-[2rem] flex items-start gap-4">
        <div className="p-2 bg-green-700 text-white rounded-lg">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-sm text-green-900">Licensed & Regulated</h4>
          <p className="text-xs text-green-700 leading-relaxed mt-1">
            {config.appName} is fully licensed by the Bank of Zambia. Your data is encrypted and secure.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoanSection;
