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