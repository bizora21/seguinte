import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Zap, Target, Users, FileText, Globe, Loader2, ArrowRight, CheckCircle } from 'lucide-react'
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/toast'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import KeywordSuggester from './KeywordSuggester'
import { motion, AnimatePresence } from 'framer-motion'

// Opções para os selects
const AUDIENCE_OPTIONS = [
  { value: 'vendedores', label: 'Vendedores e Empreendedores' },
  { value: 'clientes', label: 'Consumidores e Compradores' },
  { value: 'geral', label: 'Público Geral' },
]

const TYPE_OPTIONS = [
  { value: 'guia-completo', label: 'Guia Completo' },
  { value: 'dicas-praticas', label: 'Dicas Práticas' },
  { value: 'tendencias', label: 'Análise de Tendências' },
]

const CONTEXT_OPTIONS = [
  { value: 'maputo', label: 'Maputo e Região' },
  { value: 'beira', label: 'Beira e Sofala' },
  { value: 'nampula', label: 'Nampula e Norte' },
  { value: 'nacional', label: 'Nacional (Todo MZ)' },
]

const CONTENT_GENERATOR_BASE_URL = 'https://bpzqdwpkwlwflrcwcrqp.supabase.co/functions/v1/content-generator'

interface ContentGenerationControlsProps {
  onContentGenerated: (draftId: string) => void
  onSetTab: (tab: string) => void
}

const ContentGenerationControls: React.FC<ContentGenerationControlsProps> = ({ onContentGenerated, onSetTab }) => {
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [context, setContext] = useState('maputo')
  const [audience, setAudience] = useState('vendedores')
  const [contentType, setContentType] = useState('guia-completo')
  const [generating, setGenerating] = useState(false)

  const generateContent = async () => {
    setGenerating(true)
    const toastId = showLoading('Gerando conteúdo com IA...')
    
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session?.access_token) {
        dismissToast(toastId)
        throw new Error('Usuário não autenticado. Faça login novamente.')
      }
      
      const response = await fetch(CONTENT_GENERATOR_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'generate',
          keyword: keyword.trim(),
          context,
          audience,
          type: contentType
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        dismissToast(toastId)
        try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.error || `Falha na requisição (Status ${response.status})`);
        } catch {
            throw new Error(`Falha na requisição (Status ${response.status}): ${errorText.substring(0, 100)}...`);
        }
      }
      
      const result = await response.json()
      
      if (result.success) {
        dismissToast(toastId)
        showSuccess(`Conteúdo gerado! Revise no editor.`)
        setKeyword('')
        setStep(1)
        if (result.draftId) {
            onContentGenerated(result.draftId)
        }
      } else {
        dismissToast(toastId)
        throw new Error(result.error || 'Erro desconhecido na Edge Function.')
      }
    } catch (error: any) {
      dismissToast(toastId)
      console.error('Error generating content:', error)
      showError(`Falha na geração: ${error.message}`)
    } finally {
      setGenerating(false)
    }
  }

  const handleSuggestionSelect = (suggestion: { keyword: string }) => {
    setKeyword(suggestion.keyword);
    setStep(2);
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  }

  return (
    <Card className="border-green-200 bg-green-50 overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center text-green-800">
          <Target className="w-6 h-6 mr-2" />
          Assistente de Geração de Conteúdo
        </CardTitle>
        {/* Step Indicator */}
        <div className="flex items-center space-x-2 pt-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 h-2 rounded-full transition-colors" style={{ backgroundColor: step >= s ? '#16a34a' : '#d1d5db' }}></div>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4">
              <h3 className="font-semibold text-lg">Passo 1: Defina a Palavra-chave Principal</h3>
              <KeywordSuggester 
                value={keyword} 
                onChange={setKeyword}
                onSuggestionSelect={handleSuggestionSelect}
              />
              <Button 
                onClick={() => setStep(2)} 
                disabled={!keyword.trim()} 
                className={`w-full transition-colors ${keyword.trim() ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
              >
                Avançar <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4">
              <h3 className="font-semibold text-lg">Passo 2: Refine o Público e o Contexto</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center"><Users className="w-4 h-4 mr-1" /> Público-Alvo</label>
                  <Select value={audience} onValueChange={setAudience}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {AUDIENCE_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center"><FileText className="w-4 h-4 mr-1" /> Tipo de Conteúdo</label>
                  <Select value={contentType} onValueChange={setContentType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TYPE_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center"><Globe className="w-4 h-4 mr-1" /> Contexto Local</label>
                  <Select value={context} onValueChange={setContext}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CONTEXT_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button onClick={() => setStep(1)} variant="outline" className="w-full">Voltar</Button>
                <Button onClick={() => setStep(3)} className="w-full">Avançar <ArrowRight className="w-4 h-4 ml-2" /></Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4">
              <h3 className="font-semibold text-lg">Passo 3: Confirme e Gere o Conteúdo</h3>
              <div className="p-4 bg-white rounded-lg border space-y-2 text-sm">
                <div className="flex justify-between"><strong>Palavra-chave:</strong> <span className="text-right">{keyword}</span></div>
                <div className="flex justify-between"><strong>Público:</strong> <span className="text-right">{AUDIENCE_OPTIONS.find(o => o.value === audience)?.label}</span></div>
                <div className="flex justify-between"><strong>Tipo:</strong> <span className="text-right">{TYPE_OPTIONS.find(o => o.value === contentType)?.label}</span></div>
                <div className="flex justify-between"><strong>Contexto:</strong> <span className="text-right">{CONTEXT_OPTIONS.find(o => o.value === context)?.label}</span></div>
              </div>
              <div className="flex space-x-2">
                <Button onClick={() => setStep(2)} variant="outline" className="w-full" disabled={generating}>Voltar</Button>
                <Button onClick={generateContent} disabled={generating} className="w-full bg-green-600 hover:bg-green-700 text-white" size="lg">
                  {generating ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Gerando...</>
                  ) : (
                    <><Zap className="w-5 h-5 mr-2" /> Gerar Artigo Agora</>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}

export default ContentGenerationControls