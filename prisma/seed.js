import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const dockerSeedPath = "/media/seeds/"

const { philosopher } = await import("./seeds/philosopher.js");
await prisma.philosopher.createMany({
    data: philosopher 
})

const { era } = await import("./seeds/era.js");
await prisma.era.createMany({
    data: era
})

const { quote } = await import("./seeds/quote.js");
await prisma.quote.createMany({
    data: quote
})

const { philosopherEra } = await import("./seeds/philosopherEra.js");
await prisma.philosopherEra.createMany({
    data: philosopherEra
})

const { quoteEra } = await import("./seeds/quoteEra.js");
await prisma.quoteEra.createMany({
    data: quoteEra
})