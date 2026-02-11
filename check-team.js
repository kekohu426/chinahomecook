const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const data = await prisma.teamMember.findMany();
  console.log('TeamMember 记录数:', data.length);
  if (data.length > 0) {
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log('表中没有数据');
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
