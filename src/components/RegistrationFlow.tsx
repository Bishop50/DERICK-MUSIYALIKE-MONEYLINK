import React, { useState, useEffect } from 'react';
const logo = '/logo.png';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  Upload, 
  CheckCircle2, 
  Shield, 
  ArrowRight, 
  X, 
  Smartphone, 
  Lock, 
  Eye, 
  EyeOff,
  AlertCircle,
  User,
  FileText
} from 'lucide-react';

import { User as UserType } from '../types';
import { toast } from 'sonner';

interface RegistrationFlowProps {
  onComplete: (user: UserType) => void;
  onCancel: () => void;
  onSwitchToLogin?: () => void;
  appConfig: { name: string, logo: string };
}

type Step = 'phone' | 'otp' | 'password' | 'pin' | 'nrc' | 'passport' | 'selfie' | 'success';

const RegistrationFlow: React.FC<RegistrationFlowProps> = ({ onComplete, onCancel, onSwitchToLogin, appConfig }) => {
  const [step, setStep] = useState<Step>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState(['', '', '', '']);
  const [nrcNumber, setNrcNumber] = useState('');
  const [userName, setUserName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [nrcFront, setNrcFront] = useState<string | null>(null);
  const [nrcBack, setNrcBack] = useState<string | null>(null);
  const [selfiePhoto, setSelfiePhoto] = useState<string | null>(null);
  const [passportPhoto, setPassportPhoto] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const [passwordFeedback, setPasswordFeedback] = useState<string[]>([]);
  const [registeredUser, setRegisteredUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validatePassword = (pass: string) => {
    let strength = 0;
    const feedback: string[] = [];
    
    if (pass.length >= 8) {
      strength += 1;
    } else {
      feedback.push('At least 8 characters');
    }
    
    if (/[A-Z]/.test(pass)) {
      strength += 1;
    } else {
      feedback.push('One uppercase letter');
    }
    
    if (/[0-9]/.test(pass)) {
      strength += 1;
    } else {
      feedback.push('One number');
    }
    
    if (/[^A-Za-z0-9]/.test(pass)) {
      strength += 1;
    } else {
      feedback.push('One special character');
    }
    
    setPasswordStrength(strength);
    setPasswordFeedback(feedback);
  };

  useEffect(() => {
    validatePassword(password);
  }, [password]);

  useEffect(() => {
    if (step === 'success' && registeredUser) {
      const timer = setTimeout(() => {
        onComplete(registeredUser);
      }, 500); // Reduced from 1000 to 500 for faster automatic exit
      return () => clearTimeout(timer);
    }
  }, [step, registeredUser, onComplete]);

  const [otpError, setOtpError] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(60);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const handlePhoneSubmit = async () => {
    if (phoneNumber.length >= 9) {
      setIsLoading(true);
      try {
        const res = await fetch('/api/users');
        if (!res.ok) {
          toast.error('Server connection error. Please try again later.');
          setIsLoading(false);
          return;
        }
        const users: UserType[] = await res.json();
        const existingUser = users.find(u => u.phone === phoneNumber);
        if (existingUser) {
          toast.error('Your phone number is already registered in our system, please log in.');
          onCancel(); // Close registration and let them login
          setIsLoading(false);
          return;
        }
      } catch (e) {
        console.error('Error checking existing user:', e);
        toast.error('Server connection error. Please try again later.');
        setIsLoading(false);
        return;
      }

      setStep('otp');
      // Generate 6-digit secure OTP
      const array = new Uint32Array(1);
      window.crypto.getRandomValues(array);
      const newOtp = (array[0] % 900000 + 100000).toString();
      setGeneratedOtp(newOtp);
      console.log('OTP Sent to +260' + phoneNumber + ': ' + newOtp);
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1 && /^[0-9]*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      
      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handleOtpSubmit = () => {
    const enteredOtp = otp.join('');
    if (enteredOtp === generatedOtp) {
      setStep('password');
      setOtpError('');
    } else {
      setOtpError('Invalid OTP code. Please try again.');
    }
  };

  const handlePasswordSubmit = () => {
    if (passwordStrength >= 3) {
      setStep('pin');
    }
  };

  const handlePinChange = (index: number, value: string) => {
    if (value.length <= 1 && /^[0-9]*$/.test(value)) {
      const newPin = [...pin];
      newPin[index] = value;
      setPin(newPin);
      
      if (value && index < 3) {
        const nextInput = document.getElementById(`pin-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handlePinSubmit = () => {
    if (pin.every(p => p !== '')) {
      setStep('nrc');
    }
  };

  const handleNrcFrontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNrcFront(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNrcBackUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNrcBack(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelfieCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelfiePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePassportUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPassportPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  const handleComplete = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const users: UserType[] = await res.json();
        const existingUser = users.find(u => u.nrc === nrcNumber);
        if (existingUser) {
          toast.error('This NRC is already registered in our system. Please log in.');
          onCancel();
          setIsLoading(false);
          return;
        }
      } else {
        throw new Error('Server connection error');
      }
    } catch (e) {
      console.warn('Error checking existing user via API, falling back to local storage:', e);
      const localUsers = JSON.parse(localStorage.getItem('moneylink_users') || '[]');
      const existingUser = localUsers.find((u: any) => u.nrc === nrcNumber);
      if (existingUser) {
        toast.error('This NRC is already registered in our system. Please log in.');
        onCancel();
        setIsLoading(false);
        return;
      }
    }

    const newUser: UserType = {
      id: Math.random().toString(36).substr(2, 9),
      adminId: 'default', // Changed from default_admin to default to match server.ts
      name: userName,
      phone: phoneNumber,
      nrc: nrcNumber,
      password: password,
      pin: pin.join(''),
      isRegistered: true,
      nrcFront: nrcFront || undefined,
      nrcBack: nrcBack || undefined,
      selfiePhoto: selfiePhoto || undefined,
      passportPhoto: passportPhoto || undefined,
      balance: 0,
      isVerified: false,
      cardNumber: Math.random().toString().slice(2, 18),
      cardExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 5)).toLocaleDateString()
    };

    try {
      // Save to backend
      console.log('Sending registration request to /api/users');
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      console.log('Registration request sent, status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Registration failed:', errorData);
        throw new Error(errorData.message || 'Failed to save user to server');
      }

      // Send Welcome Notification via API
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: newUser.id,
          title: `Welcome to ${appConfig.name}`,
          message: 'Your account has been successfully created and verified.',
          isRead: false,
          type: 'system'
        })
      });
      
      // Notify Admin via API
      await fetch('/api/admin-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New User Registration',
          message: `${newUser.name} (+260 ${newUser.phone}) has registered and is verified.`,
          userId: newUser.id,
          type: 'registration',
          isRead: false
        })
      });

      setRegisteredUser(newUser);
      setStep('success'); // Set step to success for automatic redirection
      setIsLoading(false);
      return newUser;
    } catch (error) {
      console.error('Failed to register user on backend, falling back to local storage:', error);
      
      // Fallback to local storage
      const existingUsers = JSON.parse(localStorage.getItem('moneylink_users') || '[]');
      localStorage.setItem('moneylink_users', JSON.stringify([...existingUsers, newUser]));
      
      const existingNotifications = JSON.parse(localStorage.getItem('moneylink_notifications') || '[]');
      existingNotifications.push({
        id: Math.random().toString(36).substr(2, 9),
        userId: newUser.id,
        title: `Welcome to ${appConfig.name}`,
        message: 'Your account has been successfully created and verified.',
        time: new Date().toLocaleString(),
        isRead: false,
        type: 'system'
      });
      localStorage.setItem('moneylink_notifications', JSON.stringify(existingNotifications));
      
      const adminNotifications = JSON.parse(localStorage.getItem('moneylink_admin_notifications') || '[]');
      adminNotifications.push({
        id: Math.random().toString(36).substr(2, 9),
        title: 'New User Registration',
        message: `${newUser.name} (+260 ${newUser.phone}) has registered and is verified.`,
        time: new Date().toLocaleString(),
        isRead: false,
        userId: newUser.id,
        type: 'registration'
      });
      localStorage.setItem('moneylink_admin_notifications', JSON.stringify(adminNotifications));
      
      setRegisteredUser(newUser);
      setStep('success'); // Set step to success
      setIsLoading(false);
      return newUser;
    }
  };

  const handleCompleteRegistration = async () => {
    await handleComplete();
  };

  const steps: Step[] = ['phone', 'otp', 'password', 'nrc', 'passport', 'selfie'];
  const currentStepIndex = steps.indexOf(step);

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4 py-12">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative"
      >
        <button 
          onClick={onCancel}
          className="absolute top-6 right-6 p-2 hover:bg-[#F0F0F0] rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5 text-[#999]" />
        </button>

        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center border-2 border-green-100 shadow-md overflow-hidden">
              <img 
                src={appConfig.logo} 
                alt="Logo" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = logo;
                }}
              />
            </div>
          </div>
          {/* Progress Bar */}
          <div className="flex gap-2 mb-8">
            {steps.filter(s => s !== 'success').map((s, i) => (
              <div 
                key={s} 
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i <= currentStepIndex ? 'bg-green-700' : 'bg-[#F0F0F0]'
                }`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 'phone' && (
              <motion.div
                key="phone"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="w-16 h-16 bg-green-50 text-green-700 rounded-2xl flex items-center justify-center">
                  <Smartphone className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Registration</h2>
                  <p className="text-[#666] text-sm mt-2 leading-relaxed">
                    Enter your details to create your {appConfig.name} account.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#999]">
                      <User className="w-4 h-4" />
                    </div>
                    <input 
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-[#F8F9FA] border border-[#E5E5E5] rounded-2xl text-lg font-bold focus:outline-none focus:border-green-700 transition-colors"
                      placeholder="Full Name"
                    />
                  </div>

                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#999]">
                      <FileText className="w-4 h-4" />
                    </div>
                    <input 
                      type="text"
                      value={nrcNumber}
                      onChange={(e) => setNrcNumber(e.target.value.replace(/[^0-9/]/g, ''))}
                      className="w-full pl-12 pr-4 py-4 bg-[#F8F9FA] border border-[#E5E5E5] rounded-2xl text-lg font-bold focus:outline-none focus:border-green-700 transition-colors"
                      placeholder="NRC Number (e.g. 123456/78/1)"
                    />
                  </div>

                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 border-r border-[#E5E5E5] pr-3">
                      <span className="text-sm font-bold text-[#1A1A1A]">+260</span>
                    </div>
                    <input 
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-20 pr-4 py-4 bg-[#F8F9FA] border border-[#E5E5E5] rounded-2xl text-lg font-bold tracking-widest focus:outline-none focus:border-green-700 transition-colors"
                      placeholder="971234567"
                    />
                  </div>

                  <div className="flex items-start gap-3 p-2">
                    <input 
                      type="checkbox" 
                      id="terms"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-gray-300 text-green-700 focus:ring-green-700"
                    />
                    <label htmlFor="terms" className="text-[11px] text-[#666] leading-tight">
                      I agree to the <button onClick={() => setShowTermsModal(true)} className="text-green-700 font-bold hover:underline">Terms of Service</button> and <button onClick={() => setShowTermsModal(true)} className="text-green-700 font-bold hover:underline">Privacy Policy</button>.
                    </label>
                  </div>
                </div>
                <button 
                  onClick={handlePhoneSubmit}
                  disabled={phoneNumber.length < 9 || !userName || !nrcNumber || !acceptedTerms || isLoading}
                  className="w-full bg-green-700 disabled:bg-gray-300 hover:bg-green-800 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-green-700/20"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      Send OTP
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#F0F0F0]"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-bold">
                    <span className="bg-white px-2 text-[#999]">Or</span>
                  </div>
                </div>

                <button 
                  onClick={onCancel}
                  className="w-full bg-[#F8F9FA] hover:bg-[#F0F0F0] text-[#1A1A1A] py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all border border-[#E5E5E5]"
                >
                  Continue as Guest
                </button>
              </motion.div>
            )}

            {step === 'otp' && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="w-16 h-16 bg-green-50 text-green-700 rounded-2xl flex items-center justify-center">
                  <Shield className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Verify OTP</h2>
                  <p className="text-[#666] text-sm mt-2 leading-relaxed">
                    Enter the 6-digit code sent to <span className="font-bold text-[#1A1A1A]">+260 {phoneNumber}</span>
                  </p>
                  {generatedOtp && (
                    <div className="mt-2 p-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold text-center border border-blue-200">
                      OTP: {generatedOtp}
                    </div>
                  )}
                </div>
                {otpError && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold border border-red-100">
                    {otpError}
                  </div>
                )}
                <div className="flex justify-between gap-2">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      className="w-12 h-14 bg-[#F8F9FA] border border-[#E5E5E5] rounded-xl text-center text-xl font-bold focus:outline-none focus:border-green-700 transition-colors"
                    />
                  ))}
                </div>
                <div className="text-center">
                  <button 
                    onClick={() => {
                      if (resendTimer === 0) {
                        const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
                        setGeneratedOtp(newOtp);
                        setResendTimer(60);
                      }
                    }}
                    disabled={resendTimer > 0}
                    className={`text-xs font-bold ${resendTimer > 0 ? 'text-gray-400' : 'text-green-700 hover:underline'}`}
                  >
                    {resendTimer > 0 ? `Resend Code in 0:${resendTimer.toString().padStart(2, '0')}` : 'Resend Code'}
                  </button>
                </div>
                <button 
                  onClick={handleOtpSubmit}
                  disabled={!otp.every(d => d !== '')}
                  className="w-full bg-green-700 disabled:bg-gray-300 hover:bg-green-800 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-green-700/20"
                >
                  Verify Code
                </button>
              </motion.div>
            )}

            {step === 'password' && (
              <motion.div
                key="password"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="w-16 h-16 bg-green-50 text-green-700 rounded-2xl flex items-center justify-center">
                  <Lock className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Set Password</h2>
                  <p className="text-[#666] text-sm mt-2 leading-relaxed">
                    Create a strong password to secure your account.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-4 bg-[#F8F9FA] border border-[#E5E5E5] rounded-2xl text-lg font-medium focus:outline-none focus:border-green-700 transition-colors"
                      placeholder="Enter password"
                    />
                    <button 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#666]"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  <div className="space-y-3">
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4].map((s) => (
                        <div 
                          key={s}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                            s <= passwordStrength 
                              ? passwordStrength === 1 ? 'bg-red-500' 
                                : passwordStrength === 2 ? 'bg-orange-400'
                                : passwordStrength === 3 ? 'bg-yellow-400'
                                : 'bg-green-500'
                              : 'bg-[#F0F0F0]'
                          }`}
                        />
                      ))}
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {['Length', 'Uppercase', 'Number', 'Special'].map((label, i) => {
                        const requirements = [
                          password.length >= 8,
                          /[A-Z]/.test(password),
                          /[0-9]/.test(password),
                          /[^A-Za-z0-9]/.test(password)
                        ];
                        const met = requirements[i];
                        return (
                          <div key={label} className={`flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-colors ${met ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}`}>
                            {met ? <CheckCircle2 className="w-2.5 h-2.5" /> : <AlertCircle className="w-2.5 h-2.5" />}
                            {label}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                      <span className={
                        passwordStrength <= 1 ? 'text-red-500' : 
                        passwordStrength === 2 ? 'text-orange-500' :
                        passwordStrength === 3 ? 'text-yellow-600' : 
                        'text-green-600'
                      }>
                        Strength: {
                          passwordStrength <= 1 ? 'Weak' : 
                          passwordStrength === 2 ? 'Fair' :
                          passwordStrength === 3 ? 'Good' : 
                          'Excellent'
                        }
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={handlePasswordSubmit}
                  disabled={passwordStrength < 3}
                  className="w-full bg-green-700 disabled:bg-gray-300 hover:bg-green-800 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-green-700/20"
                >
                  Continue
                </button>
              </motion.div>
            )}

            {step === 'pin' && (
              <motion.div
                key="pin"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="w-16 h-16 bg-green-50 text-green-700 rounded-2xl flex items-center justify-center">
                  <Lock className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Create 4-Digit PIN</h2>
                  <p className="text-[#666] text-sm mt-2 leading-relaxed">
                    Create a 4-digit PIN for quick and secure login.
                  </p>
                </div>
                <div className="flex justify-center gap-4">
                  {pin.map((digit, i) => (
                    <input
                      key={i}
                      id={`pin-${i}`}
                      type="password"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handlePinChange(i, e.target.value)}
                      className="w-14 h-16 bg-[#F8F9FA] border border-[#E5E5E5] rounded-2xl text-center text-2xl font-bold focus:outline-none focus:border-green-700 transition-colors"
                    />
                  ))}
                </div>
                <button 
                  onClick={handlePinSubmit}
                  disabled={!pin.every(d => d !== '')}
                  className="w-full bg-green-700 disabled:bg-gray-300 hover:bg-green-800 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-green-700/20"
                >
                  Continue
                </button>
              </motion.div>
            )}

            {step === 'nrc' && (
              <motion.div
                key="nrc"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="w-16 h-16 bg-green-50 text-green-700 rounded-2xl flex items-center justify-center">
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Upload NRC</h2>
                  <p className="text-[#666] text-sm mt-2 leading-relaxed">
                    Please upload clear photos of both the front and back of your NRC.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-[#999] uppercase tracking-widest text-center">Front</p>
                    <div className="aspect-[1.6/1] bg-[#F8F9FA] rounded-2xl border-2 border-dashed border-[#E5E5E5] flex items-center justify-center overflow-hidden relative">
                      {nrcFront ? (
                        <img 
                          src={nrcFront} 
                          alt="NRC Front" 
                          className="w-full h-full object-cover" 
                          onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/600x400?text=Image+Error"; }}
                        />
                      ) : (
                        <Upload className="w-6 h-6 text-[#999]" />
                      )}
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleNrcFrontUpload} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-[#999] uppercase tracking-widest text-center">Back</p>
                    <div className="aspect-[1.6/1] bg-[#F8F9FA] rounded-2xl border-2 border-dashed border-[#E5E5E5] flex items-center justify-center overflow-hidden relative">
                      {nrcBack ? (
                        <img 
                          src={nrcBack} 
                          alt="NRC Back" 
                          className="w-full h-full object-cover" 
                          onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/600x400?text=Image+Error"; }}
                        />
                      ) : (
                        <Upload className="w-6 h-6 text-[#999]" />
                      )}
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleNrcBackUpload} />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setStep('passport')}
                  disabled={!nrcFront || !nrcBack}
                  className="w-full bg-green-700 disabled:bg-gray-300 hover:bg-green-800 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-green-700/20"
                >
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </button>
              </motion.div>
            )}

            {step === 'passport' && (
              <motion.div
                key="passport"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="w-16 h-16 bg-green-50 text-green-700 rounded-2xl flex items-center justify-center">
                  <FileText className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Passport Photo</h2>
                  <p className="text-[#666] text-sm mt-2 leading-relaxed">
                    Please upload a clear passport-sized photo for your digital banking profile.
                  </p>
                </div>
                
                <div className="aspect-square w-48 mx-auto bg-[#F8F9FA] rounded-3xl border-2 border-dashed border-[#E5E5E5] flex items-center justify-center overflow-hidden relative">
                  {passportPhoto ? (
                    <img 
                      src={passportPhoto} 
                      alt="Passport" 
                      className="w-full h-full object-cover" 
                      onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/600x400?text=Image+Error"; }}
                    />
                  ) : (
                    <Upload className="w-8 h-8 text-[#999]" />
                  )}
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handlePassportUpload} />
                </div>

                <button 
                  onClick={() => setStep('selfie')}
                  disabled={!passportPhoto}
                  className="w-full bg-green-700 disabled:bg-gray-300 hover:bg-green-800 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-green-700/20"
                >
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </button>
              </motion.div>
            )}

            {step === 'selfie' && (
              <motion.div
                key="selfie"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="w-16 h-16 bg-green-50 text-green-700 rounded-2xl flex items-center justify-center">
                  <Camera className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Take a Selfie</h2>
                  <p className="text-[#666] text-sm mt-2 leading-relaxed">
                    We need a live photo of you to match with your NRC. Ensure your face is clearly visible.
                  </p>
                </div>
                <div className="aspect-square bg-[#F8F9FA] rounded-3xl border-2 border-dashed border-[#E5E5E5] flex items-center justify-center overflow-hidden relative">
                  {selfiePhoto ? (
                    <img 
                      src={selfiePhoto} 
                      alt="Selfie Preview" 
                      className="w-full h-full object-cover" 
                      onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/600x400?text=Image+Error"; }}
                    />
                  ) : (
                    <div className="text-center">
                      <Camera className="w-12 h-12 text-[#999] mx-auto mb-2" />
                      <p className="text-[10px] font-bold text-[#999] uppercase tracking-widest">Face not captured</p>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <input 
                    type="file" 
                    id="selfie-capture" 
                    className="hidden" 
                    accept="image/*"
                    capture="user"
                    onChange={handleSelfieCapture}
                  />
                  <label 
                    htmlFor="selfie-capture"
                    className="w-full bg-[#F8F9FA] border border-[#E5E5E5] text-[#1A1A1A] py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all cursor-pointer hover:bg-[#F0F0F0]"
                  >
                    <Camera className="w-5 h-5" />
                    {selfiePhoto ? 'Retake Selfie' : 'Capture Selfie'}
                  </label>

                  <button 
                    onClick={handleCompleteRegistration}
                    disabled={!selfiePhoto || isLoading}
                    className="w-full bg-green-700 disabled:bg-gray-300 hover:bg-green-800 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-green-700/20"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        Complete Registration
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6 py-8"
              >
                <div className="w-20 h-20 bg-green-50 text-green-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Registration Successful!</h2>
                  <p className="text-[#666] text-sm mt-2 leading-relaxed">
                    Welcome to {appConfig.name}. Redirecting you to your dashboard...
                  </p>
                </div>
                <div className="flex justify-center">
                  <div className="w-8 h-8 border-4 border-green-700 border-t-transparent rounded-full animate-spin"></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="text-center pt-8 pb-4">
            <p className="text-[10px] text-[#999] font-bold uppercase tracking-widest">Developed By DMI GROUP</p>
          </div>
        </div>
      </motion.div>

      {/* Terms Modal */}
      <AnimatePresence>
        {showTermsModal && (
          <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl relative max-h-[80vh] flex flex-col"
            >
              <button 
                onClick={() => setShowTermsModal(false)}
                className="absolute top-6 right-6 p-2 hover:bg-[#F0F0F0] rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-[#999]" />
              </button>
              
              <div className="mb-6">
                <h2 className="text-2xl font-bold">Terms & Privacy</h2>
                <p className="text-[#666] text-xs mt-1">Last updated: February 2026</p>
              </div>

              <div className="flex-1 overflow-y-auto pr-4 space-y-6 text-sm text-[#444] leading-relaxed">
                <section>
                  <h3 className="font-bold text-[#1A1A1A] mb-2">1. Introduction</h3>
                  <p>Welcome to {appConfig.name}. By registering an account, you agree to comply with our terms of service and privacy policy. We are committed to protecting your financial data.</p>
                </section>
                <section>
                  <h3 className="font-bold text-[#1A1A1A] mb-2">2. KYC Verification</h3>
                  <p>To prevent fraud and comply with Zambian financial regulations, we require valid NRC documentation and a live selfie. Your data is encrypted and used only for identity verification.</p>
                </section>
                <section>
                  <h3 className="font-bold text-[#1A1A1A] mb-2">3. Loan Terms</h3>
                  <p>All loans are subject to approval. Interest rates and repayment periods are clearly stated during the application process. Failure to repay may affect your credit score.</p>
                </section>
                <section>
                  <h3 className="font-bold text-[#1A1A1A] mb-2">4. Privacy Policy</h3>
                  <p>We do not share your personal information with third parties except as required by law. We use your location data to verify "Digital Connection" security during transactions.</p>
                </section>
              </div>

              <button 
                onClick={() => {
                  setAcceptedTerms(true);
                  setShowTermsModal(false);
                }}
                className="w-full bg-green-700 text-white py-4 rounded-2xl font-bold mt-8 shadow-lg shadow-green-700/20"
              >
                I Accept the Terms
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RegistrationFlow;
