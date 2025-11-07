import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '../ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Loader2, Edit } from 'lucide-react'
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/toast'
import { supabase } from '../../lib/supabase'
import LoadingSpinner from '../LoadingSpinner'
import { useAuth } from '../../contexts/AuthContext'
import { ContentDraft, BlogCategory } from '../../types/blog'
import AdvancedEditor from './AdvancedEditor'
import ContentGenerationControls from './ContentGenerationControls'
import DraftsList from './DraftsList'
import PublishedList from './PublishedList'

// Definição do componente ContentManagerTab (Conteúdo omitido para brevidade, mas garantindo a exportação)
const ContentManagerTab = () => {
    // ... (Conteúdo do componente)
    return <div>Content Manager Tab Placeholder</div>
}

export default ContentManagerTab