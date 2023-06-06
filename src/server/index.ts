import { PrismaClient } from "@prisma/client";
import { ServerResponse, IncomingMessage, createServer } from "http";
import { quotesAPI } from "./api/quote.js";
import { schoolsAPI } from "./api/school.js";
import { serveStatic } from "./utils.js";

const prisma = new PrismaClient();
export type PrismaType = typeof prisma;
export type ResponseType = ServerResponse<IncomingMessage> & {
  req: IncomingMessage;
};

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "", `https://${req.headers.host}`);

  // set general headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; font-src fonts.gstatic.com; style-src 'unsafe-inline'; connect-src *"
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
    case /\/(static\/.+\.(js(on)?|css|html|sql|gz))?$/.test(url.pathname):
      serveStatic(url, req, res);
      return;

    // v1 quotes api
    case /\/api\/v1\/quotes(\/random)?$/.test(url.pathname):
      quotesAPI(url, req, res, prisma);
      return;

    case /\api\v1\schools/.test(url.pathname):
      schoolsAPI(req, res, prisma);
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
