import React, { useCallback, useEffect, useRef } from 'react'
import { useEditor, EditorContent, JSONContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import { Loader2 } from 'lucide-react'

interface EditorCanvasProps {
  initialContent: string
  onChange: (content: string) => void
  onUndo: () => void
  onRedo: () => void
  history: { content: string; timestamp: number }[]
  historyIndex: number
}

const EditorCanvas: React.FC<EditorCanvasProps> = ({
  initialContent,
  onChange,
  onUndo,
  onRedo,
  history,
  historyIndex
}) => {
  
  // O TipTap usa JSON internamente, mas o AdvancedEditor usa HTML para simplificar o armazenamento inicial.
  // Vamos configurar o TipTap para usar HTML como entrada/saída.
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4], // Suporte a H1-H4
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:underline',
        },
      }),
      Image.configure({
        inline: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg my-4',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: initialContent, // Conteúdo inicial em HTML
    onUpdate: ({ editor }) => {
      // Retorna o conteúdo como HTML para o AdvancedEditor
      onChange(editor.getHTML())
    },
    editorProps: {
        attributes: {
            // Aplicando classes de estilo para o editor
            class: 'ProseMirror max-w-none min-h-[400px] focus:outline-none p-4',
        },
    },
  })

  // Sincroniza o conteúdo externo (do histórico) com o editor
  useEffect(() => {
    if (editor && initialContent !== editor.getHTML()) {
        // Removendo o segundo argumento 'false' para resolver o erro de tipagem.
        // Isso fará com que o comando emita um update, mas o `if` externo deve prevenir o loop infinito.
        editor.commands.setContent(initialContent)
    }
  }, [editor, initialContent])
  
  if (!editor) {
    return <div className="flex justify-center h-32"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="flex-1 overflow-auto">
      {/* A barra de ferramentas será gerenciada pelo componente Toolbar principal,
          mas aqui podemos adicionar comandos de edição se necessário. */}
      <EditorContent editor={editor} />
    </div>
  )
}

export default EditorCanvas