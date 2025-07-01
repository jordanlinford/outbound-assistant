// Use NextAuth's default middleware to protect the dashboard.
// It automatically checks the session/JWT cookie and sends unauthenticated
// users to our custom sign-in page (`/login`).

export { default } from 'next-auth/middleware';

export const config = {
  matcher: ['/dashboard/:path*'],
}; 