-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_authorid_fkey" FOREIGN KEY ("authorid") REFERENCES "Philosopher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhilosopherEra" ADD CONSTRAINT "PhilosopherEra_philosopherid_fkey" FOREIGN KEY ("philosopherid") REFERENCES "Philosopher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhilosopherEra" ADD CONSTRAINT "PhilosopherEra_eraid_fkey" FOREIGN KEY ("eraid") REFERENCES "Era"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteEra" ADD CONSTRAINT "QuoteEra_quoteid_fkey" FOREIGN KEY ("quoteid") REFERENCES "Quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteEra" ADD CONSTRAINT "QuoteEra_eraid_fkey" FOREIGN KEY ("eraid") REFERENCES "Era"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
