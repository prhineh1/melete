// see: https://www.typescriptlang.org/docs/handbook/esm-node.html for this syntax
import jsdom = require("jsdom");
import { FileHandle, open, rm } from "node:fs/promises";

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
  await rm(path, { force: true });

  const start = `export default new Map([`;
  const end = `]);`;

  let file = await open(path, "a");
  file.appendFile(`${start}${data}${end}`);
  file.close();
}

export function getMainTitle(doc: Document): string | undefined {
  return doc
    .querySelector(".mw-page-title-main")
    ?.textContent?.replace(/\(.*\)$/, "")
    .trim()
    .toLocaleLowerCase();
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

type QueueNode<T> = {
  val: T;
  next: QueueNode<T> | null;
};

export default class Queue<T> {
  private head: QueueNode<T> | null;
  private tail: QueueNode<T> | null;
  public length: number;

  constructor() {
    this.head = this.tail = null;
    this.length = 0;
  }

  [Symbol.iterator]() {
    let node: QueueNode<T> | null = null;

    return {
      next: () => {
        if (!node && this.head) {
          node = this.head;
          return { value: node.val, done: false };
        }
        if (node?.next) {
          node = node.next;
          return { value: node.val, done: false };
        }
        return { done: true };
      },
    };
  }

  enqueue(val: T) {
    const node = { val, next: null };
    if (!this.tail) {
      this.head = this.tail = node;
    } else {
      const tail = this.tail;
      this.tail = node;
      tail.next = node;
    }

    this.length++;
  }

  deque(): T | null {
    if (!this.head) {
      return null;
    }

    const head = this.head;
    this.head = this.head.next;
    head.next = null;
    this.length--;

    if (!this.length) {
      this.head = this.tail = null;
    }

    return head.val;
  }
}
