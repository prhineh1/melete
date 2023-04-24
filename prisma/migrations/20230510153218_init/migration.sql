-- CreateTable
CREATE TABLE "Philosopher" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Philosopher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" INTEGER NOT NULL,
    "authorId" INTEGER,
    "text" TEXT NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Era" (
    "id" INTEGER NOT NULL,
    "era" TEXT NOT NULL,

    CONSTRAINT "Era_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhilosopherEra" (
    "philosopherId" INTEGER NOT NULL,
    "eraId" INTEGER NOT NULL,

    CONSTRAINT "PhilosopherEra_pkey" PRIMARY KEY ("philosopherId","eraId")
);

-- CreateTable
CREATE TABLE "QuoteEra" (
    "quoteId" INTEGER NOT NULL,
    "eraId" INTEGER NOT NULL,

    CONSTRAINT "QuoteEra_pkey" PRIMARY KEY ("quoteId","eraId")
);

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Philosopher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhilosopherEra" ADD CONSTRAINT "PhilosopherEra_philosopherId_fkey" FOREIGN KEY ("philosopherId") REFERENCES "Philosopher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhilosopherEra" ADD CONSTRAINT "PhilosopherEra_eraId_fkey" FOREIGN KEY ("eraId") REFERENCES "Era"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteEra" ADD CONSTRAINT "QuoteEra_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteEra" ADD CONSTRAINT "QuoteEra_eraId_fkey" FOREIGN KEY ("eraId") REFERENCES "Era"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS tsm_system_rows;

-- CreateView
CREATE OR REPLACE VIEW randomquote AS 
    SELECT q.text, p.name, e.era FROM "Quote" q TABLESAMPLE system_rows(1)
      LEFT JOIN "Philosopher" p ON q."authorId"=p.id
      LEFT JOIN "QuoteEra" qe on q.id=qe."quoteId"
      LEFT JOIN "Era" e on qe."eraId"=e.id;
