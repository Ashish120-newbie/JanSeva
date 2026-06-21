import { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  FileText,
  Landmark,
  Search,
  HelpCircle,
  Loader2,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface SuggestedQuestion {
  icon: React.ElementType;
  text: string;
  category: string;
}

const suggestedQuestions: SuggestedQuestion[] = [
  { icon: FileText, text: 'How do I file a complaint?', category: 'Help' },
  { icon: Search, text: 'Check my complaint status', category: 'Track' },
  { icon: Landmark, text: 'What schemes am I eligible for?', category: 'Schemes' },
  { icon: HelpCircle, text: 'What documents do I need for a birth certificate?', category: 'Services' },
];

export function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m JanSeva Assistant. I can help you with:\n\n• Filing complaints\n• Tracking complaint status\n• Government scheme recommendations\n• Required documents for services\n• General government service queries\n\nHow can I assist you today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getAIResponse = async (userMessage: string): Promise<string> => {
    const history = messages
      .filter((m) => m.id !== '1')
      .map((msg) => ({ role: msg.role, content: msg.content }));

    const response = await fetch(`${SUPABASE_URL}/functions/v1/gemini-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        apikey: SUPABASE_ANON_KEY!,
      },
      body: JSON.stringify({ message: userMessage, history }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get AI response');
    }

    return data.response || 'I could not generate a response. Please try again.';
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await getAIResponse(userMessage.content);

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: err instanceof Error
          ? `I encountered an error: ${err.message}. Please try again.`
          : 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestionClick = (text: string) => {
    setInput(text);
    textareaRef.current?.focus();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">AI Assistant</h1>
        <p className="text-slate-600">Your intelligent guide to government services</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" style={{ height: 'calc(100vh - 220px)' }}>
        <div className="h-full flex flex-col">
          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">JanSeva Assistant</h2>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Online • Ready to help
                </p>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3 animate-fade-in',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[75%] rounded-2xl px-4 py-3',
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                      : 'bg-slate-100 text-slate-700'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-slate-600" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 animate-fade-in">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-slate-100 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-sm text-slate-500">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          {messages.length === 1 && (
            <div className="px-6 pb-4">
              <p className="text-xs text-slate-500 mb-2">Quick suggestions:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((question, index) => {
                  const Icon = question.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(question.text)}
                      className="flex items-center gap-2 px-3 py-2 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 text-sm transition-colors"
                    >
                      <Icon className="w-4 h-4" />
                      {question.text}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50">
            <div className="flex gap-3">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me about government services, schemes, or complaints..."
                className="min-h-[52px] max-h-32 flex-1 resize-none"
                rows={1}
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="h-[52px] w-[52px] flex-shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
            <p className="text-xs text-slate-400 mt-2 text-center">
              Press Enter to send • Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
