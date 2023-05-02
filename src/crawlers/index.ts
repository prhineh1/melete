import WorkerPool, { Entity, getLinks } from "../utils.js";
import os from "node:os";
import philosopher from "./philosopher/index.js";
import era from "./era/index.js";
import quote from "./quote/index.js";

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
  console.log("era finished");
  console.timeLog("quick");
  const quoteFinished = await quote(links, pool, Entity.QUOTE);

  if (eraFinished && quoteFinished) {
    pool.close();
    console.log("all done");
    console.timeEnd("quick");
  }
}
