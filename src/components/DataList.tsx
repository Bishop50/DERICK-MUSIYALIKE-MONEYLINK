import React from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  CreditCard, 
  TrendingUp, 
  Zap,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Transaction } from '../types';

interface DataListProps {
  transactions: Transaction[];
  title?: string;
}

const DataList: React.FC<DataListProps> = ({ transactions, title = "Recent Activity" }) => {
  const getIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'loan': return <Wallet className="w-4 h-4" />;
      case 'payment': return <CreditCard className="w-4 h-4" />;
      case 'investment': return <TrendingUp className="w-4 h-4" />;
      case 'bill': return <Zap className="w-4 h-4" />;
      default: return <ArrowUpRight className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-3 h-3 text-green-600" />;
      case 'pending': return <Clock className="w-3 h-3 text-yellow-600" />;
      case 'failed': return <XCircle className="w-3 h-3 text-red-600" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZM', {
      style: 'currency',
      currency: 'ZMW',
    }).format(amount).replace('ZMW', 'K');
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-[#E5E5E5] shadow-sm overflow-hidden group/list">
      <div className="p-8 border-b border-[#F0F0F0] flex items-center justify-between bg-gray-50/50">
        <div>
          <h3 className="font-black text-xl tracking-tight text-gray-900 uppercase">{title}</h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Live Transaction Stream</p>
        </div>
        <button className="bg-white border border-gray-200 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 hover:text-white hover:border-green-700 transition-all shadow-sm">
          View All
        </button>
      </div>
      <div className="divide-y divide-[#F0F0F0]">
        {transactions.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-gray-200" />
            </div>
            <p className="text-[#999] text-sm font-bold uppercase tracking-widest">No transactions found.</p>
          </div>
        ) : (
          transactions.map((tx) => (
            <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-green-50/30 transition-all group cursor-pointer">
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 ${
                  tx.amount > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                }`}>
                  {tx.amount > 0 ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                </div>
                <div>
                  <p className="font-black text-sm text-gray-900 uppercase tracking-tight">{tx.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{tx.date}</span>
                    <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-full border border-gray-100 shadow-sm">
                      {getStatusIcon(tx.status)}
                      <span className={`text-[9px] font-black uppercase tracking-widest ${
                        tx.status === 'completed' ? 'text-green-600' : 
                        tx.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-black text-lg tracking-tighter ${
                  tx.amount > 0 ? 'text-green-700' : 'text-gray-900'
                }`}>
                  {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                </p>
                <div className="flex items-center justify-end gap-2 mt-1 text-gray-400">
                  <div className="p-1 bg-gray-50 rounded-md">
                    {getIcon(tx.type)}
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest">{tx.type}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DataList;
