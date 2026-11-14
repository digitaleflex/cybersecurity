// Serveur statique de production et de développement : liste blanche de fichiers, en-têtes de sécurité,
// compression gzip/brotli, cache avec ETag, URL propres. Aucune dépendance.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync, brotliCompressSync, constants as zlib } from "node:zlib";
import { SECURITY_HEADERS, HSTS } from "./site-config.mjs";

const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp",
  ".ico": "image/x-icon", ".woff2": "font/woff2", ".md": "text/markdown; charset=utf-8", ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8", ".webmanifest": "application/manifest+json; charset=utf-8"
};
const COMPRESSIBLE = new Set([".html", ".css", ".js", ".json", ".svg", ".md", ".txt", ".xml", ".webmanifest"]);

/** Seuls ces chemins sont publics : tout le reste (package.json, scripts/, tests/, .git, .github…) répond 404. */
const PUBLIC_PATHS = [
  /^\/[A-Za-z0-9_-]+\.(?:html|css|js|webmanifest|txt|xml|md)$/, // fichiers à la racine
  /^\/LICENSE$/,
  /^\/js\/[A-Za-z0-9_-]+\.js$/,
  /^\/vendor\/[A-Za-z0-9._-]+\.(?:js|txt|md)$/,
  /^\/assets\/(?:fonts\/)?[A-Za-z0-9._-]+\.(?:webp|png|svg|ico|woff2|txt)$/,
  /^\/data\/(?:resources\.json|schema\.md)$/,
  /^\/library\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)?\/README\.md$/
];
export const isPublicPath = (path) => PUBLIC_PATHS.some((re) => re.test(path));

function cacheControl(path) {
  if (/^\/(?:assets\/fonts|vendor)\//.test(path)) return "public, max-age=31536000, immutable";
  if (path.startsWith("/assets/")) return "public, max-age=604800, stale-while-revalidate=86400";
  if (path === "/data/resources.json" || path.endsWith(".md")) return "public, max-age=300, stale-while-revalidate=3600";
  return "no-cache"; // HTML, JS, CSS : toujours revalidés (ETag), donc jamais périmés après un déploiement
}

const cache = new Map(); // "chemin|encodage|mtime" -> Buffer
function compress(path, body, mtime, accept) {
  const encoding = /\bbr\b/.test(accept) ? "br" : /\bgzip\b/.test(accept) ? "gzip" : null;
  if (!encoding || body.length < 512) return { body, encoding: null };
  const key = `${path}|${encoding}|${mtime}`;
  if (!cache.has(key)) {
    cache.set(key, encoding === "br"
      ? brotliCompressSync(body, { params: { [zlib.BROTLI_PARAM_QUALITY]: 5 } })
      : gzipSync(body, { level: 6 }));
    if (cache.size > 200) cache.delete(cache.keys().next().value);
  }
  return { body: cache.get(key), encoding };
}

export function createSiteServer({ root = process.cwd() } = {}) {
  const base = resolve(root);

  async function load(path) {
    const file = resolve(base, `.${path}`);
    if (file !== base && !file.startsWith(base + sep)) return null;
    try {
      const info = await stat(file);
      if (!info.isFile()) return null;
      return { file, info, body: await readFile(file) };
    } catch { return null; }
  }

  function send(request, response, status, path, loaded, extra = {}) {
    const ext = extname(loaded.file).toLowerCase();
    const headers = { ...SECURITY_HEADERS, "Content-Type": MIME[ext] || (ext === "" ? "text/plain; charset=utf-8" : "application/octet-stream"), ...extra };
    if (request.headers["x-forwarded-proto"] === "https") headers["Strict-Transport-Security"] = HSTS;
    let body = loaded.body;
    if (status === 200) {
      const etag = `W/"${loaded.info.size.toString(16)}-${Math.floor(loaded.info.mtimeMs).toString(16)}"`;
      headers.ETag = etag;
      headers["Cache-Control"] = cacheControl(path);
      if (request.headers["if-none-match"] === etag) { response.writeHead(304, headers).end(); return; }
    } else headers["Cache-Control"] = "no-cache";
    if (COMPRESSIBLE.has(ext)) {
      headers.Vary = "Accept-Encoding";
      const packed = compress(path, body, loaded.info.mtimeMs, String(request.headers["accept-encoding"] || ""));
      body = packed.body;
      if (packed.encoding) headers["Content-Encoding"] = packed.encoding;
    }
    headers["Content-Length"] = body.length;
    response.writeHead(status, headers);
    response.end(request.method === "HEAD" ? undefined : body);
  }

  const server = createServer(async (request, response) => {
    try {
      if (!["GET", "HEAD"].includes(request.method || "GET")) {
        response.writeHead(405, { ...SECURITY_HEADERS, Allow: "GET, HEAD", "Content-Type": "text/plain; charset=utf-8" }).end("Method Not Allowed");
        return;
      }
      const url = new URL(request.url || "/", "http://localhost");
      let path;
      try { path = decodeURIComponent(url.pathname); } catch {
        response.writeHead(400, { ...SECURITY_HEADERS, "Content-Type": "text/plain; charset=utf-8" }).end("Bad Request");
        return;
      }
      if (path.includes("\0") || path.includes("..") || path.includes("\\")) path = "/__invalid__";

      // URL propres : /index.html -> /, /catalogue.html -> /catalogue (redirection permanente, requête conservée)
      const htmlMatch = path.match(/^\/([A-Za-z0-9_-]+)\.html$/);
      if (htmlMatch && htmlMatch[1] !== "404") {
        const target = htmlMatch[1] === "index" ? "/" : `/${htmlMatch[1]}`;
        response.writeHead(308, { ...SECURITY_HEADERS, Location: target + url.search, "Cache-Control": "public, max-age=3600" }).end();
        return;
      }
      if (path === "/") path = "/index.html";
      else if (/^\/[A-Za-z0-9_-]+$/.test(path) && path !== "/LICENSE") path = `${path}.html`;

      const loaded = isPublicPath(path) ? await load(path) : null;
      if (loaded) { send(request, response, 200, path, loaded); return; }
      const notFound = await load("/404.html");
      if (notFound) { send(request, response, 404, "/404.html", notFound); return; }
      response.writeHead(404, { ...SECURITY_HEADERS, "Content-Type": "text/plain; charset=utf-8" }).end("Not Found");
    } catch (error) {
      console.error(error);
      response.writeHead(500, { ...SECURITY_HEADERS, "Content-Type": "text/plain; charset=utf-8" }).end("Internal Server Error");
    }
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 4173);
  createSiteServer().listen(port, process.env.HOST || "0.0.0.0", () => {
    console.log(`HashCode Cyber Library: http://localhost:${port}`);
  });
}
