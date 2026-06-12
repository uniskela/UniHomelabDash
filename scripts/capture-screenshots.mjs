import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outputDir = path.join(root, "docs", "screenshots");
const standaloneDir = path.join(root, ".next", "standalone");
const port = 3456;
const baseUrl = `http://127.0.0.1:${port}`;

function copyDir(source, destination) {
  fs.cpSync(source, destination, { recursive: true, force: true });
}

function prepareStandaloneAssets() {
  copyDir(path.join(root, "public"), path.join(standaloneDir, "public"));
  copyDir(path.join(root, ".next", "static"), path.join(standaloneDir, ".next", "static"));
}

function seedDemoDatabase(databasePath) {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  if (fs.existsSync(databasePath)) {
    fs.unlinkSync(databasePath);
  }

  const sqlite = new Database(databasePath);
  const now = new Date().toISOString();
  const checkedAt = new Date(Date.now() - 15 * 60 * 1000).toISOString();

  sqlite.exec(`
    CREATE TABLE services (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'General',
      host TEXT NOT NULL DEFAULT '',
      icon TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      health_url TEXT NOT NULL DEFAULT '',
      health_status TEXT NOT NULL DEFAULT 'unknown',
      health_error_message TEXT NOT NULL DEFAULT '',
      last_checked_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  const insert = sqlite.prepare(`
    INSERT INTO services (
      id, name, url, category, host, icon, notes, health_url,
      health_status, health_error_message, last_checked_at, created_at, updated_at
    ) VALUES (
      @id, @name, @url, @category, @host, @icon, @notes, @healthUrl,
      @healthStatus, @healthErrorMessage, @lastCheckedAt, @createdAt, @updatedAt
    )
  `);

  const demoServices = [
    {
      id: "demo-jellyfin",
      name: "Jellyfin",
      url: "https://jellyfin.example.local",
      category: "Media",
      host: "nas.local",
      icon: "🎬",
      notes: "Family movies and TV.",
      healthUrl: "https://jellyfin.example.local/health",
      healthStatus: "healthy",
      healthErrorMessage: "",
      lastCheckedAt: checkedAt,
    },
    {
      id: "demo-portainer",
      name: "Portainer",
      url: "https://portainer.example.local",
      category: "Docker",
      host: "docker-host",
      icon: "🐳",
      notes: "",
      healthUrl: "https://portainer.example.local/api/status",
      healthStatus: "degraded",
      healthErrorMessage: "HTTP 503 Service Unavailable",
      lastCheckedAt: checkedAt,
    },
    {
      id: "demo-immich",
      name: "Immich",
      url: "https://photos.example.local",
      category: "Photos",
      host: "nas.local",
      icon: "📷",
      notes: "Photo backups.",
      healthUrl: "",
      healthStatus: "unknown",
      healthErrorMessage: "",
      lastCheckedAt: null,
    },
  ];

  for (const service of demoServices) {
    insert.run({
      ...service,
      createdAt: now,
      updatedAt: now,
    });
  }

  sqlite.close();
}

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

async function waitForStyledPage(page) {
  await page.waitForFunction(
    () => document.documentElement.classList.contains("dark"),
    { timeout: 15000 }
  );
  await page.locator("nav.fixed.bottom-0").waitFor({ state: "visible", timeout: 15000 });
}

function startServer(databasePath) {
  prepareStandaloneAssets();

  const server = spawn("node", ["server.js"], {
    cwd: standaloneDir,
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
      DATABASE_PATH: databasePath,
    },
    stdio: "inherit",
  });

  return server;
}

async function main() {
  const demoDbPath = path.join(os.tmpdir(), "unihomelabdash-screenshots.sqlite");
  seedDemoDatabase(demoDbPath);
  fs.mkdirSync(outputDir, { recursive: true });

  const { chromium } = await import("playwright");
  const server = startServer(demoDbPath);

  try {
    await waitForServer(baseUrl);
    const browser = await chromium.launch();

    const mobile = { width: 390, height: 844 };
    const captures = [
      { name: "dashboard", route: "/", waitFor: "h1" },
      {
        name: "services",
        route: "/services",
        waitFor: "text=Jellyfin",
      },
      {
        name: "add-service",
        route: "/services?add=1",
        waitFor: "text=Add service",
      },
    ];

    for (const capture of captures) {
      const page = await browser.newPage({
        viewport: mobile,
        colorScheme: "dark",
      });
      await page.goto(`${baseUrl}${capture.route}`, { waitUntil: "networkidle" });
      await waitForStyledPage(page);
      await page.waitForSelector(capture.waitFor, { timeout: 15000 });

      if (capture.name === "add-service") {
        await page.locator('[data-slot="sheet-content"]').waitFor({
          state: "visible",
          timeout: 15000,
        });
      }

      await page.waitForTimeout(300);
      await page.screenshot({
        path: path.join(outputDir, `${capture.name}.png`),
        fullPage: true,
      });
      await page.close();
    }

    await browser.close();
    console.log(`Screenshots saved to ${outputDir}`);
  } finally {
    server.kill("SIGTERM");
    if (fs.existsSync(demoDbPath)) {
      fs.unlinkSync(demoDbPath);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
