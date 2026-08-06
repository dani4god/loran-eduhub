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

export const DEFAULT_WORKSHOP_CONTENT = {
  key: 'main',
  heading: 'Loran EduHub Launch Workshop',
  subheading: 'EdTech Essentials: Equipping Educators for the Digital Age',
  discordInviteLink: '',
  advertImages: [],
  speakers: [
    {
      name: 'Dr. Amaka',
      title: 'Lecturer',
      institution: 'Federal College of Education, Asaba',
      sessionTitle: 'The Digital Classroom Landscape',
      description: 'Understanding the EdTech Ecosystem: Trends Shaping Modern Education',
      points: [
        'Overview of key digital tool categories (LMS, collaboration, assessment, AI)',
        'Why digital literacy is now a core teaching skill',
      ],
      isConvener: false,
    },
    {
      name: 'Taft Brigham',
      title: 'Software Developer',
      institution: 'Brigham Young University, Idaho, USA',
      sessionTitle: 'Collaboration & Engagement Tools',
      description: 'From Google Workspace to Kahoot: Tools That Bring Lessons to Life',
      points: [
        'Practical walkthrough of communication, collaboration, and interactive learning platforms',
        'Live demo',
      ],
      isConvener: false,
    },
    {
      name: 'Vaness Kyle',
      title: 'Senior AI Model Trainer',
      institution: 'Atlas Capture INC, Canada',
      sessionTitle: 'AI as a Teaching Companion',
      description: 'Responsible AI Integration: Enhancing, Not Replacing, the Educator',
      points: [
        'Practical AI use cases (lesson planning, grading support, personalized learning)',
        'Ethics, bias, and academic integrity considerations',
        'Live demo',
      ],
      isConvener: false,
    },
    {
      name: 'Daniel Okeke',
      title: 'Passionate Teacher & Online Educator',
      institution: 'Convener, Loran EduHub',
      sessionTitle: 'Online Tutoring: Pros and Cons',
      description: 'Building an Inclusive and Secure Digital Classroom',
      points: [
        'Accessibility tools for diverse learners',
        'Digital citizenship, online safety, and data privacy basics',
      ],
      isConvener: true,
    },
  ],
}