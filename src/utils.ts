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
  headers: string,
  noDelete?: boolean
): Promise<FileHandle> {
  if (!noDelete) {
    await rm(path, { force: true });
  }

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
