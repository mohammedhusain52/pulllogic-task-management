import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Clearing all tasks, workflows, bugs, issues, features, logs & time entries...');

  // 1. Delete all operational work items, workflows, tasks, logs, and attachments
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.timeEntry.deleteMany();
  await prisma.task.deleteMany();
  await prisma.taskTemplate.deleteMany();
  await prisma.workflowStage.deleteMany();
  await prisma.workflowRun.deleteMany();
  await prisma.workflowTemplate.deleteMany();
  await prisma.client.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemSetting.deleteMany();

  // 2. Primary User Profile: Mohammed Husain (Credentials: mohammed / Hasan*58)
  const { hash, salt } = hashPassword('Hasan*58');

  await prisma.user.create({
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

  // 3. Team Members (4): Self (Mohammed Husain), Anuj Sanklecha, Bhavish Trehan, Krishnadas M
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

  // 4. Exactly 3 Clients: Yanmar, CNH, Zonar
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

  // 5. System Settings
  await prisma.systemSetting.createMany({
    data: [
      { key: 'company_name', value: 'Pull Logic' },
      { key: 'follow_up_threshold_days', value: '1' },
      { key: 'timezone', value: 'America/Chicago' },
      { key: 'date_format', value: 'EEEE, d MMMM yyyy' },
    ],
  });

  console.log('✅ All tasks, workflows, bugs, issues & features deleted successfully!');
  console.log('👤 User: Mohammed Husain (Senior Data Scientist)');
  console.log('👥 Team Members (4): Mohammed Husain, Anuj Sanklecha, Bhavish Trehan, Krishnadas M');
  console.log('🏢 Clients (3): Yanmar, CNH, Zonar');
}

main()
  .catch((e) => {
    console.error('❌ Database reset error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
