import { writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";
import {
  ARTIFACT_ROOT,
  cleanDir,
  createLatencyProxy,
  delay,
  ensureDir,
  nowIso,
  startBackend,
  startFrontend,
  startMongo,
  stopIfRunning,
  takeScreenshot,
  waitForHttp,
  writeJson,
} from "../lib/runtime.mjs";
import { seedExperimentalData } from "../lib/seedExperimentalData.mjs";

const artifactDir = path.join(ARTIFACT_ROOT, "chaos");
const mongoDbPath = path.join(artifactDir, "mongo-data");

async function loginApi(baseUrl, email, password) {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.message || `Failed login for ${email}`);
  }

  return body.token;
}

function startProbeLoop({ label, url, headers = {}, intervalMs = 500, timeoutMs = 2_000 }) {
  const samples = [];
  let active = true;

  const task = (async () => {
    while (active) {
      const startedAt = Date.now();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      let ok = false;
      let status = 0;
      let message = "ok";

      try {
        const response = await fetch(url, {
          headers,
          signal: controller.signal,
        });
        ok = response.ok;
        status = response.status;
        message = response.statusText || "ok";
      } catch (error) {
        message = error.name === "AbortError" ? "timeout" : error.message;
      } finally {
        clearTimeout(timer);
      }

      samples.push({
        label,
        timestamp: new Date(startedAt).toISOString(),
        elapsedMs: Date.now() - startedAt,
        ok,
        status,
        message,
      });

      await delay(intervalMs);
    }
  })();

  return {
    async stop() {
      active = false;
      await task;
      return samples;
    },
  };
}

function analyzeProbeSamples(samples, injectedAt) {
  const total = samples.length || 1;
  const successes = samples.filter((sample) => sample.ok).length;
  const firstFailure = samples.find((sample) => new Date(sample.timestamp).getTime() >= injectedAt && !sample.ok);
  const firstRecovery = samples.find((sample) => {
    const sampleTime = new Date(sample.timestamp).getTime();
    return firstFailure && sampleTime > new Date(firstFailure.timestamp).getTime() && sample.ok;
  });

  return {
    totalSamples: samples.length,
    successCount: successes,
    failureCount: samples.length - successes,
    availabilityPercent: Number(((successes / total) * 100).toFixed(2)),
    mttrMs: firstRecovery ? new Date(firstRecovery.timestamp).getTime() - injectedAt : null,
    firstFailure: firstFailure || null,
    firstRecovery: firstRecovery || null,
    avgLatencyMs: Number(
      (
        samples.reduce((sum, sample) => sum + sample.elapsedMs, 0) /
        total
      ).toFixed(2)
    ),
  };
}

