import { join } from "path";
import { cwd } from "process";
import WorkerPool, {
  Entity,
  createSeedFile,
  createEntityToIdData,
  createMapping,
} from "../utils.js";

export type schoolResult = {
  school: string[];
  philToSchool?: [number, string[]];
};

export default async function school(
  links: string[],
  pool: WorkerPool,
  entity: Entity
): Promise<boolean> {
  try {
    console.log("Creating school seed file and related items...");

    const unfullfilled: Promise<schoolResult>[] = links.map((link) => {
      return new Promise((resolve, reject) => {
        pool.runTask(link, entity, (err, result) => {
          if (result) {
            resolve(result as schoolResult);
          } else {
            reject(err);
          }
        });
      });
    });

    const settled = await Promise.allSettled(unfullfilled);
    const schoolsWithDups = settled
      .map((res) => {
        if (res.status === "fulfilled") {
          return res.value.school;
        }
      })
      .flat()
      .filter((resp): resp is string => Boolean(resp));
    const mappingData = [...new Set(schoolsWithDups)].map(
      (val, idx) => `${idx + 1},${val}`
    );

    const csvData = [...new Set(schoolsWithDups)].map((val, idx) => ({
      id: idx + 1,
      name: val,
    }));

    const philToSchool = settled
      .map((res) => {
        if (res.status === "fulfilled") {
          return JSON.stringify(res.value.philToSchool);
        }
      })
      .filter((res) => res !== undefined)
      .join(",");

    await createMapping(
      philToSchool,
      join(cwd(), "/src/generated/philId_to_school.js"),
      "philIdToSchool"
    );
    await createMapping(
      createEntityToIdData(mappingData),
      join(cwd(), "/src/generated/school_to_id.js"),
      "schoolToId"
    );
    await createSeedFile(
      JSON.stringify(csvData),
      "prisma/seeds/school.js",
      "school"
    );

    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}
