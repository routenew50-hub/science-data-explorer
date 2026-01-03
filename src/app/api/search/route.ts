import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';
import { randomUUID } from 'crypto';

const SEMANTIC_SCHOLAR_BASE_URL = 'https://api.semanticscholar.org/graph/v1/paper/search';
const ARXIV_BASE_URL = 'http://export.arxiv.org/api/query';
const GOOGLE_NEWS_BASE_URL = 'https://news.google.com/rss/search';

// 통합 논문 인터페이스
interface UnifiedPaper {
  id: string;
  source: 'semantic-scholar' | 'arxiv' | 'news';
  title: string;
  year: string;
  authors: string[];
  abstract: string;
  citationCount: number;
  url: string;
  doi?: string;
  publishedAt?: string;
}

// API Response Interfaces
interface SemanticPaper {
  paperId: string;
  title: string;
  year?: number;
  authors?: { name: string }[];
  abstract?: string;
  citationCount?: number;
  externalIds?: { DOI?: string };
  openAccessPdf?: { url: string };
  url?: string;
}

interface ArxivEntry {
  id: string;
  title: string;
  published: string;
  author: { name: string } | { name: string }[];
  summary: string;
  'arxiv:doi'?: { '#text': string };
}

interface NewsItem {
  guid: string | { '#text': string };
  link: string;
  title: string;
  pubDate: string;
  source?: string | { '#text': string };
}

// 1. Semantic Scholar 검색 함수
async function searchSemanticScholar(query: string, apiKey?: string): Promise<UnifiedPaper[]> {
  try {
    const headers: HeadersInit = {};
    if (apiKey) headers['x-api-key'] = apiKey;

    const fields = 'paperId,title,abstract,authors,year,citationCount,externalIds,url,openAccessPdf';
    const apiUrl = `${SEMANTIC_SCHOLAR_BASE_URL}?query=${encodeURIComponent(query)}&year=2024-2025&fields=${fields}&limit=20`;

    const response = await fetch(apiUrl, { headers });
    if (!response.ok) {
       console.error(`Semantic Scholar Error: ${response.status} ${response.statusText}`);
       return [];
    }

    const data = await response.json();
    return (data.data || []).map((p: SemanticPaper) => ({
      id: p.paperId || `sem-${randomUUID()}`,
      source: 'semantic-scholar' as const,
      title: p.title,
      year: p.year?.toString() || '',
      authors: p.authors?.map((a) => a.name) || [],
      abstract: p.abstract || '',
      citationCount: p.citationCount || 0,
      url: p.openAccessPdf?.url || p.url || (p.externalIds?.DOI ? `https://doi.org/${p.externalIds.DOI}` : ''),
      doi: p.externalIds?.DOI,
    }));
  } catch (error) {
    console.error('Semantic Scholar Fetch Error:', error);
    return [];
  }
}

// 2. arXiv 검색 함수
async function searchArxiv(query: string): Promise<UnifiedPaper[]> {
  try {
    const apiUrl = `${ARXIV_BASE_URL}?search_query=all:${encodeURIComponent(query)}&start=0&max_results=20&sortBy=submittedDate&sortOrder=descending`;

    const response = await fetch(apiUrl);
    if (!response.ok) return [];

    const xmlText = await response.text();
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
    const jsonObj = parser.parse(xmlText);

    const entries = jsonObj.feed?.entry || [];
    const entryList = Array.isArray(entries) ? entries : [entries];

    return entryList
      .map((entry: ArxivEntry) => {
        const publishedDate = new Date(entry.published);
        const publishedYear = publishedDate.getFullYear();
        if (publishedYear < 2024) return null;

        const authors = Array.isArray(entry.author) 
            ? entry.author.map((a) => a.name) 
            : [entry.author?.name || 'Unknown'];

        return {
          id: entry.id || `arxiv-${randomUUID()}`,
          source: 'arxiv' as const,
          title: entry.title,
          year: publishedYear.toString(),
          authors,
          abstract: entry.summary || '',
          citationCount: 0,
          url: entry.id,
          doi: entry['arxiv:doi']?.['#text'] || undefined,
          publishedAt: entry.published,
        };
      })
      .filter((p: UnifiedPaper | null) => p !== null) as UnifiedPaper[];

  } catch (error) {
    console.error('arXiv Fetch Error:', error);
    return [];
  }
}

// 3. News 검색 함수
async function searchNews(query: string): Promise<UnifiedPaper[]> {
  try {
    const searchQuery = `${query} science`;
    const apiUrl = `${GOOGLE_NEWS_BASE_URL}?q=${encodeURIComponent(searchQuery)}&hl=en-US&gl=US&ceid=US:en`;

    const response = await fetch(apiUrl);
    if (!response.ok) return [];

    const xmlText = await response.text();
    const parser = new XMLParser({ ignoreAttributes: false });
    const jsonObj = parser.parse(xmlText);

    const items = jsonObj.rss?.channel?.item || [];
    const itemList = Array.isArray(items) ? items : [items];

    return itemList.slice(0, 15).map((item: NewsItem) => {
      const pubDate = new Date(item.pubDate);
      const guidText = typeof item.guid === 'object' ? item.guid['#text'] : item.guid;
      const sourceText = typeof item.source === 'object' ? item.source['#text'] : item.source;

      return {
        id: guidText || `news-${randomUUID()}`,
        source: 'news' as const,
        title: item.title,
        year: pubDate.getFullYear().toString(),
        authors: [sourceText || 'News'],
        abstract: '', 
        citationCount: 0,
        url: item.link,
        publishedAt: item.pubDate,
      };
    });
  } catch (error) {
    console.error('News Fetch Error:', error);
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const tab = searchParams.get('tab') || 'all'; 

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  const apiKey = process.env.SEMANTIC_SCHOLAR_API_KEY;
  
  const promises = [];
  
  const fetchSemantic = (tab === 'all' || tab === 'semantic');
  const fetchArxiv = (tab === 'all' || tab === 'arxiv');
  const fetchNews = (tab === 'all' || tab === 'news');

  if (fetchSemantic) promises.push(searchSemanticScholar(query, apiKey));
  else promises.push(Promise.resolve([]));

  if (fetchArxiv) promises.push(searchArxiv(query));
  else promises.push(Promise.resolve([]));
  
  if (fetchNews) promises.push(searchNews(query));
  else promises.push(Promise.resolve([]));

  const results = await Promise.allSettled(promises);

  const semanticPapers = results[0].status === 'fulfilled' ? results[0].value : [];
  const arxivPapers = results[1].status === 'fulfilled' ? results[1].value : [];
  const newsItems = results[2].status === 'fulfilled' ? results[2].value : [];

  const combinedPapers = [...semanticPapers, ...arxivPapers, ...newsItems];

  combinedPapers.sort((a, b) => {
    if (b.citationCount !== a.citationCount) {
      return b.citationCount - a.citationCount;
    }
    const yearA = parseInt(a.year) || 0;
    const yearB = parseInt(b.year) || 0;
    return yearB - yearA;
  });

  return NextResponse.json({ 
    data: combinedPapers,
    meta: {
      total: combinedPapers.length,
      sources: {
        semantic: semanticPapers.length,
        arxiv: arxivPapers.length,
        news: newsItems.length
      }
    }
  });
}
