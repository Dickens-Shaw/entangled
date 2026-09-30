import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";

const root = path.resolve(".");
const srcDir = path.resolve("src");

const artworkFiles = new Set([
  "bundle.min.js",
  "three.r157.min.js",
  "fxhash.min.js",
  "controller.js",
  "palettes.json",
  "ITERATION_COLORS.txt",
]);

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

function artworkName(urlPath) {
  if (!urlPath.startsWith("/src/")) return "";
  const name = urlPath.slice("/src/".length);
  return artworkFiles.has(name) ? name : "";
}

// index.html and the v0-live scripts are classic files. Vite must not rewrite them.
function serveArtwork() {
  return {
    name: "serve-artwork-raw",
    enforce: "pre",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = decodeURIComponent((req.url ?? "").split("?")[0]);
        const rel = pathname === "/" ? "/index.html" : pathname;
        const file = rel === "/index.html"
          ? path.resolve(root, "index.html")
          : (() => {
              const name = artworkName(rel);
              return name ? path.resolve(srcDir, name) : "";
            })();
        if (!file) return next();
        if (file !== root && !file.startsWith(root + path.sep)) return next();
        if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return next();

        res.statusCode = 200;
        res.setHeader("Content-Type", types[path.extname(file)] ?? "application/octet-stream");
        res.setHeader("Cache-Control", "no-cache");
        fs.createReadStream(file).pipe(res);
      });
    },
    resolveId(source) {
      const name = source.split("?")[0].split("/").pop();
      if (!artworkFiles.has(name)) return null;
      if (!source.includes("/src/") && !source.startsWith("src/")) return null;
      return { id: "/src/" + name, external: true };
    },
    generateBundle() {
      for (const name of artworkFiles) {
        this.emitFile({
          type: "asset",
          fileName: "src/" + name,
          source: fs.readFileSync(path.resolve(srcDir, name)),
        });
      }
    },
  };
}

export default defineConfig({
  plugins: [serveArtwork()],
  server: {
    port: 8082,
    strictPort: false,
  },
});
