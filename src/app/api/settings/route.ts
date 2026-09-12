import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const settings = await prisma.systemSetting.findMany();
    const user = await prisma.user.findFirst();
    const settingsMap = settings.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json({
      user,
      settings: settingsMap,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user: userData, settings: settingsData } = body;

    if (userData) {
      const existingUser = await prisma.user.findFirst();
      if (existingUser) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            name: userData.name,
            role: userData.role,
            organization: userData.organization,
            email: userData.email,
          },
        });
      }
    }

    if (settingsData && typeof settingsData === 'object') {
      for (const [key, value] of Object.entries(settingsData)) {
        await prisma.systemSetting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
