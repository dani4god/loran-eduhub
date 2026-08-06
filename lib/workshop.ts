// lib/workshop.ts
import crypto from 'crypto'

export function generate12DigitCode(): string {
  let code = ''
  for (let i = 0; i < 12; i++) {
    code += crypto.randomInt(0, 10).toString()
  }
  return code
}

export function generateWorkshopCertNumber(): string {
  const year = new Date().getFullYear()
  const random = crypto.randomBytes(4).toString('hex').toUpperCase()
  return `WS-${year}-${random}`
}

// The content exactly as provided — used to seed the page the first time
// it's ever loaded, so the admin has real starting content to edit rather
// than an empty page.
export const DEFAULT_WORKSHOP_CONTENT = {
  key: 'main',
  heading: 'Loran EduHub Launch Workshop',
  subheading: 'EdTech Essentials: Equipping Educators for the Digital Age',
  discordInviteLink: '',
  advertImages: [],
  speakers: [
    {
      name: 'Dr. Amaka',
      sessionTitle: 'The Digital Classroom Landscape',
      description: 'Understanding the EdTech Ecosystem: Trends Shaping Modern Education',
      points: [
        'Overview of key digital tool categories (LMS, collaboration, assessment, AI)',
        'Why digital literacy is now a core teaching skill',
      ],
    },
    {
      name: 'Taft Brigham',
      sessionTitle: 'Collaboration & Engagement Tools',
      description: 'From Google Workspace to Kahoot: Tools That Bring Lessons to Life',
      points: [
        'Practical walkthrough of communication, collaboration, and interactive learning platforms',
        'Live demo encouraged',
      ],
    },
    {
      name: 'Vaness Kyle',
      sessionTitle: 'Collaboration & Engagement Tools',
      description: 'From Google Workspace to Kahoot: Tools That Bring Lessons to Life',
      points: [
        'Practical walkthrough of communication, collaboration, and interactive learning platforms',
        'Live demo encouraged',
      ],
    },
    {
      name: 'Daniel Okeke',
      sessionTitle: 'Online Tutoring: Pros and Cons',
      description: 'Building an Inclusive and Secure Digital Classroom',
      points: [
        'Accessibility tools for diverse learners',
        'Digital citizenship, online safety, and data privacy basics',
      ],
    },
  ],
}