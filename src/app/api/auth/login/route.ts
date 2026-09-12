import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword, createSessionToken, AUTH_COOKIE_NAME, hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();

    // Find user by username or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: cleanUsername },
          { email: cleanUsername },
        ],
      },
    });

    // Fallback: If no user in database, create the default user
    if (!user) {
      if (cleanUsername === 'mohammed' || cleanUsername === 'mohammed@pulllogic.com') {
        const { hash, salt } = hashPassword('Hasan*58');
        user = await prisma.user.create({
          data: {
            username: 'mohammed',
            name: 'Mohammed Husain',
            role: 'Senior Data Scientist',
            organization: 'Pull Logic',
            email: 'mohammed@pulllogic.com',
            passwordHash: hash,
            passwordSalt: salt,
            avatar: 'MH',
          },
        });
      } else {
        return NextResponse.json(
          { error: 'Invalid username or password' },
          { status: 401 }
        );
      }
    }

    // Verify password
    if (!user.passwordHash || !user.passwordSalt) {
      // If user has no password set, initialize it if it matches Hasan*58
      if (password === 'Hasan*58') {
        const { hash, salt } = hashPassword(password);
        user = await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash: hash, passwordSalt: salt },
        });
      } else {
        return NextResponse.json(
          { error: 'Invalid username or password' },
          { status: 401 }
        );
      }
    } else {
      const isValid = verifyPassword(password, user.passwordHash, user.passwordSalt);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid username or password' },
          { status: 401 }
        );
      }
    }

    // Create session token
    const token = createSessionToken(user.id, user.username);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        organization: user.organization,
        avatar: user.avatar || 'MH',
      },
    });

    // Set HTTP-Only Cookie
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error during login' }, { status: 500 });
  }
}
