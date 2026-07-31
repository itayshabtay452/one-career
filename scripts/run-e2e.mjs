import { spawn } from "node:child_process";

const host = "127.0.0.1";
const port = "3000";
const baseUrl = `http://${host}:${port}`;
const server = spawn(
  process.execPath,
  [
    "./node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    host,
    "--port",
    port,
  ],
  {
    stdio: "inherit",
    windowsHide: true,
  },
);

function waitForExit(child) {
  return new Promise((resolve) => {
    child.once("exit", (code, signal) => resolve({ code, signal }));
  });
}

async function waitForServer() {
  const deadline = Date.now() + 120_000;

  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`Next.js exited before becoming ready (${server.exitCode}).`);
    }

    try {
      const response = await fetch(baseUrl);
      if (response.ok) {
        return;
      }
    } catch {
      // The server is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Timed out waiting for ${baseUrl}.`);
}

async function stopServer() {
  if (server.exitCode !== null) {
    return;
  }

  const exitPromise = waitForExit(server);
  server.kill();

  const stopped = await Promise.race([
    exitPromise.then(() => true),
    new Promise((resolve) => setTimeout(() => resolve(false), 5_000)),
  ]);

  if (!stopped && server.exitCode === null) {
    server.kill("SIGKILL");
    await exitPromise;
  }
}

let testExitCode;

try {
  await waitForServer();

  const playwright = spawn(
    process.execPath,
    ["./node_modules/@playwright/test/cli.js", "test"],
    {
      stdio: "inherit",
      windowsHide: true,
    },
  );
  const result = await waitForExit(playwright);
  testExitCode = result.code ?? 1;
} finally {
  await stopServer();
}

process.exitCode = testExitCode;
