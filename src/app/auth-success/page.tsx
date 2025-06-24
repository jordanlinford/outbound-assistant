'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AuthSuccess() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (session) {
      // User is authenticated, redirect to dashboard
      router.push('/dashboard?auth=success');
    } else {
      // User is not authenticated, redirect to login
      router.push('/login?error=auth_failed');
    }
  }, [session, status, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h2 className="text-lg font-medium text-gray-900">Completing authentication...</h2>
          <p className="text-sm text-gray-600 mt-2">Please wait while we redirect you.</p>
        </div>
      </div>
    </div>
  );
} 