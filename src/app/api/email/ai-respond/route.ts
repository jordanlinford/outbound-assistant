import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AIEmailResponder } from '@/lib/ai-email-responder';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { 
      incomingEmail, 
      responseType = 'general',
      tone = 'professional',
      length = 'medium',
      includeCallToAction = true,
      customInstructions 
    } = await request.json();

    // Validate input
    if (!incomingEmail?.body) {
      return NextResponse.json(
        { error: 'Missing incoming email content' },
        { status: 400 }
      );
    }

    const responder = new AIEmailResponder();

    // First, analyze the incoming email
    const analysis = await responder.analyzeEmail(incomingEmail.body);

    // Generate AI response
    const context = {
      incomingEmail: {
        from: incomingEmail.from || 'unknown@example.com',
        subject: incomingEmail.subject || 'No subject',
        body: incomingEmail.body,
        timestamp: new Date()
      },
      userProfile: {
        name: session.user.name || 'Assistant',
        email: session.user.email || 'assistant@outbound-assistant.com',
        company: 'Outbound Assistant',
        role: 'AI Assistant'
      },
      responseType: responseType
    };

    const options = {
      tone,
      length,
      includeCallToAction,
      customInstructions
    };

    const aiResponse = await responder.generateResponse(context, options);

    // Check if human intervention is needed
    const routingDecision = await responder.shouldRouteToHuman(incomingEmail.body);

    return NextResponse.json({
      success: true,
      analysis,
      aiResponse,
      routingDecision,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI email response error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate AI response',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 