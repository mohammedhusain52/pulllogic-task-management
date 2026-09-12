import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const [
      user,
      teamMembers,
      clients,
      workflowTemplates,
      workflowRuns,
      tasks,
      comments,
      timeEntries,
      activityLogs,
    ] = await Promise.all([
      prisma.user.findFirst(),
      prisma.teamMember.findMany(),
      prisma.client.findMany(),
      prisma.workflowTemplate.findMany({
        include: { stages: { include: { taskTemplates: true } } },
      }),
      prisma.workflowRun.findMany(),
      prisma.task.findMany(),
      prisma.comment.findMany(),
      prisma.timeEntry.findMany(),
      prisma.activityLog.findMany(),
    ]);

    const exportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      user,
      teamMembers,
      clients,
      workflowTemplates,
      workflowRuns,
      tasks,
      comments,
      timeEntries,
      activityLogs,
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="pulllogic-backup-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}
