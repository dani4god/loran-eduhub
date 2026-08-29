// components/library/RichTextEditor.tsx

'use client'

import { useEffect, useRef } from 'react'

import {
  useEditor,
  EditorContent,
} from '@tiptap/react'

import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'

import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'

import ResizableImage from '@/components/library/ResizableImageExtension'

import VideoEmbed, {
  isEmbeddableVideoUrl,
} from '@/components/library/VideoEmbedExtension'

import {
  Bold,
  Italic,
  UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Undo,
  Redo,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Table as TableIcon,
  ImagePlus,
  Rows3,
  Columns3,
  Trash2,
} from 'lucide-react'

import toast from 'react-hot-toast'

// ============================================================
// TYPES
// ============================================================

interface Props {
  value: string
  onChange: (html: string) => void
  placeholder?: string

  /**
   * Change this whenever the underlying chapter,
   * topic, subtopic, week, or page changes.
   */
  resetKey: string
}

// ============================================================
// TOOL BUTTON
// ============================================================

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
        active
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
      }`}
    >
      {children}
    </button>
  )
}

// ============================================================
// TOOLBAR DIVIDER
// ============================================================

function ToolbarDivider() {
  return (
    <div className="mx-1 h-5 w-px shrink-0 bg-gray-200" />
  )
}

// ============================================================
// RICH TEXT EDITOR
// ============================================================

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  resetKey,
}: Props) {
  const isInitialLoad = useRef(true)

  // ==========================================================
  // TIPTAP EDITOR
  // ==========================================================

  const editor = useEditor({
    immediatelyRender: false,

    extensions: [
      /**
       * IMPORTANT:
       *
       * Your installed StarterKit already contains
       * Link and Underline.
       *
       * Therefore DO NOT separately import:
       *
       * @tiptap/extension-link
       * @tiptap/extension-underline
       *
       * Otherwise Tiptap reports:
       *
       * Duplicate extension names found:
       * ['link', 'underline']
       */
      StarterKit.configure({
        link: {
          openOnClick: false,

          HTMLAttributes: {
            class: 'text-blue-600 underline',
          },
        },
      }),

      TextAlign.configure({
        types: [
          'heading',
          'paragraph',
        ],
      }),

      Placeholder.configure({
        placeholder:
          placeholder ||
          'Start writing...',
      }),

      Table.configure({
        resizable: true,
      }),

      TableRow,

      TableHeader,

      TableCell,

      ResizableImage.configure({
        HTMLAttributes: {
          class:
            'rounded-lg max-w-full',
        },
      }),

      VideoEmbed,
    ],

    content:
      value || '',

    // ========================================================
    // UPDATE CONTENT
    // ========================================================

    onUpdate: ({
      editor,
    }) => {
      let hasInvalid =
        false

      const {
        state,
      } = editor

      const tr =
        state.tr

      /**
       * Remove broken video nodes before
       * storing the editor HTML.
       */
      state.doc.descendants(
        (
          node,
          pos
        ) => {
          if (
            node.type.name ===
              'videoEmbed' &&
            !node.attrs.src
          ) {
            const text =
              '[Invalid video embed - please re-add]'

            const textNode =
              state.schema.text(
                text
              )

            tr.replaceWith(
              pos,
              pos +
                node.nodeSize,
              textNode
            )

            hasInvalid =
              true

            return false
          }

          return true
        }
      )

      if (
        hasInvalid
      ) {
        editor.view.dispatch(
          tr
        )

        toast.error(
          'Invalid video embed removed. Please re-add the video URL.'
        )
      }

      onChange(
        editor.getHTML()
      )
    },

    // ========================================================
    // EDITOR DOM PROPS
    // ========================================================

    editorProps: {
      attributes: {
        /**
         * IMPORTANT:
         *
         * Keep this class string on ONE LINE.
         *
         * Do not use a multiline template string here.
         * Tiptap may pass the newline to DOMTokenList,
         * causing:
         *
         * InvalidCharacterError:
         * Failed to execute 'add' on 'DOMTokenList'
         */
        class:
          'tiptap-editor-content max-w-none focus:outline-none min-h-[450px] px-5 py-4',
      },

      // ======================================================
      // HANDLE VIDEO URL PASTE
      // ======================================================

      handlePaste: (
        view,
        event
      ) => {
        const text =
          event.clipboardData
            ?.getData(
              'text/plain'
            )
            ?.trim()

        if (
          !text ||
          typeof text !==
            'string'
        ) {
          return false
        }

        // Let normal paste continue
        // when this is not a supported video URL.
        if (
          !isEmbeddableVideoUrl(
            text
          )
        ) {
          return false
        }

        const {
          state,
        } = view

        const {
          selection,
        } = state

        const currentNode =
          selection.$from.node()

        /**
         * Prevent nesting a video embed
         * inside another video embed.
         */
        if (
          currentNode &&
          currentNode.type
            .name ===
            'videoEmbed'
        ) {
          return false
        }

        event.preventDefault()

        const {
          schema,
        } =
          view.state

        const videoNode =
          schema.nodes.videoEmbed.create(
            {
              src: text,
            }
          )

        const transaction =
          view.state.tr.replaceSelectionWith(
            videoNode
          )

        view.dispatch(
          transaction
        )

        toast.success(
          'Video embedded successfully!'
        )

        return true
      },
    },
  })

  // ==========================================================
  // CLEAN INVALID VIDEO EMBEDS
  // ==========================================================

  useEffect(() => {
    if (!editor) {
      return
    }

    /**
     * Avoid cleaning immediately during the
     * first editor initialization.
     */
    if (
      isInitialLoad.current
    ) {
      isInitialLoad.current =
        false

      return
    }

    const cleanInvalidNodes =
      () => {
        let hasInvalid =
          false

        const {
          state,
        } = editor

        const tr =
          state.tr

        state.doc.descendants(
          (
            node,
            pos
          ) => {
            if (
              node.type.name ===
              'videoEmbed'
            ) {
              if (
                !node.attrs.src
              ) {
                const text =
                  '[Invalid video embed - please re-add]'

                const textNode =
                  state.schema.text(
                    text
                  )

                tr.replaceWith(
                  pos,
                  pos +
                    node.nodeSize,
                  textNode
                )

                hasInvalid =
                  true

                return false
              }
            }

            return true
          }
        )

        if (
          hasInvalid
        ) {
          editor.view.dispatch(
            tr
          )

          toast.error(
            'Invalid video embed found and removed.'
          )
        }
      }

    const timer =
      setTimeout(
        cleanInvalidNodes,
        100
      )

    return () => {
      clearTimeout(
        timer
      )
    }
  }, [editor])

  // ==========================================================
  // RESET CONTENT WHEN PAGE/NODE CHANGES
  // ==========================================================

  useEffect(() => {
    if (!editor) {
      return
    }

    /**
     * Only reload content when resetKey changes.
     *
     * Do not reload on every keystroke,
     * otherwise the cursor would jump.
     */
    editor.commands.setContent(
      value || '',
      {
        emitUpdate:
          false,
      }
    )

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    resetKey,
    editor,
  ])

  // ==========================================================
  // INSERT IMAGE
  // ==========================================================

  const insertImage =
    () => {
      const input =
        document.createElement(
          'input'
        )

      input.type =
        'file'

      input.accept =
        'image/*'

      input.onchange =
        async () => {
          const file =
            input.files?.[0]

          if (!file) {
            return
          }

          try {
            const formData =
              new FormData()

            formData.append(
              'file',
              file
            )

            formData.append(
              'type',
              'image'
            )

            const res =
              await fetch(
                '/api/upload',
                {
                  method:
                    'POST',

                  body:
                    formData,
                }
              )

            let data: any

            try {
              data =
                await res.json()
            } catch {
              toast.error(
                'Image upload returned an invalid response'
              )

              return
            }

            if (
              !res.ok
            ) {
              toast.error(
                data?.error ||
                  'Image upload failed'
              )

              return
            }

            if (
              !data?.url
            ) {
              toast.error(
                'No image URL was returned'
              )

              return
            }

            editor
              ?.chain()
              .focus()
              .setImage({
                src:
                  data.url,
              })
              .run()

            toast.success(
              'Image inserted successfully!'
            )
          } catch (
            error
          ) {
            console.error(
              'Image upload error:',
              error
            )

            toast.error(
              'Image upload failed'
            )
          }
        }

      input.click()
    }

  // ==========================================================
  // INSERT / EDIT LINK
  // ==========================================================

  const setLink =
    () => {
      if (!editor) {
        return
      }

      const previousUrl =
        editor.getAttributes(
          'link'
        ).href

      const url =
        window.prompt(
          'Enter URL',
          previousUrl ||
            'https://'
        )

      // User clicked Cancel
      if (
        url === null
      ) {
        return
      }

      // Empty URL removes existing link.
      if (
        url.trim() ===
        ''
      ) {
        editor
          .chain()
          .focus()
          .extendMarkRange(
            'link'
          )
          .unsetLink()
          .run()

        return
      }

      editor
        .chain()
        .focus()
        .extendMarkRange(
          'link'
        )
        .setLink({
          href:
            url.trim(),
        })
        .run()
    }

  // ==========================================================
  // INSERT VIDEO
  // ==========================================================

  const insertVideo =
    () => {
      if (!editor) {
        return
      }

      const url =
        window.prompt(
          'Enter video URL (YouTube, Vimeo, Loom, etc.):'
        )

      if (!url) {
        return
      }

      const cleanUrl =
        url.trim()

      if (
        !isEmbeddableVideoUrl(
          cleanUrl
        )
      ) {
        toast.error(
          'Invalid video URL. Please enter a valid YouTube, Vimeo, or Loom URL.'
        )

        return
      }

      editor.commands.setVideoEmbed(
        {
          src:
            cleanUrl,
        }
      )

      toast.success(
        'Video embedded successfully!'
      )
    }

  // ==========================================================
  // EDITOR NOT READY
  // ==========================================================

  if (!editor) {
    return null
  }

  const isTableActive =
    editor.isActive(
      'table'
    )

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="relative rounded-xl border border-gray-200 bg-white">

      {/* =====================================================
          STICKY FORMATTING TOOLBAR

          The page itself scrolls.

          This toolbar stays at the top of the viewport while
          the user is scrolling through this editor.
      ====================================================== */}

      <div className="sticky top-0 z-50 flex flex-wrap items-center gap-0.5 rounded-t-xl border-b border-gray-200 bg-gray-50 px-2 py-1.5 shadow-sm">

        {/* Bold */}
        <ToolBtn
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleBold()
              .run()
          }
          active={
            editor.isActive(
              'bold'
            )
          }
          title="Bold"
        >
          <Bold size={15} />
        </ToolBtn>

        {/* Italic */}
        <ToolBtn
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleItalic()
              .run()
          }
          active={
            editor.isActive(
              'italic'
            )
          }
          title="Italic"
        >
          <Italic size={15} />
        </ToolBtn>

        {/* Underline */}
        <ToolBtn
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleUnderline()
              .run()
          }
          active={
            editor.isActive(
              'underline'
            )
          }
          title="Underline"
        >
          <UnderlineIcon size={15} />
        </ToolBtn>

        {/* Strikethrough */}
        <ToolBtn
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleStrike()
              .run()
          }
          active={
            editor.isActive(
              'strike'
            )
          }
          title="Strikethrough"
        >
          <Strikethrough size={15} />
        </ToolBtn>

        <ToolbarDivider />

        {/* Heading 1 */}
        <ToolBtn
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleHeading({
                level: 1,
              })
              .run()
          }
          active={
            editor.isActive(
              'heading',
              {
                level: 1,
              }
            )
          }
          title="Heading 1"
        >
          <Heading1 size={15} />
        </ToolBtn>

        {/* Heading 2 */}
        <ToolBtn
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleHeading({
                level: 2,
              })
              .run()
          }
          active={
            editor.isActive(
              'heading',
              {
                level: 2,
              }
            )
          }
          title="Heading 2"
        >
          <Heading2 size={15} />
        </ToolBtn>

        {/* Heading 3 */}
        <ToolBtn
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleHeading({
                level: 3,
              })
              .run()
          }
          active={
            editor.isActive(
              'heading',
              {
                level: 3,
              }
            )
          }
          title="Heading 3"
        >
          <Heading3 size={15} />
        </ToolBtn>

        <ToolbarDivider />

        {/* Bullet list */}
        <ToolBtn
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleBulletList()
              .run()
          }
          active={
            editor.isActive(
              'bulletList'
            )
          }
          title="Bullet list"
        >
          <List size={15} />
        </ToolBtn>

        {/* Numbered list */}
        <ToolBtn
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleOrderedList()
              .run()
          }
          active={
            editor.isActive(
              'orderedList'
            )
          }
          title="Numbered list"
        >
          <ListOrdered size={15} />
        </ToolBtn>

        {/* Quote */}
        <ToolBtn
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleBlockquote()
              .run()
          }
          active={
            editor.isActive(
              'blockquote'
            )
          }
          title="Quote"
        >
          <Quote size={15} />
        </ToolBtn>

        {/* Code block */}
        <ToolBtn
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleCodeBlock()
              .run()
          }
          active={
            editor.isActive(
              'codeBlock'
            )
          }
          title="Code block"
        >
          <Code size={15} />
        </ToolBtn>

        <ToolbarDivider />

        {/* Align left */}
        <ToolBtn
          onClick={() =>
            editor
              .chain()
              .focus()
              .setTextAlign(
                'left'
              )
              .run()
          }
          active={
            editor.isActive({
              textAlign:
                'left',
            })
          }
          title="Align left"
        >
          <AlignLeft size={15} />
        </ToolBtn>

        {/* Align center */}
        <ToolBtn
          onClick={() =>
            editor
              .chain()
              .focus()
              .setTextAlign(
                'center'
              )
              .run()
          }
          active={
            editor.isActive({
              textAlign:
                'center',
            })
          }
          title="Align center"
        >
          <AlignCenter size={15} />
        </ToolBtn>

        {/* Align right */}
        <ToolBtn
          onClick={() =>
            editor
              .chain()
              .focus()
              .setTextAlign(
                'right'
              )
              .run()
          }
          active={
            editor.isActive({
              textAlign:
                'right',
            })
          }
          title="Align right"
        >
          <AlignRight size={15} />
        </ToolBtn>

        <ToolbarDivider />

        {/* Link */}
        <ToolBtn
          onClick={
            setLink
          }
          active={
            editor.isActive(
              'link'
            )
          }
          title="Insert link"
        >
          <LinkIcon size={15} />
        </ToolBtn>

        {/* Image */}
        <ToolBtn
          onClick={
            insertImage
          }
          title="Insert image"
        >
          <ImagePlus size={15} />
        </ToolBtn>

        {/* Video */}
        <ToolBtn
          onClick={
            insertVideo
          }
          title="Insert video"
        >
          <span className="text-[15px] font-bold leading-none">
            ▶
          </span>
        </ToolBtn>

        <ToolbarDivider />

        {/* Insert table */}
        <ToolBtn
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({
                rows: 3,
                cols: 3,
                withHeaderRow:
                  true,
              })
              .run()
          }
          title="Insert table"
        >
          <TableIcon size={15} />
        </ToolBtn>

        {/* Table controls */}
        {isTableActive && (
          <>
            {/* Add row */}
            <ToolBtn
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .addRowAfter()
                  .run()
              }
              title="Add row below"
            >
              <Rows3 size={15} />
            </ToolBtn>

            {/* Add column */}
            <ToolBtn
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .addColumnAfter()
                  .run()
              }
              title="Add column right"
            >
              <Columns3 size={15} />
            </ToolBtn>

            {/* Delete table */}
            <ToolBtn
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .deleteTable()
                  .run()
              }
              title="Delete table"
            >
              <Trash2 size={15} />
            </ToolBtn>
          </>
        )}

        <ToolbarDivider />

        {/* Undo */}
        <ToolBtn
          onClick={() =>
            editor
              .chain()
              .focus()
              .undo()
              .run()
          }
          title="Undo"
        >
          <Undo size={15} />
        </ToolBtn>

        {/* Redo */}
        <ToolBtn
          onClick={() =>
            editor
              .chain()
              .focus()
              .redo()
              .run()
          }
          title="Redo"
        >
          <Redo size={15} />
        </ToolBtn>
      </div>

      {/* =====================================================
          EDITOR CONTENT

          There is intentionally:
          - NO max-height
          - NO overflow-y-auto

          Therefore the whole page scrolls instead of the
          editor having its own scrollbar.
      ====================================================== */}

      <div className="rounded-b-xl bg-white">
        <EditorContent
          editor={
            editor
          }
        />
      </div>
    </div>
  )
}