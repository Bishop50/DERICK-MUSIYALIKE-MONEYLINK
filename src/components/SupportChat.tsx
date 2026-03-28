import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, X, User, Shield, Cpu, Sparkles, Mic, Play, Pause, Square } from 'lucide-react';
import { ChatMessage, User as UserType } from '../types';
import { generateAIResponse } from '../services/aiService';
import { toast } from 'sonner';

interface SupportChatProps {
  currentUser: UserType | null;
  role?: 'user' | 'admin' | 'developer' | 'agent';
  config: any;
  receiverId?: string;
  inline?: boolean;
}

const SupportChat: React.FC<SupportChatProps> = ({ currentUser, role = 'user', config, receiverId, inline = false }) => {
  const [isOpen, setIsOpen] = useState(inline);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isVoiceNoteMode, setIsVoiceNoteMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const chatId = receiverId || (role === 'user' ? (currentUser?.id || 'guest') : role);

  useEffect(() => {
    if (inline) setIsOpen(true);
  }, [inline]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.interimResults = false;
      recognitionRef.current.maxAlternatives = 1;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setNewMessage(transcript);
        setIsRecording(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };
    }
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/chat-messages?chatId=${chatId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.length === 0 && role === 'user') {
            const welcomeMsg: ChatMessage = {
              id: 'welcome',
              senderId: 'admin',
              receiverId: chatId,
              text: `Hello! How can we help you today?`,
              timestamp: new Date().toISOString(),
              isAdmin: true
            };
            setMessages([welcomeMsg]);
          } else {
            setMessages(data);
          }
        } else {
          fallbackToLocal();
        }
      } catch (error) {
        console.error('Failed to fetch chat messages via API, falling back to local storage', error);
        fallbackToLocal();
      }
    };

    const fallbackToLocal = () => {
      const storedMessages = JSON.parse(localStorage.getItem(`moneylink_chats_${chatId}`) || '[]');
      if (storedMessages.length === 0 && role === 'user') {
        const welcomeMsg: ChatMessage = {
          id: 'welcome',
          senderId: 'admin',
          receiverId: chatId,
          text: `Hello! How can we help you today?`,
          timestamp: new Date().toISOString(),
          isAdmin: true
        };
        setMessages([welcomeMsg]);
      } else {
        setMessages(storedMessages);
      }
    };

    fetchMessages();
  }, [chatId, isOpen, role, config.appName]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const startVoiceNote = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          sendVoiceNote(base64Audio);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsVoiceNoteMode(true);
    } catch (error) {
      console.error('Error starting voice note:', error);
      toast.error('Could not access microphone');
    }
  };

  const stopVoiceNote = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsVoiceNoteMode(false);
    }
  };

  const sendVoiceNote = async (base64Audio: string) => {
    const senderId = role === 'user' ? (currentUser?.id || 'guest') : role;
    const finalReceiverId = receiverId || (role === 'user' ? 'admin' : 'user');

    const msg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: senderId,
      receiverId: finalReceiverId,
      audio: base64Audio,
      timestamp: new Date().toISOString(),
      isAdmin: role !== 'user'
    };

    const updatedMessages = [...messages, msg];
    setMessages(updatedMessages);
    localStorage.setItem(`moneylink_chats_${chatId}`, JSON.stringify(updatedMessages));
    
    try {
      await fetch(`/api/chat-messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...msg, chatId })
      });
    } catch (error) {
      console.error('Failed to save voice note via API', error);
    }
  };

  const toggleRecording = () => {
    if (!isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsRecording(true);
      } else {
        toast.error('Speech recognition not supported in this browser.');
      }
    } else {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }
  };

  const handleSendMessage = async () => {
    const textToSend = newMessage.trim();
    if (!textToSend) return;

    const senderId = role === 'user' ? (currentUser?.id || 'guest') : role;
    const finalReceiverId = receiverId || (role === 'user' ? 'admin' : 'ai');

    const msg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: senderId,
      receiverId: finalReceiverId,
      text: textToSend,
      timestamp: new Date().toISOString(),
      isAdmin: role !== 'user'
    };

    // Optimistic update
    const updatedMessages = [...messages, msg];
    setMessages(updatedMessages);
    localStorage.setItem(`moneylink_chats_${chatId}`, JSON.stringify(updatedMessages));
    setNewMessage('');
    
    // Save user message in background
    try {
      await fetch(`/api/chat-messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...msg, chatId })
      });
    } catch (error) {
      console.error('Failed to save message via API', error);
    }

    if (role !== 'user') {
      setIsTyping(true);
      const context = `User Role: ${role}. User Name: ${currentUser?.name || 'Guest'}. Platform: ${config.appName} (Derick Musiyalike Institution). You are helping the staff member write a professional response or perform a task.`;
      
      try {
        const [aiText] = await Promise.all([
          generateAIResponse(textToSend, context),
          new Promise(resolve => setTimeout(resolve, 1500))
        ]);

        const aiMsg: ChatMessage = {
          id: Math.random().toString(36).substr(2, 9),
          senderId: 'ai',
          receiverId: senderId,
          text: aiText,
          timestamp: new Date().toISOString(),
          isAdmin: true
        };

        const finalMessages = [...updatedMessages, aiMsg];
        setMessages(finalMessages);
        localStorage.setItem(`moneylink_chats_${chatId}`, JSON.stringify(finalMessages));
        
        fetch(`/api/chat-messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...aiMsg, chatId })
        }).catch(error => console.error('Failed to save AI message via API', error));
      } catch (error) {
        console.error('AI generation failed', error);
      } finally {
        setIsTyping(false);
      }
    }
  };

  const useAiResponse = (text: string) => {
    setNewMessage(text);
  };

  const getHeaderColor = () => {
    if (role === 'developer') return 'bg-blue-600';
    if (role === 'admin' || role === 'agent') return 'bg-purple-600';
    return 'bg-green-700';
  };

  const getButtonColor = () => {
    if (role === 'developer') return 'bg-blue-600';
    if (role === 'admin' || role === 'agent') return 'bg-purple-600';
    return 'bg-green-700';
  };

  const AudioPlayer: React.FC<{ src: string, isAdmin: boolean }> = ({ src, isAdmin }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const togglePlay = () => {
      if (audioRef.current) {
        if (isPlaying) {
          audioRef.current.pause();
        } else {
          audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
      }
    };

    return (
      <div className={`flex items-center gap-3 p-2 rounded-xl ${isAdmin ? 'bg-gray-100' : 'bg-white/20'}`}>
        <button 
          onClick={togglePlay}
          className={`w-8 h-8 rounded-full flex items-center justify-center ${isAdmin ? 'bg-purple-600 text-white' : 'bg-white text-green-700'}`}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>
        <div className="flex-1 h-1 bg-gray-300 rounded-full overflow-hidden">
          <motion.div 
            initial={{ scaleX: 0 }}
            animate={{ scaleX: isPlaying ? 1 : 0 }}
            transition={{ duration: 10, ease: "linear" }} // Mock progress
            className={`h-full origin-left ${isAdmin ? 'bg-purple-600' : 'bg-white'}`}
          />
        </div>
        <audio 
          ref={audioRef} 
          src={src} 
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      </div>
    );
  };

  if (!currentUser && role === 'user') return null;

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-24 right-6 w-14 h-14 ${getButtonColor()} text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-[100] border-4 border-white`}
      >
        <Sparkles className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></span>
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-24 right-6 w-[320px] h-[450px] bg-white rounded-[2rem] shadow-2xl z-[101] flex flex-col overflow-hidden border border-[#E5E5E5]"
          >
            {/* Header */}
            <div className={`${getHeaderColor()} p-4 text-white flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  {role === 'user' ? <MessageSquare className="w-4 h-4" /> : <Cpu className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-xs font-bold">{role === 'user' ? 'Support Chat' : 'AI Real Assist'}</p>
                  <p className="text-[8px] opacity-60 uppercase tracking-widest">{role === 'user' ? 'Chat with Admin' : 'Powered by Gemini'}</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#F8F9FA]"
            >
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.isAdmin ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-[11px] font-medium ${
                    msg.isAdmin 
                      ? 'bg-white border border-[#E5E5E5] rounded-tl-none text-[#1A1A1A]' 
                      : `${getButtonColor()} text-white rounded-tr-none`
                  }`}>
                    {msg.audio ? (
                      <AudioPlayer src={msg.audio} isAdmin={msg.isAdmin} />
                    ) : (
                      msg.text
                    )}
                    {msg.senderId === 'ai' && (role === 'admin' || role === 'agent') && (
                      <button 
                        onClick={() => useAiResponse(msg.text || '')}
                        className="mt-2 block w-full py-1 bg-purple-50 text-purple-600 rounded-lg text-[8px] font-bold hover:bg-purple-600 hover:text-white transition-all"
                      >
                        USE_THIS_RESPONSE
                      </button>
                    )}
                    <p className={`text-[8px] mt-1 ${msg.isAdmin ? 'text-[#999]' : 'text-white/60'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-[#E5E5E5] p-3 rounded-2xl rounded-tl-none flex gap-1">
                    <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1 h-1 bg-gray-400 rounded-full" />
                    <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1 h-1 bg-gray-400 rounded-full" />
                    <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1 h-1 bg-gray-400 rounded-full" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-[#F0F0F0] flex gap-2">
              <div className="flex gap-1">
                <button 
                  onClick={toggleRecording}
                  title="Speech to Text"
                  className={`p-2 rounded-xl transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-[#F8F9FA] text-gray-400 hover:text-green-700'}`}
                >
                  <Mic className="w-4 h-4" />
                </button>
                <button 
                  onClick={isVoiceNoteMode ? stopVoiceNote : startVoiceNote}
                  title="Record Voice Note"
                  className={`p-2 rounded-xl transition-all ${isVoiceNoteMode ? 'bg-red-600 text-white animate-pulse' : 'bg-[#F8F9FA] text-gray-400 hover:text-blue-600'}`}
                >
                  {isVoiceNoteMode ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4 text-blue-500" />}
                </button>
              </div>
              <input 
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={isRecording ? "Listening..." : isVoiceNoteMode ? "Recording..." : "Ask AI anything..."}
                className="flex-1 bg-[#F8F9FA] border border-[#E5E5E5] rounded-xl px-4 py-2 text-xs outline-none focus:border-green-700"
              />
              <button 
                onClick={handleSendMessage}
                className={`p-2 ${getButtonColor()} text-white rounded-xl hover:opacity-90`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SupportChat;

