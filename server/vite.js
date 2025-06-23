import { fileURLToPath } from "url";
import path from "path";
import express from "express";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function log(message) {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  console.log(`${formattedTime} [express] ${message}`);
}

export async function setupVite(app, server) {
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.ssrFixStacktrace);
    app.use(vite.middlewares);
  }
}

export function serveStatic(app) {
  const distPath = path.resolve(__dirname, "..", "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}