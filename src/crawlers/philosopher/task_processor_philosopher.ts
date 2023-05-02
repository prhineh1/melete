import { getMainTitle } from "../../utils.js";
import jsdom = require("jsdom");

const { JSDOM } = jsdom;

export async function getPhilosopherData(link: string): Promise<string> {
  let doc;

  try {
    const {
      window: { document },
    } = await JSDOM.fromURL(link);
    doc = document;
  } catch (err) {
    console.log(`Can't load page: ${link}`);
    throw new Error(`Can't load page: ${link}`, { cause: err });
  }

  const name = getMainTitle(doc);

  if (name) {
    return name;
  } else {
    throw new Error("Unable to parse name.");
  }
}
