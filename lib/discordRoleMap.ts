// lib/discordRoleMap.ts

// Maps Course.category -> Discord role group name
// Discord roles should be: `Tutor - {group}` and `{group} Student`
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

// Subscription plan -> Discord tier role name
export const PLAN_ROLE_MAP: Record<string, string> = {
  trial: 'Trial(7 days)',
  '3months': '3 months',
  '6months': '6 months',
  '1year': '1 year diploma',
}

export const PAID_ROLE_NAME = 'Paid'
export const EXPIRED_ROLE_NAME = 'Expired'
export const SUSPENDED_ROLE_NAME = 'Suspended'
export const MEMBER_ROLE_NAME = 'member'
export const ADMIN_ROLE_NAME = 'Admin'