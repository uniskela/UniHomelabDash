import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outputDir = path.join(root, "docs", "screenshots");
const port = 3456;
const baseUrl = `http://127.0.0.1:${port}`;

async function waitForServer(url, attempts = 60) {
  for (let index = 0; index < attempts; index += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // retry
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Server did not become ready at ${url}`);
}

function startServer() {
  const server = spawn("node", ["server.js"], {
    cwd: path.join(root, ".next", "standalone"),
    env: {
      ...process.env,
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
      DATABASE_PATH: path.join(root, "data", "unihomelabdash.sqlite"),
    },
    stdio: "inherit",
  });

  return server;
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });

  const { chromium } = await import("playwright");
  const server = startServer();

  try {
    await waitForServer(baseUrl);
    const browser = await chromium.launch();

    const mobile = { width: 390, height: 844 };
    const pages = [
      ["dashboard", "/"],
      ["services", "/services"],
      ["add-service", "/services?add=1"],
    ];

    for (const [name, route] of pages) {
      const page = await browser.newPage({ viewport: mobile });
      await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(500);
      await page.screenshot({
        path: path.join(outputDir, `${name}.png`),
        fullPage: true,
      });
      await page.close();
    }

    await browser.close();
    console.log(`Screenshots saved to ${outputDir}`);
  } finally {
    server.kill("SIGTERM");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
