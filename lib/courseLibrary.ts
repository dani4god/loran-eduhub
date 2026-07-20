// lib/courseLibrary.ts
import { ICourseMaterial, IQuestion, ILink } from '@/models/CourseMaterial'
import { IMaterialProgress } from '@/models/MaterialProgress'

export type UnitLevel = 'chapter' | 'topic' | 'subtopic'

export interface FlatUnit {
  key: string
  level: UnitLevel
  title: string
  content: string
  links: ILink[]
  questions: IQuestion[]
  chapterId: string
  topicId?: string
  subtopicId?: string
  chapterTitle: string
  topicTitle?: string
}

export function buildKey(chapterId: string, topicId?: string, subtopicId?: string) {
  return [chapterId, topicId, subtopicId].filter(Boolean).join(':')
}

// Flattens the full nested tree into an ordered list of pages.
// Order: chapter page -> each topic page -> each subtopic page -> next topic... -> next chapter.
export function flattenMaterial(material: ICourseMaterial): FlatUnit[] {
  const units: FlatUnit[] = []

  for (const chapter of material.chapters) {
    const chapterId = chapter._id!.toString()

    units.push({
      key: buildKey(chapterId),
      level: 'chapter',
      title: chapter.title,
      content: chapter.content,
      links: chapter.links,
      questions: chapter.questions,
      chapterId,
      chapterTitle: chapter.title,
    })

    for (const topic of chapter.topics) {
      const topicId = topic._id!.toString()

      units.push({
        key: buildKey(chapterId, topicId),
        level: 'topic',
        title: topic.title,
        content: topic.content,
        links: topic.links,
        questions: topic.questions,
        chapterId,
        topicId,
        chapterTitle: chapter.title,
        topicTitle: topic.title,
      })

      for (const subtopic of topic.subtopics) {
        const subtopicId = subtopic._id!.toString()

        units.push({
          key: buildKey(chapterId, topicId, subtopicId),
          level: 'subtopic',
          title: subtopic.title,
          content: subtopic.content,
          links: subtopic.links,
          questions: subtopic.questions,
          chapterId,
          topicId,
          subtopicId,
          chapterTitle: chapter.title,
          topicTitle: topic.title,
        })
      }
    }
  }

  return units
}

// A unit is "complete" once the student has viewed it AND attempted
// every question attached to it (if it has any).
export function isUnitComplete(unit: FlatUnit, progress: IMaterialProgress | null): boolean {
  if (!progress) return false
  if (!progress.viewedKeys.includes(unit.key)) return false

  if (unit.questions.length === 0) return true

  return unit.questions.every(q =>
    progress.quizAttempts.some(
      a => a.unitKey === unit.key && a.questionId === q._id!.toString()
    )
  )
}

// Index of the first NOT-YET-completed unit — this is the furthest point
// the student is allowed to view. Everything at or before this index is
// unlocked; everything after is locked.
export function getUnlockedIndex(units: FlatUnit[], progress: IMaterialProgress | null): number {
  for (let i = 0; i < units.length; i++) {
    if (!isUnitComplete(units[i], progress)) return i
  }
  return units.length - 1
}

export function computeProgressPercent(units: FlatUnit[], progress: IMaterialProgress | null): number {
  if (units.length === 0) return 0
  const completed = units.filter(u => isUnitComplete(u, progress)).length
  return Math.round((completed / units.length) * 100)
}

// Strips correct answers/explanations before sending a unit to the client.
export function sanitizeQuestion(q: IQuestion) {
  return {
    _id: q._id,
    type: q.type,
    question: q.question,
    options: q.options,
  }
}

export function sanitizeUnit(unit: FlatUnit, locked: boolean, completed: boolean) {
  return {
    key: unit.key,
    level: unit.level,
    title: unit.title,
    chapterTitle: unit.chapterTitle,
    topicTitle: unit.topicTitle,
    locked,
    completed,
    // Locked units don't leak their content/links/questions to the client.
    content: locked ? null : unit.content,
    links: locked ? [] : unit.links,
    questions: locked ? [] : unit.questions.map(sanitizeQuestion),
  }
}