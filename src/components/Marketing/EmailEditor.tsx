import React, { useEffect, useState, useCallback } from 'react';
import { useEditor, EditorContent, JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { Button } from '../ui/button';
import { Bold, Italic, List, ListOrdered, Link as LinkIcon, AlignLeft, AlignCenter, AlignRight, Trash2, Heading2, Heading3 } from 'lucide-react';
import { Separator } from '../ui/separator';
import LinkDialog from './editor/LinkDialog'; // Reutilizando o LinkDialog

interface EmailEditorProps {
  initialContent: string;
  onChange: (htmlContent: string) => void;
  disabled: boolean;
}

const EmailEditor: React.FC<EmailEditorProps> = ({ initialContent, onChange, disabled }) => {
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3], // Apenas H2 e H3 para e-mail
        },
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        hardBreak: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:underline',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      TextAlign.configure({
        types: ['paragraph'],
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose max-w-none min-h-[200px] focus:outline-none p-4 bg-white rounded-b-lg border border-t-0',
      },
    },
    editable: !disabled,
  });

  useEffect(() => {
    if (editor && initialContent && editor.getHTML() !== initialContent) {
      // CORREÇÃO: Passar { emitUpdate: false } para evitar loop de atualização
      editor.commands.setContent(initialContent, { emitUpdate: false });
    }
  }, [editor, initialContent]);

  const setLink = () => {
    if (editor) {
      setIsLinkDialogOpen(true);
    }
  };

  const Toolbar = () => (
    <div className="flex flex-wrap items-center p-2 space-x-1 border-b border-gray-200 bg-gray-50 rounded-t-lg">
      <Button
        onClick={() => editor?.chain().focus().toggleBold().run()}
        disabled={!editor?.can().chain().focus().toggleBold().run()}
        variant={editor?.isActive('bold') ? 'secondary' : 'ghost'}
        size="icon"
        aria-label="Negrito"
      >
        <Bold className="w-4 h-4" />
      </Button>
      <Button
        onClick={() => editor?.chain().focus().toggleItalic().run()}
        disabled={!editor?.can().chain().focus().toggleItalic().run()}
        variant={editor?.isActive('italic') ? 'secondary' : 'ghost'}
        size="icon"
        aria-label="Itálico"
      >
        <Italic className="w-4 h-4" />
      </Button>
      
      <Separator orientation="vertical" className="h-6 mx-2" />

      <Button
        onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        variant={editor?.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'}
        size="icon"
        aria-label="Título H2"
      >
        <Heading2 className="w-4 h-4" />
      </Button>
      <Button
        onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
        variant={editor?.isActive('heading', { level: 3 }) ? 'secondary' : 'ghost'}
        size="icon"
        aria-label="Título H3"
      >
        <Heading3 className="w-4 h-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-2" />

      <Button
        onClick={() => editor?.chain().focus().toggleBulletList().run()}
        variant={editor?.isActive('bulletList') ? 'secondary' : 'ghost'}
        size="icon"
        aria-label="Lista com Marcadores"
      >
        <List className="w-4 h-4" />
      </Button>
      <Button
        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        variant={editor?.isActive('orderedList') ? 'secondary' : 'ghost'}
        size="icon"
        aria-label="Lista Numerada"
      >
        <ListOrdered className="w-4 h-4" />
      </Button>
      
      <Separator orientation="vertical" className="h-6 mx-2" />

      <Button
        onClick={setLink}
        variant={editor?.isActive('link') ? 'secondary' : 'ghost'}
        size="icon"
        aria-label="Adicionar Link"
      >
        <LinkIcon className="w-4 h-4" />
      </Button>
      
      <Separator orientation="vertical" className="h-6 mx-2" />

      <Button
        onClick={() => editor?.chain().focus().setTextAlign('left').run()}
        variant={editor?.isActive({ textAlign: 'left' }) ? 'secondary' : 'ghost'}
        size="icon"
        aria-label="Alinhar à Esquerda"
      >
        <AlignLeft className="w-4 h-4" />
      </Button>
      <Button
        onClick={() => editor?.chain().focus().setTextAlign('center').run()}
        variant={editor?.isActive({ textAlign: 'center' }) ? 'secondary' : 'ghost'}
        size="icon"
        aria-label="Alinhar ao Centro"
      >
        <AlignCenter className="w-4 h-4" />
      </Button>
      <Button
        onClick={() => editor?.chain().focus().setTextAlign('right').run()}
        variant={editor?.isActive({ textAlign: 'right' }) ? 'secondary' : 'ghost'}
        size="icon"
        aria-label="Alinhar à Direita"
      >
        <AlignRight className="w-4 h-4" />
      </Button>
    </div>
  );

  return (
    <div className="border rounded-lg">
      <Toolbar />
      <EditorContent editor={editor} />
      {editor && (
        <LinkDialog
          editor={editor}
          isOpen={isLinkDialogOpen}
          onClose={() => setIsLinkDialogOpen(false)}
        />
      )}
    </div>
  );
};

export default EmailEditor;