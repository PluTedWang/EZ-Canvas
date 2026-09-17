import user from "../fixtures/user.json";
import { db } from "../lib/db";

async function main() {
  await db.user.upsert({
    where: { email: user.email },
    update: user,
    create: user,
  });
  console.log(`Seeded user ${user.email}`);
}

main().finally(() => db.$disconnect());