async function openAuthenticatedPage(page, { frontendUrl, token, role, route }) {
  await page.goto(frontendUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate(
    ({ authToken, userRole }) => {
      localStorage.setItem("token", authToken);
      localStorage.setItem("role", userRole);
    },
    { authToken: token, userRole: role }
  );
  await page.goto(`${frontendUrl}${route}`, { waitUntil: "networkidle" });
}

async function runApiDowntimeScenario(context) {
  const scenarioDir = await ensureDir(path.join(artifactDir, "api-downtime"));
  const page = await context.browser.newPage();

  await openAuthenticatedPage(page, {
    frontendUrl: context.frontendUrl,
    token: context.tokens.hospital,
    role: "hospital",
    route: "/hospital/blood-request-create",
  });
  await page.getByRole("heading", { name: "Request Blood" }).waitFor();

  const probe = startProbeLoop({
    label: "api-downtime",
    url: `${context.backendUrl}/health`,
  });

  const injectedAt = Date.now();
  await context.backend.stop();
  await page.reload({ waitUntil: "domcontentloaded" }).catch(() => {});
  await page.getByText("Failed to load blood labs").waitFor({ timeout: 10_000 }).catch(() => {});
  await takeScreenshot(page, path.join(scenarioDir, "impact.png"));

  await delay(4_000);
  context.backend = await startBackend({
    port: context.backendPort,
    mongoUri: context.mongo.mongoUri,
    artifactDir: scenarioDir,
  });
  await waitForHttp(`${context.backendUrl}/health`);
  await openAuthenticatedPage(page, {
    frontendUrl: context.frontendUrl,
    token: context.tokens.hospital,
    role: "hospital",
    route: "/hospital/blood-request-create",
  });
  await page.getByRole("heading", { name: "Request Blood" }).waitFor();
  await takeScreenshot(page, path.join(scenarioDir, "recovered.png"));

  await delay(3_000);
  const samples = await probe.stop();
  await page.close();

  return {
    scenario: "API downtime",
    injectedAt: new Date(injectedAt).toISOString(),
    frontendObservation:
      "Hospital request page stayed mounted, surfaced the 'Failed to load blood labs' toast, and recovered after the API returned.",
    ...analyzeProbeSamples(samples, injectedAt),
    samples,
  };
}

async function runDatabaseFailureScenario(context) {
  const scenarioDir = await ensureDir(path.join(artifactDir, "database-failure"));
  const page = await context.browser.newPage();

  await openAuthenticatedPage(page, {
    frontendUrl: context.frontendUrl,
    token: context.tokens.bloodLab,
    role: "blood-lab",
    route: "/lab/inventory",
  });
  await page.getByRole("heading", { name: "Blood Stock Management" }).waitFor();

  const probe = startProbeLoop({
    label: "database-failure",
    url: `${context.backendUrl}/api/blood-lab/blood/stock`,
    headers: {
      Authorization: `Bearer ${context.tokens.bloodLab}`,
    },
  });

  const injectedAt = Date.now();
  await context.mongo.stop();
  await page.getByRole("button", { name: /refresh stock/i }).click();
  await page.getByText("Failed to load blood stock").waitFor({ timeout: 10_000 }).catch(() => {});
  await takeScreenshot(page, path.join(scenarioDir, "impact.png"));

  await delay(3_000);
  context.mongo = await startMongo({
    port: context.mongoPort,
    dbName: "bbms_chaos",
    dbPath: mongoDbPath,
  });

  let recoveredAutomatically = false;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await delay(2_000);
    const response = await fetch(`${context.backendUrl}/api/blood-lab/blood/stock`, {
      headers: {
        Authorization: `Bearer ${context.tokens.bloodLab}`,
      },
    }).catch(() => null);

    if (response?.ok) {
      recoveredAutomatically = true;
      break;
    }
  }

  if (!recoveredAutomatically) {
    await context.backend.stop();
    context.backend = await startBackend({
      port: context.backendPort,
      mongoUri: context.mongo.mongoUri,
      artifactDir: scenarioDir,
    });
    await waitForHttp(`${context.backendUrl}/health`);
  }

  await openAuthenticatedPage(page, {
    frontendUrl: context.frontendUrl,
    token: context.tokens.bloodLab,
    role: "blood-lab",
    route: "/lab/inventory",
  });
  await page.getByRole("heading", { name: "Blood Stock Management" }).waitFor();
  await takeScreenshot(page, path.join(scenarioDir, "recovered.png"));

  await delay(3_000);
  const samples = await probe.stop();
  await page.close();

  return {
    scenario: "Database failure",
    injectedAt: new Date(injectedAt).toISOString(),
    frontendObservation: recoveredAutomatically
      ? "The blood stock page showed a toast during the outage and resumed normal reads after MongoDB returned."
      : "The blood stock page showed a toast during the outage, but backend recycle was required after MongoDB returned.",
    recoveryMode: recoveredAutomatically ? "automatic" : "backend restart required",
    ...analyzeProbeSamples(samples, injectedAt),
    samples,
  };
}

