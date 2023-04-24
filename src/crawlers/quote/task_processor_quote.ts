// see: https://www.typescriptlang.org/docs/handbook/esm-node.html for this syntax
import jsdom = require("jsdom");
import { getMainTitle, getEraAnchors } from "../utils.js";

const { JSDOM } = jsdom;

enum NodeName {
  UL = "UL",
  H2 = "H2",
  LI = "LI",
}

export type Quote = {
  id?: number;
  authorId?: number;
  text: string;
  eras?: string[];
};

async function getEras(
  eraAnchors: NodeListOf<HTMLAnchorElement>
): Promise<Set<string>> {
  const eras = new Set<string>();

  for (const anchor of eraAnchors) {
    try {
      const {
        window: { document },
      } = await JSDOM.fromURL(anchor.href);
      const era = getMainTitle(document);
      if (era) {
        eras.add(era);
      }
    } catch {
      continue;
    }
  }

  return eras;
}

async function parseWikipediaPage(
  url: string
): Promise<[string | undefined, Set<string> | undefined]> {
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

async function parseWikiquotePage(link: string): Promise<Quote[]> {
  let doc: Document;
  //@ts-ignore
  const { philToId } = await import("../../generated/phil_to_id.js");

  try {
    const {
      window: { document },
    } = await JSDOM.fromURL(link.replace("wikipedia", "wikiquote"));
    doc = document;
  } catch (err) {
    return [];
  }

  // start at element after h2 "Quotes" heading
  const next =
    doc.querySelector("#Quotes")?.parentElement?.nextElementSibling ?? null;
  const quotes = findQuoteNodes(next);
  const [name, eras] = await parseWikipediaPage(
    link.replace("wikiquote", "wikipedia")
  );

  const quotesWithAuthor: Quote[] = quotes.map((quote) => ({
    authorId: philToId.get(name ?? ""),
    text: quote,
    eras: [...(eras ?? [])].map((era) => `\"${era}\"`),
  }));

  return quotesWithAuthor;
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
          quotes.push(quote.trim().replaceAll("\n", " "));
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

export async function getQuoteData(link: string): Promise<Quote[]> {
  return parseWikiquotePage(link);
}
