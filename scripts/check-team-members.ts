
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const count = await prisma.teamMember.count();
        console.log(`Total Team Members: ${count}`);

        if (count > 0) {
            const members = await prisma.teamMember.findMany();
            console.log('Team Members Data:');
            console.log(JSON.stringify(members, null, 2));
        } else {
            console.log('No team members found.');
        }
    } catch (error) {
        console.error('Error fetching team members:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
