// see: https://www.typescriptlang.org/docs/handbook/esm-node.html for this syntax
import jsdom = require("jsdom");

const INITIAL_URL = "https://en.wikipedia.org/wiki/Socrates";
const { JSDOM } = jsdom;

enum NodeType {
    TEXT = 3
}

enum NodeName {
    UL = "UL",
    H2 = "H2"
}

async function parseWikiPage(url: string) {
    const { window: { document } } = await JSDOM.fromURL(url);

    // navigate to wikiquote page
    const wikiquoteAnchor = (document.querySelector('[href*="wikiquote"]') as HTMLAnchorElement | null)?.href;

    if (wikiquoteAnchor) {
        const dom = await JSDOM.fromURL(wikiquoteAnchor);
        const name = (dom.window.document.querySelector('.mw-page-title-main') as HTMLElement | null)?.textContent;

        // start at element after h2 "Quotes" heading
        const next = dom.window.document.querySelector("#Quotes")?.parentElement?.nextElementSibling ?? null;
        const quotes = findQuoteNodes(next);
    }
}

function findQuoteNodes(next: Element | null): string[] {
    const quotes: string[] = [];

    // iterate through siblings til next h2 is encountered
    while (next && next.nodeName !== NodeName.H2) {
        if (next.nodeName === NodeName.UL) {
            const li = next.firstChild;

            if (li) {
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

    if (!nodeList.length) {
        return text;
    }

    for (const node of nodeList) {
        if (node.textContent) {
            const trimmedText = node.textContent.trim();

            if (!text) {
                // beginning of text
                text += trimmedText;
            } else if ([".",",",";","?","!",":","-","\u2014"].some(punc => punc === trimmedText[0])) {
                // textNode begins with punctuation 
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

parseWikiPage(INITIAL_URL);
