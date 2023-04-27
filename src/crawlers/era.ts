import { join } from "node:path";
import {
  createEntityToIdData,
  createMapping,
  getEraAnchors,
  getFile,
  getLinks,
  getMainTitle,
} from "../utils.js";
import jsdom = require("jsdom");
import { cwd } from "node:process";
import philToId from "../generated/philToId.js";

const { JSDOM } = jsdom;
const links = await getLinks();

async function createCsv(data: string[]) {
  const file = await getFile(join(cwd(), "era.csv"), "id,era");
  const csvData = data.join("\n");
  await file.appendFile(csvData);
  await file.close();
}

async function getEras(): Promise<[Set<string>, string]> {
  let doc;
  const duplicates = new Set<string>(); // for csv data
  let mappingData = "";

  for (const link of links) {
    try {
      const {
        window: { document },
      } = await JSDOM.fromURL(link);
      doc = document;
    } catch (err) {
      continue;
    }

    let name = getMainTitle(doc);
    const eraAnchors = getEraAnchors(doc);

    const eras = [];
    for (const anchor of eraAnchors) {
      try {
        const dom = await JSDOM.fromURL(anchor.href);
        const era = getMainTitle(dom.window.document);
        if (era) {
          duplicates.add(era);
          eras.push(`\"${era}\"`);
        }
      } catch {
        console.log("couldn't load: " + anchor.href);
        continue;
      }
    }

    if (name && eras.length) {
      const philId = philToId.get(name);
      if (philId) {
        mappingData += `[${philId},[${eras}]],`;
      }
    }
  }

  return [duplicates, mappingData];
}

const [data, nameToEra] = await getEras();
const csvData = [...data].map((era, idx) => `${idx + 1},${era}`);
createCsv(csvData);
createMapping(nameToEra, join(cwd(), "/src/generated/philIdToEra.ts"));
createMapping(
  createEntityToIdData(csvData),
  join(cwd(), "/src/generated/eraToId.ts")
);
