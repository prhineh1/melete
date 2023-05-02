import WorkerPool, {
  Entity,
  createCsv,
  createEntityToIdData,
  createMapping,
} from "../../utils.js";
import { join } from "node:path";
import { cwd } from "node:process";

export default async function philosopher(
  links: string[],
  pool: WorkerPool,
  entity: Entity
): Promise<boolean> {
  try {
    console.log("Creating philosopher.csv and related items...");

    const unfullfilled: Promise<string>[] = links.map((link) => {
      return new Promise((resolve, reject) => {
        pool.runTask(link, entity, (err, result) => {
          if (result) {
            resolve(result as string);
          } else {
            reject(err);
          }
        });
      });
    });

    const settled = await Promise.allSettled(unfullfilled);
    const fulfilled = settled
      .map((res) => {
        if (res.status === "fulfilled") {
          return res.value;
        }
      })
      .filter((val) => val)
      .map((val, idx) => `${idx + 1},${val}`);

    await createMapping(
      createEntityToIdData(fulfilled),
      join(cwd(), "/src/generated/phil_to_id.ts")
    );

    await createCsv(fulfilled.join("\n"), "philosopher.csv", "id,name");
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}
