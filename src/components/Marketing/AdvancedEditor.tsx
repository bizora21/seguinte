import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'
import { Badge } from '../ui/badge'
import { 
  Save, Send, X, Loader2
} from 'lucide-react'
import { ContentDraft, BlogCategory, LocalDraftState } from '../../types/blog'
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/toast'
import { useEditor, JSONContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import CharacterCount from '@tiptap/extension-character-count'

// Subcomponentes
import TipTapToolbar from './editor/TipTapToolbar'
import EditorCanvas from './editor/EditorCanvas'
import Sidebar from './editor/Sidebar'
import Statusbar from './editor/Statusbar'
import SEOSuggestionsPanel from './SEOSuggestionsPanel' // CORRIGIDO: Caminho relativo
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import OptimizedImageUpload from './OptimizedImageUpload'
import TipTapRenderer from '../TipTapRenderer'