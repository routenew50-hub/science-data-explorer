'use client';

import { useState } from 'react';
import Sidebar, { Paper } from './Sidebar';
import AnalysisPanel from './AnalysisPanel';
import { ExternalLink, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [searchedPapers, setSearchedPapers] = useState<Paper[]>([]); 
  const [results, setResults] = useState<{
    gemini: string | null;
    llama: string | null;
    deepseek: string | null;
  }>({
    gemini: null,
    llama: null,
    deepseek: null,
  });
  const [loadingStates, setLoadingStates] = useState({
    gemini: false,
    llama: false,
    deepseek: false,
  });

  // 분석 중 상태 (하나라도 로딩 중이면 true)
  const isAnalyzing = Object.values(loadingStates).some(state => state);

  const handleSelectPaper = async (paper: Paper) => {
    // 이미 분석 중이면 무시 (Sidebar에서 막지만 이중 방어)
    if (isAnalyzing) return;

    setSelectedPaper(paper);
    setResults({ gemini: null, llama: null, deepseek: null });
    setLoadingStates({ gemini: true, llama: true, deepseek: true });

    const models = ['gemini', 'llama', 'deepseek'] as const;
    
    models.forEach(modelKey => {
      fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paper, modelKey }),
      })
      .then(res => res.json())
      .then(data => {
        setResults(prev => ({ ...prev, [modelKey]: data.result }));
      })
      .catch(err => {
        console.error(`${modelKey} Error:`, err);
        setResults(prev => ({ ...prev, [modelKey]: '분석 중 오류가 발생했습니다.' }));
      })
      .finally(() => {
        setLoadingStates(prev => ({ ...prev, [modelKey]: false }));
      });
    });
  };

  const handleSearchComplete = (papers: Paper[]) => {
    setSearchedPapers(papers);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-slate-50 overflow-hidden">
      <Sidebar 
        onSelectPaper={handleSelectPaper} 
        selectedPaperId={selectedPaper?.id || null} 
        onSearchComplete={handleSearchComplete}
        isAnalyzing={isAnalyzing} // 로딩 상태 전달
      />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative w-full">
        {/* Mobile-First: Summary Table Area (Top 5) */}
        {searchedPapers.length > 0 && (
          <div className="bg-white border-b border-slate-200 p-4 shrink-0 shadow-sm z-20 hidden md:block">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-slate-500" />
              <h3 className="font-bold text-slate-800 text-sm">최근 검색 결과 요약 (Top 5)</h3>
            </div>
            
            <div className="overflow-x-auto pb-2">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="text-xs text-slate-500 border-b border-slate-100">
                    <th className="py-2 px-2 font-medium">Source</th>
                    <th className="py-2 px-2 font-medium">Title</th>
                    <th className="py-2 px-2 font-medium w-20">Year</th>
                    <th className="py-2 px-2 font-medium w-20">Citations</th>
                    <th className="py-2 px-2 font-medium w-24">Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {searchedPapers.slice(0, 5).map((paper, index) => (
                    <tr key={`${paper.id}-${index}`} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-2">
                         <span className={cn(
                             "text-[10px] px-1.5 py-0.5 rounded border uppercase font-bold tracking-wider",
                             paper.source === 'semantic-scholar' ? "text-indigo-600 border-indigo-100 bg-indigo-50" :
                             paper.source === 'arxiv' ? "text-red-600 border-red-100 bg-red-50" : 
                             paper.source === 'news' ? "text-green-600 border-green-100 bg-green-50" : "text-gray-600"
                         )}>
                             {paper.source === 'semantic-scholar' ? 'Paper' : 
                              paper.source === 'arxiv' ? 'arXiv' : 'News'}
                         </span>
                      </td>
                      <td className="py-2 px-2">
                        <div 
                          className={cn(
                              "font-medium text-slate-800 line-clamp-1 cursor-pointer hover:text-blue-600",
                              isAnalyzing && "pointer-events-none text-slate-400"
                          )}
                          onClick={() => handleSelectPaper(paper)}
                        >
                          {paper.title}
                        </div>
                      </td>
                      <td className="py-2 px-2 text-slate-600">{paper.year}</td>
                      <td className="py-2 px-2 text-slate-600 font-mono">{paper.citationCount}</td>
                      <td className="py-2 px-2">
                        {paper.url ? (
                          <a 
                            href={paper.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 px-2 py-1 rounded bg-blue-50 text-xs font-bold min-h-[32px]"
                          >
                            Full Text <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-300 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Selected Paper Header */}
        <header className="h-auto min-h-[64px] py-3 bg-white border-b border-slate-200 flex items-center px-4 md:px-6 shrink-0 shadow-sm z-10">
          {selectedPaper ? (
            <div className="overflow-hidden w-full">
              <div className="flex items-center gap-2 mb-1">
                 <span className={cn(
                     "text-[10px] px-1.5 py-0.5 rounded border uppercase font-bold tracking-wider",
                     selectedPaper.source === 'semantic-scholar' ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
                     selectedPaper.source === 'arxiv' ? "bg-red-50 text-red-700 border-red-100" :
                     selectedPaper.source === 'news' ? "bg-green-50 text-green-700 border-green-100" :
                     "bg-gray-50 text-gray-600 border-gray-200"
                 )}>
                     {selectedPaper.source === 'semantic-scholar' ? 'Paper' : 
                      selectedPaper.source === 'arxiv' ? 'arXiv' : 
                      selectedPaper.source === 'news' ? 'News' : 'Report'}
                 </span>
                 <h2 className="font-bold text-slate-800 line-clamp-1 text-lg leading-tight flex-1">{selectedPaper.title}</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                {selectedPaper.authors?.[0]} et al. • {selectedPaper.year} • Citations: {selectedPaper.citationCount}
              </p>
            </div>
          ) : (
            <p className="text-slate-400 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-300"></span>
              논문을 선택하여 AI 분석을 시작하세요.
            </p>
          )}
        </header>

        {/* Analysis Columns */}
        <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-y-hidden md:overflow-x-auto bg-slate-50/50 scroll-smooth">
          <AnalysisPanel 
            modelName="Gemini" 
            content={results.gemini} 
            isLoading={loadingStates.gemini} 
          />
          <AnalysisPanel 
            modelName="Llama" 
            content={results.llama} 
            isLoading={loadingStates.llama} 
          />
          <AnalysisPanel 
            modelName="DeepSeek" 
            content={results.deepseek} 
            isLoading={loadingStates.deepseek} 
          />
        </div>
      </main>
    </div>
  );
}
