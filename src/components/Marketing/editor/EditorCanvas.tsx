import React, { useCallback, useEffect, useRef } from 'react'
import { Editor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import { Loader2 } from 'lucide-react'

interface EditorCanvasProps {
  editor: Editor | null
  initialContent: string
  onChange: (content: string) => void
}

const EditorCanvas: React.FC<EditorCanvasProps> = ({
  editor,
  initialContent,
  onChange,
}) => {
  
  // Sincroniza o conteúdo externo (do histórico) com o editor
  useEffect(() => {
    if (editor && initialContent !== editor.getHTML()) {
        // Removendo o argumento 'false' para resolver o erro de tipagem.
        editor.commands.setContent(initialContent)
    }
  }, [editor, initialContent])
  
  if (!editor) {
    return <div className="flex justify-center h-32"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="flex-1 overflow-auto">
      <EditorContent editor={editor} />
    </div>
  )
}

export default EditorCanvas