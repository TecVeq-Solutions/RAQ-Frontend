'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User } from '@/types/auth';
import { AiMessage, AiPendingAction } from '@/types/ai';
import aiService from '@/lib/aiService';
import {
  Sparkles,
  X,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Bot,
  User as UserIcon,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Package,
  FileText,
  DollarSign,
  Info
} from 'lucide-react';

interface AiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export default function AiAssistantDrawer({
  isOpen,
  onClose,
  user,
}: AiAssistantDrawerProps) {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmingToken, setConfirmingToken] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0 && user) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `Hello **${user.name}**! 👋 I am your **Tecveq AI Assistant**.\n\nYou are logged in with the **${user.role.toUpperCase()}** role. How can I help you with your ERP operations today?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [user]);

  // Focus input when drawer opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
      scrollToBottom();
    }
  }, [isOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || loading) return;

    const userMsg: AiMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputMessage('');
    setLoading(true);

    try {
      // Build conversation history format for API
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res = await aiService.sendMessage(textToSend.trim(), history);

      const assistantMsg: AiMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: res.response || (res.pending_action ? 'Please review and confirm this action before I proceed:' : 'Action completed.'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        pending_action: res.pending_action,
        executed_tools: res.executed_tools,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorText = err.response?.data?.error || err.response?.data?.message || 'Unable to connect to the AI Agent. Please verify server connectivity.';
      const errorMsg: AiMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Error:** ${errorText}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionConfirm = async (action: AiPendingAction, confirmed: boolean) => {
    setConfirmingToken(action.confirmation_token);

    try {
      const res = await aiService.confirmAction(action.confirmation_token, confirmed);

      // Update message state removing pending status
      setMessages((prev) =>
        prev.map((m) => {
          if (m.pending_action?.confirmation_token === action.confirmation_token) {
            return {
              ...m,
              pending_action: null, // Clear active card
            };
          }
          return m;
        })
      );

      // Append result message
      const resultMsg: AiMessage = {
        id: `result-${Date.now()}`,
        role: 'assistant',
        content: confirmed
          ? `✅ **Success:** ${res.message || 'Operation executed and recorded into the ERP successfully.'}`
          : `🛑 **Cancelled:** The action was cancelled. No changes were made to the ERP.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, resultMsg]);
    } catch (err: any) {
      const errorText = err.response?.data?.error || err.response?.data?.message || 'Failed to execute the confirmed action.';
      const errorMsg: AiMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `❌ **Execution Failed:** ${errorText}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setConfirmingToken(null);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `Chat history cleared. How else can I assist you with **Tecveq Suite**?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const quickPrompts = [
    { label: "Today's sales summary", icon: TrendingUp, prompt: "What are today's sales and collections?" },
    { label: "Low stock alerts", icon: Package, prompt: "Which products are currently low in stock?" },
    { label: "Business KPI overview", icon: FileText, prompt: "Show me the general dashboard business summary." },
    { label: "Recent invoices", icon: DollarSign, prompt: "Show me the 5 most recent sales invoices." },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300">
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Drawer Container */}
      <div className="relative w-full max-w-lg md:max-w-xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col h-full z-10 border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base tracking-tight text-white">
                  Tecveq AI Agent
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                  {user?.role || 'Authenticated'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Enterprise ERP Intelligent Assistant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={clearChat}
              title="Clear Conversation"
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              title="Close Assistant"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Security & Role Banner */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Authenticated session: <strong>{user?.name}</strong></span>
          </div>
          <span className="text-[10px] text-slate-400">PKR Currency</span>
        </div>

        {/* Messages Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-900/40">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-slate-800 text-emerald-400 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-[85%] space-y-2.5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {/* Message Bubble */}
                <div
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                    msg.role === 'user'
                      ? 'bg-[#16A34A] text-white rounded-tr-xs font-medium'
                      : msg.isError
                      ? 'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-tl-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 rounded-tl-xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap">
                    {formatSimpleMarkdown(msg.content)}
                  </div>

                  {/* Executed Tools Indicators */}
                  {msg.executed_tools && msg.executed_tools.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/50 flex flex-wrap gap-1.5">
                      {msg.executed_tools.map((t, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-[10px] text-slate-600 dark:text-slate-300 font-mono"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          {t.tool_name.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Interactive Pending Confirmation Card */}
                {msg.pending_action && (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border-2 border-amber-300 dark:border-amber-600 shadow-md space-y-3 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
                      <AlertTriangle className="w-4 h-4" />
                      <span>{msg.pending_action.title}</span>
                    </div>

                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {msg.pending_action.summary}
                    </p>

                    {/* Breakdown details */}
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs space-y-1.5 font-mono">
                      {Object.entries(msg.pending_action.details).map(([key, val]) => (
                        <div key={key} className="flex justify-between items-start gap-2">
                          <span className="text-slate-500 dark:text-slate-400 shrink-0 font-sans">{key}:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-right whitespace-pre-wrap">{val}</span>
                        </div>
                      ))}
                    </div>

                    {/* Confirmation Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        disabled={confirmingToken === msg.pending_action.confirmation_token}
                        onClick={() => handleActionConfirm(msg.pending_action!, true)}
                        className="flex-1 py-2 px-3 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {confirmingToken === msg.pending_action.confirmation_token ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        Confirm & Execute
                      </button>

                      <button
                        type="button"
                        disabled={confirmingToken === msg.pending_action.confirmation_token}
                        onClick={() => handleActionConfirm(msg.pending_action!, false)}
                        className="py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <span className="text-[10px] text-slate-400 px-1">
                  {msg.timestamp}
                </span>
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {/* Thinking / Loading State */}
          {loading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div className="px-4 py-3 bg-white dark:bg-slate-800 rounded-2xl rounded-tl-xs border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                <span className="font-medium">Thinking & querying ERP tools...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills */}
        <div className="px-4 py-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {quickPrompts.map((q, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSendMessage(q.prompt)}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 hover:text-[#16A34A] dark:hover:bg-slate-700 text-[11px] text-slate-600 dark:text-slate-300 font-medium transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200/60 dark:border-slate-700/60"
            >
              <q.icon className="w-3 h-3 text-emerald-600" />
              <span>{q.label}</span>
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              disabled={loading}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask anything or request an ERP action (e.g. create sale, check stock)..."
              className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:border-transparent transition-all disabled:opacity-50 font-medium"
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="p-2.5 bg-[#16A34A] hover:bg-[#15803D] disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white rounded-xl shadow-xs transition-all flex items-center justify-center cursor-pointer disabled:cursor-not-allowed shrink-0"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 px-1">
            <span>Powered by OpenAI & Tecveq Service Layer</span>
            <span>Esc to close</span>
          </div>
        </div>

      </div>
    </div>
  );
}

/**
 * Lightweight Markdown helper to format bold, bullets, and line breaks without extra heavy dependencies.
 */
function formatSimpleMarkdown(text: string) {
  if (!text) return '';
  const lines = text.split('\n');

  return lines.map((line, idx) => {
    // Process bold (**text**)
    const parts = line.split(/(\*\*.*?\*\*)/g);
    const formattedLine = parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={pIdx} className="font-bold text-slate-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });

    if (line.startsWith('- ') || line.startsWith('* ')) {
      return (
        <div key={idx} className="flex items-start gap-1.5 ml-2 my-0.5">
          <span className="text-emerald-600 font-bold">•</span>
          <span>{formattedLine.slice(1)}</span>
        </div>
      );
    }

    return (
      <React.Fragment key={idx}>
        {formattedLine}
        {idx < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
}
