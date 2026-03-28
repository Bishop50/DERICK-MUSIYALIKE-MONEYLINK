import React, { useState } from 'react';
import { 
  Info, 
  ShieldCheck, 
  FileText, 
  Lock, 
  MessageCircle, 
  HelpCircle,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Phone,
  X,
  RefreshCw,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface TrustSectionProps {
  onBack: () => void;
  config: any;
}

const TrustSection: React.FC<TrustSectionProps> = ({ onBack, config }) => {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const trustItems = [
    { id: 'about', label: `About ${config.appName}`, icon: Info, desc: 'Our mission and vision', content: `Welcome to ${config.appName}. Our mission is to provide secure, fast, and reliable financial services to everyone. We believe in transparency and empowering our users with the best digital tools.` },
    { id: 'terms', label: 'Terms & Conditions', icon: FileText, desc: 'Legal agreements', content: `By using ${config.appName}, you agree to our terms of service. We reserve the right to modify these terms. Users must be 18 years or older. All transactions are final and subject to our review process.` },
    { id: 'privacy', label: 'Privacy Policy', icon: Lock, desc: 'How we protect your data', content: `Your privacy is our top priority. We use end-to-end encryption to protect your personal and financial data. We do not sell your data to third parties. Your information is only used to provide and improve our services.` },
    { id: 'support', label: 'Customer Support', icon: MessageCircle, desc: 'Live Chat / WhatsApp', url: 'https://wa.me/260774218141' },
    { id: 'faqs', label: 'FAQs', icon: HelpCircle, desc: 'Common questions', content: `Q: How long does verification take?\nA: Usually within 24 hours.\n\nQ: What are the loan limits?\nA: Limits depend on your credit score and history with us.\n\nQ: How do I reset my password?\nA: Use the 'Forgot Password' link on the login page.` },
  ];

  const openBrowser = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleItemClick = (item: any) => {
    if (item.url) {
      openBrowser(item.url);
    } else {
      setActiveModal(item.id);
    }
  };

  return (
    <div className="space-y-8 relative">
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-[#E5E5E5]"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trust & Safety</h1>
          <p className="text-[#666] text-sm">Your security is our top priority.</p>
        </div>
      </div>

      {/* Trust Score / Badge */}
      <div className="bg-white p-8 rounded-[2rem] border border-[#E5E5E5] shadow-sm text-center space-y-4">
        <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto border-4 border-green-100">
          <ShieldCheck className="w-10 h-10" />
        </div>
        <div>
          <h3 className="text-xl font-bold">Verified Provider</h3>
          <p className="text-xs text-[#999] mt-1">{config.appName} Services Limited</p>
        </div>
        <div className="flex items-center justify-center gap-2 py-2 px-4 bg-[#F8F9FA] rounded-xl w-fit mx-auto">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-[10px] font-bold text-[#666] uppercase tracking-wider">System Secure & Online</span>
        </div>
      </div>

      {/* Trust Items List */}
      <div className="grid grid-cols-1 gap-3">
        {trustItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleItemClick(item)}
            className="w-full bg-white p-5 rounded-2xl border border-[#E5E5E5] shadow-sm hover:shadow-md transition-all flex items-center gap-4 text-left group"
          >
            <div className="p-3 bg-green-50 text-green-700 rounded-xl group-hover:bg-green-700 group-hover:text-white transition-colors">
              <item.icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">{item.label}</p>
              <p className="text-[10px] text-[#999] font-medium">{item.desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#E5E5E5] group-hover:text-green-700 transition-colors" />
          </button>
        ))}
      </div>

      {/* Contact Section */}
      <div className="bg-green-700 rounded-[2rem] p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-xl font-bold mb-4">Need immediate help?</h3>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => openBrowser('mailto:derickmusiyalikeinstitution@gmail.com')}
              className="bg-white/10 hover:bg-white/20 p-4 rounded-2xl flex flex-col items-center gap-2 transition-colors border border-white/10"
            >
              <Phone className="w-5 h-5" />
              <span className="text-xs font-bold">Email Us</span>
            </button>
            <button 
              onClick={() => openBrowser('https://wa.me/260774218141')}
              className="bg-white/10 hover:bg-white/20 p-4 rounded-2xl flex flex-col items-center gap-2 transition-colors border border-white/10"
            >
              <ExternalLink className="w-5 h-5" />
              <span className="text-xs font-bold">WhatsApp</span>
            </button>
          </div>
        </div>
        <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
      </div>

      {/* Report a Problem */}
      <div className="bg-white p-6 rounded-[2rem] border border-[#E5E5E5] shadow-sm">
        <h3 className="font-bold text-sm mb-4">Report a Problem</h3>
        <textarea 
          className="w-full p-4 bg-[#F8F9FA] border border-[#E5E5E5] rounded-xl text-sm focus:outline-none focus:border-green-700" 
          rows={4} 
          placeholder="Describe the issue you're facing..."
          id="report-problem-textarea"
        />
        <button 
          onClick={() => {
            const textarea = document.getElementById('report-problem-textarea') as HTMLTextAreaElement;
            if (textarea && textarea.value.trim()) {
              toast.success('Report submitted successfully. We will look into it.');
              textarea.value = '';
            } else {
              toast.error('Please describe the issue before submitting.');
            }
          }}
          className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/20"
        >
          Submit Report
        </button>
      </div>

      {/* Developer Credit */}
      <div className="p-8 bg-[#F8F9FA] rounded-[2rem] border border-[#E5E5E5] text-center space-y-3">
        <p className="text-[9px] font-bold text-[#999] uppercase tracking-[0.3em]">Official Developer</p>
        <div className="space-y-0.5">
          <p className="text-sm font-black text-[#1A1A1A]">DMI GROUP</p>
          <p className="text-[10px] text-[#666] font-bold">Lusaka, Zambia</p>
        </div>
        <div className="pt-2 flex justify-center gap-4">
          <a href="mailto:derickmusiyalikeinstitution@gmail.com" className="text-[10px] font-bold text-green-700 hover:underline">EMAIL</a>
          <a href="https://wa.me/260774218141" target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-green-700 hover:underline">WHATSAPP</a>
        </div>
      </div>

      {/* Modal for Trust Items */}
      <AnimatePresence>
        {activeModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setActiveModal(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[2rem] p-6 w-full max-w-md shadow-2xl relative max-h-[80vh] overflow-y-auto"
            >
              <button 
                onClick={() => setActiveModal(null)}
                className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
              
              {trustItems.find(i => i.id === activeModal) && (
                <div className="mt-4">
                  <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-4">
                    {React.createElement(trustItems.find(i => i.id === activeModal)!.icon, { className: "w-6 h-6" })}
                  </div>
                  <h2 className="text-2xl font-bold mb-2">{trustItems.find(i => i.id === activeModal)?.label}</h2>
                  <div className="text-gray-600 whitespace-pre-wrap leading-relaxed text-sm">
                    {trustItems.find(i => i.id === activeModal)?.content}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TrustSection;
