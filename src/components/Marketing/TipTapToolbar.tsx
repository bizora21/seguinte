import React from 'react';
import { Editor } from '@tiptap/react';
import { Button } from '../ui/button';
import { Bold, Italic, List, ListOrdered, Heading, Link, Image, AlignLeft, AlignCenter, AlignRight, AlignJustify, MessageCircle } from 'lucide-react';
import { Separator } from '../ui/separator';

interface TipTapToolbarProps {
  editor: Editor | null;
}

const TipTapToolbar: React.FC<TipTapToolbarProps> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMark('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMark('link').setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = window.prompt('URL da Imagem');

    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div className="flex flex-wrap items-center p-2 space-x-1 border-b border-gray-200 bg-gray-50 rounded-t-lg">
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
      
      <Separator orientation="vertical" className="h-6 mx-2" />

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

      <Separator orientation="vertical" className="h-6 mx-2" />

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
      
      <Separator orientation="vertical" className="h-6 mx-2" />

      <Button
        onClick={setLink}
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
      
      <Separator orientation="vertical" className="h-6 mx-2" />

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
  );
};

export default TipTapToolbar;