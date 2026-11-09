#!/usr/bin/env node
/**
 * Local static server that mirrors the parts of vercel.json the site depends on:
 * clean URLs, redirects, response headers and the 404 page. Usage: node scripts/serve.cjs [port]
 */
"use strict";
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const port = Number(process.argv[2] || process.env.PORT || 8765);
const config = JSON.parse(fs.readFileSync(path.join(root, "vercel.json"), "utf8"));
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml",
  ".mp4": "video/mp4", ".xml": "application/xml", ".txt": "text/plain; charset=utf-8", ".ico": "image/x-icon",
};
const toRegex = (source) => new RegExp("^" + source.replace(/\(\.\*\)/g, "\u0000").replace(/[.+?^${}|[\]\\]/g, "\\$&").replace(/\u0000/g, "(.*)") + "$");

function headersFor(pathname) {
  const out = {};
  for (const rule of config.headers || []) {
    if (toRegex(rule.source).test(pathname)) for (const h of rule.headers) out[h.key] = h.value;
  }
  return out;
}

function send(res, status, file, pathname) {
  const ext = path.extname(file).toLowerCase();
  const body = fs.readFileSync(file);
  res.writeHead(status, { "Content-Type": TYPES[ext] || "application/octet-stream", "Content-Length": body.length, ...headersFor(pathname) });
  res.end(body);
}

http
  .createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    let pathname = decodeURIComponent(url.pathname);
    const redirect = (config.redirects || []).find((r) => r.source === pathname);
    if (redirect) {
      res.writeHead(redirect.permanent ? 308 : 307, { Location: redirect.destination });
      return res.end();
    }
    // cleanUrls: /about.html -> /about, /index.html -> /
    if (config.cleanUrls && pathname.endsWith(".html")) {
      const clean = pathname === "/index.html" ? "/" : pathname.slice(0, -5);
      res.writeHead(308, { Location: clean + url.search });
      return res.end();
    }
    const rel = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const full = path.join(root, rel);
    if (!full.startsWith(root + path.sep)) {
      res.writeHead(403);
      return res.end();
    }
    for (const candidate of [full, full + ".html"]) {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return send(res, 200, candidate, pathname);
    }
    send(res, 404, path.join(root, "404.html"), pathname);
  })
  .listen(port, "127.0.0.1", () => console.log(`serving http://127.0.0.1:${port}`));
