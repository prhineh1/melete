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

async function appendToCsv(data: string): Promise<boolean> {
  try {
    const csv = await getFile(join(cwd(), "philosopher.csv"), "id,name");
    await csv.appendFile(data);
    await csv.close();

    return true;
  } catch {
    return false;
  }
}

export async function getNames(): Promise<boolean> {
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

  const pairs = names.map((name, idx) => `${idx + 1},${name}`);
  createMapping(
    createEntityToIdData(pairs),
    join(cwd(), "/src/generated/philToId.ts")
  );
  return await appendToCsv(pairs.join("\n"));
}
