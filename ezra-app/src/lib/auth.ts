import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "./prisma"
import { getDefaultMasterPrompt } from "./prompts"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events",
          access_type: "offline",
          prompt: "consent"
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          // Create or update user in database
          const dbUser = await prisma.user.upsert({
            where: { email: user.email! },
            update: {
              name: user.name,
              updatedAt: new Date()
            },
            create: {
              email: user.email!,
              name: user.name,
            },
            include: { settings: true }
          })

          // Create default user settings if they don't exist
          if (!dbUser.settings) {
            await prisma.userSettings.create({
              data: {
                userId: dbUser.id,
                autonomyLevel: 0
              }
            })
          }

          // Create default master prompt if user doesn't have one
          await createDefaultMasterPromptForUser(dbUser.id);

          // Store or update OAuth account information
          if (account.access_token) {
            await prisma.oAuthAccount.upsert({
              where: {
                provider_providerAccountId: {
                  provider: account.provider,
                  providerAccountId: account.providerAccountId!
                }
              },
              update: {
                accessToken: account.access_token,
                refreshToken: account.refresh_token,
                scope: account.scope,
                tokenType: account.token_type,
                expiresAt: account.expires_at
              },
              create: {
                userId: dbUser.id,
                provider: account.provider,
                providerAccountId: account.providerAccountId!,
                accessToken: account.access_token,
                refreshToken: account.refresh_token,
                scope: account.scope,
                tokenType: account.token_type,
                expiresAt: account.expires_at
              }
            })
          }

          // Store user ID in the user object for JWT
          user.id = dbUser.id
        } catch (error) {
          console.error("Error during sign in:", error)
          return false
        }
      }
      return true
    },
    async jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
      }
      
      if (user) {
        token.userId = user.id
      }
      
      return token
    },
    async session({ session, token }) {
      // Get fresh access token from database using token.userId
      if (token.userId) {
        const oauthAccount = await prisma.oAuthAccount.findFirst({
          where: {
            userId: token.userId as string,
            provider: "google"
          }
        })
        
        if (oauthAccount) {
          session.accessToken = oauthAccount.accessToken
        }
        
        session.userId = token.userId as string
      }
      
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: "jwt"
  }
}

/**
 * Creates a default master prompt for a new user
 */
async function createDefaultMasterPromptForUser(userId: string): Promise<void> {
  try {
    // Check if user already has a master prompt
    const existingPrompt = await prisma.masterPrompt.findFirst({
      where: { userId }
    });

    if (!existingPrompt) {
      await prisma.masterPrompt.create({
        data: {
          userId,
          prompt: getDefaultMasterPrompt(),
          version: 1,
          isActive: true
        }
      });
      console.log(`Created default master prompt for user ${userId}`);
    }
  } catch (error) {
    console.error('Error creating default master prompt:', error);
  }
} 