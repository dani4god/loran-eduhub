import { NextAuthOptions, DefaultSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import DiscordProvider from 'next-auth/providers/discord'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Tutor from '@/models/Tutor'
import Student from '@/models/Student'
import Admin from '@/models/Admin'
import bcrypt from 'bcryptjs'
import {
  getGuildRoles,
  addMemberToGuild,
  getGuildMember,
  assignRolesToMember,
} from '@/lib/discord'
import { getTutorRoleNames, MEMBER_ROLE_NAME, LORAN_GUILD_ID } from '@/lib/discordRoleMap'
import Course from '@/models/Course'

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

async function syncTutorToDiscord(
  tutor: any,
  discordId: string,
  accessToken: string
) {
  try {
    const guildId = LORAN_GUILD_ID
    if (!guildId) return

    // Get course categories for this tutor
    const courses = await Course.find({
      _id: { $in: tutor.courses },
      isActive: true,
    }).select('category')

    const categories = courses.map((c: any) => c.category)
    const targetRoleNames = getTutorRoleNames(categories)
    targetRoleNames.push(MEMBER_ROLE_NAME)

    // Fetch all roles from the guild
    const guildRoles = await getGuildRoles(guildId)
    const roleByName = new Map<string, string>(
      guildRoles.map((r: any) => [r.name, r.id])
    )

    const roleIds = targetRoleNames
      .map(name => roleByName.get(name))
      .filter(Boolean) as string[]

    // Add tutor to the guild if not already a member
    const member = await getGuildMember(guildId, discordId)
    if (!member) {
      await addMemberToGuild(guildId, discordId, accessToken)
    }

    // Assign roles
    await assignRolesToMember(guildId, discordId, roleIds)

    // Store assigned role names on the tutor record
    await Tutor.findByIdAndUpdate(tutor._id, {
      discordRoles: targetRoleNames,
    })

    console.log(`✅ Tutor ${tutor.firstName} synced to Discord with roles: ${targetRoleNames.join(', ')}`)
  } catch (err: any) {
    // Non-fatal — log but don't block the sign-in
    console.error('Discord tutor sync error:', err.message)
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
      if (user) {
        token.id = user.id
        token.role = user.role
        token.email = user.email
      }
      if (account && account.provider === 'discord') {
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
    async signIn({ user, account, profile }) {
      if (account?.provider === 'discord') {
        try {
          await connectDB()

          const existingUser = await User.findOne({ email: user.email })
          if (!existingUser) return true // new user via Discord — let NextAuth handle it

          const expiresAt = account.expires_at
            ? new Date(account.expires_at * 1000)
            : null

          // Save Discord tokens to User
          await User.findByIdAndUpdate(existingUser._id, {
            discordId: account.providerAccountId,
            discordUsername: (profile as any)?.username,
            discordAccessToken: account.access_token,
            discordRefreshToken: account.refresh_token,
            discordTokenExpiresAt: expiresAt,
          })

          if (existingUser.role === 'tutor') {
            const tutor = await Tutor.findOne({ userId: existingUser._id })
            if (tutor) {
              // Update tutor's Discord identity
              await Tutor.findByIdAndUpdate(tutor._id, {
                discordId: account.providerAccountId,
                discordUsername: (profile as any)?.username,
              })

              // Only sync approved tutors
              if (tutor.status === 'approved' && account.access_token) {
                await syncTutorToDiscord(
                  tutor,
                  account.providerAccountId,
                  account.access_token
                )
              }
            }
          }

          // Student Discord sync will be added here in a follow-up
          // (same pattern — add to guild, assign student roles based on active enrollments)

        } catch (error) {
          console.error('Discord sign in error:', error)
          // Return true anyway — don't block sign-in just because Discord sync failed
          return true
        }
      }
      return true
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}