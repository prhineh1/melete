// see: https://www.typescriptlang.org/docs/handbook/esm-node.html for this syntax
import jsdom = require("jsdom");
import {
  getLinks,
  getFile,
  getMainTitle,
  getEraAnchors,
  createMapping,
} from "../utils.js";
import { join } from "node:path";
import { cwd } from "node:process";
import philToId from "../generated/philToId.js";

const { JSDOM } = jsdom;

enum NodeName {
  UL = "UL",
  H2 = "H2",
  LI = "LI",
}

type Quote = {
  id?: number;
  authorId?: number;
  text: string;
  eras?: string[];
};

async function createCsv(quotes: Quote[]) {
  const csv = await getFile(join(cwd(), "quote.csv"), "id,philosopherId,text");

  const data = quotes
    .map((quote) => `${quote.id},${quote.authorId},${quote.text}`)
    .join("\n");
  await csv.appendFile(data);
  await csv.close();
}

async function getEras(
  eraAnchors: NodeListOf<HTMLAnchorElement>
): Promise<string[]> {
  const eras = [];

  for (const anchor of eraAnchors) {
    try {
      const dom = await JSDOM.fromURL(anchor.href);
      const era = getMainTitle(dom.window.document);
      if (era) {
        eras.push(era);
      }
    } catch {
      console.log("couldn't load: " + anchor.href);
      continue;
    }
  }

  return eras;
}

async function parseWikipediaPage(
  url: string
): Promise<[string | undefined, string[] | undefined]> {
  let doc: Document;

  try {
    const {
      window: { document },
    } = await JSDOM.fromURL(url);
    doc = document;
  } catch (err) {
    console.error("can't load page: " + url);
    return [undefined, undefined];
  }

  const name = getMainTitle(doc);
  const eraAnchors = getEraAnchors(doc);

  return [name, await getEras(eraAnchors)];
}

async function parseWikiquotePage(): Promise<Quote[]> {
  let quoteData: Quote[] = [];
  const links = await getLinks();

  for (const link of links) {
    let doc: Document;

    try {
      const {
        window: { document },
      } = await JSDOM.fromURL(link.replace("wikipedia", "wikiquote"));
      doc = document;
    } catch (err) {
      console.error("can't load page: " + link);
      continue;
    }

    console.log("parsing quotes from: " + link);

    // start at element after h2 "Quotes" heading
    const next =
      doc.querySelector("#Quotes")?.parentElement?.nextElementSibling ?? null;
    const quotes = findQuoteNodes(next);
    const [name, eras] = await parseWikipediaPage(
      link.replace("wikiquote", "wikipedia")
    );

    if (name) {
      const quotesWithAuthor: Quote[] = quotes.map((quote) => ({
        authorId: philToId.get(name),
        text: quote,
        eras,
      }));
      quoteData = quoteData.concat(quotesWithAuthor);
    }
  }
  return quoteData;
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
        li = next.nextElementSibling;
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

async function getQuotes() {
  const data = await parseWikiquotePage();
  const dataWithIds = data.map((quote, idx) => ({ id: idx + 1, ...quote }));
  const forEraMapping = dataWithIds
    .filter((quote) => quote.eras?.length)
    .map((quote) => `[${quote.id},[${quote.eras}]],`)
    .join("\n");
  createMapping(forEraMapping, join(cwd(), "/src/generated/quoteIdtoEra.ts"));
  createCsv(dataWithIds);
}

getQuotes();
