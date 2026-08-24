// components/library/VideoEmbedExtension.ts
import { Node, type CommandProps } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    videoEmbed: {
      setVideoEmbed: (attrs: { src: string }) => ReturnType
      cleanupInvalidVideoEmbeds: () => ReturnType
    }
  }
}

export function isEmbeddableVideoUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  
  try {
    const urlObj = new URL(url)
    const host = urlObj.hostname.toLowerCase()
    return [
      'youtube.com', 'youtu.be',
      'vimeo.com',
      'loom.com', 'www.loom.com',
      'dailymotion.com',
      'vidyard.com',
      'wistia.com',
      'player.vimeo.com'
    ].some(domain => host.includes(domain))
  } catch {
    return false
  }
}

function getEmbedUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null

  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`

  const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/)
  if (loomMatch) return `https://www.loom.com/embed/${loomMatch[1]}`

  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`

  const dailymotionMatch = url.match(/dailymotion\.com\/video\/([a-zA-Z0-9]+)/)
  if (dailymotionMatch) return `https://www.dailymotion.com/embed/video/${dailymotionMatch[1]}`

  if (url.includes('embed') || url.includes('player.')) return url

  return null
}

export const VideoEmbed = Node.create({
  name: 'videoEmbed',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: element => element.getAttribute('src'),
        renderHTML: attributes => {
          if (attributes.src) {
            return { src: attributes.src }
          }
          return {}
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-video-embed]',
        getAttrs: (dom) => {
          const iframe = dom.querySelector('iframe')
          if (iframe) {
            return { src: iframe.getAttribute('src') }
          }
          const src = dom.getAttribute('data-src')
          if (src) {
            return { src }
          }
          return { src: null }
        }
      }
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const src = HTMLAttributes.src
    
    if (!src || typeof src !== 'string') {
      return ['div', { 
        'data-video-embed': '', 
        'data-error': 'missing-src',
        style: 'padding: 1rem; background: #fef2f2; color: #dc2626; border-radius: 0.5rem; border: 1px solid #fecaca; margin: 1rem 0; font-size: 0.875rem;'
      }, [
        'span', {}, '⚠️ Video embed error: Missing video URL. Please remove and re-add the video.'
      ]]
    }

    const embedUrl = getEmbedUrl(src)
    
    if (!embedUrl) {
      return ['div', { 
        'data-video-embed': '', 
        'data-error': 'invalid-url',
        style: 'padding: 1rem; background: #fef2f2; color: #dc2626; border-radius: 0.5rem; border: 1px solid #fecaca; margin: 1rem 0; font-size: 0.875rem;'
      }, [
        'span', {}, `⚠️ Unable to embed video: Invalid URL`
      ]]
    }

    return ['div', { 'data-video-embed': '', 'data-src': src }, [
      'div', { class: 'video-embed-wrapper' },
      ['iframe', {
        src: embedUrl,
        allowfullscreen: 'true',
        loading: 'lazy',
        allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
      }]
    ]]
  },

  // ✅ CORRECTED addCommands
  addCommands() {
    return {
      setVideoEmbed: (attrs: { src: string }) => ({ commands }) => {
        if (!attrs.src || typeof attrs.src !== 'string') {
          console.warn('VideoEmbed: Attempted to set video embed with invalid src')
          return false
        }
        return commands.insertContent({ type: this.name, attrs })
      },
      // Command to remove invalid video embeds
      cleanupInvalidVideoEmbeds: () => ({ commands, editor }: CommandProps) => {
        let cleaned = false
        const { state } = editor
        const tr = state.tr
        
        state.doc.descendants((node, pos) => {
          if (node.type.name === 'videoEmbed' && !node.attrs.src) {
            tr.delete(pos, pos + node.nodeSize)
            cleaned = true
            return false
          }
        })
        
        if (cleaned) {
          editor.view.dispatch(tr)
          return true
        }
        return false
      },
    }
  },
})

export default VideoEmbed