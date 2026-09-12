import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  verifySessionToken,
  verifyPassword,
  hashPassword,
  createSessionToken,
  AUTH_COOKIE_NAME,
} from '@/lib/auth';
import { logActivity } from '@/lib/services/activityService';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    const session = token ? verifySessionToken(token) : null;

    const body = await req.json();
    const { currentPassword, newPassword, username, email } = body;

    if (!newPassword || newPassword.trim().length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    let user = null;

    if (session?.userId) {
      user = await prisma.user.findUnique({
        where: { id: session.userId },
      });
    }

    // If not found by session, try finding by username or email
    if (!user) {
      const searchIdentifier = (username || email || 'mohammed').trim().toLowerCase();
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { username: searchIdentifier },
            { email: searchIdentifier },
          ],
        },
      });
    }

    if (!user) {
      // Default to first user in database if single-user mode
      user = await prisma.user.findFirst();
    }

    if (!user) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    // If currentPassword is provided, verify it if user wants to be strict
    if (currentPassword && currentPassword.trim() && user.passwordHash && user.passwordSalt) {
      const isValid = verifyPassword(currentPassword, user.passwordHash, user.passwordSalt);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Current password is incorrect. Leave current password blank or enter the correct one to reset.' },
          { status: 400 }
        );
      }
    }

    // Hash and store the new password
    const { hash, salt } = hashPassword(newPassword.trim());

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hash,
        passwordSalt: salt,
      },
    });

    await logActivity({
      entityType: 'USER',
      entityId: user.id,
      action: 'PASSWORD_CHANGED',
      newValue: 'Password updated successfully',
    });

    // Create fresh session token and set cookie
    const newToken = createSessionToken(updatedUser.id, updatedUser.username || 'mohammed');

    const res = NextResponse.json({
      success: true,
      message: 'Password updated successfully!',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        username: updatedUser.username,
        email: updatedUser.email,
      },
    });

    res.cookies.set(AUTH_COOKIE_NAME, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return res;
  } catch (error: any) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update password' },
      { status: 500 }
    );
  }
}
