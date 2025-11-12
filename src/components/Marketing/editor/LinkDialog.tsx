import React, { useState, useEffect } from 'react'
import { Editor } from '@tiptap/react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '../../ui/dialog'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Button } from '../../ui/button'
import { Link, Trash2 } from 'lucide-react'

interface LinkDialogProps {
  editor: Editor
  isOpen: boolean
  onClose: () => void
}

const LinkDialog: React.FC<LinkDialogProps> = ({ editor, isOpen, onClose }) => {
  const [url, setUrl] = useState('')

  useEffect(() => {
    if (isOpen) {
      const existingUrl = editor.getAttributes('link').href || ''
      setUrl(existingUrl)
    }
  }, [isOpen, editor])

  const handleSave = () => {
    if (url.trim()) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run()
    } else {
      editor.chain().focus().unsetLink().run()
    }
    onClose()
  }

  const handleRemove = () => {
    editor.chain().focus().unsetLink().run()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Link className="w-5 h-5 mr-2" />
            Editar Link
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="link-url">URL</Label>
          <Input
            id="link-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://exemplo.com"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleSave()
              }
            }}
          />
        </div>
        <DialogFooter className="justify-between">
          <Button variant="destructive" onClick={handleRemove}>
            <Trash2 className="w-4 h-4 mr-2" />
            Remover Link
          </Button>
          <div className="flex space-x-2">
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleSave}>Salvar</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default LinkDialog