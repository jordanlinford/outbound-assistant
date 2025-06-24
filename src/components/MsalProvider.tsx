'use client';

import { MsalProvider as AzureMsalProvider } from '@azure/msal-react';
import { msalInstance } from '@/lib/msal-config';

interface MsalProviderProps {
  children: React.ReactNode;
}

export function MsalProvider({ children }: MsalProviderProps) {
  return (
    <AzureMsalProvider instance={msalInstance}>
      {children}
    </AzureMsalProvider>
  );
} 