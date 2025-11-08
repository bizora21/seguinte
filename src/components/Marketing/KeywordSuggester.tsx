import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Loader2, Search, TrendingUp, Users } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import { showSuccess, showError } from '../../utils/toast';
import { supabase } from '../../lib/supabase';

interface KeywordSuggestion {
  keyword: string;
  volume: number;
  competition: number;
}

interface KeywordSuggesterProps {
  value: string;
  onChange: (value: string) => void;
  onSuggestionSelect?: (suggestion: KeywordSuggestion) => void;
}

const SUGGESTIONS_API_URL = 'https://bpzqdwpkwlwflrcwcrqp.supabase.co/functions/v1/content-suggestions';

const KeywordSuggester: React.FC<KeywordSuggesterProps> = ({ value, onChange, onSuggestionSelect }) => {
  const [suggestions, setSuggestions] = useState<KeywordSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const fetchSuggestions = useCallback(async (keyword: string) => {
    if (!keyword.trim()) {
      setSuggestions([]);
      return;
    }
    
    setLoading(true);
    
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        throw new Error('Usuário não autenticado.');
      }
      
      const response = await fetch(SUGGESTIONS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          keyword,
          contentType: 'blog'
        })
      });
      
      if (!response.ok) throw new Error('Falha ao buscar sugestões.');
      
      const result = await response.json();
      
      const mockSuggestions = (result.suggestions || []).slice(0, 5).map((s: string, index: number) => ({
        keyword: s,
        volume: Math.floor(Math.random() * 10000) + 1000,
        competition: Math.floor(Math.random() * 100)
      }));
      
      setSuggestions(mockSuggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedFetchSuggestions = useDebounce(fetchSuggestions, 500);

  useEffect(() => {
    if (value.length > 2) {
      debouncedFetchSuggestions(value);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [value, debouncedFetchSuggestions]);

  const handleSuggestionClick = (suggestion: KeywordSuggestion) => {
    onChange(suggestion.keyword);
    setShowSuggestions(false);
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    }
  };

  const getCompetitionColor = (score: number) => {
    if (score < 30) return 'text-green-600';
    if (score < 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ex: vender eletrônicos online"
        className="pr-10"
      />
      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
      
      {showSuggestions && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              <span className="text-sm">Buscando sugestões...</span>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 mb-2">SUGESTÕES DE PALAVRAS-CHAVE</div>
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 hover:bg-gray-100 rounded cursor-pointer"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="flex items-center">
                    <span className="font-medium">{suggestion.keyword}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs">
                    <div className="flex items-center text-blue-600">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {suggestion.volume.toLocaleString('pt-MZ')}
                    </div>
                    <div className={`flex items-center ${getCompetitionColor(suggestion.competition)}`}>
                      <Users className="w-3 h-3 mr-1" />
                      {suggestion.competition}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-gray-500">
              Nenhuma sugestão encontrada
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default KeywordSuggester;