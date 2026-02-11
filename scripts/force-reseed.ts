

import "dotenv/config";
import { prisma } from "../lib/db/prisma";
import { DEFAULT_PROMPTS } from "../lib/ai/default-prompts";

// const prisma = new PrismaClient(); // Removed


async function main() {
    console.log("Starting forced prompt re-seed...");

    // 1. Delete all existing prompts
    console.log("Deleting all records from AIPrompt...");
    const deleteResult = await prisma.aIPrompt.deleteMany({});
    console.log(`Deleted ${deleteResult.count} records.`);

    // 2. Insert updated defaults
    console.log(`Inserting ${DEFAULT_PROMPTS.length} new prompts...`);

    for (const p of DEFAULT_PROMPTS) {
        await prisma.aIPrompt.create({
            data: {
                key: p.key,
                name: p.name,
                description: p.description,
                category: p.category,
                prompt: p.prompt,
                systemPrompt: p.systemPrompt,
                variables: p.variables.join(","), // Array to string
                isActive: true,
            }
        });
        console.log(`- Inserted: ${p.key}`);
    }

    console.log("Re-seed complete. Database now matches code.");
}

main()
    .catch((e) => {
        console.error("Error during re-seed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
