import { join } from "path";
import { createMapping, getFile, getLinks } from "../utils.js";
import { cwd } from "process";
import jsdom = require("jsdom");

let id = 1;
const { JSDOM } = jsdom;

function createMapData(data: string[]): string {
  let str = "";

  for (const pair of data) {
    let [id, name] = pair.split(",");
    name = `\"${name}\"`;
    str += `[${name},${id}],`;
  }

  return str;
}

async function appendToCsv(data: string[]): Promise<string[]> {
  const csv = await getFile(
    join(cwd(), "philosopher.csv"),
    "philosopherId,name"
  );
  const pairedData = data.map((name) => `${id++},${name}`);
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

    let name = doc
      .querySelector(".mw-page-title-main")
      ?.textContent?.replace(/\(.*\)$/, "")
      .trim()
      .toLocaleLowerCase();

    if (name) {
      names.push(name);
    }
  }

  const pairs = await appendToCsv(names);
  const mapData = createMapData(pairs);
  createMapping(mapData, join(cwd(), "/src/generated/philToId.ts"));
}

getNames();
