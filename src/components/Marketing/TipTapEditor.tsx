import React, { useEffect, useState, useCallback } from 'react';
import { useEditor, EditorContent, JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import CharacterCount from '@tiptap/extension-character-count';
import TipTapToolbar from './TipTapToolbar';
import { Card, CardContent } from '../ui/card';

interface TipTapEditorProps {
  initialContent: JSONContent | null;
  onChange: (content: JSONContent) => void;
  wordCount: number;
  onWordCountChange: (count: number) => void;
}

const TipTapEditor: React.FC<TipTapEditorProps> = ({ initialContent, onChange, onWordCountChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4], // Adicionado H4
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
      CharacterCount.configure({
        limit: 10000,
      }),
    ],
    content: initialContent || { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Comece a escrever aqui...' }] }] },
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
    onTransaction: ({ editor }) => {
      // Update word count on every transaction
      const words = editor.storage.characterCount.words();
      onWordCountChange(words);
    },
    editorProps: {
        attributes: {
            class: 'prose prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-h4:text-base max-w-none min-h-[400px] focus:outline-none p-4',
        },
    },
  });

  // Sincroniza o conteúdo inicial quando ele muda (ex: após a geração da IA)
  useEffect(() => {
    if (editor && initialContent && JSON.stringify(editor.getJSON()) !== JSON.stringify(initialContent)) {
        editor.commands.setContent(initialContent);
    }
  }, [editor, initialContent]);

  return (
    <Card className="border-gray-300">
      <TipTapToolbar editor={editor} />
      <CardContent className="p-0">
        <EditorContent editor={editor} />
      </CardContent>
    </Card>
  );
};

export default TipTapEditor;