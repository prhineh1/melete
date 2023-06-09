import WorkerPool, { Entity, getLinks } from "./utils.js";
import os from "node:os";
import philosopher from "./philosopher/index.js";
import era from "./era/index.js";
import quote from "./quote/index.js";
import school from "./school/index.js";
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

// fetch wikipedia links
const links = await getLinks();

const pool = new WorkerPool(os.availableParallelism(), "task_processor.js");

const filteredLinks = await philosopher(links, pool, Entity.PHILOSOPHER);
console.log("philosopher finished");

if (filteredLinks.length) {
  const schoolFinished = await school(filteredLinks, pool, Entity.SCHOOL);
  const eraFinished = await era(filteredLinks, pool, Entity.ERA);
  console.log("era finished");
  const quoteFinished = await quote(filteredLinks, pool, Entity.QUOTE);

  if (eraFinished && quoteFinished && schoolFinished) {
    pool.close();
    createBridges();
    console.log("crawl finished");
  }
}
