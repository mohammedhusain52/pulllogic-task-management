import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { startTaskTimer, stopTaskTimer, getActiveTimers } from '@/lib/services/timeTrackingService';

export async function GET() {
  try {
    const active = await getActiveTimers();
    return NextResponse.json(active);
  } catch (error) {
    console.error('Error fetching active timers:', error);
    return NextResponse.json({ error: 'Failed to fetch active timers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, taskId, timeEntryId, teamMemberId, note } = body;

    if (action === 'start') {
      if (!taskId) {
        return NextResponse.json({ error: 'taskId is required to start timer' }, { status: 400 });
      }
      const entry = await startTaskTimer(taskId, teamMemberId, note);
      return NextResponse.json(entry);
    }

    if (action === 'stop') {
      let targetId = timeEntryId;
      if (!targetId && taskId) {
        const running = await prisma.timeEntry.findFirst({
          where: { taskId, isRunning: true },
        });
        targetId = running?.id;
      }

      if (!targetId) {
        return NextResponse.json({ error: 'No active timer found to stop' }, { status: 400 });
      }

      const entry = await stopTaskTimer(targetId);
      return NextResponse.json(entry);
    }

    return NextResponse.json({ error: 'Invalid action. Use "start" or "stop"' }, { status: 400 });
  } catch (error) {
    console.error('Error handling time action:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to handle timer' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Time entry id is required' }, { status: 400 });
    }

    await prisma.timeEntry.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting time entry:', error);
    return NextResponse.json({ error: 'Failed to delete time entry' }, { status: 500 });
  }
}
