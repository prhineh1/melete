import { parentPort } from "worker_threads";
import jsdom = require("jsdom");
import { getMainTitle } from "../../utils.js";

const { JSDOM } = jsdom;

export default async function getPhilosopherName(
  link: string
): Promise<string> {
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

parentPort?.on("message", (link: string) => {
  getPhilosopherName(link).then((name) => parentPort?.postMessage(name));
});
