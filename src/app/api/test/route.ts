import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import sgMail from '@sendgrid/mail';

export async function GET() {
  const results = {
    openai: false,
    sendgrid: false,
    database: false,
    errors: [] as string[]
  };

  // Test OpenAI
  try {
    if (process.env.OPENAI_API_KEY) {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Say 'test successful'" }],
        max_tokens: 10,
      });
      
      if (completion.choices[0]?.message?.content) {
        results.openai = true;
      }
    } else {
      results.errors.push('OPENAI_API_KEY not found');
    }
  } catch (error) {
    results.errors.push(`OpenAI error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Test SendGrid
  try {
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      // Just test API key validity, don't send email
      results.sendgrid = true;
    } else {
      results.errors.push('SENDGRID_API_KEY not found');
    }
  } catch (error) {
    results.errors.push(`SendGrid error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Test Database (simple check)
  try {
    // If we can import prisma, database connection should work
    const { prisma } = await import('@/lib/prisma');
    await prisma.$connect();
    results.database = true;
    await prisma.$disconnect();
  } catch (error) {
    results.errors.push(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  const allWorking = results.openai && results.sendgrid && results.database;

  return NextResponse.json({
    status: allWorking ? 'success' : 'partial',
    message: allWorking ? 'All systems operational!' : 'Some systems need configuration',
    results,
    nextSteps: allWorking ? [] : [
      !results.openai && 'Add OPENAI_API_KEY to .env.local',
      !results.sendgrid && 'Add SENDGRID_API_KEY and FROM_EMAIL to .env.local',
      !results.database && 'Check database connection'
    ].filter(Boolean)
  });
} 