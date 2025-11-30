import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TextAlign from '@tiptap/extension-text-align';
import { Button } from '../ui/button';
import { Bold, Italic, List, ListOrdered, Link as LinkIcon, AlignLeft, AlignCenter, AlignRight, Heading2, Heading3, ImageIcon, Table as TableIcon } from 'lucide-react';
import { Separator } from '../ui/separator';
import LinkDialog from './editor/LinkDialog';

interface EmailEditorProps {
  initialContent: string;
  onChange: (htmlContent: string) => void;
  disabled: boolean;
  contentToInsert?: string | null; // Prop para injetar HTML
  onContentInserted?: () => void; // Callback para limpar a injeção
}

const EmailEditor: React.FC<EmailEditorProps> = ({ initialContent, onChange, disabled, contentToInsert, onContentInserted }) => {
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
        blockquote: false,
        code: false,
        codeBlock: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:underline',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Image.configure({
        inline: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-md my-4',
          style: 'max-width: 100%; height: auto;',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full my-4',
          style: 'width: 100%; border-collapse: collapse;',
        },
      }),
      TableRow,
      TableHeader,
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 p-2',
          style: 'border: 1px solid #e5e7eb; padding: 8px;',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph', 'image'],
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[300px] focus:outline-none p-4 bg-white rounded-b-lg',
      },
    },
    editable: !disabled,
  });

  // Efeito para sincronizar conteúdo inicial (apenas na carga ou reset total)
  useEffect(() => {
    if (editor && initialContent && editor.isEmpty && initialContent.length > 0) {
       editor.commands.setContent(initialContent);
    }
  }, [editor, initialContent]);

  // Efeito para INSERIR conteúdo (produtos) sem apagar o resto
  useEffect(() => {
    if (editor && contentToInsert) {
      // Insere o HTML na posição atual do cursor ou no final
      editor.chain().focus().insertContent(contentToInsert).run();
      
      // Avisa o pai que já inseriu, para limpar o estado
      if (onContentInserted) {
        onContentInserted();
      }
    }
  }, [editor, contentToInsert, onContentInserted]);

  const setLink = () => {
    if (editor) {
      setIsLinkDialogOpen(true);
    }
  };

  const addImage = () => {
    const url = window.prompt('URL da Imagem');
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const Toolbar = () => (
    <div className="flex flex-wrap items-center p-2 gap-1 border-b border-gray-200 bg-gray-50 rounded-t-lg sticky top-0 z-10">
      <Button onClick={() => editor?.chain().focus().toggleBold().run()} disabled={!editor?.can().chain().focus().toggleBold().run()} variant={editor?.isActive('bold') ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8"><Bold className="w-4 h-4" /></Button>
      <Button onClick={() => editor?.chain().focus().toggleItalic().run()} disabled={!editor?.can().chain().focus().toggleItalic().run()} variant={editor?.isActive('italic') ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8"><Italic className="w-4 h-4" /></Button>
      
      <Separator orientation="vertical" className="h-6 mx-1" />

      <Button onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} variant={editor?.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8"><Heading2 className="w-4 h-4" /></Button>
      <Button onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} variant={editor?.isActive('heading', { level: 3 }) ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8"><Heading3 className="w-4 h-4" /></Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <Button onClick={() => editor?.chain().focus().setTextAlign('left').run()} variant={editor?.isActive({ textAlign: 'left' }) ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8"><AlignLeft className="w-4 h-4" /></Button>
      <Button onClick={() => editor?.chain().focus().setTextAlign('center').run()} variant={editor?.isActive({ textAlign: 'center' }) ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8"><AlignCenter className="w-4 h-4" /></Button>
      <Button onClick={() => editor?.chain().focus().setTextAlign('right').run()} variant={editor?.isActive({ textAlign: 'right' }) ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8"><AlignRight className="w-4 h-4" /></Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <Button onClick={() => editor?.chain().focus().toggleBulletList().run()} variant={editor?.isActive('bulletList') ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8"><List className="w-4 h-4" /></Button>
      <Button onClick={() => editor?.chain().focus().toggleOrderedList().run()} variant={editor?.isActive('orderedList') ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8"><ListOrdered className="w-4 h-4" /></Button>
      
      <Separator orientation="vertical" className="h-6 mx-1" />

      <Button onClick={setLink} variant={editor?.isActive('link') ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8"><LinkIcon className="w-4 h-4" /></Button>
      <Button onClick={addImage} variant="ghost" size="icon" className="h-8 w-8"><ImageIcon className="w-4 h-4" /></Button>
      
      {/* Botão para deletar tabela se estiver selecionada */}
      {editor?.isActive('table') && (
        <Button onClick={() => editor.chain().focus().deleteTable().run()} variant="destructive" size="icon" className="h-8 w-8 ml-auto"><TableIcon className="w-4 h-4" /></Button>
      )}
    </div>
  );

  return (
    <div className="border rounded-lg bg-white shadow-sm flex flex-col h-full">
      <Toolbar />
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} className="h-full" />
      </div>
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