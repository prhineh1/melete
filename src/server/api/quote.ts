import { PrismaType, HttpResponseType } from "../index.js";

export async function quotesAPI(
  url: URL,
  res: HttpResponseType,
  prisma: PrismaType
): Promise<void> {
  try {
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
      where: {
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
        author: quote.author,
        eras: quote.eras.map((obj) => obj.Era.era),
        text: quote.text,
      })),
    };
    res.writeHead(200);
    res.end(JSON.stringify(quotesAndPages));
  } catch {
    res.writeHead(500);
    res.end();
  }
}
