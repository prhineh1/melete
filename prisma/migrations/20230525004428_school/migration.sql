-- CreateTable
CREATE TABLE "School" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhilosopherSchool" (
    "philosopherId" INTEGER NOT NULL,
    "schoolId" INTEGER NOT NULL,

    CONSTRAINT "PhilosopherSchool_pkey" PRIMARY KEY ("philosopherId","schoolId")
);

-- AddForeignKey
ALTER TABLE "PhilosopherSchool" ADD CONSTRAINT "PhilosopherSchool_philosopherId_fkey" FOREIGN KEY ("philosopherId") REFERENCES "Philosopher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhilosopherSchool" ADD CONSTRAINT "PhilosopherSchool_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
