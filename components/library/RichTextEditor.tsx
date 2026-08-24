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
import ResizableImage from '@/components/library/ResizableImageExtension'
import VideoEmbed, { isEmbeddableVideoUrl } from '@/components/library/VideoEmbedExtension'
import { useEffect, useRef } from 'react'
import {
  Bold, Italic, UnderlineIcon, Strikethrough, List, ListOrdered,
  Quote, Code, Link as LinkIcon, Undo, Redo, Heading1, Heading2, Heading3,
  AlignLeft, AlignCenter, AlignRight, Table as TableIcon, Minus,
  ImagePlus,
} from 'lucide-react'
import toast from 'react-hot-toast'

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
  const isInitialLoad = useRef(true)

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
      ResizableImage.configure({ HTMLAttributes: { class: 'rounded-lg max-w-full' } }),
      VideoEmbed,
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      // Clean up invalid video embeds before saving
      let hasInvalid = false
      const { state } = editor
      const tr = state.tr
      
      state.doc.descendants((node, pos) => {
        if (node.type.name === 'videoEmbed' && !node.attrs.src) {
          // Replace invalid node with a text node
          const text = '[Invalid video embed - please re-add]'
          const textNode = state.schema.text(text)
          tr.replaceWith(pos, pos + node.nodeSize, textNode)
          hasInvalid = true
          return false
        }
      })
      
      if (hasInvalid) {
        editor.view.dispatch(tr)
        toast.error('Invalid video embed removed. Please re-add the video URL.')
      }
      
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          'tiptap-editor-content max-w-none focus:outline-none min-h-[220px] px-4 py-3',
      },
      handlePaste: (view, event) => {
        const text = event.clipboardData?.getData('text/plain')?.trim()
        
        // Validate the URL
        if (!text || typeof text !== 'string') {
          return false
        }

        // Check if it's a valid video URL
        if (!isEmbeddableVideoUrl(text)) {
          return false
        }

        // Prevent pasting if it's already a video embed
        const { state } = view
        const { selection } = state
        const node = selection.$from.node()
        if (node && node.type.name === 'videoEmbed') {
          return false
        }

        event.preventDefault()
        const { schema } = view.state
        const videoNode = schema.nodes.videoEmbed.create({ src: text })
        const transaction = view.state.tr.replaceSelectionWith(videoNode)
        view.dispatch(transaction)
        
        toast.success('Video embedded successfully!')
        return true
      },
    },
  })

  // Clean up invalid video embeds on load and when content changes
  useEffect(() => {
    if (!editor) return

    // Skip cleanup on initial load to avoid removing valid content
    if (isInitialLoad.current) {
      isInitialLoad.current = false
      return
    }

    const cleanInvalidNodes = () => {
      let hasInvalid = false
      const { state } = editor
      const tr = state.tr

      state.doc.descendants((node, pos) => {
        if (node.type.name === 'videoEmbed') {
          if (!node.attrs.src) {
            // Replace invalid node with a text node
            const text = '[Invalid video embed - please re-add]'
            const textNode = state.schema.text(text)
            tr.replaceWith(pos, pos + node.nodeSize, textNode)
            hasInvalid = true
            return false
          }
        }
      })

      if (hasInvalid) {
        editor.view.dispatch(tr)
        toast.error('Invalid video embed found and removed.')
      }
    }

    // Run cleanup after a small delay to ensure editor is ready
    const timer = setTimeout(cleanInvalidNodes, 100)
    return () => clearTimeout(timer)
  }, [editor])

  // Force-reload content only when switching to a different node (chapter/topic/subtopic),
  // not on every keystroke — otherwise the cursor position would jump on every character typed.
  useEffect(() => {
    if (!editor) return
    // pass options object to satisfy SetContentOptions type (don't emit update)
    editor.commands.setContent(value || '', { emitUpdate: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, editor])

  const insertImage = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'image')
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok) editor?.chain().focus().setImage({ src: data.url }).run()
    }
    input.click()
  }

  const setLink = () => {
    if (!editor) return

    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('Enter URL', previousUrl || 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const insertVideo = () => {
    if (!editor) return
    
    const url = window.prompt('Enter video URL (YouTube, Vimeo, Loom, etc.):')
    if (!url) return
    
    if (!isEmbeddableVideoUrl(url)) {
      toast.error('Invalid video URL. Please enter a valid YouTube, Vimeo, or Loom URL.')
      return
    }
    
    editor.commands.setVideoEmbed({ src: url })
    toast.success('Video embedded successfully!')
  }

  if (!editor) return null

  return (
    <div className="border border-gray-200 overflow-hidden bg-white rounded-xl">
      {/* Sticky toolbar - stays visible while scrolling through content */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b border-gray-100 bg-gray-50 px-2 py-1.5">
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
        <ToolBtn onClick={insertImage} title="Insert image">
          <ImagePlus size={15} />
        </ToolBtn>
        <ToolBtn onClick={insertVideo} title="Insert video">
          <div className="text-[15px] font-bold">▶</div>
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