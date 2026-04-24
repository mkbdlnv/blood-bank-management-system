import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ARTIFACT_ROOT,
  QA_ROOT,
  cleanDir,
  createProcessSampler,
  ensureDir,
  nowIso,
  readJson,
  runCommand,
  startBackend,
  startMongo,
  stopIfRunning,
  writeJson,
} from "../lib/runtime.mjs";
import {
  disconnectExperimentalData,
  seedExperimentalData,
} from "../lib/seedExperimentalData.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const artifactDir = path.join(ARTIFACT_ROOT, "performance");
const scenarioScript = path.join(__dirname, "bbms-scenario.js");

const profile = process.env.CI ? "ci" : "local";

const thresholds = {
  login: {
    load: { avg: 300, median: 250, p95: 500, errorRate: 0.01 },
    stress: { avg: 450, median: 400, p95: 800, errorRate: 0.02 },
    spike: { avg: 650, median: 600, p95: 1_100, errorRate: 0.03 },
    endurance: { avg: 350, median: 300, p95: 650, errorRate: 0.01 },
  },
  request: {
    load: { avg: 350, median: 300, p95: 650, errorRate: 0.01 },
    stress: { avg: 550, median: 500, p95: 950, errorRate: 0.02 },
    spike: { avg: 800, median: 750, p95: 1_300, errorRate: 0.03 },
    endurance: { avg: 450, median: 400, p95: 850, errorRate: 0.02 },
  },
  stock: {
    load: { avg: 320, median: 280, p95: 600, errorRate: 0.01 },
    stress: { avg: 500, median: 450, p95: 900, errorRate: 0.02 },
    spike: { avg: 750, median: 700, p95: 1_200, errorRate: 0.03 },
    endurance: { avg: 420, median: 360, p95: 750, errorRate: 0.02 },
  },
};

const executionProfiles = {
  local: {
    load: { vus: 12, duration: "20s" },
    stress: { vus: 20, maxVus: 36, duration: "40s" },
    spike: { vus: 12, maxVus: 60, duration: "25s" },
    endurance: { vus: 10, duration: "45s" },
  },
  ci: {
    load: { vus: 8, duration: "12s" },
    stress: { vus: 14, maxVus: 24, duration: "20s" },
    spike: { vus: 8, maxVus: 35, duration: "18s" },
    endurance: { vus: 6, duration: "25s" },
  },
};

