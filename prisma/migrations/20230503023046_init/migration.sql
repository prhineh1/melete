-- CreateTable
CREATE TABLE "Philosopher" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Philosopher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" INTEGER NOT NULL,
    "authorid" INTEGER,
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
    "philosopherid" INTEGER NOT NULL,
    "eraid" INTEGER NOT NULL,

    CONSTRAINT "PhilosopherEra_pkey" PRIMARY KEY ("philosopherid","eraid")
);

-- CreateTable
CREATE TABLE "QuoteEra" (
    "quoteid" INTEGER NOT NULL,
    "eraid" INTEGER NOT NULL,

    CONSTRAINT "QuoteEra_pkey" PRIMARY KEY ("quoteid","eraid")
);
