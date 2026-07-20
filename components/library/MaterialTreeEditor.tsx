// components/library/MaterialTreeEditor.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronDown, ChevronRight, Plus, Trash2, BookOpen, FileText,
  Layers, Save, Eye, EyeOff, ArrowLeft, BarChart3, AlertCircle,
} from 'lucide-react'
import RichTextEditor from './RichTextEditor'
import LinkEditor from './LinkEditor'
import QuestionEditor from './QuestionEditor'

interface Path {
  c: number
  t?: number
  s?: number
}

function getNode(chapters: any[], path: Path) {
  const chapter = chapters[path.c]
  if (path.t !== undefined && path.s !== undefined) return chapter.topics[path.t].subtopics[path.s]
  if (path.t !== undefined) return chapter.topics[path.t]
  return chapter
}

function cloneChapters(chapters: any[]) {
  return JSON.parse(JSON.stringify(chapters))
}

function pathKey(path: Path) {
  return `${path.c}-${path.t ?? ''}-${path.s ?? ''}`
}

export default function MaterialTreeEditor({ material }: { material: any }) {
  const router = useRouter()
  const [title, setTitle] = useState(material.title)
  const [description, setDescription] = useState(material.description || '')
  const [status, setStatus] = useState(material.status)
  const [chapters, setChapters] = useState<any[]>(material.chapters || [])
  const [selected, setSelected] = useState<Path | null>(
    chapters.length > 0 ? { c: 0 } : null
  )
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set([0]))
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set())
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const toggleChapter = (i: number) => {
    const s = new Set(expandedChapters)
    s.has(i) ? s.delete(i) : s.add(i)
    setExpandedChapters(s)
  }

  const toggleTopic = (key: string) => {
    const s = new Set(expandedTopics)
    s.has(key) ? s.delete(key) : s.add(key)
    setExpandedTopics(s)
  }

  const addChapter = () => {
    const clone = cloneChapters(chapters)
    clone.push({ title: `Chapter ${clone.length + 1}`, content: '', links: [], questions: [], topics: [] })
    setChapters(clone)
    setSelected({ c: clone.length - 1 })
    setExpandedChapters(new Set([...expandedChapters, clone.length - 1]))
  }

  const addTopic = (c: number) => {
    const clone = cloneChapters(chapters)
    const topics = clone[c].topics
    topics.push({ title: `Topic ${topics.length + 1}`, content: '', links: [], questions: [], subtopics: [] })
    setChapters(clone)
    setSelected({ c, t: topics.length - 1 })
    setExpandedTopics(new Set([...expandedTopics, `${c}-${topics.length - 1}`]))
  }

  const addSubtopic = (c: number, t: number) => {
    const clone = cloneChapters(chapters)
    const subtopics = clone[c].topics[t].subtopics
    subtopics.push({ title: `Subtopic ${subtopics.length + 1}`, content: '', links: [], questions: [] })
    setChapters(clone)
    setSelected({ c, t, s: subtopics.length - 1 })
  }

  const deleteNode = (path: Path) => {
    if (!window.confirm('Delete this and everything inside it? This cannot be undone.')) return
    const clone = cloneChapters(chapters)

    if (path.t !== undefined && path.s !== undefined) {
      clone[path.c].topics[path.t].subtopics.splice(path.s, 1)
    } else if (path.t !== undefined) {
      clone[path.c].topics.splice(path.t, 1)
    } else {
      clone.splice(path.c, 1)
    }

    setChapters(clone)
    setSelected(null)
  }

  const updateSelectedNode = (updater: (node: any) => void) => {
    if (!selected) return
    const clone = cloneChapters(chapters)
    const node = getNode(clone, selected)
    updater(node)
    setChapters(clone)
  }

  const save = async (publishStatus?: 'draft' | 'published') => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/tutor/library/${material._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          chapters,
          ...(publishStatus ? { status: publishStatus } : {}),
        }),
      })
      const data = await res.json()

      if (res.ok) {
        if (publishStatus) setStatus(publishStatus)
        setMessage({ type: 'success', text: 'Saved successfully.' })
        setChapters(data.material.chapters)
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save' })
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Something went wrong' })
    } finally {
      setSaving(false)
    }
  }

  const deleteMaterial = async () => {
    if (!window.confirm('Delete this entire course material? This cannot be undone.')) return
    const res = await fetch(`/api/tutor/library/${material._id}`, { method: 'DELETE' })
    if (res.ok) router.push('/dashboard/tutor/library')
  }

  const selectedNode = selected ? getNode(chapters, selected) : null

  return (
    <div className="pt-16 lg:pt-0 min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3 flex-wrap">
          <button
            onClick={() => router.push('/dashboard/tutor/library')}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 shrink-0"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="flex-1 min-w-[160px]">
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="font-bold text-gray-900 text-base w-full outline-none"
              placeholder="Material title"
            />
          </div>

          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
              status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {status === 'published' ? 'Published' : 'Draft'}
          </span>

          <button
            onClick={() => router.push(`/dashboard/tutor/library/${material._id}/progress`)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-gray-600 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50"
          >
            <BarChart3 size={15} /> Progress
          </button>

          <button
            onClick={() => save()}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 disabled:opacity-50"
          >
            <Save size={15} /> {saving ? 'Saving...' : 'Save'}
          </button>

          <button
            onClick={() => save(status === 'published' ? 'draft' : 'published')}
            disabled={saving}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 ${
              status === 'published'
                ? 'bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {status === 'published' ? <EyeOff size={15} /> : <Eye size={15} />}
            {status === 'published' ? 'Unpublish' : 'Publish'}
          </button>

          <button
            onClick={deleteMaterial}
            className="p-2 rounded-lg hover:bg-red-50 text-red-500"
            title="Delete material"
          >
            <Trash2 size={18} />
          </button>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <Layers size={18} />
          </button>
        </div>

        {message && (
          <div
            className={`max-w-7xl mx-auto px-4 sm:px-6 pb-3 text-xs font-medium ${
              message.type === 'success' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {message.text}
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto flex">
        {/* Sidebar tree */}
        <div
          className={`${
            sidebarOpen ? 'block' : 'hidden'
          } lg:block w-full lg:w-80 shrink-0 border-r border-gray-100 bg-white lg:bg-transparent lg:sticky lg:top-[57px] lg:h-[calc(100vh-57px)] overflow-y-auto p-4`}
        >
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Short description of this material..."
            rows={2}
            className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 mb-4"
          />

          <button
            onClick={addChapter}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-100 mb-3"
          >
            <Plus size={14} /> Add Chapter
          </button>

          <div className="space-y-1">
            {chapters.map((chapter: any, c: number) => (
              <div key={c}>
                <div
                  className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 cursor-pointer group ${
                    selected && selected.c === c && selected.t === undefined
                      ? 'bg-blue-50 text-blue-700'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <button onClick={() => toggleChapter(c)} className="shrink-0">
                    {expandedChapters.has(c) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  <BookOpen size={13} className="shrink-0 text-indigo-500" />
                  <span
                    onClick={() => { setSelected({ c }); setSidebarOpen(false) }}
                    className="flex-1 text-sm font-semibold truncate"
                  >
                    {chapter.title || 'Untitled chapter'}
                  </span>
                  <button
                    onClick={() => addTopic(c)}
                    className="opacity-0 group-hover:opacity-100 text-blue-500 shrink-0"
                    title="Add topic"
                  >
                    <Plus size={13} />
                  </button>
                  <button
                    onClick={() => deleteNode({ c })}
                    className="opacity-0 group-hover:opacity-100 text-red-400 shrink-0"
                    title="Delete chapter"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {expandedChapters.has(c) && (
                  <div className="ml-5 border-l border-gray-100 pl-2 space-y-1 mt-1">
                    {chapter.topics.map((topic: any, t: number) => {
                      const tKey = `${c}-${t}`
                      return (
                        <div key={t}>
                          <div
                            className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 cursor-pointer group ${
                              selected && selected.c === c && selected.t === t && selected.s === undefined
                                ? 'bg-blue-50 text-blue-700'
                                : 'hover:bg-gray-50 text-gray-600'
                            }`}
                          >
                            <button onClick={() => toggleTopic(tKey)} className="shrink-0">
                              {expandedTopics.has(tKey) ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                            </button>
                            <Layers size={12} className="shrink-0 text-purple-500" />
                            <span
                              onClick={() => { setSelected({ c, t }); setSidebarOpen(false) }}
                              className="flex-1 text-sm truncate"
                            >
                              {topic.title || 'Untitled topic'}
                            </span>
                            <button
                              onClick={() => addSubtopic(c, t)}
                              className="opacity-0 group-hover:opacity-100 text-blue-500 shrink-0"
                              title="Add subtopic"
                            >
                              <Plus size={12} />
                            </button>
                            <button
                              onClick={() => deleteNode({ c, t })}
                              className="opacity-0 group-hover:opacity-100 text-red-400 shrink-0"
                              title="Delete topic"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>

                          {expandedTopics.has(tKey) && (
                            <div className="ml-5 border-l border-gray-100 pl-2 space-y-1 mt-1">
                              {topic.subtopics.map((sub: any, s: number) => (
                                <div
                                  key={s}
                                  className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 cursor-pointer group ${
                                    selected && selected.c === c && selected.t === t && selected.s === s
                                      ? 'bg-blue-50 text-blue-700'
                                      : 'hover:bg-gray-50 text-gray-500'
                                  }`}
                                >
                                  <FileText size={11} className="shrink-0 text-green-500" />
                                  <span
                                    onClick={() => { setSelected({ c, t, s }); setSidebarOpen(false) }}
                                    className="flex-1 text-xs truncate"
                                  >
                                    {sub.title || 'Untitled subtopic'}
                                  </span>
                                  <button
                                    onClick={() => deleteNode({ c, t, s })}
                                    className="opacity-0 group-hover:opacity-100 text-red-400 shrink-0"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}

            {chapters.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-6">
                No chapters yet. Add one to get started.
              </p>
            )}
          </div>
        </div>

        {/* Editor panel */}
        <div className="flex-1 min-w-0 p-4 sm:p-6">
          {!selectedNode ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <BookOpen className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-gray-400 text-sm">
                Select a chapter, topic, or subtopic from the sidebar to start editing —
                or add a chapter to begin.
              </p>
            </div>
          ) : (
            <div className="max-w-3xl space-y-5">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="capitalize font-medium">
                  {selected!.s !== undefined ? 'Subtopic' : selected!.t !== undefined ? 'Topic' : 'Chapter'}
                </span>
                {selected!.t !== undefined && (
                  <>
                    <ChevronRight size={12} />
                    <span>{chapters[selected!.c].title}</span>
                  </>
                )}
                {selected!.s !== undefined && (
                  <>
                    <ChevronRight size={12} />
                    <span>{chapters[selected!.c].topics[selected!.t!].title}</span>
                  </>
                )}
              </div>

              <input
                value={selectedNode.title}
                onChange={e => updateSelectedNode(n => { n.title = e.target.value })}
                className="w-full text-xl font-bold text-gray-900 outline-none border-b border-transparent focus:border-gray-200 pb-2"
                placeholder="Title"
              />

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Content</p>
                <RichTextEditor
                  resetKey={pathKey(selected!)}
                  value={selectedNode.content}
                  onChange={html => updateSelectedNode(n => { n.content = html })}
                  placeholder="Write the lesson content here..."
                />
              </div>

              <LinkEditor
                links={selectedNode.links}
                onChange={links => updateSelectedNode(n => { n.links = links })}
              />

              <QuestionEditor
                questions={selectedNode.questions}
                onChange={questions => updateSelectedNode(n => { n.questions = questions })}
              />

              <div className="flex items-start gap-2 bg-blue-50/50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <p>
                  Students unlock content sequentially — this page unlocks the next one only
                  after they view it and answer any questions here.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}