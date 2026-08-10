// scripts/seed.mjs
import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set in .env.local')
  process.exit(1)
}

const CourseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, required: true },
    discordRoleGroup: { type: String, required: true },
    syllabus: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

const Course = mongoose.models.Course || mongoose.model('Course', CourseSchema)

const courses = [
  // ── Languages ──
  {
    name: 'German Language',
    description: 'Learn conversational and grammatical German from beginner to advanced levels.',
    category: 'language',
    discordRoleGroup: 'Languages',
    syllabus: ['Alphabet & pronunciation', 'Basic grammar & sentence structure', 'Conversational practice', 'Reading & writing skills'],
  },
  {
    name: 'French Language',
    description: 'Build fluency in French through structured lessons and conversation practice.',
    category: 'language',
    discordRoleGroup: 'Languages',
    syllabus: ['Alphabet & pronunciation', 'Basic grammar & verb conjugation', 'Conversational practice', 'Reading & writing skills'],
  },
  {
    name: 'Chinese Language (Mandarin)',
    description: 'Learn Mandarin Chinese — speaking, listening, reading, and writing basics.',
    category: 'language',
    discordRoleGroup: 'Languages',
    syllabus: ['Pinyin & tones', 'Basic characters & writing', 'Conversational practice', 'Everyday vocabulary'],
  },
  {
    name: 'English Phonetics',
    description: 'Improve pronunciation, spoken clarity, and phonetic accuracy in English.',
    category: 'language',
    discordRoleGroup: 'Languages',
    syllabus: ['The phonetic alphabet (IPA)', 'Stress & intonation', 'Common pronunciation errors', 'Speaking practice & feedback'],
  },

  // ── Tech ──
  {
    name: 'Full Stack Web Development',
    description: 'Build complete web applications from front-end to back-end.',
    category: 'tech',
    discordRoleGroup: 'Tech Innovations',
    syllabus: ['HTML, CSS & JavaScript fundamentals', 'Front-end frameworks', 'Back-end & databases', 'Deploying a full stack project'],
  },
  {
    name: 'Backend Development with Python (Django)',
    description: 'Learn server-side development using Python and the Django framework.',
    category: 'tech',
    discordRoleGroup: 'Tech Innovations',
    syllabus: ['Python fundamentals', 'Django framework basics', 'REST APIs', 'Database integration & deployment'],
  },
  {
    name: 'C Programming',
    description: 'Master the fundamentals of programming using the C language.',
    category: 'tech',
    discordRoleGroup: 'Tech Innovations',
    syllabus: ['Syntax & data types', 'Control structures', 'Functions & pointers', 'Memory management'],
  },
  {
    name: 'Front-End Development (React & Vue)',
    description: 'Build interactive user interfaces with modern JavaScript frameworks.',
    category: 'tech',
    discordRoleGroup: 'Tech Innovations',
    syllabus: ['JavaScript essentials', 'React fundamentals', 'Vue fundamentals', 'Building real-world UI projects'],
  },
  {
    name: 'AI Automation & Machine Learning',
    description: 'Introduction to AI concepts, automation tools, and machine learning basics.',
    category: 'tech',
    discordRoleGroup: 'Tech Innovations',
    syllabus: ['AI & ML fundamentals', 'Automation tools & workflows', 'Basic model training', 'Practical AI use cases'],
  },
  {
    name: 'Data Analysis with SPSS',
    description: 'Learn statistical data analysis using SPSS software.',
    category: 'tech',
    discordRoleGroup: 'Tech Innovations',
    syllabus: ['SPSS interface & data entry', 'Descriptive statistics', 'Hypothesis testing', 'Data visualization & reporting'],
  },
  {
    name: 'Project Management',
    description: 'Learn core project management principles, tools, and methodologies.',
    category: 'tech',
    discordRoleGroup: 'Tech Innovations',
    syllabus: ['Project lifecycle & planning', 'Agile & Scrum basics', 'Risk & resource management', 'PM tools (Trello, Asana, etc.)'],
  },
  {
    name: 'Video Editing & Graphic Design',
    description: 'Learn practical video editing and graphic design skills for content creation.',
    category: 'tech',
    discordRoleGroup: 'Tech Innovations',
    syllabus: ['Editing software fundamentals', 'Color grading & transitions', 'Graphic design principles', 'Branding & visual content'],
  },
  {
    name: 'Content Creation & Social Media Marketing',
    description: 'Learn to create engaging content and grow a brand on social media.',
    category: 'tech',
    discordRoleGroup: 'Tech Innovations',
    syllabus: ['Content strategy basics', 'Platform-specific content (IG, TikTok, etc.)', 'Analytics & growth', 'Social media marketing campaigns'],
  },

  // ── IGCSE ──
  {
    name: 'IGCSE Physics',
    description: 'Full preparation for Cambridge IGCSE Physics.',
    category: 'igcse',
    discordRoleGroup: 'IGCSE',
    syllabus: ['Mechanics', 'Electricity & magnetism', 'Waves & optics', 'Thermal physics'],
  },
  {
    name: 'IGCSE Mathematics',
    description: 'Full preparation for Cambridge IGCSE Mathematics.',
    category: 'igcse',
    discordRoleGroup: 'IGCSE',
    syllabus: ['Number & algebra', 'Geometry & trigonometry', 'Statistics & probability', 'Problem-solving techniques'],
  },
  {
    name: 'IGCSE Chemistry',
    description: 'Full preparation for Cambridge IGCSE Chemistry.',
    category: 'igcse',
    discordRoleGroup: 'IGCSE',
    syllabus: ['Atomic structure & bonding', 'Chemical reactions', 'Organic chemistry basics', 'Practical & exam technique'],
  },
  {
    name: 'IGCSE Biology',
    description: 'Full preparation for Cambridge IGCSE Biology.',
    category: 'igcse',
    discordRoleGroup: 'IGCSE',
    syllabus: ['Cell biology', 'Human physiology', 'Genetics & evolution', 'Ecology'],
  },

  // ── JAMB / WAEC ──
  {
    name: 'JAMB Mathematics',
    description: 'JAMB UTME Mathematics preparation covering the full syllabus.',
    category: 'jamb-waec',
    discordRoleGroup: 'JAMB',
    syllabus: ['Number & algebra', 'Geometry & trigonometry', 'Calculus basics', 'Past questions & exam practice'],
  },
  {
    name: 'JAMB Physics',
    description: 'JAMB UTME Physics preparation covering the full syllabus.',
    category: 'jamb-waec',
    discordRoleGroup: 'JAMB',
    syllabus: ['Mechanics', 'Electricity & magnetism', 'Waves & optics', 'Past questions & exam practice'],
  },
  {
    name: 'JAMB Chemistry',
    description: 'JAMB UTME Chemistry preparation covering the full syllabus.',
    category: 'jamb-waec',
    discordRoleGroup: 'JAMB',
    syllabus: ['Atomic structure & bonding', 'Chemical reactions', 'Organic chemistry', 'Past questions & exam practice'],
  },
  {
    name: 'WAEC Physics',
    description: 'WAEC/NECO Physics preparation covering the full syllabus.',
    category: 'jamb-waec',
    discordRoleGroup: 'JAMB',
    syllabus: ['Mechanics', 'Electricity & magnetism', 'Waves & optics', 'Practical & exam technique'],
  },
  {
    name: 'WAEC Chemistry',
    description: 'WAEC/NECO Chemistry preparation covering the full syllabus.',
    category: 'jamb-waec',
    discordRoleGroup: 'JAMB',
    syllabus: ['Atomic structure & bonding', 'Chemical reactions', 'Organic chemistry', 'Practical & exam technique'],
  },
  {
    name: 'WAEC Mathematics',
    description: 'WAEC/NECO Mathematics preparation covering the full syllabus.',
    category: 'jamb-waec',
    discordRoleGroup: 'JAMB',
    syllabus: ['Number & algebra', 'Geometry & trigonometry', 'Statistics & probability', 'Past questions & exam practice'],
  },

  // ── IELTS ──
  {
    name: 'IELTS General Training',
    description: 'Preparation for the IELTS General Training module for immigration and work purposes.',
    category: 'ielts',
    discordRoleGroup: 'IELTS',
    syllabus: ['Listening skills', 'Reading strategies', 'Writing (letters & essays)', 'Speaking practice & mock tests'],
  },
  {
    name: 'IELTS Academic',
    description: 'Preparation for the IELTS Academic module for university admissions.',
    category: 'ielts',
    discordRoleGroup: 'IELTS',
    syllabus: ['Listening skills', 'Academic reading strategies', 'Academic writing (Task 1 & 2)', 'Speaking practice & mock tests'],
  },
]

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    console.log('Clearing existing courses...')
    await Course.deleteMany({})

    console.log(`Inserting ${courses.length} courses...`)
    await Course.insertMany(courses)

    console.log('✅ Seed complete.')
  } catch (err) {
    console.error('Seed failed:', err)
    process.exitCode = 1
  } finally {
    await mongoose.disconnect()
  }
}

seed()