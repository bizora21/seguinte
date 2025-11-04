import React, { useMemo } from 'react'
import SimpleMDE from 'react-simplemde-editor'
import 'easymde/dist/easymde.min.css'
import { Card, CardContent } from '../ui/card'
import { Label } from '../ui/label'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  label: string
  rows?: number
  placeholder?: string
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ value, onChange, label, placeholder }) => {
  
  const options = useMemo(() => {
    return {
      autofocus: true,
      spellChecker: true,
      placeholder: placeholder || "Digite o conteúdo do artigo em Markdown...",
      // Removendo hideIcons para garantir que todos os botões padrão sejam visíveis
      // Adicionando 'heading' explicitamente para garantir H1, H2, H3
      toolbar: [
        "bold", "italic", "strikethrough", "|", 
        "heading", "heading-1", "heading-2", "heading-3", "|", // Adicionado heading e níveis
        "unordered-list", "ordered-list", "|", 
        "link", "quote", "code", "table", "|", 
        "preview", "clean-block", "fullscreen" // Adicionado fullscreen
      ] as any,
      status: ["lines", "words", "cursor"], // Adicionando barra de status para mais recursos
    }
  }, [placeholder])

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Card className="border-gray-300">
        <CardContent className="p-0">
          <SimpleMDE 
            value={value} 
            onChange={onChange} 
            options={options} 
            className="min-h-[400px]"
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default MarkdownEditor