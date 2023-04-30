import WorkerPool, { Entity, getLinks } from "../utils.js";
import os from "node:os";
import philosopher from "./philosopher/index.js";
import era from "./era/index.js";

console.time("quick");
const pool = new WorkerPool(
  os.availableParallelism(),
  "crawlers/task_processor.js"
);

// fetch wikipedia links
const links = await getLinks();

const philosopherFinished = await philosopher(links, pool, Entity.PHILOSOPHER);
console.timeLog("quick");

if (philosopherFinished) {
  const eraFinished = await era(links, pool, Entity.ERA);

  if (eraFinished) {
    pool.close();
    console.log("all done");
    console.timeEnd("quick");
  }
}
