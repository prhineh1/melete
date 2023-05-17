import { getMainTitle } from "../utils.js";
import jsdom = require("jsdom");

const { JSDOM } = jsdom;

export type Philosopher = {
  name: string;
};

export async function getPhilosopherData(
  link: string
): Promise<[Philosopher, string] | null> {
  if (link.includes("redlink")) {
    // link doesn't have corresponding page
    return null;
  }

  let doc;

  try {
    const {
      window: { document },
    } = await JSDOM.fromURL(link);
    doc = document;
  } catch (err) {
    return null;
  }

  // only include philosophers who have an "era", "region", or
  // "school or tradition" entry on their page
  const [regionTh] = Array.from(
    doc.querySelectorAll(".infobox.biography.vcard th.infobox-label")
  ).filter((th) => th.textContent?.trim().toLocaleLowerCase() === "region");

  const [eraTh] = Array.from(
    doc.querySelectorAll(".infobox.biography.vcard th.infobox-label")
  ).filter((th) => th.textContent?.trim().toLocaleLowerCase() === "era");

  const [schoolTh] = Array.from(
    doc.querySelectorAll(".infobox.biography.vcard th.infobox-label")
  ).filter((th) =>
    th.textContent?.trim().toLocaleLowerCase().includes("school")
  );

  if (!(regionTh || eraTh || schoolTh)) {
    return null;
  }

  return [{ name: getMainTitle(doc) ?? "" }, link];
}
