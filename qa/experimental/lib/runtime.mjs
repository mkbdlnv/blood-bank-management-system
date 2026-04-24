import fs from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as timerDelay } from "node:timers/promises";
import { MongoMemoryServer } from "mongodb-memory-server";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");
export const QA_ROOT = path.resolve(REPO_ROOT, "qa");
export const BACKEND_ROOT = path.resolve(REPO_ROOT, "backend");
export const FRONTEND_ROOT = path.resolve(REPO_ROOT, "frontend");
export const ARTIFACT_ROOT = path.resolve(QA_ROOT, "artifacts", "experimental");
export const delay = timerDelay;

export async function ensureDir(dirPath) {
  await mkdir(dirPath, { recursive: true });
  return dirPath;
}

export async function cleanDir(dirPath) {
  await rm(dirPath, { recursive: true, force: true });
  await ensureDir(dirPath);
}

export async function writeJson(filePath, value) {
  await ensureDir(path.dirname(filePath));
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

export function nowIso() {
  return new Date().toISOString();
}

export function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function waitForPort(port, host = "127.0.0.1", timeoutMs = 60_000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const connected = await new Promise((resolve) => {
      const socket = net.createConnection({ host, port }, () => {
        socket.end();
        resolve(true);
      });

      socket.on("error", () => resolve(false));
    });

    if (connected) {
      return true;
    }

    await timerDelay(250);
  }

  throw new Error(`Timed out waiting for ${host}:${port}`);
}

export async function waitForHttp(url, { timeoutMs = 60_000, intervalMs = 500 } = {}) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return response;
      }
    } catch {
      // Service is still starting.
    }

    await timerDelay(intervalMs);
  }

  throw new Error(`Timed out waiting for ${url}`);
}

export function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function percentile(values, percentileValue) {
  if (!values.length) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((percentileValue / 100) * sorted.length) - 1)
  );
  return sorted[index];
}

export function bytesToMb(bytes) {
  return Number((bytes / (1024 * 1024)).toFixed(2));
}

export async function startMongo({ port = 27027, dbName = "bbms_experimental", dbPath } = {}) {
  const mongoServer = await MongoMemoryServer.create({
    instance: {
      dbName,
      port,
      ip: "127.0.0.1",
      storageEngine: "wiredTiger",
      dbPath,
    },
  });

  return {
    mongoServer,
    mongoUri: mongoServer.getUri(),
    async stop() {
      await mongoServer.stop();
    },
  };
}

export function startCommand({
  command,
  args,
  cwd,
  env,
  logFile,
  name,
}) {
  const logStream = fs.createWriteStream(logFile, { flags: "a" });
  logStream.write(`[${nowIso()}] Starting ${name}: ${command} ${args.join(" ")}\n`);

  const child = spawn(command, args, {
    cwd,
    env: {
      ...process.env,
      ...env,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (chunk) => {
    logStream.write(chunk);
  });

  child.stderr.on("data", (chunk) => {
    logStream.write(chunk);
  });

  const exitPromise = new Promise((resolve) => {
    child.once("exit", (code, signal) => {
      logStream.write(`[${nowIso()}] ${name} exited with code=${code} signal=${signal}\n`);
      logStream.end();
      resolve({ code, signal });
    });
  });

  return {
    child,
    logFile,
    exitPromise,
    async stop(signal = "SIGTERM") {
      if (!child.killed) {
        child.kill(signal);
      }

      const result = await Promise.race([
        exitPromise,
        timerDelay(10_000).then(async () => {
          if (!child.killed) {
            child.kill("SIGKILL");
          }
          return exitPromise;
        }),
      ]);

      return result;
    },
  };
}

export async function startBackend({
  port,
  mongoUri,
  artifactDir,
  jwtSecret = "experimental-secret",
}) {
  const logFile = path.join(artifactDir, "backend.log");
  const backend = startCommand({
    name: "backend",
    command: "node",
    args: ["server.js"],
    cwd: BACKEND_ROOT,
    env: {
      PORT: String(port),
      JWT_SECRET: jwtSecret,
      MONGO_URI: mongoUri,
      NODE_ENV: "development",
      ALLOWED_ORIGINS: `http://127.0.0.1:5173,http://127.0.0.1:${port},http://127.0.0.1`,
    },
    logFile,
  });

  await waitForHttp(`http://127.0.0.1:${port}/health`);

  return backend;
}

export async function startFrontend({
  port,
  apiProxyTarget,
  artifactDir,
}) {
  const logFile = path.join(artifactDir, "frontend.log");
  const frontend = startCommand({
    name: "frontend",
    command: "npm",
    args: ["run", "dev", "--", "--host", "127.0.0.1", "--port", String(port)],
    cwd: FRONTEND_ROOT,
    env: {
      VITE_API_PROXY_TARGET: apiProxyTarget,
    },
    logFile,
  });

  await waitForHttp(`http://127.0.0.1:${port}`);

  return frontend;
}

export async function runCommand(command, args, { cwd = REPO_ROOT, env = {}, timeoutMs = 0 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let timeoutId;

    if (timeoutMs > 0) {
      timeoutId = setTimeout(() => {
        child.kill("SIGKILL");
        reject(new Error(`Command timed out: ${command} ${args.join(" ")}`));
      }, timeoutMs);
    }

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      resolve({
        code,
        signal,
        stdout,
        stderr,
      });
    });
  });
}

