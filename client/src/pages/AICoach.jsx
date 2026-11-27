import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Trash2, Sparkles, User, MessageSquare } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../AuthContext';

const SUGGESTIONS = [
  'What if I miss a workout?',
  'How to improve my bench press?',
  'Modify workout for home',
  'Why am I not seeing results?',
  'Recovery tips',
  'Diet advice for my goals',
];

function formatMessageTime(timestamp) {
  if (!timestamp) return '';
  let date;
  if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(timestamp)) {
    date = new Date(timestamp.replace(' ', 'T') + 'Z');
  } else {
    date = new Date(timestamp);
  }
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function AICoach() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [historyLoading, setHistoryLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState('');

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    let isMounted = true;

    async function fetchHistory() {
      try {
        setHistoryLoading(true);
        setError('');
        const data = await api.getAIHistory();
        if (!isMounted) return;
        const conversations = Array.isArray(data?.conversations) ? data.conversations : [];
        setMessages(
          conversations.map((msg, idx) => ({
            id: msg.id || `hist-${idx}-${msg.created_at || Date.now()}`,
            role: msg.role,
            content: msg.content,
            created_at: msg.created_at || new Date().toISOString(),
          }))
        );
      } catch (err) {
        if (!isMounted) return;
        setError(err.message || 'Failed to load conversation history.');
      } finally {
        if (isMounted) setHistoryLoading(false);
      }
    }

    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!historyLoading) {
      scrollToBottom(messages.length <= 1 ? 'auto' : 'smooth');
    }
  }, [messages, sending, historyLoading]);

  const sendMessage = async (textOverride) => {
    const trimmed = (typeof textOverride === 'string' ? textOverride : input).trim();
    if (!trimmed || sending) return;

    setError('');
    if (typeof textOverride !== 'string') {
      setInput('');
    }

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setSending(true);

    try {
      const data = await api.chatWithAI(trimmed);
      const aiMsg = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data?.reply || 'I could not generate a response right now. Please try again.',
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setError(err.message || 'Failed to get a response from FitCoach AI.');
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleClearHistory = async () => {
    if (clearing || messages.length === 0) return;
    try {
      setClearing(true);
      setError('');
      await api.clearAIHistory();
      setMessages([]);
    } catch (err) {
      setError(err.message || 'Failed to clear conversation history.');
    } finally {
      setClearing(false);
    }
  };

  const firstName = user?.full_name?.split(' ')[0];

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] w-full bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="shrink-0 bg-gray-900/90 backdrop-blur-md border-b border-gray-800 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-semibold text-white truncate">
                FitCoach AI
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                <Sparkles className="w-3 h-3" />
                Coach
              </span>
            </div>
            <p className="text-xs text-gray-400 truncate">
              Personalized training, form &amp; nutrition guidance
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClearHistory}
          disabled={clearing || messages.length === 0 || historyLoading}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer"
        >
          <Trash2 className="w-4 h-4 text-gray-400" />
          <span>{clearing ? 'Clearing...' : 'Clear History'}</span>
        </button>
      </header>

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="shrink-0 mx-4 sm:mx-6 mt-3 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs sm:text-sm flex items-center justify-between gap-3"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError('')}
              className="text-red-400 hover:text-red-200 font-medium shrink-0 cursor-pointer"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scrollable Messages Area */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-5 space-y-4">
        {historyLoading ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-400">
            <div className="w-10 h-10 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin" />
            <p className="text-sm">Loading your coaching conversation...</p>
          </div>
        ) : messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto px-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-gray-900 border border-emerald-500/30 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/5">
              <MessageSquare className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              {firstName ? `Welcome back, ${firstName}!` : 'Welcome to FitCoach AI'}
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed mb-5">
              I know your fitness profile, workout plan, and goals. Ask a question below or pick a quick topic to get personalized coaching advice.
            </p>
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs text-emerald-400">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Try asking about workouts, recovery, form, or nutrition</span>
            </div>
          </motion.div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              const timeLabel = formatMessageTime(msg.created_at);

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className={`flex items-end gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-full bg-gray-800 border border-emerald-500/30 flex items-center justify-center shrink-0 mb-1 shadow-sm">
                      <Bot className="w-4 h-4 text-emerald-400" />
                    </div>
                  )}

                  <div
                    className={`flex flex-col max-w-[82%] sm:max-w-[72%] ${
                      isUser ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`px-4 py-3 text-sm sm:text-[15px] leading-relaxed whitespace-pre-wrap break-words shadow-md ${
                        isUser
                          ? 'bg-emerald-600 text-white rounded-2xl rounded-br-md shadow-emerald-950/30'
                          : 'bg-gray-800 text-gray-100 rounded-2xl rounded-bl-md border border-gray-700/60 shadow-black/20'
                      }`}
                    >
                      {msg.content}
                    </div>
                    {timeLabel && (
                      <span className="mt-1 px-1 text-[11px] text-gray-500">
                        {timeLabel}
                      </span>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-full bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center shrink-0 mb-1">
                      <User className="w-4 h-4 text-emerald-400" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}

        {/* Loading indicator when waiting for AI response */}
        {sending && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-end gap-2.5 justify-start"
          >
            <div className="w-8 h-8 rounded-full bg-gray-800 border border-emerald-500/30 flex items-center justify-center shrink-0 mb-1">
              <Bot className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="bg-gray-800 border border-gray-700/60 rounded-2xl rounded-bl-md px-4 py-3.5 shadow-md flex items-center gap-1.5">
              {[0, 1, 2].map((dot) => (
                <motion.span
                  key={dot}
                  className="w-2 h-2 rounded-full bg-emerald-400"
                  animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
                  transition={{
                    duration: 0.9,
                    repeat: Infinity,
                    delay: dot * 0.18,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Sticky Bottom Suggestions + Input Bar */}
      <div className="sticky bottom-0 shrink-0 bg-gray-900/95 backdrop-blur-md border-t border-gray-800 px-4 sm:px-6 pt-3 pb-4 space-y-3">
        {/* Horizontal Scrollable Quick Suggestion Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {SUGGESTIONS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => sendMessage(chip)}
              disabled={sending || historyLoading}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-emerald-300 border border-gray-700 hover:border-emerald-500/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Row */}
        <div className="flex items-center gap-2.5">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
            placeholder="Ask FitCoach AI anything about your workouts, form, or nutrition..."
            className="flex-1 min-w-0 bg-gray-950 text-gray-100 placeholder-gray-500 text-sm sm:text-base rounded-xl px-4 py-3 border border-gray-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-colors disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => sendMessage()}
            disabled={!input.trim() || sending}
            aria-label="Send message"
            className="shrink-0 inline-flex items-center justify-center w-11 h-11 sm:w-auto sm:px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-emerald-500/15"
          >
            <Send className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline text-sm">Send</span>
          </button>
        </div>
      </div>
    </div>
  );
}
