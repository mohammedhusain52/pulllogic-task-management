import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Automatically initializes baseline clients, team members, and settings on a fresh database
 */
export async function ensureBaselineData() {
  try {
    const clientCount = await prisma.client.count();
    if (clientCount === 0) {
      await prisma.client.createMany({
        data: [
          {
            name: 'Yanmar',
            description: 'Industrial machinery, diesel engines & agricultural equipment operations.',
            active: true,
          },
          {
            name: 'CNH',
            description: 'Agricultural and construction equipment forecasting & supply chain pipelines.',
            active: true,
          },
          {
            name: 'Zonar',
            description: 'Fleet telematics, GPS tracking, and IoT analytics pipelines.',
            active: true,
          },
        ],
      });
    }

    const teamCount = await prisma.teamMember.count();
    if (teamCount === 0) {
      await prisma.teamMember.createMany({
        data: [
          {
            name: 'Mohammed Husain',
            role: 'Senior Data Scientist · Lead',
            email: 'mohammed@pulllogic.com',
            avatarColor: 'indigo',
            active: true,
          },
          {
            name: 'Anuj Sanklecha',
            role: 'Data & Analytics Engineer',
            email: 'anuj@pulllogic.com',
            avatarColor: 'blue',
            active: true,
          },
          {
            name: 'Bhavish Trehan',
            role: 'ML Ops & Data Engineer',
            email: 'bhavish@pulllogic.com',
            avatarColor: 'emerald',
            active: true,
          },
          {
            name: 'Krishnadas M',
            role: 'Data Pipeline Engineer',
            email: 'krishnadas@pulllogic.com',
            avatarColor: 'purple',
            active: true,
          },
        ],
      });
    }

    const settingCount = await prisma.systemSetting.count();
    if (settingCount === 0) {
      await prisma.systemSetting.createMany({
        data: [
          { key: 'company_name', value: 'Pull Logic' },
          { key: 'follow_up_threshold_days', value: '1' },
          { key: 'timezone', value: 'America/Chicago' },
          { key: 'date_format', value: 'EEEE, d MMMM yyyy' },
        ],
      });
    }
  } catch (err) {
    console.error('Error ensuring baseline data:', err);
  }
}
