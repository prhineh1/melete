import os from "node:os";
import WorkerPool, {
  createCsv,
  createEntityToIdData,
  createMapping,
  getLinks,
} from "../../utils.js";
import { join } from "node:path";
import { cwd } from "node:process";

const pool = new WorkerPool(
  os.availableParallelism(),
  "crawlers/philosopher/task_processor.js"
);
const links = await getLinks();

const unfullfilled: Promise<string>[] = links.map((link) => {
  return new Promise((resolve, reject) => {
    pool.runTask(link, (err, result) => {
      if (result) {
        resolve(result as string);
      } else {
        reject(err);
      }
    });
  });
});

const settled = await Promise.allSettled(unfullfilled);
pool.close();
const fulfilled = settled
  .filter((res) => res.status === "fulfilled")
  .map((res, idx) => {
    if (res.status === "fulfilled") {
      return `${idx + 1},${res.value!}`;
    }
    return "";
  });

createMapping(
  createEntityToIdData(fulfilled),
  join(cwd(), "/src/generated/philToId.ts")
);

createCsv(fulfilled.join("\n"), "philosopher.csv", "id,name");
