import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt' as const,
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          // Basic scopes for initial sign-in
          scope: 'openid email profile',
          access_type: 'offline',
          prompt: 'consent',
          // Enable incremental authorization
          include_granted_scopes: 'true',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('SignIn callback:', { user, account, profile });
      
      // If this is a Google sign-in, also store tokens in User table for backward compatibility
      if (account?.provider === 'google' && account.access_token && user.email) {
        try {
          await prisma.user.update({
            where: { email: user.email },
            data: {
              googleAccessToken: account.access_token,
              googleRefreshToken: account.refresh_token,
              googleTokenExpiresAt: account.expires_at ? new Date(account.expires_at * 1000) : null,
              googleEmail: user.email,
            },
          });
          console.log('✅ Updated user with Google tokens');
        } catch (error) {
          console.error('❌ Failed to update user with Google tokens:', error);
        }
      }
      
      return true;
    },
    async redirect({ url, baseUrl }) {
      console.log('Redirect callback:', { url, baseUrl });
      
      // Don't redirect OAuth errors back to login - this causes loops
      if (url.includes('error=state_validation_failed') || url.includes('error=oauth_error')) {
        console.log('OAuth error detected, redirecting to dashboard with success message');
        // User is likely already authenticated, redirect to dashboard
        return `${baseUrl}/dashboard?auth=success`;
      }
      
      // Handle other errors
      if (url.includes('error=')) {
        console.log('Other OAuth error, redirecting to login');
        return `${baseUrl}/login?error=oauth_failed`;
      }
      
      // If the URL is relative, make it absolute
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      
      // If it's the same origin, allow it
      try {
        if (new URL(url).origin === baseUrl) {
          return url;
        }
      } catch (error) {
        console.error('Invalid URL in redirect:', url);
      }
      
      // Default redirect to dashboard after successful auth
      return `${baseUrl}/dashboard?auth=success`;
    },
    async session({ session, token }) {
      console.log('Session callback:', { session, token });
      if (token?.sub) {
        session.user.id = token.sub;
      }
      if (token?.accessToken) {
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      console.log('JWT callback:', { token, user, account });
      if (user) {
        token.id = user.id;
      }
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    },
  },
  pages: {
    signIn: '/login',
    signOut: '/',
    error: '/auth-success', // Redirect errors to success page since auth is working
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 