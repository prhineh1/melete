import { Prisma, PrismaClient } from "@prisma/client";
import { ServerResponse, IncomingMessage, createServer } from "http";
import { quotesAPI } from "./api/quote.js";
import { serveStatic } from "./utils.js";

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

  // set general headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; font-src fonts.gstatic.com; style-src 'unsafe-inline'"
  );
  res.setHeader("Date", new Date().toUTCString());

  // only service "GET" requests
  if (req.method !== "GET") {
    res.writeHead(405, { Allow: "GET" });
    res.end();
    return;
  }

  switch (true) {
    // root and static content
    case /\/(static\/.+\.(js(on)?|css|html|sql))?$/.test(url.pathname):
      serveStatic(url, req, res);
      return;

    // v1 quotes api
    case /\/api\/v1\/quotes(\/random)?$/.test(url.pathname):
      quotesAPI(url, req, res, prisma);
      return;

    // 404
    default:
      res.writeHead(404);
      res.end();
      return;
  }
});

server.listen(8080, () => {
  console.log("HTTPS server listening on port 8080");
});
