import React from 'react';
import { LucideProps } from 'lucide-react';
import { motion } from 'motion/react';

interface QuickActionButtonProps {
  icon: React.FC<LucideProps>;
  label: string;
  onClick?: () => void;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({ icon: Icon, label, onClick }) => {
  return (
    <motion.button 
      onClick={onClick}
      className="flex flex-col items-center gap-2 group"
      whileHover={{ y: -4, scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center transition-transform group-hover:shadow-md border border-[#E5E5E5] shadow-sm">
        <Icon className="w-6 h-6 text-green-700" />
      </div>
      <span className="text-[10px] font-bold text-[#666] text-center">{label}</span>
    </motion.button>
  );
};

export default QuickActionButton;
