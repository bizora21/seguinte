import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { Button } from '../../ui/button';
import { Separator } from '../../ui/separator';
import { 
  Bold, Italic, List, ListOrdered, Heading, Link, Image, AlignLeft, AlignCenter, AlignRight, 
  Undo, Redo,
  Eye, Edit3, Save, Send,
  Plus, MoreHorizontal
} from 'lucide-react';
import LinkDialog from './LinkDialog'; // Importando o novo componente

interface TipTapToolbarProps {
  editor: Editor | null;
  onSave: () => void;
  onPublish: () => void;
  onTogglePreview: () => void;
  onToggleSidebar: () => void;
  onGenerateWithAI: () => void;
  isPreviewMode: boolean;
  isSaving: boolean;
  isPublishing: boolean;
}

const TipTapToolbar: React.FC<TipTapToolbarProps> = ({ 
  editor, 
  onSave, 
  onPublish, 
  onTogglePreview, 
  onToggleSidebar, 
  onGenerateWithAI,
  isPreviewMode,
  isSaving,
  isPublishing
}) => {
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);

  if (!editor) {
    return null;
  }

  const addImage = () => {
    const url = window.prompt('URL da Imagem');

    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center p-2 space-x-1 border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
        {/* Grupo de Formatação */}
        <div className="flex items-center border-r pr-2 mr-2">
          <Button
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
            size="icon"
            aria-label="Negrito"
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
            size="icon"
            aria-label="Itálico"
          >
            <Italic className="w-4 h-4" />
          </Button>
        </div>
        
        <Separator orientation="vertical" className="h-6" />

        {/* Grupo de Títulos */}
        <div className="flex items-center border-r pr-2 mr-2">
          <Button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'}
            size="icon"
            aria-label="Título H2"
          >
            <Heading className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            variant={editor.isActive('heading', { level: 3 }) ? 'secondary' : 'ghost'}
            size="icon"
            aria-label="Título H3"
          >
            <Heading className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
            variant={editor.isActive('heading', { level: 4 }) ? 'secondary' : 'ghost'}
            size="icon"
            aria-label="Título H4"
          >
            <Heading className="w-3 h-3" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Grupo de Listas */}
        <div className="flex items-center border-r pr-2 mr-2">
          <Button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
            size="icon"
            aria-label="Lista com Marcadores"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
            size="icon"
            aria-label="Lista Numerada"
          >
            <ListOrdered className="w-4 h-4" />
          </Button>
        </div>
        
        <Separator orientation="vertical" className="h-6" />

        {/* Grupo de Links e Mídia */}
        <div className="flex items-center border-r pr-2 mr-2">
          <Button
            onClick={() => setIsLinkDialogOpen(true)}
            variant={editor.isActive('link') ? 'secondary' : 'ghost'}
            size="icon"
            aria-label="Adicionar Link"
          >
            <Link className="w-4 h-4" />
          </Button>
          <Button
            onClick={addImage}
            variant="ghost"
            size="icon"
            aria-label="Adicionar Imagem"
          >
            <Image className="w-4 h-4" />
          </Button>
        </div>
        
        <Separator orientation="vertical" className="h-6" />

        {/* Grupo de Alinhamento */}
        <div className="flex items-center border-r pr-2 mr-2">
          <Button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            variant={editor.isActive({ textAlign: 'left' }) ? 'secondary' : 'ghost'}
            size="icon"
            aria-label="Alinhar à Esquerda"
          >
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            variant={editor.isActive({ textAlign: 'center' }) ? 'secondary' : 'ghost'}
            size="icon"
            aria-label="Alinhar ao Centro"
          >
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            variant={editor.isActive({ textAlign: 'right' }) ? 'secondary' : 'ghost'}
            size="icon"
            aria-label="Alinhar à Direita"
          >
            <AlignRight className="w-4 h-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Grupo de Desfazer/Refazer */}
        <div className="flex items-center border-r pr-2 mr-2">
          <Button variant="ghost" size="sm" title="Desfazer (Ctrl+Z)" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
            <Undo className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" title="Refazer (Ctrl+Y)" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
            <Redo className="w-4 h-4" />
          </Button>
        </div>

        {/* Grupo de Ações de Visualização e IA */}
        <div className="flex items-center space-x-2 ml-auto">
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

        <Separator orientation="vertical" className="h-6" />

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
            {isPublishing ? 'Publicar' : 'Publicar'}
          </Button>
        </div>
      </div>
      
      <LinkDialog
        editor={editor}
        isOpen={isLinkDialogOpen}
        onClose={() => setIsLinkDialogOpen(false)}
      />
    </>
  );
};

export default TipTapToolbar;