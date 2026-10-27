import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../dist/salud-web/browser",
);
const port = Number(process.env.PORT || 4387);
const backendPort=Number(process.env.BACKEND_PORT||8080);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
};
await stat(path.join(root, "index.html")).catch(() => {
  throw new Error("Primero ejecutá npm run build.");
});
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "same-origin");
  if (url.pathname.startsWith("/api/")) {
    const upstream = http.request(
      {
        hostname: "127.0.0.1",
        port: backendPort,
        path: url.pathname + url.search,
        method: req.method,
        headers: req.headers,
      },
      (response) => {
        res.writeHead(response.statusCode || 502, response.headers);
        response.pipe(res);
      },
    );
    upstream.on("error", () => {
      if (!res.headersSent)
        res.writeHead(503, { "Content-Type": "application/problem+json" });
      res.end(
        JSON.stringify({
          detail: `El servidor no está disponible en el puerto ${backendPort}.`,
        }),
      );
    });
    req.pipe(upstream);
    return;
  }
  if (!["GET", "HEAD"].includes(req.method)) {
    res.writeHead(405);
    res.end();
    return;
  }
  try {
    const decoded = decodeURIComponent(url.pathname);
    let target = path.resolve(root, "." + decoded);
    if (!target.startsWith(root + path.sep) && target !== root) {
      res.writeHead(403);
      res.end();
      return;
    }
    if (path.extname(target)) {
      const info = await stat(target);
      if (!info.isFile()) throw new Error("Not a file");
    } else target = path.join(root, "index.html");
    const body = await readFile(target);
    res.writeHead(200, {
      "Content-Type": mime[path.extname(target)] || "application/octet-stream",
      "Cache-Control":
        path.extname(target) === ".html" ? "no-cache" : "public, max-age=3600",
    });
    res.end(req.method === "HEAD" ? undefined : body);
  } catch {
    res.writeHead(404);
    res.end("Archivo no disponible.");
  }
});
server.listen(port, "127.0.0.1", () =>
  console.log(`Patio: http://127.0.0.1:${port}/`),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => server.close(() => process.exit(0)));
