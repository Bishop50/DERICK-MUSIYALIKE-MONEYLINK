import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';

interface OnboardingStep {
  targetId: string;
  title: string;
  description: string;
}

interface OnboardingProps {
  steps: OnboardingStep[];
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ steps, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const updatePosition = () => {
      const target = document.getElementById(steps[currentStep].targetId);
      if (target) {
        const rect = target.getBoundingClientRect();
        setPosition({
          top: rect.top + window.scrollY + rect.height + 10,
          left: rect.left + window.scrollX,
        });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [currentStep, steps]);

  const step = steps[currentStep];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute bg-white p-6 rounded-2xl shadow-xl w-72 border border-[#E5E5E5]"
          style={{ top: position.top, left: position.left }}
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-sm">{step.title}</h3>
            <button onClick={onComplete} className="text-[#999] hover:text-black">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-[#666] mb-4">{step.description}</p>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-[#999] font-bold">
              {currentStep + 1} / {steps.length}
            </span>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="p-2 bg-[#F8F9FA] rounded-lg hover:bg-[#F0F0F0]"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => {
                  if (currentStep < steps.length - 1) {
                    setCurrentStep(currentStep + 1);
                  } else {
                    onComplete();
                  }
                }}
                className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                {currentStep < steps.length - 1 ? <ArrowRight className="w-4 h-4" /> : 'Finish'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Onboarding;
