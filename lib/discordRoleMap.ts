// lib/discordRoleMap.ts

export const CATEGORY_TO_ROLE_GROUP: Record<string, string> = {
  tech: 'Tech Innovations',
  igcse: 'IGCSE',
  language: 'Languages',
  ielts: 'IELTS',
  'jamb-waec': 'JAMB',
  diploma: 'EduTech',
}

export function getTutorRoleName(category: string): string {
  const group = CATEGORY_TO_ROLE_GROUP[category] || 'General'
  return `Tutor - ${group}`
}

export function getStudentRoleName(category: string): string {
  const group = CATEGORY_TO_ROLE_GROUP[category] || 'General'
  return `${group} Student`
}

export function getTutorRoleNames(categories: string[]): string[] {
  return Array.from(new Set(categories.map(getTutorRoleName)))
}

export const PLAN_ROLE_MAP: Record<string, string> = {
  trial: 'Trial(7 days)',
  monthly: 'Monthly',  
  '3months': '3 months',
  '6months': '6 months',
  '1year': '1 year diploma',
}

export const PAID_ROLE_NAME = 'Paid'
export const EXPIRED_ROLE_NAME = 'Expired'
export const SUSPENDED_ROLE_NAME = 'Suspended'
export const MEMBER_ROLE_NAME = 'member'
export const ADMIN_ROLE_NAME = 'Admin'

// The single fixed Loran EduHub Discord guild ID
export const LORAN_GUILD_ID = process.env.DISCORD_GUILD_ID!