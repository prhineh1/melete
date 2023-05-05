import { readFileSync } from "fs";
import { createServer } from "https";

const options = {
  key: readFileSync("key.pem"),
  cert: readFileSync("cert.pem"),
};

const server = createServer(options, (req, res) => {
  res.writeHead(200);
  res.end("hello world\n");
});

server.listen(8080, () => {
  console.log("HTTPS server listening on port 8080");
});
