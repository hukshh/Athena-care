import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Send, Bot, User, Trash2, Mic, MicOff, ChevronRight, AlertCircle
} from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { chatAPI } from '../../services/api';
import toast from 'react-hot-toast';

const SUGGESTED_PROMPTS = [
  'What are the best hospitals for cardiac surgery in India?',
  'How much does knee replacement cost in Thailand?',
  'What visa do I need for medical treatment in Turkey?',
  'What is the recovery time after liver transplant?',
  'Compare treatment costs between India and Singapore',
  'What documents do I need for medical tourism?',
];

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  content: `Hello! I'm AthenaCare AI, your intelligent healthcare assistant powered by RAG (Retrieval-Augmented Generation).

I can help you with:
• **Hospital recommendations** across 89 countries
• **Treatment cost estimates** and comparisons
• **Visa and travel requirements** for medical tourism
• **Recovery timelines** and post-treatment care
• **Doctor specialization** and credentials

What would you like to know about your medical journey?`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

const TypingIndicator = () => (
  <div className="flex items-center gap-3 p-2">
    <div className="w-8 h-8 bg-sky-500/20 rounded-full flex items-center justify-center flex-shrink-0">
      <Bot className="w-4 h-4 text-sky-400" />
    </div>
    <div className="bg-slate-800/80 rounded-2xl rounded-tl-sm px-4 py-3">
      <div className="typing-indicator flex items-center gap-1">
        <span /><span /><span />
      </div>
    </div>
  </div>
);

const renderContent = (content) => {
  return content.split('\n').map((line, i) => {
    if (!line) return <br key={i} />;
    if (line.includes('**')) {
      const parts = line.split('**');
      return (
        <p key={i} className="mb-0.5">
          {parts.map((part, j) =>
            j % 2 === 1
              ? <strong key={j} className="text-white font-semibold">{part}</strong>
              : part
          )}
        </p>
      );
    }
    if (line.startsWith('• ')) {
      return (
        <p key={i} className="flex items-start gap-1.5 mb-0.5">
          <span className="text-sky-400 mt-0.5 flex-shrink-0">•</span>
          <span>{line.slice(2)}</span>
        </p>
      );
    }
    return <p key={i} className="mb-0.5">{line}</p>;
  });
};

const MessageBubble = ({ message }) => {
  const isBot = message.role === 'assistant';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-3 ${isBot ? '' : 'flex-row-reverse'}`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isBot ? 'bg-sky-500/20' : 'bg-violet-500/20'}`}>
        {isBot ? <Bot className="w-4 h-4 text-sky-400" /> : <User className="w-4 h-4 text-violet-400" />}
      </div>
      <div className={`max-w-[78%] ${isBot ? '' : 'items-end flex flex-col'}`}>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isBot
            ? 'bg-slate-800/80 text-slate-200 rounded-tl-sm'
            : 'bg-sky-500/20 text-sky-100 border border-sky-500/20 rounded-tr-sm'
        }`}>
          {renderContent(message.content)}
        </div>
        {message.sources?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5 px-1">
            {message.sources.map((s, i) => (
              <span key={i} className="text-xs text-slate-600 bg-slate-800/50 px-2 py-0.5 rounded-full">
                📚 {s.title || s.category}
              </span>
            ))}
          </div>
        )}
        <span className="text-slate-600 text-xs mt-1 px-1">{message.timestamp}</span>
      </div>
    </motion.div>
  );
};

const ChatbotPage = () => {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [apiError, setApiError] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Load chat history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await chatAPI.getHistory();
        const history = res.data?.messages || [];
        if (history.length > 0) {
          const formatted = history.map((m) => ({
            id: m.id || m._id,
            role: m.role,
            content: m.content,
            sources: m.sources || [],
            timestamp: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }));
          setMessages([WELCOME_MESSAGE, ...formatted]);
        }
      } catch {
        // No history yet — that's fine
      }
    };
    loadHistory();
  }, []);

  const handleSend = useCallback(async (text = input) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setApiError(false);

    try {
      // Build history for context (last 6 messages, excluding welcome)
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await chatAPI.sendMessage({
        message: trimmed,
        history,
      });

      const botMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.data?.answer || 'I could not generate a response. Please try again.',
        sources: res.data?.sources || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setApiError(true);
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I\'m having trouble connecting to the AI service right now. Please check that the backend is running and try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping, messages]);

  const handleClear = async () => {
    try {
      await chatAPI.clearHistory();
    } catch { /* ignore */ }
    setMessages([WELCOME_MESSAGE]);
    setApiError(false);
    toast.success('Chat cleared');
  };

  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast.error('Voice input not supported in this browser');
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (e) => {
      setInput(e.results[0][0].transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">AI Healthcare Assistant</h1>
            <p className="text-slate-400 text-sm mt-0.5">Powered by LangChain + FAISS RAG</p>
          </div>
          <div className="flex items-center gap-2">
            {apiError ? (
              <span className="badge-red flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Backend Error
              </span>
            ) : (
              <span className="badge-green flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Online
              </span>
            )}
            <button onClick={handleClear} className="btn-ghost flex items-center gap-1 text-sm">
              <Trash2 className="w-4 h-4" /> Clear
            </button>
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex-1 glass-card overflow-hidden flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompts — show when only welcome message */}
          {messages.length <= 1 && (
            <div className="px-4 pb-3 border-t border-slate-800/30 pt-3">
              <p className="text-slate-500 text-xs mb-2">Suggested questions:</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_PROMPTS.slice(0, 3).map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    className="text-xs bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 px-3 py-1.5 rounded-full border border-slate-700/50 hover:border-sky-500/30 transition-all flex items-center gap-1"
                  >
                    <ChevronRight className="w-3 h-3 text-sky-400 flex-shrink-0" />
                    {prompt.length > 45 ? prompt.slice(0, 45) + '...' : prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-slate-800/50 p-4">
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ask about hospitals, treatments, costs, visa requirements..."
                  className="input-field resize-none min-h-[48px] max-h-32 py-3 pr-12"
                  rows={1}
                />
                <button
                  onClick={toggleVoice}
                  className={`absolute right-3 bottom-3 transition-colors ${isListening ? 'text-red-400 animate-pulse' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping}
                className="btn-primary p-3 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-slate-600 text-xs mt-2 text-center">
              AthenaCare AI · RAG-grounded responses · Not a substitute for professional medical advice
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ChatbotPage;
