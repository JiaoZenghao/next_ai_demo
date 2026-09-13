import { cpSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

// next build does not copy public/static into standalone automatically.
// Docker copies these in its final stage; this prepares the same layout locally.
const root = new URL("../", import.meta.url);
const standalone = new URL(".next/standalone/", root);
cpSync(fileURLToPath(new URL(".next/static", root)), fileURLToPath(new URL(".next/static", standalone)), { recursive: true });
const publicDir = new URL("public", root);
if (existsSync(publicDir)) {
  cpSync(fileURLToPath(publicDir), fileURLToPath(new URL("public", standalone)), { recursive: true });
}
await import(new URL("server.js", standalone).href);
