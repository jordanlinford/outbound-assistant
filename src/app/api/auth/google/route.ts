import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

// Define scope groups for different features
const SCOPE_GROUPS = {
  gmail: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify',
  ],
  calendar: [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events',
  ],
  drive: [
    'https://www.googleapis.com/auth/drive.file',
  ],
};

export async function GET(request: Request) {
  const session = await getServerSession();

  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const redirectUri = searchParams.get('redirect_uri') || process.env.NEXTAUTH_URL + '/api/auth/google/callback';
  
  // Allow requesting specific scope groups
  const requestedScopes = searchParams.get('scopes')?.split(',') || ['gmail'];
  
  // Build scopes array based on requested scope groups
  let scopes: string[] = [];
  requestedScopes.forEach(scopeGroup => {
    if (SCOPE_GROUPS[scopeGroup as keyof typeof SCOPE_GROUPS]) {
      scopes.push(...SCOPE_GROUPS[scopeGroup as keyof typeof SCOPE_GROUPS]);
    }
  });

  // If no valid scopes requested, default to Gmail
  if (scopes.length === 0) {
    scopes = SCOPE_GROUPS.gmail;
  }

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    // Enable incremental authorization - this will include previously granted scopes
    include_granted_scopes: 'true',
    state: JSON.stringify({
      userId: session.user.id,
      requestedScopes: requestedScopes,
      timestamp: Date.now(),
    }),
  });

  return NextResponse.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
} 