import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const prompts = await prisma.aIPrompt.findMany();
    console.log(`Fetched ${prompts.length} prompts from DB.`);

    const allCount = await prisma.aIPrompt.count();
    console.log(`Total prompts in DB: ${allCount}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
