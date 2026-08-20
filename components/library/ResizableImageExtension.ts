// components/library/ResizableImageExtension.ts
import Image from '@tiptap/extension-image'
import { ReactNodeViewRenderer } from '@tiptap/react'
import ResizableImageNode from './ResizableImageNode'

const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        renderHTML: (attributes) => (attributes.width ? { style: `width: ${attributes.width}px` } : {}),
      },
    }
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageNode)
  },
})

export default ResizableImage