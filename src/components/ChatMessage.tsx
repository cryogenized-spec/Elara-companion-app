import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '../types';
import { CodeBlock } from './CodeBlock';
import { Copy, Check, RefreshCw, Edit3, AlertCircle, Sparkles, User, X, Play } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  isLast: boolean;
  isStreaming: boolean;
  portraitImage?: string | null;
  onRegenerate?: () => void;
  onEditAndResend?: (messageId: string, newContent: string) => void;
  onRetry?: () => void;
  onCompleteResponse?: () => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isLast,
  isStreaming,
  portraitImage,
  onRegenerate,
  onEditAndResend,
  onRetry,
  onCompleteResponse,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && onEditAndResend) {
      onEditAndResend(message.id, editContent.trim());
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  return (
    <div className="w-full py-4 px-4 md:px-6 transition-colors">
      <div className="max-w-2xl mx-auto">
        {isUser ? (
          /* User Message - Right Aligned Bubble */
          <div className="flex flex-col items-end space-y-1.5 group">
            <div className="bg-sky-600/90 text-white px-4 py-3 rounded-2xl rounded-tr-none max-w-[85%] text-[14px] leading-relaxed shadow-lg">
              {isEditing ? (
                <div className="w-full">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full p-2 rounded-lg bg-sky-950/80 border border-sky-400/50 text-white text-sm focus:outline-none resize-none font-sans leading-relaxed"
                    rows={Math.max(2, editContent.split('\n').length)}
                  />
                  <div className="flex items-center gap-2 mt-2 justify-end">
                    <button
                      onClick={handleCancelEdit}
                      className="px-2.5 py-1 rounded text-xs font-medium bg-sky-800 hover:bg-sky-700 text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={!editContent.trim()}
                      className="px-2.5 py-1 rounded text-xs font-medium bg-white text-sky-900 hover:bg-zinc-100 disabled:opacity-50"
                    >
                      Save & Resend
                    </button>
                  </div>
                </div>
              ) : (
                message.content
              )}
            </div>

            <div className="flex items-center gap-2 px-1">
              <span className="text-[10px] text-zinc-500">
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>

              {!isEditing && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <button
                    onClick={handleCopy}
                    className="p-0.5 text-zinc-500 hover:text-zinc-300"
                    title="Copy message"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                  {onEditAndResend && !isStreaming && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-0.5 text-zinc-500 hover:text-zinc-300"
                      title="Edit message"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Assistant Message - Left Aligned with Avatar */
          <div className="flex space-x-3.5 max-w-[95%] group">
            {/* Avatar */}
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700/80 flex items-center justify-center overflow-hidden shadow-sm shrink-0 mt-0.5">
              {portraitImage ? (
                <img src={portraitImage} alt="Elara" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-sky-900 flex items-center justify-center text-[10px] font-bold text-sky-300">
                  EL
                </div>
              )}
            </div>

            <div className="flex flex-col space-y-1.5 min-w-0 flex-1">
              <div className="bg-zinc-900 border border-zinc-800/50 text-zinc-200 px-4 py-3 rounded-2xl rounded-tl-none text-[14px] leading-relaxed shadow-sm overflow-hidden">
                {message.isError ? (
                  <div className="p-1 text-red-300 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-200">Response Error</p>
                      <p className="text-red-300/90 text-xs mt-1">{message.errorMessage || message.content}</p>
                      {onRetry && (
                        <button
                          onClick={onRetry}
                          className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded bg-red-900/60 hover:bg-red-800 text-red-100 text-xs font-medium"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Retry Response
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        const codeString = String(children).replace(/\n$/, '');

                        if (!inline && match) {
                          return <CodeBlock language={match[1]} value={codeString} />;
                        } else if (!inline) {
                          return <CodeBlock language="text" value={codeString} />;
                        }

                        return (
                          <code
                            className="bg-zinc-800/90 text-sky-300 px-1.5 py-0.5 rounded text-xs font-mono border border-zinc-700/50"
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      },
                      p({ children }) {
                        return <p className="mb-2.5 last:mb-0 leading-relaxed">{children}</p>;
                      },
                      em({ children }) {
                        return <em className="italic text-sky-100/90 font-serif leading-relaxed px-0.5">{children}</em>;
                      },
                      ul({ children }) {
                        return <ul className="list-disc list-inside mb-2.5 space-y-1">{children}</ul>;
                      },
                      ol({ children }) {
                        return <ol className="list-decimal list-inside mb-2.5 space-y-1">{children}</ol>;
                      },
                      blockquote({ children }) {
                        return (
                          <blockquote className="border-l-2 border-sky-500/60 pl-3 my-2.5 italic text-zinc-400">
                            {children}
                          </blockquote>
                        );
                      },
                      table({ children }) {
                        return (
                          <div className="overflow-x-auto my-3 rounded-lg border border-zinc-800">
                            <table className="w-full text-left text-xs border-collapse">{children}</table>
                          </div>
                        );
                      },
                      th({ children }) {
                        return (
                          <th className="bg-zinc-800/80 px-3 py-2 border-b border-zinc-700 font-semibold text-zinc-300">
                            {children}
                          </th>
                        );
                      },
                      td({ children }) {
                        return <td className="px-3 py-2 border-b border-zinc-800/60 text-zinc-300">{children}</td>;
                      },
                      a({ href, children }) {
                        return (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-400 hover:underline"
                          >
                            {children}
                          </a>
                        );
                      },
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                )}

                {/* Streaming Cursor Indicator */}
                {message.isStreaming && (
                  <span className="inline-block w-2 h-4 ml-1 bg-sky-400 animate-pulse rounded-sm align-middle" />
                )}
              </div>

              {/* Subtitle / Timestamp & Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-1 pt-1">
                <span className="text-[10px] text-zinc-500">
                  Elara • {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div className="flex items-center space-x-2">
                  {isLast && !isStreaming && onCompleteResponse && !message.isError && (
                    <button
                      onClick={onCompleteResponse}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-950/80 hover:bg-sky-900 text-sky-300 border border-sky-800/60 text-xs font-medium transition-colors shadow-sm"
                      title="Prompt Elara to complete her last response"
                    >
                      <Play className="w-3 h-3 text-sky-400 fill-sky-400/20" />
                      <span>Complete Message</span>
                    </button>
                  )}
                  <button
                    onClick={handleCopy}
                    className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                    title="Copy response"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                  {isLast && !isStreaming && onRegenerate && !message.isError && (
                    <button
                      onClick={onRegenerate}
                      className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                      title="Regenerate response"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
