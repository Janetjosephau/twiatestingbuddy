const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const configs = await prisma.lLMConfig.findMany();
  console.log('LLM Configs Count:', configs.length);
  console.log('Configs:', JSON.stringify(configs, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
