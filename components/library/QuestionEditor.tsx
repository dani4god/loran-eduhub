// components/library/QuestionEditor.tsx
'use client'

import { useState } from 'react'
import { Plus, X, HelpCircle, Check } from 'lucide-react'

interface Question {
  _id?: string
  type: 'mcq' | 'fill' | 'trueFalse'
  question: string
  options?: string[]
  correctAnswer: string
  explanation?: string
}

export default function QuestionEditor({
  questions,
  onChange,
}: {
  questions: Question[]
  onChange: (qs: Question[]) => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [type, setType] = useState<Question['type']>('mcq')
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [explanation, setExplanation] = useState('')

  const resetForm = () => {
    setType('mcq')
    setQuestion('')
    setOptions(['', ''])
    setCorrectAnswer('')
    setExplanation('')
    setShowForm(false)
  }

  const addOption = () => setOptions([...options, ''])

  // still in QuestionEditor.tsx
  const updateOption = (i: number, val: string) => {
    const copy = [...options]
    const oldVal = copy[i]
    copy[i] = val
    setOptions(copy)
    // Keep the correct-answer selection pointed at the same option even if its text is edited.
    if (correctAnswer === oldVal) setCorrectAnswer(val)
  }

  const removeOption = (i: number) => {
    if (correctAnswer === options[i]) setCorrectAnswer('')
    setOptions(options.filter((_, idx) => idx !== i))
  }

  // components/library/QuestionEditor.tsx — inside saveQuestion()
  const saveQuestion = () => {
    if (!question.trim() || !correctAnswer.trim()) return

    const newQ: Question = {
      type,
      question: question.trim(),
      correctAnswer: correctAnswer.trim(),
      explanation: explanation.trim() || undefined,
      ...(type === 'mcq' ? { options: options.map(o => o.trim()).filter(o => o) } : {}),
    }

    onChange([...questions, newQ])
    resetForm()
  }

  const removeQuestion = (idx: number) => {
    onChange(questions.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Revision Questions
        </p>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            type="button"
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            <Plus size={13} /> Add question
          </button>
        )}
      </div>

      {questions.length > 0 && (
        <div className="space-y-2">
          {questions.map((q, idx) => (
            <div key={idx} className="bg-gray-50 rounded-xl p-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  <HelpCircle size={14} className="text-purple-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800">{q.question}</p>
                    <p className="text-xs text-gray-400 mt-0.5 capitalize">
                      {q.type === 'trueFalse' ? 'True / False' : q.type === 'mcq' ? 'Multiple choice' : 'Fill in the gap'}
                      {' · '}Answer: {q.correctAnswer}
                    </p>
                  </div>
                </div>
                <button onClick={() => removeQuestion(idx)} type="button" className="text-gray-400 hover:text-red-500 shrink-0">
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="border border-blue-100 bg-blue-50/40 rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {(['mcq', 'trueFalse', 'fill'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => { setType(t); setCorrectAnswer('') }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  type === t ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
                }`}
              >
                {t === 'mcq' ? 'Multiple Choice' : t === 'trueFalse' ? 'True / False' : 'Fill in the Gap'}
              </button>
            ))}
          </div>

          <textarea
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Enter the question..."
            rows={2}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
          />

          {type === 'mcq' && (
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => opt.trim() && setCorrectAnswer(opt)}
                    disabled={!opt.trim()}
                    className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      correctAnswer === opt && opt.trim()
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300'
                    }`}
                  >
                    {correctAnswer === opt && opt.trim() && <Check size={12} />}
                  </button>
                  <input
                    value={opt}
                    onChange={e => updateOption(i, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5"
                  />
                  {options.length > 2 && (
                    <button onClick={() => removeOption(i)} type="button" className="text-gray-400 hover:text-red-500">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={addOption} type="button" className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                <Plus size={12} /> Add option
              </button>
              <p className="text-xs text-gray-400">Tap the circle next to the correct option.</p>
            </div>
          )}

          {type === 'trueFalse' && (
            <div className="flex gap-2">
              {['true', 'false'].map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setCorrectAnswer(v)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize ${
                    correctAnswer === v ? 'bg-green-500 text-white' : 'bg-white border border-gray-200 text-gray-600'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          )}

          {type === 'fill' && (
            <input
              value={correctAnswer}
              onChange={e => setCorrectAnswer(e.target.value)}
              placeholder="Correct answer"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
            />
          )}

          <input
            value={explanation}
            onChange={e => setExplanation(e.target.value)}
            placeholder="Explanation shown after answering (optional)"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
          />

          <div className="flex gap-2 pt-1">
            <button
              onClick={saveQuestion}
              type="button"
              disabled={!question.trim() || !correctAnswer.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:opacity-40"
            >
              Save Question
            </button>
            <button onClick={resetForm} type="button" className="px-4 py-2 text-gray-500 text-sm font-semibold">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}