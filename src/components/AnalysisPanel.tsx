import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { Bot, Sparkles, Zap, Brain, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalysisPanelProps {
  modelName: 'Gemini' | 'Llama' | 'DeepSeek';
  content: string | null;
  isLoading: boolean;
}

const MODEL_CONFIG = {
  Gemini: {
    icon: Sparkles,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100'
  },
  Llama: {
    icon: Zap,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-100'
  },
  DeepSeek: {
    icon: Brain,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    border: 'border-teal-100'
  }
};

const useTypewriter = (text: string | null, speed = 10) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    // Reset explicitly when text changes, but avoid setting state if it's already what we want
    // Ideally, just use a local var for accumulation and set state periodically
    // or rely on the interval.
    // To fix "set state during effect":
    // We can just setDisplayedText('') in the cleanup of the previous effect? No.
    // The issue is calling setDisplayedText('') synchronously at the start.
    
    // Correct approach: Just let the effect run.
    let isMounted = true;
    setDisplayedText(''); // This is still synchronous in effect body.
    
    if (!text) return;

    let index = 0;
    const intervalId = setInterval(() => {
      if (!isMounted) return;
      const chunkSize = Math.floor(Math.random() * 4) + 2;
      const chunk = text.slice(index, index + chunkSize);
      
      setDisplayedText((prev) => prev + chunk);
      index += chunkSize;
      
      if (index >= text.length) {
        clearInterval(intervalId);
        setDisplayedText(text);
      }
    }, speed);

    return () => {
        isMounted = false;
        clearInterval(intervalId);
    };
  }, [text, speed]);

  return displayedText;
};

export default function AnalysisPanel({ modelName, content, isLoading }: AnalysisPanelProps) {
  const config = MODEL_CONFIG[modelName];
  const Icon = config.icon;
  
  const typedContent = useTypewriter(content, 15);
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="w-full md:flex-1 flex flex-col min-h-[400px] md:min-h-0 md:h-full border-b md:border-b-0 md:border-r border-slate-200 last:border-b-0 last:border-r-0 shrink-0 relative">
      <div className={cn("p-4 border-b flex items-center gap-2 sticky top-0 bg-opacity-95 backdrop-blur z-10 bg-white/80", config.bg, config.border)}>
        <Icon className={cn("w-5 h-5", config.color)} />
        <h2 className={cn("font-bold text-base", config.color)}>{modelName}</h2>
        {isLoading && <Loader2 className={cn("w-4 h-4 animate-spin ml-auto", config.color)} />}
      </div>
      
      <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto bg-white scroll-smooth">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-6 py-10 fade-in">
             <div className="relative">
                <div className={cn("w-16 h-16 rounded-full flex items-center justify-center animate-bounce opacity-20", config.bg)}>
                    <Icon className={cn("w-8 h-8", config.color)} />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className={cn("w-6 h-6 animate-spin", config.color)} />
                </div>
             </div>
             
             <div className="text-center space-y-2">
                <p className="text-sm font-bold text-slate-700 animate-pulse">
                    AI가 논문을 정독 중입니다...
                </p>
                <p className="text-xs text-slate-500">
                    교육 키트 아이디어 구상 중
                </p>
             </div>

             <div className="w-full space-y-3 px-4 opacity-40">
                <div className="h-2 bg-slate-200 rounded w-full animate-pulse"></div>
                <div className="h-2 bg-slate-200 rounded w-5/6 animate-pulse delay-75"></div>
                <div className="h-2 bg-slate-200 rounded w-4/6 animate-pulse delay-150"></div>
                <div className="h-2 bg-slate-200 rounded w-full animate-pulse delay-200"></div>
             </div>
          </div>
        ) : content ? (
          <div className="prose prose-sm prose-slate max-w-none prose-p:leading-relaxed prose-headings:text-slate-800 prose-a:text-blue-600 prose-details:border prose-details:border-slate-200 prose-details:rounded-lg prose-details:p-2 prose-summary:cursor-pointer prose-summary:font-medium">
            {/* @ts-expect-error rehype-raw type mismatch */}
            <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                {typedContent}
            </ReactMarkdown>
            {typedContent.length < content.length && (
                <span className="inline-block w-1.5 h-4 ml-0.5 align-middle bg-slate-800 animate-pulse"></span>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 py-10">
            <Bot className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm">분석 결과가 여기에 표시됩니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
