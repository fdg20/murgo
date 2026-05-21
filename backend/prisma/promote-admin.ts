import 'dotenv/config';
import { createClerkClient } from '@clerk/backend';
import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const ADMIN_EMAIL = (
  process.argv[2] ??
  process.env.ADMIN_EMAIL ??
  'kramdano@gmail.com'
).toLowerCase();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  if (!process.env.CLERK_SECRET_KEY) {
    throw new Error('CLERK_SECRET_KEY is required in backend/.env');
  }

  const clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  });

  const { data } = await clerk.users.getUserList({
    emailAddress: [ADMIN_EMAIL],
  });

  if (!data.length) {
    console.error(
      `\nNo Clerk account found for ${ADMIN_EMAIL}.\n` +
        '1. Create the user in Clerk (or sign up in MurGo / admin panel)\n' +
        '2. Verify the email if required\n' +
        `3. Run: npm run promote-admin -- ${ADMIN_EMAIL}\n`,
    );
    process.exit(1);
  }

  const clerkUser = data[0];

  await clerk.users.updateUserMetadata(clerkUser.id, {
    publicMetadata: { role: UserRole.ADMIN },
  });

  const email =
    clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress ?? ADMIN_EMAIL;

  await prisma.user.upsert({
    where: { email },
    create: {
      clerkId: clerkUser.id,
      email,
      firstName: clerkUser.firstName ?? 'MurGo',
      lastName: clerkUser.lastName ?? 'Admin',
      avatarUrl: clerkUser.imageUrl,
      role: UserRole.ADMIN,
      isActive: true,
    },
    update: {
      clerkId: clerkUser.id,
      role: UserRole.ADMIN,
      isActive: true,
      firstName: clerkUser.firstName ?? undefined,
      lastName: clerkUser.lastName ?? undefined,
      avatarUrl: clerkUser.imageUrl,
    },
  });

  console.log(`\nAdmin access granted for ${email}`);
  console.log('Clerk publicMetadata.role = ADMIN');
  console.log('You can now sign in at the MurGo admin panel.\n');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
