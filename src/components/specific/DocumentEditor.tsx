'use client'

import { useEditor, EditorContent, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator' // Assuming you have Separator

interface DocumentEditorProps {
  initialContent: any | null
  onContentChange: (content: any) => void
}

const Toolbar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-t-lg border border-input bg-transparent p-2">
      <Button
        variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
        size="icon"
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
        size="icon"
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant={editor.isActive('strike') ? 'secondary' : 'ghost'}
        size="icon"
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="h-4 w-4" />
      </Button>
      <Separator orientation="vertical" className="h-8" />
      <Button
        variant={editor.isActive('heading', { level: 1 }) ? 'secondary' : 'ghost'}
        size="icon"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button
        variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'}
        size="icon"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="h-4 w-4" />
      </Button>
       <Button
        variant={editor.isActive('heading', { level: 3 }) ? 'secondary' : 'ghost'}
        size="icon"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="h-4 w-4" />
      </Button>
      <Separator orientation="vertical" className="h-8" />
       <Button
        variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
        size="icon"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </Button>
       <Button
        variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
        size="icon"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function DocumentEditor({
  initialContent,
  onContentChange,
}: DocumentEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit],
    content: initialContent || '<p>Comece a escrever seu documento...</p>',
    editorProps: {
      attributes: {
        class:
          'prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none min-h-[400px] rounded-b-lg border border-input p-4',
      },
    },
    onUpdate: ({ editor }) => {
      onContentChange(editor.getJSON())
    },
  })

  return (
    <div>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}
