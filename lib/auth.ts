import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (
          credentials?.username === process.env.APP_USERNAME &&
          credentials?.password === process.env.APP_PASSWORD
        ) {
          return { id: "1", name: "Scout" }
        }
        return null
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  pages: {
    signIn: "/login"
  },
  callbacks: {
    async jwt({ token }) {
      return token
    },
    async session({ session, token }) {
      return session
    }
  }
}
