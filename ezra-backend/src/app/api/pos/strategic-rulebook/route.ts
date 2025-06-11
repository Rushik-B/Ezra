import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET the active strategic rulebook
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const rulebook = await prisma.strategicRulebook.findFirst({
      where: { userId: session.userId, isActive: true },
      orderBy: { version: 'desc' },
    });

    if (!rulebook) {
      return NextResponse.json({ error: 'Strategic Rulebook not found' }, { status: 404 });
    }

    return NextResponse.json(rulebook);
  } catch (error) {
    console.error('Error fetching Strategic Rulebook:', error);
    return NextResponse.json({ error: 'Failed to fetch Strategic Rulebook' }, { status: 500 });
  }
}

// POST a new version of the strategic rulebook
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

    const current = await prisma.strategicRulebook.findFirst({
      where: { userId: session.userId },
      orderBy: { version: 'desc' },
    });
    const nextVersion = current ? current.version + 1 : 1;

    await prisma.strategicRulebook.updateMany({
      where: { userId: session.userId },
      data: { isActive: false },
    });

    const newRulebook = await prisma.strategicRulebook.create({
      data: {
        userId: session.userId,
        content,
        version: nextVersion,
        isActive: true,
      },
    });

    return NextResponse.json(newRulebook);
  } catch (error) {
    console.error('Error saving Strategic Rulebook:', error);
    return NextResponse.json({ error: 'Failed to save Strategic Rulebook' }, { status: 500 });
  }
} 