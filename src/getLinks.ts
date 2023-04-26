// see: https://www.typescriptlang.org/docs/handbook/esm-node.html for this syntax
import jsdom = require("jsdom");
import { open } from "node:fs/promises";

const philosopherUrls = [
  "https://en.wikipedia.org/wiki/List_of_philosophers_(A%E2%80%93C)",
  "https://en.wikipedia.org/wiki/List_of_philosophers_(D%E2%80%93H)",
  "https://en.wikipedia.org/wiki/List_of_philosophers_(I%E2%80%93Q)",
  "https://en.wikipedia.org/wiki/List_of_philosophers_(R%E2%80%93Z)",
];

const { JSDOM } = jsdom;

/**
 *
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

export default async function getLinks(): Promise<string[]> {
  let links: string[] = [];

  for (const link of philosopherUrls) {
    links = links.concat(await collectLinks(link));
  }
  return links;
}
