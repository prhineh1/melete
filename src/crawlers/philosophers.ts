import { join } from "path";
import {
  createEntityToIdData,
  createMapping,
  getFile,
  getLinks,
  getMainTitle,
} from "../utils.js";
import { cwd } from "process";
import jsdom = require("jsdom");

const { JSDOM } = jsdom;

async function appendToCsv(data: string[]): Promise<string[]> {
  const csv = await getFile(join(cwd(), "philosopher.csv"), "id,name");
  const pairedData = data.map((name, idx) => `${idx + 1},${name}`);
  const csvData = pairedData.join("\n");
  await csv.appendFile(csvData);
  await csv.close();

  return pairedData;
}

async function getNames() {
  const links = await getLinks();
  const names: string[] = [];

  for (const link of links) {
    let doc;

    try {
      const {
        window: { document },
      } = await JSDOM.fromURL(link);
      doc = document;
    } catch (err) {
      console.error("can't load page: " + link);
      continue;
    }

    let name = getMainTitle(doc);

    if (name) {
      names.push(name);
    }
  }

  const pairs = await appendToCsv(names);
  createMapping(
    createEntityToIdData(pairs),
    join(cwd(), "/src/generated/philToId.ts")
  );
}

getNames();
