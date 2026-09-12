import { NextRequest, NextResponse } from 'next/server';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, syncAutomatedNotifications } from '@/lib/services/notificationService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get('unread') === 'true';

    await syncAutomatedNotifications();
    const notifications = await getNotifications(unreadOnly);
    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, markAll } = body;

    if (markAll) {
      await markAllNotificationsAsRead();
      return NextResponse.json({ success: true });
    }

    if (id) {
      const updated = await markNotificationAsRead(id);
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: 'id or markAll is required' }, { status: 400 });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}
