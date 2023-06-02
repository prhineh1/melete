import * as jsdom from "jsdom";
import { getMainTitle, getInfoboxAnchors } from "../utils.js";
import { schoolResult } from "./index.js";

const { JSDOM } = jsdom;

export async function getSchoolData(link: string): Promise<schoolResult> {
  let doc;
  const duplicates: string[] = []; // for seed data
  let mappingData: schoolResult["philToSchool"];
  //@ts-ignore
  const { philToId } = await import("../../generated/phil_to_id.ts");

  try {
    const {
      window: { document },
    } = await JSDOM.fromURL(link);
    doc = document;
  } catch (err) {
    return {} as schoolResult;
  }

  let name = getMainTitle(doc);
  const schoolAnchors = getInfoboxAnchors(doc, [
    "school",
    "tradidtion",
    "movement",
  ]);

  const schools: Set<string> = new Set<string>();
  for (const anchor of schoolAnchors) {
    try {
      const dom = await JSDOM.fromURL(anchor.href);
      const school = getMainTitle(dom.window.document);
      if (school) {
        duplicates.push(school);
        schools.add(school);
      }
    } catch {
      return {} as schoolResult;
    }
  }

  if (name && schools.size) {
    const philId = philToId.get(name);
    if (philId) {
      mappingData = [philId, [...schools]];
    }
  }

  const res = {
    school: duplicates,
    philToSchool: mappingData,
  };
  return res;
}
