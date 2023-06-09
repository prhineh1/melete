import * as jsdom from "jsdom";
import { AsyncResource } from "node:async_hooks";
import EventEmitter from "node:events";
import { writeFile } from "node:fs/promises";
import { Worker } from "node:worker_threads";

const philosopherUrlsLists = [
  "https://en.wikipedia.org/wiki/List_of_philosophers_(A%E2%80%93C)",
  "https://en.wikipedia.org/wiki/List_of_philosophers_(D%E2%80%93H)",
  "https://en.wikipedia.org/wiki/List_of_philosophers_(I%E2%80%93Q)",
  "https://en.wikipedia.org/wiki/List_of_philosophers_(R%E2%80%93Z)",
];

const { JSDOM } = jsdom;

/**
 * collects links from alphabetical List of philosophers page
 */
async function collectLinks(url: string): Promise<string[]> {
  const {
    window: { document },
  } = await JSDOM.fromURL(url);

  let links: string[] = [];
  // first h2 before links begin
  let next = document.querySelector("h2") as Element;

  while (next && next.nextElementSibling) {
    // end of list
    if (next.id === "#toc") {
      return links;
    }
    if (next.nodeName === "UL") {
      const rowLinks = Array.from(next.querySelectorAll("li > a")).map(
        (a) => (a as HTMLAnchorElement).href
      );

      links = [...links, ...rowLinks];
    }
    next = next.nextElementSibling;
  }
  return links;
}

export async function getLinks(): Promise<string[]> {
  let links: string[] = [];

  for (const link of philosopherUrlsLists) {
    links = links.concat(await collectLinks(link));
  }
  return links;
}

export async function createMapping(
  data: string,
  path: string,
  exportName: string
) {
  try {
    const start = `export const ${exportName} = new Map([`;
    const end = `]);`;

    await writeFile(path, `${start}${data}${end}`);
  } catch (e) {
    console.log(e);
    throw new Error("unable to create mapping between entities");
  }
}

export function getMainTitle(doc: Document): string | undefined {
  return doc
    .querySelector(".mw-page-title-main")
    ?.textContent?.replace(/\(.*\)$/, "")
    .trim()
    .toLowerCase();
}

export function createEntityToIdData(data: string[]): string {
  let str = "";

  for (const pair of data) {
    let [id, name] = pair.split(",");
    name = `\"${name}\"`;
    str += `[${name},${id}],`;
  }

  return str;
}

export function getInfoboxAnchors(
  doc: Document,
  type: string[]
): NodeListOf<HTMLAnchorElement> {
  const [eraTh] = Array.from(
    doc.querySelectorAll(".infobox.biography.vcard th.infobox-label")
  ).filter((th) =>
    type.some((t) => t === th.textContent?.trim().toLocaleLowerCase())
  );

  return (
    (eraTh?.parentElement?.querySelectorAll(
      'td a:not([href*="#"])'
    ) as NodeListOf<HTMLAnchorElement>) ?? []
  );
}

/* WORKER POOL IMPLEMENTATION */

// see https://nodejs.org/dist/latest-v18.x/docs/api/worker_threads.html#worker-threads
const kTaskInfo = Symbol("kTaskInfo");
const kWorkerFreedEvent = Symbol("kWorkerFreedEvent");

interface WorkerPlus extends Worker {
  [kTaskInfo]: WorkerPoolTaskInfo | null;
}

class WorkerPoolTaskInfo extends AsyncResource {
  private callback: (err: Error | null, result: unknown | null) => void;

  constructor(callback: (err: Error | null, result: unknown | null) => void) {
    super("WorkerPoolTaskInfo");
    this.callback = callback;
  }

  done(err: Error | null, result: unknown | null) {
    this.runInAsyncScope(this.callback, null, err, result);
    this.emitDestroy(); // `TaskInfo`s are used only once.
  }
}

export default class WorkerPool extends EventEmitter {
  private numThreads: number;
  private workers: WorkerPlus[];
  private freeWorkers: WorkerPlus[];
  private tasks: {
    task: string;
    entity: Entity;
    callback: (err: Error | null, result: unknown | null) => void;
  }[];
  private scriptPath: string;

  constructor(numThreads: number, scriptPath: string) {
    super();
    this.numThreads = numThreads;
    this.workers = [];
    this.freeWorkers = [];
    this.tasks = [];
    this.scriptPath = scriptPath;

    for (let i = 0; i < this.numThreads; i++) this.addNewWorker();

    // Any time the kWorkerFreedEvent is emitted, dispatch
    // the next task pending in the queue, if any.
    this.on(kWorkerFreedEvent, () => {
      if (this.tasks.length > 0) {
        const { task, entity, callback } = this.tasks.shift()!;
        this.runTask(task, entity, callback);
      }
    });
  }

  addNewWorker() {
    const worker = new Worker(
      new URL(this.scriptPath, import.meta.url)
    ) as WorkerPlus;
    worker.on("message", (result: unknown) => {
      // In case of success: Call the callback that was passed to `runTask`,
      // remove the `TaskInfo` associated with the Worker, and mark it as free
      // again.
      if (worker[kTaskInfo]) {
        worker[kTaskInfo].done(null, result);
      }
      worker[kTaskInfo] = null;
      this.freeWorkers.push(worker);
      this.emit(kWorkerFreedEvent);
    });
    worker.on("error", (err) => {
      // In case of an uncaught exception: Call the callback that was passed to
      // `runTask` with the error.
      if (worker[kTaskInfo]) worker[kTaskInfo].done(err, null);
      else this.emit("error", err);
      // Remove the worker from the list and start a new Worker to replace the
      // current one.
      this.workers.splice(this.workers.indexOf(worker), 1);
      this.addNewWorker();
    });
    this.workers.push(worker);
    this.freeWorkers.push(worker);
    this.emit(kWorkerFreedEvent);
  }

  runTask(
    task: string,
    entity: Entity,
    callback: (err: Error | null, result: unknown) => void
  ) {
    if (this.freeWorkers.length === 0) {
      // No free threads, wait until a worker thread becomes free.
      this.tasks.push({ task, entity, callback });
      return;
    }

    const worker = this.freeWorkers.pop();
    if (worker) {
      worker[kTaskInfo] = new WorkerPoolTaskInfo(callback);
      worker.postMessage({ task, entity });
    }
  }

  close() {
    for (const worker of this.workers) worker.terminate();
  }
}

export async function createSeedFile(
  data: string,
  path: string,
  exportName: string
) {
  try {
    const start = `export const ${exportName} =`;
    await writeFile(path, `${start}${data};`);
  } catch {
    throw new Error("unable to create file");
  }
}

export enum Entity {
  PHILOSOPHER = "philosopher",
  ERA = "era",
  QUOTE = "quote",
  SCHOOL = "school",
}
