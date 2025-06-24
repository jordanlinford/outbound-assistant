import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    console.log('Middleware - Token:', req.nextauth.token);
    console.log('Middleware - URL:', req.url);
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        console.log('Middleware authorized callback:', { token: !!token, url: req.url });
        return !!token;
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: ['/dashboard/:path*'],
}; 