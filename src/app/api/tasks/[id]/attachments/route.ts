import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logActivity } from '@/lib/services/activityService';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { fileName, fileUrl, mimeType, size = 0, entityType = 'TASK' } = body;

    if (!fileName || !fileUrl) {
      return NextResponse.json({ error: 'fileName and fileUrl are required' }, { status: 400 });
    }

    const attachment = await prisma.attachment.create({
      data: {
        entityType,
        entityId: id,
        fileName,
        fileUrl,
        mimeType,
        size,
      },
    });

    await logActivity({
      entityType,
      entityId: id,
      action: 'ATTACHMENT_ADDED',
      newValue: fileName,
      metadata: { fileUrl, size },
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    console.error('Error adding attachment:', error);
    return NextResponse.json({ error: 'Failed to add attachment' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const attachmentId = searchParams.get('attachmentId');

    if (!attachmentId) {
      return NextResponse.json({ error: 'attachmentId is required' }, { status: 400 });
    }

    await prisma.attachment.delete({ where: { id: attachmentId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return NextResponse.json({ error: 'Failed to delete attachment' }, { status: 500 });
  }
}
