import React, { useCallback, useEffect, useRef } from 'react'
import { Editor, EditorContent, JSONContent } from '@tiptap/react'
import { Loader2 } from 'lucide-react'

interface EditorCanvasProps {
  editor: Editor | null
}

const EditorCanvas: React.FC<EditorCanvasProps> = ({
  editor,
}) => {
  
  if (!editor) {
    return <div className="flex justify-center h-32"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="flex-1 overflow-auto">
      <EditorContent editor={editor} />
    </div>
  )
}

export default EditorCanvas