import { IncomingMessage, get } from "http";
import { createObjectHash } from "../utils.js";
import { PrismaType, ResponseType } from "../index.js";

type Philosopher = {
  name: string;
  schools: string[];
  eras: string[];
};

export async function philosophersAPI(
  url: URL,
  req: IncomingMessage,
  res: ResponseType,
  prisma: PrismaType
): Promise<void> {
  try {
    let ret;
    let resHash = "";

    ret = await getPhilosophers(url, prisma);

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

async function getPhilosophers(
  url: URL,
  prisma: PrismaType
): Promise<{ cursor: number; philosophers: Philosopher[] }> {
  const names = url.searchParams.getAll("name");
  const eras = url.searchParams.getAll("era");
  const schools = url.searchParams.getAll("school");
  const cursor = Number(url.searchParams.get("cursor"));

  const philosophers = await prisma.philosopher.findMany({
    select: {
      id: true,
      name: true,
      schools: {
        select: {
          School: {
            select: {
              name: true,
            },
          },
        },
      },
      eras: {
        select: {
          Era: {
            select: {
              era: true,
            },
          },
        },
      },
    },
    where:
      !names.length && !eras.length && !schools.length
        ? undefined
        : {
            // see https://www.prisma.io/docs/concepts/components/prisma-client/null-and-undefined#the-effect-of-null-and-undefined-on-conditionals
            // for discussion of how "OR" operator works
            OR: [
              names.length
                ? {
                    OR: names.map((name) => ({
                      name: {
                        contains: name.toLowerCase().trim(),
                      },
                    })),
                  }
                : {},
              eras.length
                ? {
                    eras: {
                      some: {
                        Era: {
                          OR: eras.map((era) => ({
                            era: {
                              contains: era.toLowerCase().trim(),
                            },
                          })),
                        },
                      },
                    },
                  }
                : {},
              schools.length
                ? {
                    schools: {
                      some: {
                        School: {
                          OR: schools.map((school) => ({
                            name: {
                              contains: school.toLowerCase().trim(),
                            },
                          })),
                        },
                      },
                    },
                  }
                : {},
            ],
          },
    take: 100,
    skip: 1,
    cursor: cursor === 0 ? undefined : { id: cursor },
  });

  return {
    cursor: philosophers.length < 100 ? -1 : philosophers[99].id,
    philosophers: philosophers.map((philosopher) => ({
      name: philosopher.name ?? "unknown",
      eras: philosopher.eras.map((obj) => obj.Era.era),
      schools: philosopher.schools.map((obj) => obj.School.name),
    })),
  };
}
