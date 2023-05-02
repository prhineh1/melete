import { join } from "path";
import { cwd } from "process";
import WorkerPool, { Entity, createCsv, createMapping } from "../../utils.js";
import { Quote } from "./task_processor_quote.js";

export default async function quote(
  links: string[],
  pool: WorkerPool,
  entity: Entity
): Promise<boolean> {
  try {
    console.log("Creating quote.csv and related items...");

    const unfullfilled: Promise<Quote[]>[] = links.map((link) => {
      return new Promise((resolve, reject) => {
        pool.runTask(link, entity, (err, result) => {
          if (result) {
            resolve(result as Quote[]);
          } else {
            reject(err);
          }
        });
      });
    });

    const settled = await Promise.allSettled(unfullfilled);
    const quotes = settled
      .map((res) => {
        if (res.status === "fulfilled") {
          return res.value;
        }
      })
      .flat()
      .filter((resp) => resp)
      .map((quote, idx) => ({ id: idx, ...quote }));

    const quoteIdtoEra = quotes
      .filter((quote) => quote.eras?.length)
      .map((quote) => `[${quote?.id},[${quote?.eras}]]`)
      .join(",");

    await createMapping(
      quoteIdtoEra,
      join(cwd(), "/src/generated/quoteID_to_era.ts")
    );

    const data = quotes
      .map((quote) => `${quote.id},${quote.authorId},${quote.text}`)
      .join("\n");

    createCsv(data, "quote.csv", "id,authorId,text");

    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}
