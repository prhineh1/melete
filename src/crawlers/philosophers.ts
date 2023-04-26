import { join } from "path";
import { getFile, getLinks } from "../utils.js";
import { cwd } from "process";
import jsdom = require("jsdom");

let id = 1;
const { JSDOM } = jsdom;

async function appendToCsv(data: string[]) {
  const csv = await getFile(join(cwd(), "philosopher.csv"), "name,id");
  const csvData = data.map((name) => `${name},${id++}`).join("\n");
  await csv.appendFile(csvData);
  await csv.close();
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
  appendToCsv(names);
}

getNames();
