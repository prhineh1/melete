import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DIRECT_URL
        }
    }
});

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

const { school } = await import("./seeds/school.js");
await prisma.school.createMany({
    data: school
})

const { philosopherEra } = await import("./seeds/philosopherEra.js");
await prisma.philosopherEra.createMany({
    data: philosopherEra
})

const { quoteEra } = await import("./seeds/quoteEra.js");
await prisma.quoteEra.createMany({
    data: quoteEra
})

const { philosopherSchool } = await import("./seeds/philosopherSchool.js");
await prisma.philosopherSchool.createMany({
    data: philosopherSchool
})
