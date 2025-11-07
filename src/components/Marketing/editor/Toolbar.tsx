import React from 'react'
import { Button } from '../../ui/button'
import { Separator } from '../../ui/separator'
import { 
  Bold, Italic, Underline, Strikethrough,
  Heading1, Heading2, Heading3,
  List, ListOrdered,
  Link, Image, Quote, Code, Table,
  Undo, Redo,
  Eye, Edit3, Save, Send,
  Plus, Trash2, MoreHorizontal
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../../ui/dropdown-menu'

interface ToolbarProps {
  onSave: () => void
  onPublish: () => void
  onUndo: () => void
  onRedo: () => void
  onTogglePreview: () => void
  onToggleSidebar: () => void
  onGenerateWithAI: () => void
  isPreviewMode: boolean
  isSaving: boolean
  isPublishing: boolean
  draft: any // Tipagem flexível para o rascunho
}

const Toolbar: React.FC<ToolbarProps> = ({
  onSave,
  onPublish,
  onUndo,
  onRedo,
  onTogglePreview,
  onToggleSidebar,
  onGenerateWithAI,
  isPreviewMode,
  isSaving,
  isPublishing,
  draft
}) => {
  const [isMoreOpen, setIsMoreOpen] = React.useState(false)

  // Funções de comando simuladas (serão substituídas por comandos TipTap reais)
  const handleFormat = (command: string) => {
    console.log(`Comando de formatação simulado: ${command}`)
    // Aqui, em uma refatoração futura, usaríamos editor.chain().focus().toggleBold().run()
  }

  return (
    <div className="border-b bg-white px-4 py-2 flex items-center justify-between sticky top-0 z-10">
      {/* Grupo de Ações Principais */}
      <div className="flex items-center space-x-1">
        {/* Ações de Formatação de Texto */}
        <div className="flex items-center border-r pr-2 mr-2">
          <Button variant="ghost" size="sm" title="Negrito (Ctrl+B)" onClick={() => handleFormat('bold')}>
            <Bold className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" title="Itálico (Ctrl+I)" onClick={() => handleFormat('italic')}>
            <Italic className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" title="Sublinhado (Ctrl+U)" onClick={() => handleFormat('underline')}>
            <Underline className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" title="Tachado (Ctrl+Shift+S)" onClick={() => handleFormat('strikethrough')}>
            <Strikethrough className="w-4 h-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Ações de Estrutura */}
        <div className="flex items-center border-r pr-2 mr-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" title="Títulos">
                <Heading1 className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={() => handleFormat('h1')}>
                <Heading1 className="w-4 h-4 mr-2" />
                Título 1
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFormat('h2')}>
                <Heading2 className="w-4 h-4 mr-2" />
                Título 2
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFormat('h3')}>
                <Heading3 className="w-4 h-4 mr-2" />
                Título 3
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center border-r pr-2 mr-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" title="Listas">
                <List className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={() => handleFormat('ul')}>
                <List className="w-4 h-4 mr-2" />
                Lista com Marcadores
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFormat('ol')}>
                <ListOrdered className="w-4 h-4 mr-2" />
                Lista Numerada
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center border-r pr-2 mr-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" title="Inserir">
                <Plus className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={() => handleFormat('link')}>
                <Link className="w-4 h-4 mr-2" />
                Link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFormat('image')}>
                <Image className="w-4 h-4 mr-2" />
                Imagem
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFormat('table')}>
                <Table className="w-4 h-4 mr-2" />
                Tabela
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleFormat('quote')}>
                <Quote className="w-4 h-4 mr-2" />
                Citação
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFormat('code')}>
                <Code className="w-4 h-4 mr-2" />
                Código
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Grupo de Ações de Edição */}
      <div className="flex items-center space-x-1">
        <Button variant="ghost" size="sm" title="Desfazer (Ctrl+Z)" onClick={onUndo}>
          <Undo className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" title="Refazer (Ctrl+Y)" onClick={onRedo}>
          <Redo className="w-4 h-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6 mx-2" />

      {/* Grupo de Ações de Visualização */}
      <div className="flex items-center space-x-1">
        <Button
          variant={isPreviewMode ? "default" : "ghost"}
          size="sm"
          onClick={onTogglePreview}
          title={isPreviewMode ? "Editar" : "Pré-visualizar"}
        >
          {isPreviewMode ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </Button>
        <Button variant="ghost" size="sm" title="Barra Lateral" onClick={onToggleSidebar}>
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6 mx-2" />

      {/* Grupo de Ações de IA */}
      <div className="flex items-center space-x-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onGenerateWithAI}
          className="text-purple-600 border-purple-600 hover:bg-purple-50"
          title="Gerar Conteúdo com IA"
        >
          <Plus className="w-4 h-4 mr-1" />
          IA
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6 mx-2" />

      {/* Grupo de Ações de Salvamento */}
      <div className="flex items-center space-x-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onSave}
          disabled={isSaving}
          title="Salvar Rascunho"
        >
          <Save className="w-4 h-4 mr-1" />
          {isSaving ? 'Salvando...' : 'Salvar'}
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={onPublish}
          disabled={isPublishing}
          className="bg-green-600 hover:bg-green-700 text-white"
          title="Publicar Artigo"
        >
          <Send className="w-4 h-4 mr-1" />
          {isPublishing ? 'Publicando...' : 'Publicar'}
        </Button>
      </div>
    </div>
  )
}

export default Toolbar