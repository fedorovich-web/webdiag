import { cp, mkdir } from "node:fs/promises";

const webRoot = new URL("../apps/web/", import.meta.url);
const targetRoot = new URL("../apps/web/.next/standalone/apps/web/", import.meta.url);
await mkdir(new URL(".next/static/", targetRoot), { recursive: true });
await cp(new URL(".next/static/", webRoot), new URL(".next/static/", targetRoot), { recursive: true });
await mkdir(new URL("public/", targetRoot), { recursive: true });
await cp(new URL("public/", webRoot), new URL("public/", targetRoot), { recursive: true });
console.log("Standalone static assets prepared.");
