import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const viteBin = path.join(root, "node_modules", "vite", "bin", "vite.js");

if (!existsSync(viteBin)) {
  console.error("Dependencies are missing. Run npm.cmd install first on Windows PowerShell.");
  process.exit(1);
}

const children = [];

function run(label, command, args, env = {}) {
  const child = spawn(command, args, {
    cwd: root,
    env: { ...process.env, ...env },
    stdio: "inherit"
  });

  child.on("exit", (code, signal) => {
    if (signal) return;
    if (code !== 0) {
      console.error(`${label} exited with code ${code}`);
      shutdown(code);
    }
  });

  children.push(child);
}

function shutdown(code = 0) {
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

run("api", process.execPath, ["server/index.js"], {
  NODE_ENV: "development",
  PORT: "3001"
});

run("vite", process.execPath, [viteBin, "--host", "127.0.0.1", "--port", "5173"]);
