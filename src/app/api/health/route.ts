import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prismaHealthCheck } from '@/lib/prisma';

export async function GET() {
  const startTime = Date.now();
  
  try {
    const checks = await Promise.allSettled([
      // Database health check
      prismaHealthCheck(),
      
      // Environment variables check
      Promise.resolve({
        status: 'healthy',
        variables: {
          DATABASE_URL: !!process.env.DATABASE_URL,
          NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
          NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
          GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
          GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
          MICROSOFT_CLIENT_ID: !!process.env.MICROSOFT_CLIENT_ID,
          MICROSOFT_CLIENT_SECRET: !!process.env.MICROSOFT_CLIENT_SECRET,
          OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
        }
      }),
      
      // NextAuth session check
      getServerSession(authOptions).then(session => ({
        status: 'healthy',
        hasSession: !!session,
        sessionUser: session?.user?.email || null
      })).catch(error => ({
        status: 'unhealthy',
        error: error.message
      }))
    ]);

    const [dbCheck, envCheck, authCheck] = checks;
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: Date.now() - startTime,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: dbCheck.status === 'fulfilled' ? dbCheck.value : { status: 'unhealthy', error: dbCheck.reason },
        environment: envCheck.status === 'fulfilled' ? envCheck.value : { status: 'unhealthy', error: envCheck.reason },
        authentication: authCheck.status === 'fulfilled' ? authCheck.value : { status: 'unhealthy', error: authCheck.reason }
      }
    };

    // Determine overall health status
    const allHealthy = Object.values(health.checks).every(check => check.status === 'healthy');
    health.status = allHealthy ? 'healthy' : 'degraded';

    return NextResponse.json(health, { 
      status: allHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
} 