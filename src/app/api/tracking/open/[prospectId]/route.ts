import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 1×1 transparent PNG (base64-encoded)
const TRANSPARENT_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/ggC1ioAAAAASUVORK5CYII=';
const TRANSPARENT_PNG_BUFFER = Buffer.from(TRANSPARENT_PNG_BASE64, 'base64');

export async function GET(
  _req: NextRequest,
  { params }: { params: { prospectId: string } }
) {
  const { prospectId } = params;

  // Record the open in the background (fire-and-forget – we do not block the response)
  if (prospectId) {
    prisma.interaction
      .create({
        data: {
          type: 'email_opened',
          prospect: {
            connect: { id: prospectId },
          },
        },
      })
      .catch((err) => {
        // Log but never crash the pixel route
        console.error('Failed to store email_opened interaction', err);
      });
  }

  // Return the pixel with cache-busting headers
  return new NextResponse(TRANSPARENT_PNG_BUFFER, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Content-Length': TRANSPARENT_PNG_BUFFER.length.toString(),
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
} 