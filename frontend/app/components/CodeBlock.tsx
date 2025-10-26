import { useState, useEffect, useRef } from 'react';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  language?: string;
  children: string;
  inline?: boolean;
}

export default function CodeBlock({ language, children, inline }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);
  const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (codeRef.current && !inline) {
      // Clear any pending highlight timeout
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }

      // Debounce highlighting for smoother streaming
      highlightTimeoutRef.current = setTimeout(() => {
        if (codeRef.current) {
          // Remove existing highlighting classes
          codeRef.current.removeAttribute('data-highlighted');
          codeRef.current.className = '';
          
          // Apply syntax highlighting
          if (language) {
            codeRef.current.className = `language-${language}`;
          }
          hljs.highlightElement(codeRef.current);
        }
      }, 100); // 100ms debounce for smooth streaming
    }

    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, [children, inline, language]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // For inline code, render as simple styled span
  if (inline) {
    return (
      <code className="px-1.5 py-0.5 rounded bg-white/10 text-purple-300 font-mono text-sm">
        {children}
      </code>
    );
  }

  // For code blocks, use highlight.js
  return (
    <div className="relative group my-4">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 rounded-t-lg border-b border-gray-700">
        <span className="text-xs text-gray-400 font-mono uppercase">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors rounded hover:bg-gray-700"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check size={14} />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="m-0! rounded-t-none! rounded-b-lg! overflow-x-auto code-scroll transition-opacity duration-150">
        <code
          ref={codeRef}
          className={language ? `language-${language}` : 'language-text'}
        >
          {children}
        </code>
      </pre>
    </div>
  );
}
