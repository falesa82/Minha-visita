import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Company, FilterState, JourneyStage } from '../types';
import { generateMockCompanies } from '../services/mockService';

interface AppContextType {
  // Navigation
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Search
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  searchResults: Company[];
  setSearchResults: (results: Company[]) => void;
  performSearch: () => void;
  isSearching: boolean;

  // Data
  history: Company[];
  journey: Company[];

  // Actions
  addToJourney: (company: Company) => void;
  updateCompany: (company: Company) => void;
  removeFromJourney: (companyId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [activeTab, setActiveTab] = useState('prospecção');
  const [filters, setFilters] = useState<FilterState>({
    transportType: '',
    cnaeQuery: '',
    city: '',
    state: '',
    radiusKm: 10,
    minSize: 'ALL'
  });
  
  const [searchResults, setSearchResults] = useState<Company[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [history, setHistory] = useState<Company[]>([]);
  const [journey, setJourney] = useState<Company[]>([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('mv_history');
    const savedJourney = localStorage.getItem('mv_journey');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    if (savedJourney) setJourney(JSON.parse(savedJourney));
  }, []);

  useEffect(() => {
    localStorage.setItem('mv_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('mv_journey', JSON.stringify(journey));
  }, [journey]);

  const performSearch = () => {
    setIsSearching(true);
    setTimeout(() => {
      const results = generateMockCompanies(15, filters.city, filters.state, filters.cnaeQuery);
      
      const filteredResults = filters.minSize !== 'ALL' 
        ? results.filter(c => c.size === filters.minSize)
        : results;

      // IA SIMULADA: Ordenação por relevância (Score)
      const sortedResults = filteredResults.sort((a, b) => (b.score || 0) - (a.score || 0));
      
      setSearchResults(sortedResults);
      updateHistory(sortedResults);
      setIsSearching(false);
    }, 1000);
  };

  const updateHistory = (newResults: Company[]) => {
    setHistory(prevHistory => {
      // IA SIMULADA: Ranking de relevância no histórico (Premium History)
      const combined = [...newResults.slice(0, 5), ...prevHistory];
      const uniqueCombined = combined.filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i);
      
      // Ordena o histórico para manter as melhores oportunidades no topo
      return uniqueCombined.sort((a,b) => (b.score || 0) - (a.score || 0)).slice(0, 20);
    });
  };

  const addToJourney = (company: Company) => {
    const newCompany = { ...company, stage: JourneyStage.ANALYSIS };
    if (!journey.find(c => c.id === company.id)) {
      setJourney(prev => [...prev, newCompany]);
    }
    setActiveTab('jornada');
  };

  const updateCompany = (updatedCompany: Company) => {
    setJourney(prev => prev.map(c => c.id === updatedCompany.id ? updatedCompany : c));
  };

  const removeFromJourney = (companyId: string) => {
    setJourney(prev => prev.filter(c => c.id !== companyId));
  };

  return (
    <AppContext.Provider value={{
      activeTab,
      setActiveTab,
      filters,
      setFilters,
      searchResults,
      setSearchResults,
      performSearch,
      isSearching,
      history,
      journey,
      addToJourney,
      updateCompany,
      removeFromJourney
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};