export function createProcessSampler(pid, intervalMs = 1_000) {
  const samples = [];
  let timer;

  async function sampleOnce() {
    const result = await runCommand("ps", ["-o", "%cpu=", "-o", "rss=", "-p", String(pid)]);
    if (result.code !== 0) return;

    const line = result.stdout
      .split("\n")
      .map((entry) => entry.trim())
      .find(Boolean);

    if (!line) return;

    const [cpuText, rssKbText] = line.split(/\s+/);
    const cpu = Number(cpuText);
    const rssKb = Number(rssKbText);

    if (Number.isFinite(cpu) && Number.isFinite(rssKb)) {
      samples.push({
        timestamp: nowIso(),
        cpuPercent: cpu,
        rssMb: Number((rssKb / 1024).toFixed(2)),
      });
    }
  }

  return {
    start() {
      timer = setInterval(() => {
        sampleOnce().catch(() => {
          // Ignore transient ps failures while processes are exiting.
        });
      }, intervalMs);
    },
    async stop() {
      if (timer) {
        clearInterval(timer);
      }
      await sampleOnce().catch(() => {});

      return {
        samples,
        avgCpuPercent: Number(average(samples.map((item) => item.cpuPercent)).toFixed(2)),
        maxCpuPercent: Number(Math.max(0, ...samples.map((item) => item.cpuPercent)).toFixed(2)),
        avgMemoryMb: Number(average(samples.map((item) => item.rssMb)).toFixed(2)),
        maxMemoryMb: Number(Math.max(0, ...samples.map((item) => item.rssMb)).toFixed(2)),
      };
    },
  };
}

export async function stopIfRunning(handle) {
  if (handle?.stop) {
    await handle.stop();
  }
}

export async function createLatencyProxy({
  listenPort,
  targetPort,
  delayMs,
  artifactDir,
}) {
  await ensureDir(artifactDir);
  const logFile = path.join(artifactDir, "latency-proxy.log");
  const { createServer, request: httpRequest } = await import("node:http");

  const requests = [];
  const server = createServer((clientReq, clientRes) => {
    const startedAt = Date.now();
    const requestChunks = [];

    clientReq.on("data", (chunk) => requestChunks.push(chunk));
    clientReq.on("end", async () => {
      await timerDelay(delayMs);

      const upstream = httpRequest(
        {
          host: "127.0.0.1",
          port: targetPort,
          path: clientReq.url,
          method: clientReq.method,
          headers: clientReq.headers,
        },
        (upstreamRes) => {
          clientRes.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
          upstreamRes.pipe(clientRes);
        }
      );

      upstream.on("error", (error) => {
        clientRes.statusCode = 502;
        clientRes.end(JSON.stringify({ message: error.message }));
      });

      if (requestChunks.length) {
        upstream.write(Buffer.concat(requestChunks));
      }
      upstream.end();

      requests.push({
        path: clientReq.url,
        method: clientReq.method,
        delayedByMs: delayMs,
        startedAt: new Date(startedAt).toISOString(),
      });
    });
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(listenPort, "127.0.0.1", resolve);
  });

  fs.writeFileSync(logFile, `[${nowIso()}] Latency proxy listening on ${listenPort}\n`, "utf8");

  return {
    async stop() {
      await new Promise((resolve) => server.close(resolve));
      await writeJson(path.join(artifactDir, "latency-proxy-requests.json"), requests);
    },
  };
}

export async function takeScreenshot(page, filePath) {
  await ensureDir(path.dirname(filePath));
  await page.screenshot({ path: filePath, fullPage: true });
}
