import { IncomingMessage, ServerResponse } from "http";
import { createObjectHash } from "../utils.js";
import { PrismaType, ResponseType } from "../index.js";

type Quote = {
  author: string;
  eras: string[];
  text: string;
};

export async function quotesAPI(
  url: URL,
  req: IncomingMessage,
  res: ResponseType,
  prisma: PrismaType
): Promise<void> {
  try {
    let ret;
    let resHash = "";

    // random quote
    if (url.pathname.includes("random")) {
      ret = await getRandomQuote(prisma);
      res.setHeader("Cache-Control", "no-cache");
    } else {
      // quotes with query params
      ret = await getQuotes(url, prisma);

      resHash = createObjectHash(ret);
      res.setHeader("ETag", resHash);
      res.setHeader(
        "Cache-Control",
        "public, max-age=604800, stale-while-revalidate=86400"
      );
    }

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

async function getQuotes(
  url: URL,
  prisma: PrismaType
): Promise<{ cursor: number; quotes: Quote[] }> {
  const authors = url.searchParams.getAll("author");
  const eras = url.searchParams.getAll("era");
  const cursor = Number(url.searchParams.get("cursor"));

  const quotes = await prisma.quote.findMany({
    select: {
      id: true,
      text: true,
      author: {
        select: {
          name: true,
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
      !authors.length && !eras.length
        ? undefined
        : {
            // see https://www.prisma.io/docs/concepts/components/prisma-client/null-and-undefined#the-effect-of-null-and-undefined-on-conditionals
            // for discussion of how "OR" operator works
            OR: [
              authors.length
                ? {
                    author: {
                      OR: authors.map((author) => ({
                        name: {
                          contains: author.toLowerCase().trim(),
                        },
                      })),
                    },
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
            ],
          },
    take: 100,
    skip: 1,
    cursor: cursor === 0 ? undefined : { id: cursor },
  });

  const quotesAndPages = {
    cursor: quotes.length < 100 ? -1 : quotes[99].id,
    quotes: quotes.map((quote) => ({
      author: quote.author?.name ?? "unknown",
      eras: quote.eras.map((obj) => obj.Era.era),
      text: quote.text,
    })),
  };
  return quotesAndPages;
}

async function getRandomQuote(prisma: PrismaType): Promise<Quote> {
  const [ret] = (await prisma.$queryRaw`SELECT q.text, p.name, e.era
      FROM "Quote" q TABLESAMPLE system_rows(1)
      LEFT JOIN "Philosopher" p ON q."authorId"=p.id
      LEFT JOIN "QuoteEra" qe on q.id=qe."quoteId"
      LEFT JOIN "Era" e on qe."eraId"=e.id`) as {
    text: string;
    name: string | null;
    era: string[] | string | null;
  }[];

  const quote: Quote = {
    author: ret.name ?? "unknown",
    text: ret.text,
    eras: Array.isArray(ret.era) ? ret.era : ret.era ? [ret.era] : [],
  };

  const randomQuotes = await prisma.randomquote.findMany();

  return {
    author: randomQuotes[0].name ?? "unknown",
    text: randomQuotes[0].text,
    eras: randomQuotes.map((quote) => quote.era ?? ""),
  };
}
