import React from 'react';
import { useEditor, EditorContent, JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';

interface TipTapRendererProps {
  content: JSONContent | string; // Aceita JSON ou HTML
}

// Função de segurança para garantir que o conteúdo é válido para o TipTap
const sanitizeContentForTiptap = (content: JSONContent | string | null): JSONContent | string => {
    if (!content) {
        return ''; // Retorna string vazia
    }
    // Se for um objeto e parecer um documento TipTap válido, use-o.
    if (typeof content === 'object' && content.type === 'doc') {
        return content;
    }
    // Se for uma string, use-a (TipTap a tratará como HTML por padrão se não for JSON).
    if (typeof content === 'string') {
        return content;
    }
    console.warn("Conteúdo inválido passado para o TipTapRenderer. Recebido:", content);
    return ''; 
}

const TipTapRenderer: React.FC<TipTapRendererProps> = ({ content }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
        blockquote: {},
        bulletList: {},
        orderedList: {},
      }),
      Link.configure({
        openOnClick: true,
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
    // Passamos o conteúdo sanitizado diretamente.
    content: sanitizeContentForTiptap(content),
    editable: false, // Modo somente leitura
    editorProps: {
        attributes: {
            class: 'max-w-none min-h-[100px] focus:outline-none',
        },
    },
  });

  if (!editor) {
    return <div className="text-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div></div>;
  }

  return (
    <div className="max-w-none">
      <EditorContent editor={editor} />
    </div>
  );
};

export default TipTapRenderer;