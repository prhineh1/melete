// see: https://www.typescriptlang.org/docs/handbook/esm-node.html for this syntax
import jsdom = require("jsdom");
import { AsyncResource } from "node:async_hooks";
import EventEmitter from "node:events";
import { FileHandle, open, rm } from "node:fs/promises";
import { join } from "node:path";
import { cwd } from "node:process";
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
      let rowLinks = Array.from(next.querySelectorAll("li > a")).map(
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

/**
 * opens file at "path" if it exists
 * create if it doesn't exist
 * add csv headers if they don't exist
 */
export async function getFile(
  path: string,
  headers: string
): Promise<FileHandle> {
  await rm(path, { force: true });

  let file = await open(path, "a+");
  const firstLine = (await file.readLines()[Symbol.asyncIterator]().next())
    .value;

  // if file has content, return as is
  if (firstLine) {
    file.close();
    return open(path, "a");
  }

  // otherwise append header and return
  file = await open(path, "a");
  await file.appendFile(`${headers}\n`);
  return file;
}

export async function createMapping(data: string, path: string) {
  try {
    await rm(path, { force: true });

    const start = `export default new Map([`;
    const end = `]);`;

    let file = await open(path, "a");
    file.appendFile(`${start}${data}${end}`);
    file.close();
  } catch {
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

export function getEraAnchors(doc: Document): NodeListOf<HTMLAnchorElement> {
  const [eraTh] = Array.from(
    doc.querySelectorAll(".infobox.biography.vcard th.infobox-label")
  ).filter((th) => th.textContent?.trim().toLocaleLowerCase() === "era");

  return (
    (eraTh?.parentElement?.querySelectorAll(
      'a:not([href*="#"])'
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
  private mutex: Mutex;

  constructor(numThreads: number, scriptPath: string) {
    super();
    this.numThreads = numThreads;
    this.workers = [];
    this.freeWorkers = [];
    this.tasks = [];
    this.scriptPath = scriptPath;
    this.mutex = new Mutex();

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
      worker.postMessage({ task, entity, mutex: this.mutex });
    }
  }

  close() {
    for (const worker of this.workers) worker.terminate();
  }
}

export async function createCsv(data: string, path: string, headers: string) {
  try {
    const csv = await getFile(join(cwd(), path), headers);
    await csv.appendFile(data);
    await csv.close();
  } catch {
    throw new Error("unable to create csv");
  }
}

export enum Entity {
  PHILOSOPHER = "philosopher",
  ERA = "era",
}

export class Mutex {
  private view: Int32Array;
  private buffer: SharedArrayBuffer;
  private readonly Status = {
    LOCKED: 1,
    UNLOCKED: 0,
  };

  constructor(buf?: SharedArrayBuffer) {
    this.buffer = buf ?? new SharedArrayBuffer(4);
    this.view = new Int32Array(this.buffer);
  }

  connect() {
    return new Mutex(this.buffer);
  }

  lock() {
    if (
      Atomics.compareExchange(
        this.view,
        0,
        this.Status.UNLOCKED,
        this.Status.LOCKED
      ) === this.Status.LOCKED
    ) {
      Atomics.wait(this.view, 0, this.Status.LOCKED);
    }
  }

  unlock() {
    if (
      Atomics.compareExchange(
        this.view,
        0,
        this.Status.LOCKED,
        this.Status.UNLOCKED
      ) !== this.Status.LOCKED
    ) {
      throw new Error("Mutex is an inconsistent state");
    }
    Atomics.notify(this.view, 0, 1);
  }
}
