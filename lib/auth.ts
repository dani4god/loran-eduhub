import { NextAuthOptions, DefaultSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import DiscordProvider from 'next-auth/providers/discord'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Tutor from '@/models/Tutor'
import Student from '@/models/Student'
import Admin from '@/models/Admin'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { decode } from 'next-auth/jwt'
import {
  getGuildRoles,
  addMemberToGuild,
  getGuildMember,
  assignRolesToMember,
} from '@/lib/discord'
import {
  getTutorRoleNames,
  getStudentRoleName,
  PLAN_ROLE_MAP,
  PAID_ROLE_NAME,
  MEMBER_ROLE_NAME,
  LORAN_GUILD_ID,
} from '@/lib/discordRoleMap'
import Course from '@/models/Course'
import Enrollment from '@/models/Enrollment'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      role: 'student' | 'tutor' | 'admin'
      name?: string | null
      discordId?: string | null
    } & DefaultSession['user']
  }

  interface User {
    id: string
    email: string
    role: 'student' | 'tutor' | 'admin'
    discordId?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: 'student' | 'tutor' | 'admin'
    email: string
    discordId?: string
    discordAccessToken?: string
  }
}

// ── Read the CURRENTLY logged-in Loran user from the existing session
// cookie, without touching Discord's profile/email at all. This is what
// lets "Connect Discord" work regardless of which email the Discord
// account uses.
async function getLoggedInUserIdFromCookies(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const raw =
      cookieStore.get('__Secure-next-auth.session-token')?.value ||
      cookieStore.get('next-auth.session-token')?.value

    if (!raw) return null

    const token = await decode({
      token: raw,
      secret: process.env.NEXTAUTH_SECRET!,
    })

    return (token?.id as string) || null
  } catch (err) {
    console.error('Failed to decode existing session cookie:', err)
    return null
  }
}

async function syncTutorToDiscord(
  tutor: any,
  discordId: string,
  accessToken: string
) {
  try {
    const guildId = LORAN_GUILD_ID
    if (!guildId) return

    const courses = await Course.find({
      _id: { $in: tutor.courses },
      isActive: true,
    }).select('category')

    const categories = courses.map((c: any) => c.category)
    const targetRoleNames = getTutorRoleNames(categories)
    targetRoleNames.push(MEMBER_ROLE_NAME)

    const guildRoles = await getGuildRoles(guildId)
    const roleByName = new Map<string, string>(
      guildRoles.map((r: any) => [r.name, r.id])
    )

    const roleIds = targetRoleNames
      .map(name => roleByName.get(name))
      .filter(Boolean) as string[]

    const member = await getGuildMember(guildId, discordId)
    if (!member) {
      await addMemberToGuild(guildId, discordId, accessToken)
    }

    await assignRolesToMember(guildId, discordId, roleIds)

    await Tutor.findByIdAndUpdate(tutor._id, {
      discordRoles: targetRoleNames,
    })

    console.log(`✅ Tutor ${tutor.firstName} synced to Discord with roles: ${targetRoleNames.join(', ')}`)
  } catch (err: any) {
    console.error('Discord tutor sync error:', err.message)
  }
}

