import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';
import { addKnowledgeChunk } from '@/lib/knowledge-base';
import { prisma } from '@/lib/prisma';

const PostSchema = z.object({
  content: z.string().min(10, 'Content is too short'),
  tags: z.array(z.string()).optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });

  // @ts-ignore generated type after prisma generate
  const chunks = await prisma.knowledgeChunk.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(chunks);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });

  const json = await req.json();
  const parse = PostSchema.safeParse(json);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }

  const { content, tags } = parse.data;
  try {
    await addKnowledgeChunk(session.user.id, content, tags);
    return new NextResponse(null, { status: 201 });
  } catch (err) {
    console.error(err);
    return new NextResponse('Failed to add knowledge chunk', { status: 500 });
  }
} 