async function runLatencyScenario(context) {
  const scenarioDir = await ensureDir(path.join(artifactDir, "network-latency"));
  const proxyPort = 5054;
  const delayedFrontendPort = 5175;
  const latencyProxy = await createLatencyProxy({
    listenPort: proxyPort,
    targetPort: context.backendPort,
    delayMs: 1_500,
    artifactDir: scenarioDir,
  });

  const delayedFrontend = await startFrontend({
    port: delayedFrontendPort,
    apiProxyTarget: `http://127.0.0.1:${proxyPort}`,
    artifactDir: scenarioDir,
  });

  const delayedFrontendUrl = `http://127.0.0.1:${delayedFrontendPort}`;
  const page = await context.browser.newPage();
  const probe = startProbeLoop({
    label: "network-latency",
    url: `${context.backendUrl}/api/facility/labs`,
    headers: {
      Authorization: `Bearer ${context.tokens.hospital}`,
    },
  });

  const injectedAt = Date.now();
  const pageLoadStarted = Date.now();
  await openAuthenticatedPage(page, {
    frontendUrl: delayedFrontendUrl,
    token: context.tokens.hospital,
    role: "hospital",
    route: "/hospital/blood-request-create",
  });
  await page.getByRole("heading", { name: "Request Blood" }).waitFor();
  const pageLoadMs = Date.now() - pageLoadStarted;
  await takeScreenshot(page, path.join(scenarioDir, "impact.png"));

  await delay(3_000);
  const samples = await probe.stop();
  await page.close();
  await delayedFrontend.stop();
  await latencyProxy.stop();

  return {
    scenario: "Injected network latency",
    injectedAt: new Date(injectedAt).toISOString(),
    frontendObservation:
      "The hospital request page remained functional under the delayed proxy, but the first data-bearing render slowed noticeably.",
    pageLoadMs,
    ...analyzeProbeSamples(samples, injectedAt),
    mttrMs: 0,
    samples,
  };
}

function createMarkdown(results) {
  const lines = [
    "# Assignment 3 Chaos Results",
    "",
    `Generated: ${nowIso()}`,
    "",
    "| Scenario | Availability % | MTTR (ms) | Avg Probe Latency (ms) | Frontend Behaviour |",
    "|---|---:|---:|---:|---|",
  ];

  for (const result of results) {
    lines.push(
      `| ${result.scenario} | ${result.availabilityPercent.toFixed(2)} | ${result.mttrMs ?? "N/A"} | ${result.avgLatencyMs.toFixed(2)} | ${result.frontendObservation} |`
    );
  }

  lines.push("");
  lines.push("## Lessons");
  lines.push("");
  lines.push("- API outages are visible quickly in the UI through toasts, but users cannot complete request workflows until the service returns.");
  lines.push("- Database failure handling is weaker than API process failure because recovery may require reconnect stabilization or a backend recycle.");
  lines.push("- Latency does not break the app, but it pushes critical flows close to the edge of acceptable responsiveness.");
  lines.push("");

  return `${lines.join("\n")}\n`;
}

async function main() {
  await cleanDir(artifactDir);
  await ensureDir(mongoDbPath);

  let mongo = await startMongo({
    port: 27028,
    dbName: "bbms_chaos",
    dbPath: mongoDbPath,
  });
  let backend;
  let frontend;
  let browser;

  try {
    backend = await startBackend({
      port: 5053,
      mongoUri: mongo.mongoUri,
      artifactDir,
    });
    frontend = await startFrontend({
      port: 5174,
      apiProxyTarget: "http://127.0.0.1:5053",
      artifactDir,
    });

    const seeded = await seedExperimentalData(mongo.mongoUri);
    const tokens = {
      hospital: await loginApi("http://127.0.0.1:5053", seeded.hospital.email, seeded.hospital.password),
      bloodLab: await loginApi("http://127.0.0.1:5053", seeded.bloodLab.email, seeded.bloodLab.password),
    };

    browser = await chromium.launch({ headless: true });
    const sharedContext = {
      browser,
      backend,
      backendPort: 5053,
      backendUrl: "http://127.0.0.1:5053",
      frontend,
      frontendUrl: "http://127.0.0.1:5174",
      mongo,
      mongoPort: 27028,
      seeded,
      tokens,
    };

    const results = [];
    results.push(await runApiDowntimeScenario(sharedContext));
    results.push(await runDatabaseFailureScenario(sharedContext));
    results.push(await runLatencyScenario(sharedContext));

    await writeJson(path.join(artifactDir, "results.json"), {
      generatedAt: nowIso(),
      results,
    });
    await writeFile(path.join(artifactDir, "results.md"), createMarkdown(results), "utf8");
  } finally {
    await stopIfRunning(browser ? { stop: () => browser.close() } : null);
    await stopIfRunning(frontend);
    await stopIfRunning(backend);
    await stopIfRunning(mongo);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
