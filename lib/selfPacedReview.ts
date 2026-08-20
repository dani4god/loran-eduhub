// lib/selfPacedReview.ts

export const SURVEY_OPTIONS = {
  courseExperience: [
    { value: 'excellent', label: 'Excellent' },
    { value: 'good', label: 'Good' },
    { value: 'average', label: 'Average' },
    { value: 'poor', label: 'Poor' },
  ],
  wouldRecommend: [
    { value: 'yes', label: 'Yes, definitely' },
    { value: 'maybe', label: 'Maybe' },
    { value: 'no', label: 'No' },
  ],
  difficultyLevel: [
    { value: 'very_difficult', label: 'Very difficult' },
    { value: 'somewhat_difficult', label: 'Somewhat difficult' },
    { value: 'just_right', label: 'Just right' },
    { value: 'too_easy', label: 'Too easy' },
  ],
  weeklyStructureHelpful: [
    { value: 'very_helpful', label: 'Very helpful' },
    { value: 'helpful', label: 'Helpful' },
    { value: 'neutral', label: 'Neutral' },
    { value: 'not_helpful', label: 'Not helpful' },
  ],
  tutorRating: [
    { value: 'excellent', label: 'Excellent' },
    { value: 'good', label: 'Good' },
    { value: 'average', label: 'Average' },
    { value: 'poor', label: 'Poor' },
  ],
  hadOneOnOneSession: [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
  ],
  workshopRating: [
    { value: 'great', label: 'Great' },
    { value: 'good', label: 'Good' },
    { value: 'average', label: 'Average' },
    { value: 'did_not_attend', label: "Didn't attend any" },
  ],
  careerImpact: [
    { value: 'yes_significantly', label: 'Yes, significantly' },
    { value: 'somewhat', label: 'Somewhat' },
    { value: 'not_really', label: 'Not really' },
    { value: 'too_early', label: 'Too early to tell' },
  ],
} as const

export function labelFor(field: keyof typeof SURVEY_OPTIONS, value: string): string {
  return SURVEY_OPTIONS[field].find((o) => o.value === value)?.label || value
}