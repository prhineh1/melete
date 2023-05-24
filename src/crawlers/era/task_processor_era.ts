import jsdom = require("jsdom");
import { getInfoboxAnchors, getMainTitle } from "../utils.js";
import { eraResult } from "./index.js";

const { JSDOM } = jsdom;

export async function getEraData(link: string): Promise<eraResult> {
  let doc;
  const duplicates = []; // for csv data
  let mappingData: eraResult["philToEra"];
  //@ts-ignore
  const { philToId } = await import("../../generated/phil_to_id.js");

  try {
    const {
      window: { document },
    } = await JSDOM.fromURL(link);
    doc = document;
  } catch (err) {
    return {} as eraResult;
  }

  let name = getMainTitle(doc);
  const eraAnchors = getInfoboxAnchors(doc, ["era"]);

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
      return {} as eraResult;
    }
  }

  if (name && eras.size) {
    const philId = philToId.get(name);
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
