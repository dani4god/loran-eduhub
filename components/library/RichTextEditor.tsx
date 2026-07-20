// components/library/RichTextEditor.tsx
'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import { useEffect } from 'react'
import {
  Bold, Italic, UnderlineIcon, Strikethrough, List, ListOrdered,
  Quote, Code, Link as LinkIcon, Undo, Redo, Heading1, Heading2, Heading3,
  AlignLeft, AlignCenter, AlignRight, Table as TableIcon, Minus,
} from 'lucide-react'

interface Props {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  resetKey: string // change this whenever the underlying node switches, to force-reload content
}

function ToolBtn({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-lg transition-colors ${
        active ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  )
}

export default function RichTextEditor({ value, onChange, placeholder, resetKey }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-blue-600 underline' } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: placeholder || 'Start writing...' }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[220px] px-4 py-3',
      },
    },
  })

  // Force-reload content only when switching to a different node (chapter/topic/subtopic),
  // not on every keystroke — otherwise the cursor position would jump on every character typed.
  useEffect(() => {
    if (!editor) return
    // pass options object to satisfy SetContentOptions type (don't emit update)
    editor.commands.setContent(value || '', { emitUpdate: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, editor])

  if (!editor) return null

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('Enter URL', previousUrl || 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-100 bg-gray-50 px-2 py-1.5">
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
          <Bold size={15} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
          <Italic size={15} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
          <UnderlineIcon size={15} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
          <Strikethrough size={15} />
        </ToolBtn>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
          <Heading1 size={15} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
          <Heading2 size={15} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
          <Heading3 size={15} />
        </ToolBtn>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
          <List size={15} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list">
          <ListOrdered size={15} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Quote">
          <Quote size={15} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code block">
          <Code size={15} />
        </ToolBtn>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align left">
          <AlignLeft size={15} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align center">
          <AlignCenter size={15} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align right">
          <AlignRight size={15} />
        </ToolBtn>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <ToolBtn onClick={setLink} active={editor.isActive('link')} title="Insert link">
          <LinkIcon size={15} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Insert table">
          <TableIcon size={15} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
          <Minus size={15} />
        </ToolBtn>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Undo">
          <Undo size={15} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Redo">
          <Redo size={15} />
        </ToolBtn>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}