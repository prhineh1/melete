import WorkerPool, { Entity, getLinks } from "./utils.js";
import os from "node:os";
import philosopher from "./philosopher/index.js";
import era from "./era/index.js";
import quote from "./quote/index.js";
import createBridges from "../bridges/index.js";
import { mkdir, statfs } from "node:fs/promises";
import { join } from "node:path";
import { cwd } from "node:process";

// create prisma/seeds and src/generated if necessary
statfs(join(cwd(), "/prisma/seeds")).catch(async () => {
  await mkdir(join(cwd(), "/prisma/seeds"));
});

statfs(join(cwd(), "/src/generated")).catch(async () => {
  await mkdir(join(cwd(), "/src/generated"));
});

const pool = new WorkerPool(os.availableParallelism(), "task_processor.js");

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
    console.log("crawl finished");
  }
}
