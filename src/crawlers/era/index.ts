import { join } from "path";
import { cwd } from "process";
import WorkerPool, {
  Entity,
  createCsv,
  createEntityToIdData,
  createMapping,
} from "../../utils.js";

export type eraResult = {
  era: string[];
  philToEra?: [number, string[]];
  eraToEra?: string[];
};

export default async function era(
  links: string[],
  pool: WorkerPool,
  entity: Entity
): Promise<boolean> {
  try {
    console.log("Creating era.csv and related items...");

    const unfullfilled: Promise<eraResult>[] = links.map((link) => {
      return new Promise((resolve, reject) => {
        pool.runTask(link, entity, (err, result) => {
          if (result) {
            resolve(result as eraResult);
          } else {
            reject(err);
          }
        });
      });
    });

    const settled = await Promise.allSettled(unfullfilled);
    const erasWithDups = settled
      .map((res) => {
        if (res.status === "fulfilled") {
          return res.value.era;
        }
      })
      .flat()
      .filter((resp) => resp !== undefined && Object.keys(resp).length);
    const csvData = [...new Set(erasWithDups)].map(
      (val, idx) => `${idx + 1},${val}`
    );

    const philToEra = settled
      .map((res) => {
        if (res.status === "fulfilled") {
          return JSON.stringify(res.value.philToEra);
        }
      })
      .filter((res) => res !== undefined)
      .join(",");

    const eraToEra = settled
      .map((res) => {
        if (res.status === "fulfilled") {
          return res.value.eraToEra;
        }
      })
      .flat()
      .filter((res) => res);

    await createMapping(
      philToEra,
      join(cwd(), "/src/generated/philId_to_era.js")
    );
    await createMapping(
      [...new Set(eraToEra)].join(","),
      join(cwd(), "src/generated/era_to_era.js")
    );
    await createMapping(
      createEntityToIdData(csvData),
      join(cwd(), "/src/generated/era_to_id.js")
    );
    await createCsv(csvData.join("\n"), "era.csv", "id,era");

    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}