// ── Student sync: role set is derived live from active enrollments'
// course categories, so newly added courses/enrollments just work on
// the next sync — nothing hardcoded.
async function syncStudentToDiscord(
  student: any,
  discordId: string,
  accessToken: string
) {
  try {
    const guildId = LORAN_GUILD_ID
    if (!guildId) return

    const enrollments = await Enrollment.find({
      studentId: student._id,
      status: 'active',
    })

    if (enrollments.length === 0) {
      await Student.findByIdAndUpdate(student._id, { discordRoles: [MEMBER_ROLE_NAME] })
      return
    }

    const courseIds = enrollments.map((e: any) => e.courseId)
    const courses = await Course.find({ _id: { $in: courseIds } }).select('category')
    const courseById = new Map(courses.map((c: any) => [c._id.toString(), c]))

    const targetRoleNames = new Set<string>([MEMBER_ROLE_NAME])

    for (const enrollment of enrollments) {
      const course = courseById.get(enrollment.courseId.toString())
      if (!course) continue

      targetRoleNames.add(getStudentRoleName(course.category))

      const planRoleName = PLAN_ROLE_MAP[enrollment.plan]
      if (planRoleName) targetRoleNames.add(planRoleName)

      if (enrollment.plan !== 'trial') targetRoleNames.add(PAID_ROLE_NAME)
    }

    const roleNamesArr = Array.from(targetRoleNames)

    const guildRoles = await getGuildRoles(guildId)
    const roleByName = new Map<string, string>(
      guildRoles.map((r: any) => [r.name, r.id])
    )

    const roleIds = roleNamesArr
      .map(name => roleByName.get(name))
      .filter(Boolean) as string[]

    const member = await getGuildMember(guildId, discordId)
    if (!member) {
      await addMemberToGuild(guildId, discordId, accessToken)
    }

    await assignRolesToMember(guildId, discordId, roleIds)

    await Student.findByIdAndUpdate(student._id, {
      discordRoles: roleNamesArr,
    })

    console.log(`✅ Student ${student.firstName} synced to Discord with roles: ${roleNamesArr.join(', ')}`)
  } catch (err: any) {
    console.error('Discord student sync error:', err.message)
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'identify email guilds guilds.join',
        },
      },
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        role: { label: 'Role', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter your email and password')
        }

        await connectDB()

        const user = await User.findOne({ email: credentials.email.toLowerCase() })
        if (!user) throw new Error('No account found with this email')

        if (credentials.role && user.role !== credentials.role) {
          throw new Error(`No ${credentials.role} account found with this email`)
        }

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) throw new Error('Incorrect password')

        if (!user.isActive) {
          throw new Error('Your account has been suspended. Please contact support.')
        }

        if (user.role === 'tutor') {
          const tutor = await Tutor.findOne({ userId: user._id })
          if (!tutor) throw new Error('Tutor profile not found')
          if (tutor.status === 'pending') throw new Error('Your application is still under review')
          if (tutor.status === 'disapproved') throw new Error('Your tutor application was not approved')
          if (tutor.status === 'suspended') throw new Error('Your account has been suspended')
        }

        if (user.role === 'student') {
          const student = await Student.findOne({ userId: user._id })
          if (!student) throw new Error('Student profile not found')
        }

        if (user.role === 'admin') {
          const admin = await Admin.findOne({ userId: user._id })
          if (!admin) throw new Error('Admin profile not found')
          if (!admin.isActive) throw new Error('Your admin account has been deactivated')
          await Admin.findByIdAndUpdate(admin._id, { lastLoginAt: new Date() })
        }

        let name = user.email.split('@')[0]
        if (user.role === 'tutor') {
          const tutor = await Tutor.findOne({ userId: user._id })
          name = tutor ? `${tutor.firstName} ${tutor.lastName}` : name
        } else if (user.role === 'student') {
          const student = await Student.findOne({ userId: user._id })
          name = student ? `${student.firstName} ${student.lastName}` : name
        } else if (user.role === 'admin') {
          const admin = await Admin.findOne({ userId: user._id })
          name = admin ? `${admin.firstName} ${admin.lastName}` : name
        }

        return {
          id: user._id.toString(),
          email: user.email,
          role: user.role,
          name,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/auth/student/login',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Only credentials sign-in is allowed to set the base identity.
      // Discord's OAuth profile must never overwrite token.id/role —
      // that's what corrupted sessions when linking Discord.
      if (user && account?.provider === 'credentials') {
        token.id = user.id
        token.role = user.role
        token.email = user.email
      }

      if (account?.provider === 'discord') {
        token.discordId = account.providerAccountId
        token.discordAccessToken = account.access_token
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.email = token.email
        session.user.discordId = token.discordId as string | null
      }
      return session
    },
    async signIn({ account, profile }) {
      if (account?.provider === 'discord') {
        try {
          await connectDB()

          // Link by the CURRENTLY logged-in Loran user, never by email.
          const currentUserId = await getLoggedInUserIdFromCookies()
          if (!currentUserId) {
            console.error('Discord connect attempted with no active Loran session')
            return true
          }

          const existingUser = await User.findById(currentUserId)
          if (!existingUser) return true

          const expiresAt = account.expires_at
            ? new Date(account.expires_at * 1000)
            : null

          const discordUsername = (profile as any)?.username

          await User.findByIdAndUpdate(existingUser._id, {
            discordId: account.providerAccountId,
            discordUsername,
            discordAccessToken: account.access_token,
            discordRefreshToken: account.refresh_token,
            discordTokenExpiresAt: expiresAt,
          })

          if (existingUser.role === 'tutor') {
            const tutor = await Tutor.findOne({ userId: existingUser._id })
            if (tutor) {
              await Tutor.findByIdAndUpdate(tutor._id, {
                discordId: account.providerAccountId,
                discordUsername,
              })

              if (tutor.status === 'approved' && account.access_token) {
                await syncTutorToDiscord(
                  tutor,
                  account.providerAccountId,
                  account.access_token
                )
              }
            }
          }

          if (existingUser.role === 'student') {
            const student = await Student.findOne({ userId: existingUser._id })
            if (student && account.access_token) {
              await Student.findByIdAndUpdate(student._id, {
                discordId: account.providerAccountId,
                discordUsername,
              })

              await syncStudentToDiscord(
                student,
                account.providerAccountId,
                account.access_token
              )
            }
          }
        } catch (error) {
          console.error('Discord sign in error:', error)
          return true
        }
      }
      return true
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}