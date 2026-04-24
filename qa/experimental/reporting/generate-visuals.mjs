import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ARTIFACT_ROOT } from "../lib/runtime.mjs";

const chartsDir = path.join(ARTIFACT_ROOT, "charts");

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function maxValue(values) {
  return Math.max(...values, 1);
}

function makeBarChart({
  title,
  subtitle,
  labels,
  values,
  output,
  color = "#C2410C",
  valueSuffix = "",
}) {
  const width = 980;
  const height = 560;
  const margin = { top: 90, right: 40, bottom: 120, left: 80 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const barGap = 18;
  const barWidth = Math.max(24, (plotWidth - barGap * (labels.length - 1)) / labels.length);
  const ceiling = maxValue(values) * 1.15;

  const bars = labels.map((label, index) => {
    const value = values[index];
    const barHeight = (value / ceiling) * plotHeight;
    const x = margin.left + index * (barWidth + barGap);
    const y = margin.top + plotHeight - barHeight;
    const valueLabel = Number.isInteger(value) ? `${value}` : value.toFixed(2);

    return `
      <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="8" fill="${color}" />
      <text x="${x + barWidth / 2}" y="${y - 10}" text-anchor="middle" font-size="14" fill="#111827">${esc(valueLabel + valueSuffix)}</text>
      <text x="${x + barWidth / 2}" y="${height - 65}" text-anchor="end" transform="rotate(-35 ${x + barWidth / 2} ${height - 65})" font-size="13" fill="#374151">${esc(label)}</text>
    `;
  }).join("");

  const ticks = 5;
  const grid = Array.from({ length: ticks + 1 }, (_unused, index) => {
    const value = (ceiling / ticks) * index;
    const y = margin.top + plotHeight - (value / ceiling) * plotHeight;

    return `
      <line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" stroke="#E5E7EB" stroke-width="1" />
      <text x="${margin.left - 12}" y="${y + 5}" text-anchor="end" font-size="12" fill="#6B7280">${esc(value.toFixed(0))}</text>
    `;
  }).join("");

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="#FFF7ED" />
      <rect x="24" y="24" width="${width - 48}" height="${height - 48}" rx="22" fill="#FFFFFF" stroke="#F1F5F9" />
      <text x="${margin.left}" y="58" font-size="28" font-weight="700" fill="#111827">${esc(title)}</text>
      <text x="${margin.left}" y="82" font-size="14" fill="#6B7280">${esc(subtitle)}</text>
      ${grid}
      <line x1="${margin.left}" y1="${margin.top + plotHeight}" x2="${width - margin.right}" y2="${margin.top + plotHeight}" stroke="#94A3B8" stroke-width="2" />
      ${bars}
    </svg>
  `;

  return writeFile(output, `${svg}\n`, "utf8");
}

async function main() {
  await mkdir(chartsDir, { recursive: true });

  const performance = JSON.parse(
    await readFile(path.join(ARTIFACT_ROOT, "performance", "results.json"), "utf8")
  );
  const mutation = JSON.parse(
    await readFile(path.join(ARTIFACT_ROOT, "mutation", "results.json"), "utf8")
  );
  const chaos = JSON.parse(
    await readFile(path.join(ARTIFACT_ROOT, "chaos", "results.json"), "utf8")
  );

  const p95ByEndpoint = new Map();
  for (const result of performance.results.filter((item) => item.scenario === "spike")) {
    p95ByEndpoint.set(result.targetLabel, result.p95Ms);
  }

  await makeBarChart({
    title: "Spike Test P95 Latency",
    subtitle: "95th percentile response time for the three highest-risk endpoints under spike load",
    labels: [...p95ByEndpoint.keys()],
    values: [...p95ByEndpoint.values()],
    output: path.join(chartsDir, "performance-p95-spike.svg"),
    color: "#DC2626",
    valueSuffix: " ms",
  });

  const throughputByEndpoint = new Map();
  for (const result of performance.results.filter((item) => item.scenario === "stress")) {
    throughputByEndpoint.set(result.targetLabel, result.throughputRps);
  }

  await makeBarChart({
    title: "Stress Test Throughput",
    subtitle: "Observed requests per second during the stress profile",
    labels: [...throughputByEndpoint.keys()],
    values: [...throughputByEndpoint.values()],
    output: path.join(chartsDir, "performance-throughput-stress.svg"),
    color: "#2563EB",
    valueSuffix: " r/s",
  });

  await makeBarChart({
    title: "Mutation Score by Module",
    subtitle: "Higher is better; surviving mutants indicate missing assertions or edge-case tests",
    labels: mutation.moduleScores.map((item) => item.module.replace(" & ", " / ")),
    values: mutation.moduleScores.map((item) => item.mutationScore),
    output: path.join(chartsDir, "mutation-score-by-module.svg"),
    color: "#7C3AED",
    valueSuffix: "%",
  });

  await makeBarChart({
    title: "Chaos Availability by Scenario",
    subtitle: "Short-window availability during injected failures and degraded conditions",
    labels: chaos.results.map((item) => item.scenario),
    values: chaos.results.map((item) => item.availabilityPercent),
    output: path.join(chartsDir, "chaos-availability.svg"),
    color: "#059669",
    valueSuffix: "%",
  });

  await makeBarChart({
    title: "Chaos MTTR by Scenario",
    subtitle: "Mean time to recovery in milliseconds; latency injection keeps availability but does not require recovery",
    labels: chaos.results.map((item) => item.scenario),
    values: chaos.results.map((item) => item.mttrMs || 0),
    output: path.join(chartsDir, "chaos-mttr.svg"),
    color: "#D97706",
    valueSuffix: " ms",
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
