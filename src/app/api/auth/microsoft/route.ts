import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const MICROSOFT_AUTH_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
const MICROSOFT_TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

const SCOPES = [
  'offline_access',
  'User.Read',  // Required to fetch user profile from /me endpoint
  'Mail.Read',
  'Mail.Send',
  'Mail.ReadWrite',
  'Calendars.Read',
  'Calendars.ReadWrite',
].join(' ');

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const redirectUri = searchParams.get('redirect_uri') || process.env.NEXTAUTH_URL + '/api/auth/microsoft/callback';

  // Create a more secure state parameter that includes timestamp
  const stateData = {
    userId: session.user.email || session.user.id, // Use email as primary identifier
    timestamp: Date.now(),
    nonce: Math.random().toString(36).substring(2, 15)
  };
  const state = Buffer.from(JSON.stringify(stateData)).toString('base64');

  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES,
    response_mode: 'query',
    state: state, // Pass encoded state data
  });

  return NextResponse.redirect(`${MICROSOFT_AUTH_URL}?${params.toString()}`);
} 