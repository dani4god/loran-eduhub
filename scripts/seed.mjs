import mongoose from 'mongoose'
import { readFileSync } from 'fs'

// Load .env.local manually
const envFile = readFileSync('.env.local', 'utf-8')
envFile.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=')
  if (key && rest.length) process.env[key.trim()] = rest.join('=').trim()
})

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env.local')
  process.exit(1)
}

// ── Inline schemas ──
const CourseSchema = new mongoose.Schema({
  name: String,
  description: String,
  category: String,
  discordRoleGroup: String,
  syllabus: [String],
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

const Course = mongoose.models.Course || mongoose.model('Course', CourseSchema)

// ── Course Data ──
const COURSES = [
  // Tech
  { name: 'Web Fullstack Development (HTML, CSS & JavaScript)', category: 'tech', discordRoleGroup: 'Tech Innovations', description: 'Learn to build modern websites from scratch using HTML5, CSS3, and JavaScript ES6+.', syllabus: ['HTML5 structure & semantics', 'CSS3 layouts & Flexbox/Grid', 'JavaScript fundamentals', 'DOM manipulation', 'Responsive design', 'Project: Personal portfolio'] },
  { name: 'Python Programming', category: 'tech', discordRoleGroup: 'Tech Innovations', description: 'Introduction to programming using Python — from basics to real-world projects.', syllabus: ['Variables & data types', 'Control flow & loops', 'Functions & modules', 'File handling', 'OOP concepts', 'Project: Data calculator'] },
  { name: 'Microsoft Office Suite', category: 'tech', discordRoleGroup: 'Tech Innovations', description: 'Master Word, Excel, and PowerPoint for academic and professional use.', syllabus: ['Word: formatting & reports', 'Excel: formulas & charts', 'PowerPoint: presentations', 'Google Workspace equivalents'] },
  { name: 'Graphic Design (Canva & Photoshop)', category: 'tech', discordRoleGroup: 'Tech Innovations', description: 'Learn visual design principles and tools used by professionals.', syllabus: ['Design principles & color theory', 'Canva for beginners', 'Photoshop basics', 'Logo & poster creation', 'Social media graphics'] },
  { name: 'Data Analysis', category: 'tech', discordRoleGroup: 'Tech Innovations', description: 'Learn to collect, clean, and analyse data using spreadsheet tools.', syllabus: ['Data entry & validation', 'Formulas & pivot tables', 'Charts & dashboards', 'Google Sheets automation', 'Real dataset project'] },
  { name: 'AI Automation and Machine Learning', category: 'tech', discordRoleGroup: 'Tech Innovations', description: 'Learn to collect, clean, and analyse data using spreadsheet tools.', syllabus: ['Data entry & validation', 'Formulas & pivot tables', 'Charts & dashboards', 'Google Sheets automation', 'Real dataset project'] },


  // IGCSE
  { name: 'IGCSE Mathematics', category: 'igcse', discordRoleGroup: 'IGCSE', description: 'Comprehensive preparation for Cambridge IGCSE Mathematics (0580).', syllabus: ['Number & algebra', 'Geometry & mensuration', 'Statistics & probability', 'Past paper practice', 'Exam technique'] },
  { name: 'IGCSE English Language', category: 'igcse', discordRoleGroup: 'IGCSE', description: 'Structured preparation for Cambridge IGCSE First Language English (0500).', syllabus: ['Reading comprehension', 'Summary writing', 'Directed writing', 'Narrative & descriptive essays', 'Paper 1 & 2 full practice'] },
  { name: 'IGCSE Physics', category: 'igcse', discordRoleGroup: 'IGCSE', description: 'Full syllabus coverage for Cambridge IGCSE Physics (0625).', syllabus: ['Motion & forces', 'Thermal physics', 'Waves & light', 'Electricity & magnetism', 'Atomic physics', 'Practical skills'] },
  { name: 'IGCSE Chemistry', category: 'igcse', discordRoleGroup: 'IGCSE', description: 'Complete Cambridge IGCSE Chemistry (0620) preparation.', syllabus: ['Atomic structure', 'Bonding & reactions', 'Acids, bases & salts', 'Organic chemistry', 'Experimental techniques'] },
  { name: 'IGCSE Biology', category: 'igcse', discordRoleGroup: 'IGCSE', description: 'Full preparation for Cambridge IGCSE Biology (0610).', syllabus: ['Cell biology', 'Plant & animal systems', 'Genetics & evolution', 'Ecology', 'Human physiology'] },
  { name: 'IGCSE Economics', category: 'igcse', discordRoleGroup: 'IGCSE', description: 'Preparation for Cambridge IGCSE Economics (0455).', syllabus: ['Basic economic problem', 'Microeconomics', 'Macroeconomics', 'International trade', 'Case studies & essays'] },

  // Language
  { name: 'Mandarin Chinese (Beginner to Intermediate)', category: 'language', discordRoleGroup: 'Languages', description: 'Learn to speak, read, and write Mandarin Chinese from scratch.', syllabus: ['Pinyin & tones', 'Basic greetings & vocabulary', 'Numbers, dates & time', 'Grammar patterns', 'HSK 1 & 2 preparation', 'Conversational practice'] },
  { name: 'German Language (A1 to B1)', category: 'language', discordRoleGroup: 'Languages', description: 'Structured German learning following the CEFR framework.', syllabus: ['A1: Alphabet & basic phrases', 'A2: Grammar & everyday topics', 'B1: Reading, writing & conversation', 'Goethe-Zertifikat exam prep'] },
  { name: 'French Language (A1 to B2)', category: 'language', discordRoleGroup: 'Languages', description: 'Comprehensive French language learning from beginner to upper-intermediate.', syllabus: ['Pronunciation & phonetics', 'Grammar: verbs, articles, tenses', 'Speaking & listening practice', 'DELF exam preparation'] },
  { name: 'Arabic Language (Beginner)', category: 'language', discordRoleGroup: 'Languages', description: 'Learn Modern Standard Arabic script, pronunciation, and basic communication.', syllabus: ['Arabic alphabet & script', 'Basic vocabulary & phrases', 'Simple grammar structures', 'Quran Arabic introduction'] },
  { name: 'Spanish Language (A1 to A2)', category: 'language', discordRoleGroup: 'Languages', description: 'Beginner Spanish covering everyday conversation and basic grammar.', syllabus: ['Alphabet & pronunciation', 'Greetings & introductions', 'Present tense verbs', 'Daily vocabulary', 'DELE A1 preparation'] },

  // IELTS
  { name: 'IELTS Academic Preparation', category: 'ielts', discordRoleGroup: 'IELTS', description: 'Intensive preparation for the IELTS Academic test — all four skills.', syllabus: ['Listening: strategies & practice', 'Reading: skimming, scanning & inference', 'Writing Task 1: graphs & diagrams', 'Writing Task 2: essays', 'Speaking: Part 1, 2 & 3', 'Full mock tests & feedback'] },
  { name: 'IELTS General Training', category: 'ielts', discordRoleGroup: 'IELTS', description: 'Targeted preparation for IELTS General Training for immigration and work purposes.', syllabus: ['Listening & reading strategies', 'Writing Task 1: formal letters', 'Writing Task 2: essays', 'Speaking fluency practice', 'Band score improvement techniques'] },
  { name: 'English Communication & Fluency', category: 'ielts', discordRoleGroup: 'IELTS', description: 'Build confidence in spoken and written English for professional and academic use.', syllabus: ['Grammar review', 'Vocabulary building', 'Pronunciation & accent', 'Public speaking', 'Business English', 'Email & report writing'] },

  // JAMB & WAEC
  { name: 'JAMB UTME — Mathematics', category: 'jamb-waec', discordRoleGroup: 'JAMB', description: 'Intensive JAMB Mathematics preparation covering all UTME topics.', syllabus: ['Algebra & indices', 'Trigonometry', 'Statistics & probability', 'Coordinate geometry', 'JAMB past questions (10 years)', 'Speed & time drills'] },
  { name: 'JAMB UTME — English Language', category: 'jamb-waec', discordRoleGroup: 'JAMB', description: 'Full JAMB English preparation including comprehension, lexis & structure.', syllabus: ['Comprehension passages', 'Lexis & structure', 'Oral English', 'Summary writing', 'JAMB past questions', 'Set texts'] },
  { name: 'JAMB UTME — Physics', category: 'jamb-waec', discordRoleGroup: 'JAMB', description: 'Complete UTME Physics preparation with calculations and theory.', syllabus: ['Mechanics & motion', 'Heat & temperature', 'Waves & optics', 'Electricity & magnetism', 'Modern physics', 'Past question analysis'] },
  { name: 'JAMB UTME — Chemistry', category: 'jamb-waec', discordRoleGroup: 'JAMB', description: 'Full UTME Chemistry preparation for science students.', syllabus: ['Atomic structure & bonding', 'Chemical equations', 'Organic chemistry', 'Electrochemistry', 'Past question practice'] },
  { name: 'JAMB UTME — Biology', category: 'jamb-waec', discordRoleGroup: 'JAMB', description: 'Comprehensive UTME Biology covering all JAMB-specified topics.', syllabus: ['Cell biology', 'Genetics & heredity', 'Ecology & environment', 'Reproduction', 'Human systems', 'Past question bank'] },
  { name: 'WAEC Mathematics', category: 'jamb-waec', discordRoleGroup: 'JAMB', description: 'Full WAEC/SSCE Mathematics preparation — theory and objectives.', syllabus: ['Number & numeration', 'Algebra & equations', 'Geometry & mensuration', 'Statistics & probability', 'WAEC marking guide analysis', 'Essay practice'] },
  { name: 'WAEC English Language', category: 'jamb-waec', discordRoleGroup: 'JAMB', description: 'Complete WAEC English Language preparation for Paper 1, 2 & 3.', syllabus: ['Comprehension & summary', 'Essay writing', 'Oral English & phonetics', 'Lexis & structure', 'Literature in English'] },
  { name: 'WAEC/NECO Combined Sciences', category: 'jamb-waec', discordRoleGroup: 'JAMB', description: 'Combined Physics, Chemistry & Biology preparation for WAEC and NECO.', syllabus: ['Physics essentials', 'Chemistry essentials', 'Biology essentials', 'Past papers & marking schemes'] },

  // Diploma / EduTech
  { name: 'Diploma in Early Childhood Education', category: 'diploma', discordRoleGroup: 'EduTech', description: 'Professional diploma for those seeking to work with children aged 0–8 years.', syllabus: ['Child development theories', 'Curriculum planning for early years', 'Classroom management', 'Special needs & inclusion', 'Assessment & record keeping', 'Practicum guidance'] },
  { name: 'Diploma in Secondary School Teaching', category: 'diploma', discordRoleGroup: 'EduTech', description: 'Practical teaching diploma for graduates seeking to teach at secondary level.', syllabus: ['Pedagogy & teaching methods', 'Lesson planning & delivery', 'Classroom management', 'Assessment & grading', 'Educational psychology', 'Subject-specific methodology'] },
  { name: 'Diploma in Educational Administration', category: 'diploma', discordRoleGroup: 'EduTech', description: 'For school leaders, administrators, and those in educational management roles.', syllabus: ['School governance & policy', 'Human resource management', 'Financial administration', 'Curriculum leadership', 'School improvement planning', 'Legal framework in education'] },
  { name: 'Diploma in Educational Technology', category: 'diploma', discordRoleGroup: 'EduTech', description: 'Learn to integrate technology into teaching for 21st-century classrooms.', syllabus: ['E-learning design', 'Learning Management Systems (LMS)', 'Digital content creation', 'Online assessment tools', 'Blended learning strategies', 'EdTech tools for Nigerian schools'] },
]

async function seed() {
  console.log('🔌 Connecting to MongoDB...')
  await mongoose.connect(MONGODB_URI)
  console.log('✅ Connected')

  console.log('🧹 Clearing existing courses...')
  await Course.deleteMany({})

  console.log('🌱 Seeding courses...')
  const inserted = await Course.insertMany(COURSES)
  console.log(`✅ ${inserted.length} courses seeded\n`)

  const categories = ['tech', 'igcse', 'language', 'ielts', 'jamb-waec', 'diploma']
  categories.forEach(cat => {
    const list = inserted.filter(c => c.category === cat)
    console.log(`  ${cat.toUpperCase()} (${list.length} courses)`)
    list.forEach(c => console.log(`    • ${c.name} [${c.discordRoleGroup}]`))
  })

  console.log('\n🎉 Seed complete! Run npm run dev and check your database.')
  await mongoose.disconnect()
}

seed().catch(err => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})