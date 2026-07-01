import { spawn } from "node:child_process";
import { openSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = openSync(path.join(rootDir, "server-detached.log"), "a");
const err = openSync(path.join(rootDir, "server-detached.err.log"), "a");

const child = spawn(process.execPath, ["server/index.js"], {
  cwd: rootDir,
  detached: true,
  env: {
    ...process.env,
    FETCH_ON_START: process.env.FETCH_ON_START || "false"
  },
  stdio: ["ignore", out, err]
});

child.unref();
console.log(`Started RSS dashboard server on http://127.0.0.1:3001 with PID ${child.pid}`);
