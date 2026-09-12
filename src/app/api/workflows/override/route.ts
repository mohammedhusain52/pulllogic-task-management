import { NextRequest, NextResponse } from 'next/server';
import { overrideTaskDependency } from '@/lib/services/workflowService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { taskId, reason = 'Manually overridden by Mohammed Husain' } = body;

    if (!taskId) {
      return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
    }

    const updatedTask = await overrideTaskDependency(taskId, reason);
    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Error overriding dependency:', error);
    return NextResponse.json({ error: 'Failed to override dependency' }, { status: 500 });
  }
}
