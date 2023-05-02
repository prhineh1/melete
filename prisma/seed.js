import { PrismaClient } from '@prisma/client';
import { join } from 'path';
import { cwd } from 'process';
const prisma = new PrismaClient();

const file = join(cwd(), 'philosopher.csv')
const philosopherSeed = await prisma.$executeRawUnsafe(`
    COPY "Philosopher"(id, name)
    FROM /Users/prhineh1/Documents/Code/melete/philosopher.csv
    DELIMITER ','
    CSV HEADER;   
`)