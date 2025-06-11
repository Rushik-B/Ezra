import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET the active interaction network
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const network = await prisma.interactionNetwork.findFirst({
      where: { userId: session.userId, isActive: true },
      orderBy: { version: 'desc' },
    });

    if (!network) {
      // If none exists, maybe we should generate one? For now, return not found.
      // This part of the logic is handled by ensureUserHas... in the generator service.
      // A user visiting the page should have one generated if they have enough emails.
      return NextResponse.json({ error: 'Interaction Network not found' }, { status: 404 });
    }

    return NextResponse.json(network);
  } catch (error) {
    console.error('Error fetching Interaction Network:', error);
    return NextResponse.json({ error: 'Failed to fetch Interaction Network' }, { status: 500 });
  }
}

// POST a new version of the interaction network
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { content } = await request.json();
    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const current = await prisma.interactionNetwork.findFirst({
      where: { userId: session.userId },
      orderBy: { version: 'desc' },
    });
    const nextVersion = current ? current.version + 1 : 1;

    await prisma.interactionNetwork.updateMany({
      where: { userId: session.userId },
      data: { isActive: false },
    });

    const newNetwork = await prisma.interactionNetwork.create({
      data: {
        userId: session.userId,
        content,
        version: nextVersion,
        isActive: true,
      },
    });

    return NextResponse.json(newNetwork);
  } catch (error) {
    console.error('Error saving Interaction Network:', error);
    return NextResponse.json({ error: 'Failed to save Interaction Network' }, { status: 500 });
  }
} 