import { prisma } from './prisma';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Helper to generate embedding for given text (returns number[] length 1536)
export async function embedText(text: string): Promise<number[]> {
  if (!process.env.OPENAI_API_KEY) {
    // Return zero vector (not ideal) if no key configured
    return Array(1536).fill(0);
  }
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  // @ts-ignore openai typings
  return response.data[0].embedding as number[];
}

export async function addKnowledgeChunk(userId: string, content: string, tags: string[] = []): Promise<void> {
  const embedding = await embedText(content);
  // @ts-ignore – Vector type generated after prisma generate
  await prisma.knowledgeChunk.create({
    data: {
      userId,
      content,
      tags,
      embedding,
    },
  });
}

export async function getRelevantChunks(userId: string, query: string, topK = 5): Promise<string[]> {
  const queryEmbedding = await embedText(query);
  // @ts-ignore – Vector ordering helper generated after prisma generate
  const chunks: Array<{ content: string }> = await prisma.knowledgeChunk.findMany({
    where: { userId },
    orderBy: {
      // Cosine similarity ordering (pgvector)
      embedding: {
        _cosine: queryEmbedding,
      },
    },
    take: topK,
  });
  return chunks.map((c) => c.content);
} 