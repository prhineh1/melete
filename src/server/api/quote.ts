import { PrismaType, HttpResponseType } from "../index.js";

export async function quotesAPI(
  url: URL,
  res: HttpResponseType,
  prisma: PrismaType
): Promise<void> {
  try {
    const authors = url.searchParams.getAll("author");
    const eras = url.searchParams.getAll("era");
    const page = Number(url.searchParams.get("page") ?? 1);

    const quotes = await prisma.quote.findMany({
      select: {
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
        AND: [
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
      skip: Number.isNaN(page) || page === 1 ? 0 : (page - 1) * 100,
    });

    const totalPages = await prisma.quote.count({
      where: {
        AND: [
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
    });

    const quotesAndPages = {
      pages: Math.ceil(totalPages / 100),
      currentPage: page,
      quotes: quotes,
    };
    res.writeHead(200);
    res.end(JSON.stringify(quotesAndPages));
  } catch {
    res.writeHead(500);
    res.end();
  }
}
