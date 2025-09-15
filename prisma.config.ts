// prisma.config.ts
import { defineConfig } from 'prisma/config';
import path from 'path';
import 'dotenv/config';  // optional, if you want environment vars loaded

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),

  migrations: {
    path: path.join('prisma', 'migrations'),
    // If you want seed, put it inside migrations as `seed`
    seed: 'ts-node prisma/seedChallenges.ts'
  }
});
