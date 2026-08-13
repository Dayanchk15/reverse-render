import http from "http";
import httpProxy from "http-proxy";

const PORT = process.env.PORT || 10000;
const UPSTREAM_URL = process.env.UPSTREAM_URL;

if (!UPSTREAM_URL) {
  throw new Error("UPSTREAM_URL is not set");
}

const proxy = httpProxy.createProxyServer({
  target: UPSTREAM_URL,
  changeOrigin: true,
  ws: true,
});

proxy.on("error", (err, req, res) => {
  console.error("Proxy error:", err.message);

  if (res && !res.headersSent) {
    res.writeHead(502, {
      "Content-Type": "text/plain",
    });
  }

  if (res) {
    res.end("Bad Gateway");
  }
});

const server = http.createServer((req, res) => {
  proxy.web(req, res);
});

server.on("upgrade", (req, socket, head) => {
  proxy.ws(req, socket, head);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Reverse proxy listening on ${PORT}`);
  console.log(`Upstream: ${UPSTREAM_URL}`);
});
