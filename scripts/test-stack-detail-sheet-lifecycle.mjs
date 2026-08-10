import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { chromium } from "playwright";

const root = process.cwd();

function findOpenPort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close((error) => {
        if (error || !address || typeof address === "string") {
          reject(error ?? new Error("Could not reserve a test port."));
          return;
        }
        resolve(address.port);
      });
    });
  });
}

function seedProvider(databasePath) {
  const database = new Database(databasePath);
  database.exec(`
    CREATE TABLE providers (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      enabled INTEGER NOT NULL,
      read_only INTEGER NOT NULL,
      config_json TEXT NOT NULL,
      credentials_encrypted TEXT,
      last_tested_at TEXT,
      last_error TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  const now = new Date().toISOString();
  database
    .prepare(
      `INSERT INTO providers VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      "provider-1",
      "portainer",
      "Lifecycle test Portainer",
      1,
      1,
      "{}",
      null,
      null,
      "",
      now,
      now
    );
  database.close();
}

async function waitForServer(url) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // The dev server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Timed out waiting for the stack lifecycle test server.");
}

async function main() {
  const port = await findOpenPort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const databasePath = path.join(os.tmpdir(), `unihomelabdash-stack-sheet-${process.pid}.sqlite`);
  seedProvider(databasePath);
  const nextDevArgs = [
    path.join(root, "node_modules", "next", "dist", "bin", "next"),
    "dev",
    "-H",
    "127.0.0.1",
    "-p",
    String(port),
  ];
  assert.deepEqual(
    nextDevArgs.slice(2, 4),
    ["-H", "127.0.0.1"],
    "The lifecycle test server must be loopback-bound before auth is disabled."
  );
  const server = spawn(
    process.execPath,
    nextDevArgs,
    {
      cwd: root,
      env: {
        ...process.env,
        AUTH_DISABLED: "true",
        ALLOWED_DEV_ORIGIN: "127.0.0.1",
        DATABASE_PATH: databasePath,
      },
      stdio: "inherit",
    }
  );

  let browser;
  try {
    await waitForServer(`${baseUrl}/stacks`);
    browser = await chromium.launch();
    const page = await browser.newPage();
    await page.addInitScript(() => {
      const nativeFetch = window.fetch.bind(window);
      window.__stackDetailLifecycle = {
        containerRequestStarted: false,
        containerRequestAborted: false,
        containerRequestCount: 0,
        resolveContainerRequest: null,
      };
      window.fetch = (input, init) => {
        const url = String(input);
        if (url.includes("/api/stacks/") && url.endsWith("/containers")) {
          window.__stackDetailLifecycle.containerRequestStarted = true;
          window.__stackDetailLifecycle.containerRequestCount += 1;
          return new Promise((resolve, reject) => {
            window.__stackDetailLifecycle.resolveContainerRequest = resolve;
            init?.signal?.addEventListener("abort", () => {
              window.__stackDetailLifecycle.containerRequestAborted = true;
              reject(new DOMException("The operation was aborted.", "AbortError"));
            });
          });
        }
        return nativeFetch(input, init);
      };
    });
    const stack = {
      id: "provider-1:42",
      name: "Media",
      status: "active",
      reportedStatus: "active",
      endpointStatus: "connected",
      type: "Compose",
      endpointId: 7,
      endpointName: "Docker host",
      providerId: "provider-1",
      providerName: "Lifecycle test Portainer",
    };

    await page.route("**/api/stacks", (route) =>
      route.fulfill({ contentType: "application/json", body: JSON.stringify({ stacks: [stack] }) })
    );

    await page.goto(`${baseUrl}/stacks`, { waitUntil: "domcontentloaded" });
    const trigger = page.getByRole("button", { name: "View containers for Media" });
    await trigger.waitFor({ state: "visible", timeout: 10_000 });
    await trigger.click();
    await page.waitForFunction(() => window.__stackDetailLifecycle.containerRequestStarted);
    const sheet = page.locator('[data-slot="sheet-content"]');
    await sheet.waitFor({ state: "visible" });
    await sheet.getByText("Compose stack").waitFor({ state: "visible" });
    await sheet.getByText("Status: active").waitFor({ state: "visible" });
    await sheet.getByText("Last reported lifecycle: active").waitFor({ state: "visible" });
    await sheet.getByRole("status").getByText("Loading read-only container membership.").waitFor({
      state: "attached",
    });
    await page.evaluate(() => {
      window.__stackDetailLifecycle.resolveContainerRequest?.(
        new Response(JSON.stringify({ containers: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      );
    });
    await sheet.getByRole("status").getByText("No containers found for this stack.").waitFor({
      state: "attached",
    });

    await page.keyboard.press("Escape");
    assert.equal(
      await trigger.evaluate((element) => document.activeElement === element),
      true,
      "closing the drawer should restore focus to its stack trigger"
    );

    await page.evaluate(() => {
      window.__stackDetailLifecycle.containerRequestStarted = false;
      window.__stackDetailLifecycle.containerRequestAborted = false;
    });
    await trigger.click();
    await page.waitForFunction(
      () =>
        window.__stackDetailLifecycle.containerRequestStarted &&
        window.__stackDetailLifecycle.containerRequestCount === 2
    );
    await sheet.waitFor({ state: "visible" });
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => window.__stackDetailLifecycle.containerRequestAborted);
    assert.equal(
      await trigger.evaluate((element) => document.activeElement === element),
      true,
      "closing a pending request should restore focus to its stack trigger"
    );

    console.log("PASS stack detail sheet closes, aborts its request, and restores trigger focus");
  } finally {
    await browser?.close();
    if (server.exitCode === null) {
      server.kill("SIGTERM");
      await once(server, "exit");
    }
    if (fs.existsSync(databasePath)) {
      fs.unlinkSync(databasePath);
    }
  }
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
