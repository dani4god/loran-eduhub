// lib/auth.ts
import { NextAuthOptions, DefaultSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import DiscordProvider from 'next-auth/providers/discord'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Tutor from '@/models/Tutor'
import Student from '@/models/Student'
import Admin from '@/models/Admin'
import bcrypt from 'bcryptjs'

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

        if (!user) {
          throw new Error('No account found with this email')
        }

        if (credentials.role && user.role !== credentials.role) {
          throw new Error(`No ${credentials.role} account found with this email`)
        }

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) {
          throw new Error('Incorrect password')
        }

        if (!user.isActive) {
          throw new Error('Your account has been suspended. Please contact support.')
        }

        if (user.role === 'tutor') {
          const tutor = await Tutor.findOne({ userId: user._id })

          if (!tutor) {
            throw new Error('Tutor profile not found')
          }

          if (tutor.status === 'pending') {
            throw new Error('Your application is still under review')
          }

          if (tutor.status === 'disapproved') {
            throw new Error('Your tutor application was not approved')
          }

          if (tutor.status === 'suspended') {
            throw new Error('Your account has been suspended')
          }
        }

        if (user.role === 'student') {
          const student = await Student.findOne({ userId: user._id })

          if (!student) {
            throw new Error('Student profile not found')
          }
        }

        if (user.role === 'admin') {
          const admin = await Admin.findOne({ userId: user._id })

          if (!admin) {
            throw new Error('Admin profile not found')
          }

          if (!admin.isActive) {
            throw new Error('Your admin account has been deactivated')
          }

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
          name: name,
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
          if (existingUser) {
            const expiresAt = account.expires_at
              ? new Date(account.expires_at * 1000)
              : null

            await User.findByIdAndUpdate(existingUser._id, {
              discordId: account.providerAccountId,
              discordUsername: (profile as any)?.username,
              discordAccessToken: account.access_token,
              discordRefreshToken: account.refresh_token,
              discordTokenExpiresAt: expiresAt,
            })

            if (existingUser.role === 'tutor') {
              await Tutor.findOneAndUpdate(
                { userId: existingUser._id },
                {
                  discordId: account.providerAccountId,
                  discordUsername: (profile as any)?.username,
                }
              )
            }
          }
          return true
        } catch (error) {
          console.error('Discord sign in error:', error)
          return false
        }
      }
      return true
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}