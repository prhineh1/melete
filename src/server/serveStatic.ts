import { join } from "path";
import { readFileSync } from "fs";
import { cwd } from "process";
import { HttpResponseType } from "./index.js";

export function serveStatic(url: URL, res: HttpResponseType) {
  try {
    let file: Buffer;
    let contentType: string;

    if (url.pathname.search(/(\.css)$/) > -1) {
      contentType = "text/css";
      file = readFileSync(join(cwd(), `static${url.pathname}`));
    } else if (url.pathname.search(/(\.js)$/) > -1) {
      contentType = "application/javascript";
      file = readFileSync(join(cwd(), `static${url.pathname}`));
    } else {
      contentType = "application/json";
      file = readFileSync(join(cwd(), "openapi.json"));
    }

    res.writeHead(200, { "Content-Type": contentType });
    res.end(file);
  } catch {
    res.writeHead(500);
    res.end();
  }
}
