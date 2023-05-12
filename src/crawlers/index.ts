import WorkerPool, { Entity, getLinks } from "../utils.js";
import os from "node:os";
import philosopher from "./philosopher/index.js";
import era from "./era/index.js";
import quote from "./quote/index.js";
import createBridges from "../bridges/index.js";

const pool = new WorkerPool(
  os.availableParallelism(),
  "crawlers/task_processor.js"
);

// fetch wikipedia links
const links = await getLinks();

const philosopherFinished = await philosopher(links, pool, Entity.PHILOSOPHER);
console.log("philosopher finished");

if (philosopherFinished) {
  const eraFinished = await era(links, pool, Entity.ERA);
  console.log("era finished");
  const quoteFinished = await quote(links, pool, Entity.QUOTE);

  if (eraFinished && quoteFinished) {
    pool.close();
    createBridges();
  }
}
