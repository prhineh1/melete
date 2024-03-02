import { IncomingMessage } from "http";
import { createObjectHash } from "../utils.js";
import { PrismaType, ResponseType } from "../index.js";

type School = {
  name: string;
};

export async function schoolsAPI(
  req: IncomingMessage,
  res: ResponseType,
  prisma: PrismaType
): Promise<void> {
  try {
    let resHash = "";

    const ret = await getSchools(prisma);

    resHash = createObjectHash(ret);
    res.setHeader("ETag", resHash);
    res.setHeader(
      "Cache-Control",
      "public, max-age=604800, stale-while-revalidate=86400"
    );

    res.setHeader("Content-Type", "application/json");

    const eTag = req.headers["if-none-match"];
    // if eTags match send a 304
    if (eTag && eTag === resHash) {
      res.writeHead(304);
      res.end();
      return;
    }

    res.writeHead(200);
    res.end(JSON.stringify(ret));
  } catch (e) {
    res.writeHead(500, e as string);
    res.end();
  }
}

async function getSchools(prisma: PrismaType): Promise<School[]> {
  const schools = await prisma.school.findMany({
    select: {
      name: true,
    },
  });

  return schools;
}
