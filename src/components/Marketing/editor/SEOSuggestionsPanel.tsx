import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Button } from '../../ui/button'
import { Textarea } from '../../ui/textarea'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Zap, X, Loader2, Send, RefreshCw, BarChart3, CheckCircle, AlertTriangle, Lightbulb } from 'lucide-react'
import { LocalDraftState } from '../../../types/blog'
import { showSuccess, showError, showLoading, dismissToast } from '../../../utils/toast'
import { JSONContent } from '@tiptap/react'
import { CONTENT_GENERATOR_BASE_URL } from '../../../utils/admin'
import { supabase } from '../../../lib/supabase'
import { Badge } from '../../ui/badge'

interface SEOSuggestionsPanelProps {
  isOpen: boolean
  onClose: () => void
  draft: LocalDraftState
  wordCount: number
  onUpdateMetrics: (seoScore: number, readabilityScore: string) => void
}

const SEOSuggestionsPanel: React.FC<SEOSuggestionsPanelProps> = ({
  isOpen,
  onClose,
  draft,
  wordCount,
  onUpdateMetrics
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  const getSeoColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  }

  const handleReanalyze = useCallback(async () => {
    if (!draft.id || !draft.content) return;

    setLoading(true);
    const toastId = showLoading('Reanalisando SEO com IA...');

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        dismissToast(toastId);
        throw new Error('Usuário não autenticado. Faça login novamente.');
      }
      
      const response = await fetch(CONTENT_GENERATOR_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'reanalyze',
          draft: draft,
          wordCount: wordCount
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        dismissToast(toastId);
        try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.error || `Falha na requisição (Status ${response.status})`);
        } catch {
            throw new Error(`Falha na requisição (Status ${response.status}): ${errorText.substring(0, 100)}...`);
        }
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        dismissToast(toastId);
        showSuccess('Análise de SEO concluída!');
        
        const { seo_score, readability_score, suggestions } = result.data;
        
        onUpdateMetrics(seo_score, readability_score);
        setSuggestions(suggestions || []);
        
      } else {
        dismissToast(toastId);
        throw new Error(result.error || 'Erro desconhecido na Edge Function.');
      }
    } catch (error: any) {
      dismissToast(toastId);
      console.error('Error reanalyzing content:', error);
      showError(`Falha na reanálise: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [draft, wordCount, onUpdateMetrics]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl h-auto max-h-[90vh] flex flex-col">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center text-purple-800">
              <Zap className="w-5 h-5 mr-2" />
              Assistente de SEO com IA
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Métricas Atuais */}
          <div className="grid grid-cols-3 gap-4 text-center p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">SEO Score</p>
              <p className={`text-2xl font-bold ${getSeoColor(draft.seo_score)}`}>{draft.seo_score}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Palavras</p>
              <p className="text-2xl font-bold text-blue-600">{wordCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Legibilidade</p>
              <p className="text-lg font-bold text-green-600">{draft.readability_score || 'N/A'}</p>
            </div>
          </div>

          {/* Botão de Reanálise */}
          <Button 
            onClick={handleReanalyze} 
            disabled={loading || !draft.id}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Reanalisando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reanalisar Conteúdo e Obter Sugestões
              </>
            )}
          </Button>
          
          {/* Sugestões de Melhoria */}
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base flex items-center text-yellow-800">
                <Lightbulb className="w-4 h-4 mr-2" />
                Sugestões de Melhoria
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {suggestions.length === 0 ? (
                <p className="text-sm text-gray-600">
                  Clique em "Reanalisar" para obter sugestões de como otimizar seu artigo para o público moçambicano e melhorar o SEO Score.
                </p>
              ) : (
                <ul className="list-disc list-inside text-sm text-yellow-800 space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          
          {/* Palavras-chave Secundárias */}
          <div className="space-y-2">
            <Label className="font-medium">Palavras-chave Secundárias (LSI)</Label>
            <div className="flex flex-wrap gap-2">
              {(draft.secondary_keywords || []).map((keyword, index) => (
                <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
          
        </CardContent>
      </Card>
    </div>
  );
};

export default SEOSuggestionsPanel;