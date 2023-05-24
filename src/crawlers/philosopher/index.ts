import WorkerPool, {
  Entity,
  createSeedFile,
  createEntityToIdData,
  createMapping,
} from "../utils.js";
import { join } from "node:path";
import { cwd } from "node:process";
import { Philosopher } from "./task_processor_philosopher.js";

export default async function philosopher(
  links: string[],
  pool: WorkerPool,
  entity: Entity
): Promise<string[]> {
  try {
    console.log("Creating philosopher seed file and related items...");

    const unfullfilled: Promise<[Philosopher, string] | null>[] = links.map(
      (link) => {
        return new Promise((resolve, reject) => {
          pool.runTask(link, entity, (err, result) => {
            if (result) {
              resolve(result as [Philosopher, string] | null);
            } else {
              reject(err);
            }
          });
        });
      }
    );

    const settled = await Promise.allSettled(unfullfilled);
    const fulfilled = settled
      .map((res) => {
        if (res.status === "fulfilled") {
          return res.value;
        }
      })
      .filter((val): val is [Philosopher, string] => Boolean(val));

    const mappingData = fulfilled.map(
      (val, idx) => `${idx + 1},${val[0].name}`
    );
    const csvData = fulfilled.map((val, idx) => ({
      id: idx + 1,
      name: val[0].name,
    }));
    const filteredLinks = fulfilled.map((val) => val?.[1]!);

    await createMapping(
      createEntityToIdData(mappingData),
      join(cwd(), "/src/generated/phil_to_id.js"),
      "philToId"
    );

    await createSeedFile(
      JSON.stringify(csvData),
      "prisma/seeds/philosopher.js",
      "philosopher"
    );
    return filteredLinks;
  } catch (err) {
    console.error(err);
    return [];
  }
}
