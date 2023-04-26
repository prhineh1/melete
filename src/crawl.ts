// see: https://www.typescriptlang.org/docs/handbook/esm-node.html for this syntax
import jsdom = require("jsdom");
import { FileHandle, open } from "node:fs/promises";
import getLinks from "./getLinks.js";

const { JSDOM } = jsdom;

enum NodeName {
  UL = "UL",
  H2 = "H2",
}

let id = 1; // id for Quotes table

/**
 * open "Quotes.csv" exists in root project dir
 * create if it doesn't exist
 * add csv headers if they don't exist
 */
async function getFile(): Promise<FileHandle> {
  let file = await open("../quotes.csv", "a+");
  const firstLine = (await file.readLines()[Symbol.asyncIterator]().next())
    .value;

  // if file has content, return as is
  if (firstLine) {
    file.close();
    return open("../quotes.csv", "a");
  }

  // otherwise append header and return
  file = await open("../quotes.csv", "a");
  await file.appendFile("id,author,text\n");
  return file;
}

async function appendToCsv(quotes: string[], author: string = "") {
  const csv = await getFile();
  const data = quotes.map((quote) => `${id++},${author},${quote}`).join("\n");
  await csv.appendFile(data);
  await csv.close();
}

async function parseWikiquotePage(url: string) {
  let doc: Document;

  try {
    const {
      window: { document },
    } = await JSDOM.fromURL(url);
    doc = document;
  } catch (err) {
    console.error("can't load page: " + url);
    return;
  }

  console.log("parsing quotes from: " + url);

  const name = (
    doc.querySelector(".mw-page-title-main") as HTMLElement | null
  )?.textContent?.trim();

  // start at element after h2 "Quotes" heading
  const next =
    doc.querySelector("#Quotes")?.parentElement?.nextElementSibling ?? null;
  const quotes = findQuoteNodes(next);

  await appendToCsv(quotes, name);
}

function findQuoteNodes(next: Element | null): string[] {
  const quotes: string[] = [];

  // iterate through siblings til next h2 is encountered
  while (next && next.nodeName !== NodeName.H2) {
    if (next.nodeName === NodeName.UL) {
      const li = next.firstChild;

      if (li && li.childNodes.length) {
        const quote = getTextContent([...li.childNodes]);
        quotes.push(quote.trim());
      }
    }
    next = next.nextElementSibling;
  }
  return quotes;
}

function getTextContent(nodeList: ChildNode[], text: string = ""): string {
  nodeList = nodeList.filter((node: ChildNode) => {
    // remove text nodes with null values
    if (!node.textContent) {
      return false;
      // only want text content from top LI element; remove child UL nodes with extraneous content
    } else if (node.nodeName === NodeName.UL) {
      return false;
    }
    return true;
  });

  // base case
  if (!nodeList.length) {
    return text;
  }

  for (const node of nodeList) {
    if (node.textContent) {
      const trimmedText = node.textContent.trim();

      // beginning of text
      if (!text) {
        text += trimmedText;
        // textNode begins with punctuation
      } else if (
        [".", ",", ";", "?", "!", ":", "-", "\u2014"].some(
          (punc) => punc === trimmedText[0]
        )
      ) {
        text += trimmedText;
      } else {
        text += " " + trimmedText;
      }
    }

    // set textContent to null to signal that this node has been processed
    node.textContent = null;
  }

  return getTextContent(nodeList, text);
}

console.time("crawl");

const quotePages = await getLinks();

for (const link of quotePages) {
  await parseWikiquotePage(link.replace("wikipedia", "wikiquote"));
}
console.timeEnd("crawl");
