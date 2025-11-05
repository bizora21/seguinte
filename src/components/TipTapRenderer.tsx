import React from 'react';
import { useEditor, EditorContent, JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';

interface TipTapRendererProps {
  content: JSONContent;
}

const TipTapRenderer: React.FC<TipTapRendererProps> = ({ content }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
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
    content: content,
    editable: false, // Modo somente leitura
    editorProps: {
        attributes: {
            // Aplicando as mesmas classes de estilo do editor para consistência
            class: 'prose prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg max-w-none min-h-[100px] focus:outline-none',
        },
    },
  });

  if (!editor) {
    return <div className="text-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div></div>;
  }

  return (
    <div className="prose max-w-none">
      <EditorContent editor={editor} />
    </div>
  );
};

export default TipTapRenderer;