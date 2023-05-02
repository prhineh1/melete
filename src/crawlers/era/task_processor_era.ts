import jsdom = require("jsdom");
import { getEraAnchors, getMainTitle } from "../../utils.js";
import { eraResult } from "./index.js";
import phil_to_id from "../../generated/phil_to_id.js";

const { JSDOM } = jsdom;

export async function getEraData(link: string): Promise<eraResult> {
  let doc;
  const duplicates = []; // for csv data
  let mappingData: eraResult["philToEra"];

  try {
    const {
      window: { document },
    } = await JSDOM.fromURL(link);
    doc = document;
  } catch (err) {
    throw new Error(`Can't load page: ${link}`, { cause: err });
  }

  let name = getMainTitle(doc);
  const eraAnchors = getEraAnchors(doc);

  const eras: Set<string> = new Set<string>();
  for (const anchor of eraAnchors) {
    try {
      const dom = await JSDOM.fromURL(anchor.href);
      const era = getMainTitle(dom.window.document);
      if (era) {
        duplicates.push(era);
        eras.add(era);
      }
    } catch {
      throw new Error(`Can't load page: ${link}`);
    }
  }

  if (name && eras.size) {
    const philId = phil_to_id.get(name);
    if (philId) {
      mappingData = [philId, [...eras]];
    }
  }

  const res = {
    era: duplicates,
    philToEra: mappingData,
  };

  return res;
}
