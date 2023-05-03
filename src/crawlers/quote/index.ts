import { join } from "path";
import { cwd } from "process";
import WorkerPool, {
  Entity,
  createMapping,
  createSeedFile,
} from "../../utils.js";
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
      .map((quote, idx) => ({ id: idx + 1, ...quote }));

    const quoteIdtoEra = quotes
      .filter((quote) => quote.eras?.length)
      .map((quote) => `[${quote?.id},[${quote?.eras}]]`)
      .join(",");

    await createMapping(
      quoteIdtoEra,
      join(cwd(), "/src/generated/quoteID_to_era.js"),
      "quoteIdToEra"
    );

    const data = quotes
      .filter((quote) => quote.id && quote.text)
      .map((quote) => {
        if (quote.authorId) {
          return { id: quote.id, authorId: quote.authorId, text: quote.text };
        }
        return { id: quote.id, text: quote.text };
      });

    createSeedFile(JSON.stringify(data), "prisma/seeds/quote.js", "quote");

    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}
