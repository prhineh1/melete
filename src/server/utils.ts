import { join } from "path";
import { readFile, open, FileHandle } from "fs/promises";
import { cwd } from "process";
import { HttpResponseType } from "./index.js";
import { createHash } from "crypto";
import { IncomingMessage } from "http";

export async function serveStatic(
  url: URL,
  req: IncomingMessage,
  res: HttpResponseType
) {
  try {
    const pathName = url.pathname === "/" ? "static/index.html" : url.pathname;
    const fileBuffer = await readFile(join(cwd(), `${pathName}`));
    let contentType: string;
    const eTag = req.headers["if-none-match"];
    const fileHandle = await open(join(cwd(), `${pathName}`));

    // css file
    if (pathName.search(/(\.css)$/) > -1) {
      contentType = "text/css";

      // js file
    } else if (pathName.search(/(\.js)$/) > -1) {
      contentType = "application/javascript";

      // gzip file
    } else if (pathName.search(/(\.gz)$/) > -1) {
      contentType = "application/sql";
      // download for sql dump
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="melete_sql_dump_2023-05-18.gz"'
      );
      res.setHeader("Content-Encoding", "gzip");

      // html file
    } else if (pathName.search(/\.html/) > -1) {
      contentType = "text/html";
    } else {
      contentType = "application/json";
    }

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Cache-Control",
      "public, max-age=604800, stale-while-revalidate=86400"
    );
    const respEtag = await createCacheHeaders(fileHandle, res);

    // if eTags match send a 304
    if (eTag && respEtag === eTag) {
      res.writeHead(304);
      res.end();
      return;
    }

    res.writeHead(200);
    res.end(fileBuffer);
  } catch {
    res.writeHead(500);
    res.end();
  }
}

async function createCacheHeaders(
  file: FileHandle,
  res: HttpResponseType
): Promise<string> {
  const mTime = (await file.stat()).mtime;

  res.setHeader("Last-Modified", mTime.toUTCString());
  const respEtag = await createFileHash(file);
  res.setHeader("ETag", respEtag);

  return respEtag;
}

export function createObjectHash(obj: Object): string {
  const hash = createHash("md5");
  hash.update(JSON.stringify(obj));
  return hash.digest("hex");
}

function createFileHash(file: FileHandle): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const stream = file.createReadStream();
    const hash = createHash("md5");
    stream.pipe(hash);

    stream.on("end", () => {
      resolve(hash.digest("hex"));
    });

    stream.on("error", reject);
  });
}
