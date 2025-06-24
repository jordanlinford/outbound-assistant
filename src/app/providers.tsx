'use client';

import { SessionProvider } from 'next-auth/react';
import { MsalProvider } from '@/components/MsalProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <MsalProvider>
        {children}
      </MsalProvider>
    </SessionProvider>
  );
} 