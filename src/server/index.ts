import { readFileSync } from "fs";
import { createServer } from "https";
import { Prisma, PrismaClient } from "@prisma/client";
import { ServerResponse, IncomingMessage } from "http";
import { quotesAPI } from "./api/quote.js";

export type PrismaType = PrismaClient<
  Prisma.PrismaClientOptions,
  never,
  Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined
>;
export type HttpResponseType = ServerResponse<IncomingMessage> & {
  req: IncomingMessage;
};
const prisma = new PrismaClient();

const options = {
  key: readFileSync("key.pem"),
  cert: readFileSync("cert.pem"),
};

const server = createServer(options, (req, res) => {
  const url = new URL(req.url ?? "", `https://${req.headers.host}`);
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "public, max-age=604800");

  // only service "GET" requests
  if (req.method !== "GET") {
    res.writeHead(405);
    res.end();
    return;
  }

  switch (url.pathname) {
    case "/quotes":
    case "/quotes/":
      quotesAPI(url, res, prisma);
      break;
    default:
      res.writeHead(404);
      res.end();
      break;
  }
});

server.listen(8080, () => {
  console.log("HTTPS server listening on port 8080");
});
