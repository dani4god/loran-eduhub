export const LESSON_NOTE_CLASSES = [
  { value: 'jss1', label: 'JSS 1' },
  { value: 'jss2', label: 'JSS 2' },
  { value: 'jss3', label: 'JSS 3' },
  { value: 'ss1', label: 'SS 1' },
  { value: 'ss2', label: 'SS 2' },
  { value: 'ss3', label: 'SS 3' },
] as const

export const SS_CATEGORIES = [
  { value: 'core', label: 'Core / General Academic' },
  { value: 'sciences', label: 'Sciences' },
  { value: 'arts_humanities', label: 'Arts & Humanities' },
  { value: 'commercial', label: 'Commercial / Business' },
  { value: 'home_economics_vocational', label: 'Home Economics & Vocational' },
  { value: 'technical_trade', label: 'Technical / Trade' },
] as const

export const JSS_SUBJECTS = [
  'English Language', 'General Mathematics / Mathematics', 'Basic Science', 'Basic Technology',
  'Business Studies', 'Social Studies', 'Civic Education', 'Cultural and Creative Arts (CCA)',
  'Agricultural Science / Agriculture', 'Home Economics', 'Nigerian History',
  'Information Technology (IT) / Computer Studies', 'French Language', 'Arabic', 'Hausa Language',
  'Igbo Language', 'Yoruba Language', 'Christian Religious Studies (CRS)', 'Islamic Studies (IS)',
  'Physical and Health Education', 'Security Education', 'Entrepreneurship',
]

export const SS_SUBJECTS_BY_CATEGORY: Record<string, string[]> = {
  core: ['English Language', 'General Mathematics', 'Further Mathematics', 'Civic Education', 'Computer & IT / Information Technology', 'Physical Education', 'Health Education'],
  sciences: ['Biology', 'Chemistry', 'Physics', 'Agricultural Science', 'Fisheries', 'Animal Husbandry'],
  arts_humanities: ['Literature-in-English', 'Government', 'History', 'Geography', 'Christian Religious Studies', 'Islamic Studies', 'Arabic', 'French Language', 'Igbo Language', 'Yoruba Language', 'Hausa Language', 'Music', 'Visual Art'],
  commercial: ['Economics', 'Commerce', 'Financial Accounting', 'Book Keeping', 'Marketing', 'Insurance', 'Office Practice', 'Store Keeping', 'Store Management', 'Salesmanship', 'Tourism'],
  home_economics_vocational: ['Home Management', 'Foods & Nutrition', 'Clothing & Textiles', 'Garment Making', 'Catering & Craft Practice', 'Cosmetology', 'Photography', 'Tie & Dye Craft', 'Textile Trade', 'Leather Goods', 'Printing Craft Practice'],
  technical_trade: ['Technical Drawing', 'Basic Electricity', 'Basic Electronics', 'Electrical Installation & Maintenance Work', 'Auto Mechanics', 'Auto Mechanical Works', 'Auto Electrical Works', 'Automobile Parts Merchandising', 'Building Construction', 'Block Laying, Brick Laying & Concrete Works', 'Plumbing & Pipe Fitting', 'Welding & Fabrication', 'Metal Work', 'Woodwork', 'Carpentry & Joinery', 'Furniture Making', 'Machine Woodworking', 'Upholstery', 'Painting & Decoration', 'Radio, Television & Electrical Work', 'Radio, Television & Repairs', 'GSM Maintenance & Repairs', 'Air Conditioning & Refrigeration', 'Mining'],
}

const JSS_CLASSES = ['jss1', 'jss2', 'jss3']

export function isJssClass(classValue: string): boolean {
  return JSS_CLASSES.includes(classValue)
}

export function getSubjectsFor(classValue: string, category?: string): string[] {
  if (isJssClass(classValue)) return JSS_SUBJECTS
  if (!category) return []
  return SS_SUBJECTS_BY_CATEGORY[category] || []
}
