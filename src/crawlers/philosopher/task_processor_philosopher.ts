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
    return "";
  }

  return getMainTitle(doc) ?? "";
}
