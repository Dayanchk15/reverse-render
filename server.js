import http from "node:http";
import WebSocket, { WebSocketServer } from "ws";

const port = Number(process.env.PORT || 10000);
const upstreamUrl = process.env.UPSTREAM_WS_URL;

if (!upstreamUrl) {
  throw new Error("UPSTREAM_WS_URL is required");
}

const httpServer = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200);
    res.end("ok");
    return;
  }

  res.writeHead(404);
  res.end("not found");
});

const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", (client) => {
  const upstream = new WebSocket(upstreamUrl);

  upstream.on("open", () => {
    client.on("message", (data, binary) => {
      if (upstream.readyState === WebSocket.OPEN) {
        upstream.send(data, { binary });
      }
    });

    upstream.on("message", (data, binary) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data, { binary });
      }
    });
  });

  const close = () => {
    if (client.readyState !== WebSocket.CLOSED) client.close();
    if (upstream.readyState !== WebSocket.CLOSED) upstream.close();
  };

  client.on("close", close);
  upstream.on("close", close);
  client.on("error", close);
  upstream.on("error", close);
});

httpServer.listen(port, "0.0.0.0", () => {
  console.log(`relay listening on ${port}`);
});
