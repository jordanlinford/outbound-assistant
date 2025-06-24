import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const MICROSOFT_AUTH_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';

const SCOPES = [
  'offline_access',
  'User.Read',
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

  // Use a simple state - just timestamp to prevent replay attacks
  const state = `simple_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES,
    response_mode: 'query',
    state: state,
  });

  console.log('Microsoft OAuth redirect URL:', `${MICROSOFT_AUTH_URL}?${params.toString()}`);

  return NextResponse.redirect(`${MICROSOFT_AUTH_URL}?${params.toString()}`);
} 