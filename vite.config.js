import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";

const grailRoot = path.resolve("demos/entangled-grail");

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".md": "text/markdown; charset=utf-8",
};

// Serve the recovered artwork as raw files. Vite must not rewrite
// bundle.min.js or three.r157.min.js; both are classic scripts.
function serveGrail() {
  return {
    name: "serve-entangled-grail",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const raw = req.url ?? "";
        const pathname = decodeURIComponent(raw.split("?")[0]);
        if (pathname !== "/grail" && !pathname.startsWith("/grail/")) return next();

        const rel = pathname === "/grail" ? "/" : pathname.slice("/grail".length);
        const target = path.resolve(grailRoot, "." + (rel.endsWith("/") ? `${rel}index.html` : rel));
        if (target !== grailRoot && !target.startsWith(grailRoot + path.sep)) return next();

        const file = fs.existsSync(target) && fs.statSync(target).isDirectory()
          ? path.join(target, "index.html")
          : target;
        if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return next();

        res.statusCode = 200;
        res.setHeader("Content-Type", types[path.extname(file)] ?? "application/octet-stream");
        fs.createReadStream(file).pipe(res);
      });
    },
  };
}

export default defineConfig({
  plugins: [serveGrail()],
  server: {
    port: 8082,
    strictPort: false,
  },
});