const targets = [
  {
    id: "login",
    label: "Auth Login",
    endpoint: "POST /api/auth/login",
  },
  {
    id: "request",
    label: "Hospital Blood Request Creation",
    endpoint: "POST /api/hospital/blood/request",
  },
  {
    id: "stock",
    label: "Blood Stock Update",
    endpoint: "POST /api/blood-lab/blood/add",
  },
];
const requestedTargets = (process.env.PERFORMANCE_TARGETS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const requestedScenarios = (process.env.PERFORMANCE_SCENARIOS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

function metricValue(metric, key) {
  if (!metric) return 0;
  if (metric.values && key in metric.values) {
    return Number(metric.values[key] || 0);
  }
  return Number(metric[key] || 0);
}

function evaluateThreshold(result, targetId, scenarioId) {
  const targetThreshold = thresholds[targetId][scenarioId];

  const checks = {
    avg: result.avgMs <= targetThreshold.avg,
    median: result.medianMs <= targetThreshold.median,
    p95: result.p95Ms <= targetThreshold.p95,
    errorRate: result.errorRate <= targetThreshold.errorRate,
  };

  return {
    ...checks,
    passed: Object.values(checks).every(Boolean),
  };
}

function createMarkdown(results) {
  const lines = [
    "# Assignment 3 Performance Results",
    "",
    `Generated: ${nowIso()}`,
    "",
    "## Threshold Plan",
    "",
    "| Endpoint | Scenario | Avg <= (ms) | Median <= (ms) | P95 <= (ms) | Error Rate <= |",
    "|---|---|---:|---:|---:|---:|",
  ];

  for (const target of targets) {
    for (const [scenarioId, targetThreshold] of Object.entries(thresholds[target.id])) {
      lines.push(
        `| ${target.label} | ${scenarioId} | ${targetThreshold.avg} | ${targetThreshold.median} | ${targetThreshold.p95} | ${(targetThreshold.errorRate * 100).toFixed(1)}% |`
      );
    }
  }

  lines.push("");
  lines.push("## Execution Metrics");
  lines.push("");
  lines.push("| Endpoint | Scenario | Avg (ms) | Median (ms) | P95 (ms) | Throughput (req/s) | Error Rate | Avg CPU % | Max CPU % | Avg Mem (MB) | Max Mem (MB) | Status |");
  lines.push("|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|");

  for (const result of results) {
    lines.push(
      `| ${result.targetLabel} | ${result.scenario} | ${result.avgMs.toFixed(2)} | ${result.medianMs.toFixed(2)} | ${result.p95Ms.toFixed(2)} | ${result.throughputRps.toFixed(2)} | ${(result.errorRate * 100).toFixed(2)}% | ${result.cpu.avgCpuPercent.toFixed(2)} | ${result.cpu.maxCpuPercent.toFixed(2)} | ${result.cpu.avgMemoryMb.toFixed(2)} | ${result.cpu.maxMemoryMb.toFixed(2)} | ${result.thresholds.passed ? "PASS" : "FAIL"} |`
    );
  }

  lines.push("");
  lines.push("## Notes");
  lines.push("");
  lines.push("- CPU and memory samples were captured from the Express backend process once per second during each k6 run.");
  lines.push("- Endurance duration is shortened for reproducible local/CI execution and should be extended to 15-30 minutes for a larger-scale study.");
  lines.push("");

  return `${lines.join("\n")}\n`;
}

async function main() {
  await cleanDir(artifactDir);

  const mongo = process.env.EXPERIMENTAL_MONGO_URI
    ? {
        mongoUri: process.env.EXPERIMENTAL_MONGO_URI,
        async stop() {},
      }
    : await startMongo({ port: 27027, dbName: "bbms_performance" });
  let backend;

  try {
    backend = await startBackend({
      port: 5051,
      mongoUri: mongo.mongoUri,
      artifactDir,
    });

    const results = [];
    const profileConfig = executionProfiles[profile];

    for (const target of targets.filter((item) => !requestedTargets.length || requestedTargets.includes(item.id))) {
      for (const scenarioId of ["load", "stress", "spike", "endurance"].filter((item) => !requestedScenarios.length || requestedScenarios.includes(item))) {
        console.log(`[performance] Starting ${target.id}/${scenarioId} (${profile} profile)`);
        const runId = `${target.id}-${scenarioId}`;
        const runDir = await ensureDir(path.join(artifactDir, runId));
        const summaryPath = path.join(runDir, "summary.json");
        const logPath = path.join(runDir, "k6.log");

        const seeded = await seedExperimentalData(mongo.mongoUri);
        const sampler = createProcessSampler(backend.child.pid, 1_000);
        const targetThresholds = thresholds[target.id][scenarioId];
        const execution = profileConfig[scenarioId];

        sampler.start();
        const commandResult = await runCommand(
          "k6",
          ["run", "--summary-export", summaryPath, scenarioScript],
          {
            cwd: QA_ROOT,
            env: {
              BASE_URL: "http://127.0.0.1:5051",
              TARGET: target.id,
              SCENARIO: scenarioId,
              VUS: String(execution.vus),
              MAX_VUS: String(execution.maxVus || execution.vus),
              DURATION: execution.duration,
              AVG_THRESHOLD_MS: String(targetThresholds.avg),
              MEDIAN_THRESHOLD_MS: String(targetThresholds.median),
              P95_THRESHOLD_MS: String(targetThresholds.p95),
              ERROR_RATE_THRESHOLD: String(targetThresholds.errorRate),
              HOSPITAL_EMAIL: seeded.hospital.email,
              HOSPITAL_PASSWORD: seeded.hospital.password,
              LAB_EMAIL: seeded.bloodLab.email,
              LAB_PASSWORD: seeded.bloodLab.password,
              LAB_ID: seeded.bloodLab.id,
              LOGIN_ACCOUNTS_JSON: JSON.stringify(seeded.loginPool),
            },
            timeoutMs: 180_000,
          }
        );
        const cpu = await sampler.stop();

        await writeJson(path.join(runDir, "k6-command.json"), commandResult);
        await ensureDir(path.dirname(logPath));
        await writeFile(logPath, `${commandResult.stdout}\n${commandResult.stderr}`, "utf8");

        const summary = await readJson(summaryPath);
        const result = {
          target: target.id,
          targetLabel: target.label,
          endpoint: target.endpoint,
          scenario: scenarioId,
          avgMs: metricValue(summary.metrics.http_req_duration, "avg"),
          medianMs: metricValue(summary.metrics.http_req_duration, "med"),
          p95Ms: metricValue(summary.metrics.http_req_duration, "p(95)"),
          throughputRps: metricValue(summary.metrics.http_reqs, "rate"),
          errorRate: metricValue(summary.metrics.http_req_failed, "rate"),
          cpu,
          thresholds: null,
          summaryPath,
          logPath,
        };

        result.thresholds = evaluateThreshold(result, target.id, scenarioId);
        results.push(result);
        console.log(
          `[performance] Finished ${target.id}/${scenarioId}: avg=${result.avgMs.toFixed(2)}ms p95=${result.p95Ms.toFixed(2)}ms errors=${(result.errorRate * 100).toFixed(2)}%`
        );
      }
    }

    await writeJson(path.join(artifactDir, "results.json"), {
      generatedAt: nowIso(),
      profile,
      thresholds,
      results,
    });
    await writeFile(path.join(artifactDir, "results.md"), createMarkdown(results), "utf8");
  } finally {
    await disconnectExperimentalData();
    await stopIfRunning(backend);
    await stopIfRunning(mongo);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
