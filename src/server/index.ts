import { Prisma, PrismaClient } from "@prisma/client";
import { ServerResponse, IncomingMessage, createServer } from "http";
import { quotesAPI } from "./api/quote.js";
import { serveStatic } from "./serveStatic.js";
import { join } from "path";
import { readFileSync } from "fs";
import { cwd } from "process";

export type PrismaType = PrismaClient<
  Prisma.PrismaClientOptions,
  never,
  Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined
>;
export type HttpResponseType = ServerResponse<IncomingMessage> & {
  req: IncomingMessage;
};
const prisma = new PrismaClient();

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "", `https://${req.headers.host}`);

  // only service "GET" requests
  if (req.method !== "GET") {
    res.writeHead(405);
    res.end();
    return;
  }

  switch (url.pathname) {
    case "/":
      const file = readFileSync(join(cwd(), `static/index.html`));
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(file);
      break;
    case "/api/v1/quotes":
    case "/api/v1/quotes/random":
      quotesAPI(url, res, prisma);
      break;
    default:
      if (url.pathname.search(/(\.css)$|(\.js(on)?)$/) > -1) {
        serveStatic(url, res);
      }
      res.writeHead(404);
      res.end();
      break;
  }
});

server.listen(8080, () => {
  console.log("HTTPS server listening on port 8080");
});
