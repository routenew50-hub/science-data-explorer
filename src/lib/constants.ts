export const SEARCH_SOURCES = {
  GOV: [
    { id: 'US', name: '미국 (Science.gov)', url: 'https://www.science.gov/scigov/desktop/en/results.html?param.search=', type: 'search' },
    { id: 'US_OSTI', name: '미국 (OSTI.gov)', url: 'https://www.osti.gov/search/semantic:', type: 'search' },
    { id: 'UK', name: '영국 (GOV.UK)', url: 'https://www.gov.uk/search/research-and-statistics?keywords=', type: 'search' },
    { id: 'KR', name: '한국 (NTIS)', url: 'https://www.ntis.go.kr/', type: 'home' },
    { id: 'JP', name: '일본 (e-Rad / JST)', url: 'https://www.e-rad.go.jp/en/', type: 'home' },
    { id: 'EU', name: '유럽연합 (CORDIS)', url: 'https://cordis.europa.eu/search?q=', type: 'search' },
    { id: 'DE', name: '독일 (Max Planck)', url: 'https://www.mpg.de/search?q=', type: 'search' },
  ],
  MUSEUMS: [
    { id: 'US_SMITH', name: 'Smithsonian (US)', url: 'https://www.si.edu/', type: 'home' },
    { id: 'US_EXPLOR', name: 'Exploratorium (US)', url: 'https://www.exploratorium.edu/', type: 'home' },
    { id: 'UK_SCI', name: 'Science Museum (UK)', url: 'https://www.sciencemuseum.org.uk/', type: 'home' },
    { id: 'FR_CITE', name: 'Cité des sciences (FR)', url: 'https://www.cite-sciences.fr/en/home', type: 'home' },
    { id: 'KR_NSM', name: '국립중앙과학관 (KR)', url: 'https://www.science.go.kr/', type: 'home' },
    { id: 'KR_GW', name: '국립과천과학관 (KR)', url: 'https://www.sciencecenter.go.kr/', type: 'home' },
    { id: 'KR_SSC', name: '서울시립과학관 (KR)', url: 'https://science.seoul.go.kr/', type: 'home' }, // 추가됨
  ]
};
