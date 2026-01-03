'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, Globe, FileText, Zap, ExternalLink, BookOpen, Newspaper, Building2, ChevronRight, Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SEARCH_SOURCES } from '@/lib/constants';

// Type Definitions
type TabType = 'research' | 'gov' | 'museum' | 'news';

export interface Paper {
  id: string; 
  source: 'semantic-scholar' | 'arxiv' | 'science-gov' | 'news';
  title: string;
  abstract: string | null;
  year: string;
  citationCount: number;
  authors: string[];
  url: string;
  doi?: string;
}

const TABS: { id: TabType; label: string; icon?: any }[] = [
  { id: 'research', label: '논문 & 트렌드' }, 
  { id: 'news', label: '과학 뉴스', icon: Newspaper },
  { id: 'museum', label: '글로벌 과학관', icon: Building2 },
  { id: 'gov', label: '정부 보고서', icon: FileText },
];

export default function MainDashboard() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('research');
  const [papers, setPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [visitedIds, setVisitedIds] = useState<Set<string>>(new Set());
  
  // performSearch를 useCallback으로 감싸서 의존성 배열에 추가 가능하게 함
  const performSearch = useCallback(async () => {
    if (activeTab === 'gov' || activeTab === 'museum') {
        return; 
    }

    setIsLoading(true);
    setError(null);
    setPapers([]);

    try {
      const apiTab = activeTab === 'news' ? 'news' : 'all';
      
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&tab=${apiTab}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      const newPapers = Array.isArray(data.data) ? data.data : [];
      // 상위 10개만 노출
      setPapers(newPapers.slice(0, 10));
    } catch (err) {
      console.error(err);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, query]); // query가 변경되어도 재검색은 사용자 액션으로만 하지만, 함수 자체는 최신 query를 가져야 함.

  // 탭 변경 시 상태 초기화 및 자동 검색
  useEffect(() => {
    setPapers([]); 
    setError(null);
    if(hasSearched && query.trim() && (activeTab === 'research' || activeTab === 'news')) {
        performSearch();
    }
  }, [activeTab, hasSearched, query, performSearch]); // 모든 의존성 추가. 조건문으로 실행 제어.

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setHasSearched(true);
    performSearch();
  };

  const handleCardClick = (id: string, url: string) => {
    setVisitedIds(prev => new Set(prev).add(id));
    if (url) window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">
          <div className="flex items-center justify-center md:justify-start mb-6">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 text-center">
                Science Data
            </h1>
          </div>

          <div className="flex flex-col gap-6">
            <form onSubmit={handleFormSubmit} className="relative w-full">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="검색어를 입력하세요..."
                className="w-full px-6 h-16 md:h-20 border-2 border-slate-300 rounded-3xl text-lg md:text-xl font-medium focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-900 shadow-sm transition-all placeholder:text-slate-400"
              />
            </form>

            {/* 탭 메뉴 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 w-full">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3 px-4 py-4 md:py-5 text-base md:text-lg font-bold transition-all border-2 w-full",
                    "rounded-full",
                    activeTab === tab.id 
                      ? "bg-slate-900 text-white border-slate-900 shadow-lg transform scale-[1.02] z-10" 
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-400 hover:text-slate-900"
                  )}
                >
                  {tab.icon ? <tab.icon className="w-6 h-6 md:w-7 md:h-7" /> : <BookOpen className="w-6 h-6 md:w-7 md:h-7" />}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8 pb-32">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400 animate-pulse">
            <Loader2 className="w-16 h-16 animate-spin mb-6 text-slate-300" />
            <span className="text-2xl font-medium">데이터 탐색 중...</span>
          </div>
        )}

        {/* ... (생략된 Deep Link 렌더링 코드는 이전과 동일하므로 유지) ... */}
        {/* Gov */}
        {!isLoading && activeTab === 'gov' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                {SEARCH_SOURCES.GOV.map((source) => {
                    const linkUrl = source.type === 'search' 
                        ? `${source.url}${encodeURIComponent(query)}`
                        : source.url;
                    const isVisited = visitedIds.has(source.id);
                    return (
                        <div 
                            key={source.id}
                            onClick={() => handleCardClick(source.id, linkUrl)}
                            className="bg-white p-8 rounded-xl border border-slate-100 shadow-md hover:shadow-xl hover:border-blue-500 transition-all cursor-pointer group flex flex-col h-full transform hover:-translate-y-1"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-4 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <Landmark className="w-8 h-8" />
                                </div>
                                <h3 className={cn("font-bold text-xl line-clamp-1 flex-1 transition-colors", isVisited ? "text-[#A0A0A0]" : "text-slate-900")}>
                                    {source.name}
                                </h3>
                                <ExternalLink className={cn("w-6 h-6 transition-colors", isVisited ? "text-[#A0A0A0]" : "text-slate-300 group-hover:text-blue-500")} />
                            </div>
                            <p className="text-base text-slate-500 mt-auto font-medium">
                                {source.type === 'search' && query ? `"${query}" 결과 보기` : '공식 홈페이지 이동'}
                            </p>
                        </div>
                    );
                })}
            </div>
        )}

        {/* Museum */}
        {!isLoading && activeTab === 'museum' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                {SEARCH_SOURCES.MUSEUMS.map((source) => {
                    const linkUrl = source.type === 'search' ? `${source.url}${encodeURIComponent(query)}` : source.url;
                    const isVisited = visitedIds.has(source.id);
                    return (
                        <div 
                            key={source.id}
                            onClick={() => handleCardClick(source.id, linkUrl)}
                            className="bg-white p-8 rounded-xl border border-slate-100 shadow-md hover:shadow-xl hover:border-purple-500 transition-all cursor-pointer group flex flex-col h-full transform hover:-translate-y-1"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-4 bg-purple-50 rounded-xl text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                    <Building2 className="w-8 h-8" />
                                </div>
                                <h3 className={cn("font-bold text-xl line-clamp-1 flex-1 transition-colors", isVisited ? "text-[#A0A0A0]" : "text-slate-900")}>
                                    {source.name}
                                </h3>
                                <ExternalLink className={cn("w-6 h-6 transition-colors", isVisited ? "text-[#A0A0A0]" : "text-slate-300 group-hover:text-purple-500")} />
                            </div>
                            <p className="text-base text-slate-500 mt-auto font-medium">
                                {source.type === 'search' && query ? `"${query}" 결과 보기` : '공식 홈페이지 이동'}
                            </p>
                        </div>
                    );
                })}
            </div>
        )}

        {/* Papers */}
        {!isLoading && (activeTab === 'research' || activeTab === 'news') && (
            <div className="space-y-6 animate-fade-in">
                {papers.length === 0 && hasSearched && !error && (
                    <div className="text-center py-32 text-slate-500 bg-white rounded-xl border-2 border-slate-100">
                        <Search className="w-20 h-20 mx-auto mb-6 text-slate-200" />
                        <p className="text-2xl font-bold mb-3">검색 결과가 없습니다.</p>
                        <p className="text-lg">다른 키워드로 검색하거나 탭을 변경해보세요.</p>
                    </div>
                )}
                {papers.length === 0 && !hasSearched && (
                     <div className="text-center py-32 text-slate-400">
                        <Globe className="w-24 h-24 mx-auto mb-8 text-slate-200" />
                        <p className="text-3xl font-bold text-slate-700 mb-4">전문 과학 데이터 탐색</p>
                        <p className="text-xl">논문, 정부 보고서, 과학관 소식을 한곳에서 검색하세요.</p>
                    </div>
                )}
                {papers.map((paper, index) => {
                    const isVisited = visitedIds.has(paper.id);
                    return (
                        <div 
                            key={`${paper.id}-${index}`} 
                            onClick={() => handleCardClick(paper.id, paper.url)}
                            className="bg-white p-8 rounded-xl border border-slate-100 shadow-md hover:shadow-xl hover:border-blue-400 transition-all cursor-pointer group relative overflow-hidden transform hover:-translate-y-1"
                        >
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-3 mb-1">
                                    <span className={cn(
                                        "text-xs px-3 py-1.5 rounded-lg uppercase font-bold tracking-wide",
                                        paper.source === 'semantic-scholar' ? "bg-indigo-100 text-indigo-700" :
                                        paper.source === 'arxiv' ? "bg-red-100 text-red-700" :
                                        "bg-green-100 text-green-700"
                                    )}>
                                        {paper.source === 'semantic-scholar' ? 'PAPER' : paper.source === 'arxiv' ? 'ARXIV' : 'NEWS'}
                                    </span>
                                    <span className="text-sm text-slate-500 font-medium">{paper.year}</span>
                                    {paper.citationCount > 0 && (
                                        <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg font-medium">
                                            Cited by {paper.citationCount}
                                        </span>
                                    )}
                                </div>
                                <h3 className={cn("text-2xl md:text-3xl font-bold leading-tight transition-colors", isVisited ? "text-[#A0A0A0]" : "text-slate-900 group-hover:text-blue-700")}>
                                    {paper.title}
                                </h3>
                                <p className={cn("text-lg line-clamp-2 md:line-clamp-3 leading-relaxed", isVisited ? "text-[#A0A0A0]" : "text-slate-600")}>
                                    {paper.abstract || '내용 요약 없음'}
                                </p>
                                <div className="flex items-center justify-between text-base text-slate-400 mt-2">
                                    <span className="font-medium">{paper.authors.slice(0, 3).join(', ')}{paper.authors.length > 3 && ' et al.'}</span>
                                    <span className={cn("flex items-center gap-1 font-bold opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0", isVisited ? "text-[#A0A0A0]" : "text-blue-600")}>
                                        원문 보기 <ChevronRight className="w-5 h-5" />
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </main>
    </div>
  );
}
