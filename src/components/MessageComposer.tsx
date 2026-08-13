import React, { useState, useRef, useEffect } from 'react';
import { Send, Square, Sparkles } from 'lucide-react';

interface MessageComposerProps {
  onSendMessage: (text: string) => void;
  isStreaming: boolean;
  onStopStreaming: () => void;
  disabled?: boolean;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSendMessage,
  isStreaming,
  onStopStreaming,
  disabled = false,
}) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (input.trim() && !isStreaming && !disabled) {
      onSendMessage(input.trim());
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  return (
    <footer className="p-4 md:p-6 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent shrink-0">
      <div className="max-w-2xl mx-auto">
        <div className="relative group">
          {/* Quick Info Badges */}
          <div className="flex space-x-2 mb-2">
            <div className="px-3 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded-full text-[10px] text-zinc-400 flex items-center hover:bg-zinc-800 cursor-pointer transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mr-1.5"></span>
              Active Persistence
            </div>
            <div className="px-3 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded-full text-[10px] text-zinc-400 flex items-center hover:bg-zinc-800 cursor-pointer transition-colors">
              <Sparkles className="w-3 h-3 mr-1 text-sky-400" />
              Gemini Cybernetic Loop
            </div>
          </div>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Elara..."
            disabled={disabled}
            rows={2}
            className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-2xl py-3.5 pl-4 pr-24 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20 transition-all resize-none shadow-2xl min-h-[72px] max-h-48 placeholder-zinc-600 text-sm leading-relaxed"
          />

          <div className="absolute bottom-3.5 right-3.5 flex items-center space-x-2">
            {isStreaming ? (
              <button
                onClick={onStopStreaming}
                className="bg-red-600 hover:bg-red-500 text-white p-2.5 rounded-xl transition-all shadow-lg shadow-red-900/20 flex items-center gap-1.5 text-xs font-medium"
                title="Stop generation"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim() || disabled}
                className="bg-sky-600 hover:bg-sky-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white p-2.5 rounded-xl transition-all shadow-lg shadow-sky-900/20"
                title="Send message (Enter)"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-[10px] text-zinc-600 mt-3 tracking-wide select-none">
          Elara may occasionally display synthetic biases or fabricated data. Review technical outputs carefully.
        </p>
      </div>
    </footer>
  );
};
