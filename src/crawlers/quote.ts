// see: https://www.typescriptlang.org/docs/handbook/esm-node.html for this syntax
import jsdom = require("jsdom");
import { getLinks, getFile } from "../utils.js";
import { join } from "node:path";
import { cwd } from "node:process";
import philToId from "../generated/philToId.js";
import { rm } from "node:fs/promises";

const { JSDOM } = jsdom;

enum NodeName {
  UL = "UL",
  H2 = "H2",
  LI = "LI",
}

let id = 1; // id for Quotes table

async function appendToCsv(quotes: string[], author: string = "") {
  const csv = await getFile(
    join(cwd(), "quote.csv"),
    "quoteId,philosopherId,text",
    true
  );

  const mappedId = philToId.get(author);
  const data = quotes.map((quote) => `${id++},${mappedId},${quote}`).join("\n");
  await csv.appendFile(data);
  await csv.close();
}

async function parseWikipediaPage(url: string): Promise<string> {
  let doc: Document;

  try {
    const {
      window: { document },
    } = await JSDOM.fromURL(url);
    doc = document;
  } catch (err) {
    console.error("can't load page: " + url);
    return "unknown";
  }

  const name =
    (
      doc.querySelector(".mw-page-title-main") as HTMLElement | null
    )?.textContent
      ?.replace(/\(.*\)$/, "")
      .trim()
      .toLocaleLowerCase() ?? "unkown";

  return name;
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

  // start at element after h2 "Quotes" heading
  const next =
    doc.querySelector("#Quotes")?.parentElement?.nextElementSibling ?? null;
  const quotes = findQuoteNodes(next);
  const name = await parseWikipediaPage(url.replace("wikiquote", "wikipedia"));

  await appendToCsv(quotes, name);
}

function findQuoteNodes(next: Element | null): string[] {
  const quotes: string[] = [];

  // iterate through siblings til next h2 is encountered
  while (next && next.nodeName !== NodeName.H2) {
    if (next.nodeName === NodeName.UL) {
      let li = next.firstChild;

      // usually only one li per ul, but there may be more
      while (li?.nodeName === NodeName.LI) {
        if (li && li.childNodes.length) {
          const quote = getTextContent([...li.childNodes]);
          quotes.push(quote.trim());
        }
      }
      li = next.nextElementSibling;
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

// delete old file
await rm(join(cwd(), "quote.csv"), { force: true });
const quotePages = await getLinks();

for (const link of quotePages) {
  await parseWikiquotePage(link.replace("wikipedia", "wikiquote"));
}
