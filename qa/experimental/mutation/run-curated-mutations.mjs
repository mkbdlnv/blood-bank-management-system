import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  ARTIFACT_ROOT,
  REPO_ROOT,
  cleanDir,
  ensureDir,
  nowIso,
  runCommand,
  writeJson,
} from "../lib/runtime.mjs";

const artifactDir = path.join(ARTIFACT_ROOT, "mutation");

const mutants = [
  {
    id: "AUTH-LOGIC-001",
    module: "Authentication & Role-Based Access",
    type: "Logical operator change",
    file: "backend/controllers/authContoller.js",
    description: "Allow requests with one missing credential to pass validation.",
    replacement: {
      find: "if (!email || !password)",
      replace: "if (!email && !password)",
    },
    missingTest: "Missing test: reject requests where only one credential is absent (email present/password missing, and vice versa).",
  },
  {
    id: "AUTH-RETURN-002",
    module: "Authentication & Role-Based Access",
    type: "Return value modification",
    file: "backend/controllers/authContoller.js",
    description: "Treat valid passwords as invalid credentials.",
    replacement: {
      find: "if (!isMatch)",
      replace: "if (isMatch)",
    },
    missingTest: "Covered by valid and invalid password tests.",
  },
  {
    id: "AUTH-CONST-003",
    module: "Authentication & Role-Based Access",
    type: "Constant alteration",
    file: "backend/controllers/authContoller.js",
    description: "Treat approved facilities as pending.",
    replacement: {
      find: 'if (user.status === "pending") {',
      replace: 'if (user.status === "approved") {',
    },
    missingTest: "A dedicated test for approved-facility login keeps this from surviving.",
  },
  {
    id: "AUTH-CONST-004",
    module: "Authentication & Role-Based Access",
    type: "Constant alteration",
    file: "backend/controllers/authContoller.js",
    description: "Redirect donor logins to home instead of the donor dashboard.",
    replacement: {
      find: 'if (user.role === "donor") redirect = "/donor";',
      replace: 'if (user.role === "donor") redirect = "/";',
    },
    missingTest: "Covered by the donor login redirect assertion.",
  },
  {
    id: "ADMIN-CONST-001",
    module: "Facility Registration & Admin Approval",
    type: "Constant alteration",
    file: "backend/controllers/adminController.js",
    description: "Leave approved facilities in pending status.",
    replacement: {
      find: 'facility.status = "approved";',
      replace: 'facility.status = "pending";',
    },
    missingTest: "Covered by approval workflow assertions.",
  },
  {
    id: "ADMIN-LOGIC-002",
    module: "Facility Registration & Admin Approval",
    type: "Logical operator change",
    file: "backend/controllers/adminController.js",
    description: "Reject requests that already include a rejection reason.",
    replacement: {
      find: 'if (!rejectionReason) return res.status(400).json({ message: "Rejection reason is required." });',
      replace: 'if (rejectionReason) return res.status(400).json({ message: "Rejection reason is required." });',
    },
    missingTest: "Covered by reject-path validation tests.",
  },
  {
    id: "ADMIN-FILTER-003",
    module: "Facility Registration & Admin Approval",
    type: "Function removal",
    file: "backend/controllers/adminController.js",
    description: "Hide pending facilities from the listing endpoint.",
    replacement: {
      find: "const facilities = await Facility.find();",
      replace: 'const facilities = await Facility.find({ status: "approved" });',
    },
    missingTest: "Covered by the facilities listing test that expects both pending and approved entries.",
  },
  {
    id: "ADMIN-CONST-004",
    module: "Facility Registration & Admin Approval",
    type: "Constant alteration",
    file: "backend/controllers/adminController.js",
    description: "Reject-path sets status back to approved.",
    replacement: {
      find: 'facility.status = "rejected";',
      replace: 'facility.status = "approved";',
    },
    missingTest: "Covered by reject workflow assertions.",
  },
  {
    id: "HOSP-LOGIC-001",
    module: "Hospital Blood Request Workflow",
    type: "Logical operator change",
    file: "backend/controllers/hospitalController.js",
    description: "Allow partially empty request payloads through validation.",
    replacement: {
      find: "if (!labId || !bloodType || !units) {",
      replace: "if (!labId && !bloodType && !units) {",
    },
    missingTest: "Covered by request validation tests.",
  },
  {
    id: "HOSP-CONST-002",
    module: "Hospital Blood Request Workflow",
    type: "Constant alteration",
    file: "backend/controllers/hospitalController.js",
    description: "Accept zero-unit blood requests.",
    replacement: {
      find: "if (units < 1) {",
      replace: "if (units < 0) {",
    },
    missingTest: "Missing test: reject `units = 0` in hospital request creation.",
  },
  {
    id: "HOSP-CONST-003",
    module: "Hospital Blood Request Workflow",
    type: "Constant alteration",
    file: "backend/controllers/hospitalController.js",
    description: "Only pending labs are treated as valid request targets.",
    replacement: {
      find: '      status: "approved" ',
      replace: '      status: "pending" ',
    },
    missingTest: "Covered by approved/pending lab request tests.",
  },
  {
    id: "HOSP-FUNC-004",
    module: "Hospital Blood Request Workflow",
    type: "Function removal",
    file: "backend/controllers/hospitalController.js",
    description: "Skip hospital history logging after request creation.",
    replacement: {
      find: `    // Add to hospital history
    await Facility.findByIdAndUpdate(hospitalId, {
      $push: {
        history: {
          eventType: "Stock Update",
          description: \`Requested \${units} units of \${bloodType} from \${lab.name}\`,
          date: new Date(),
          referenceId: request._id,
        },
      },
    });`,
      replace: "    await Promise.resolve();",
    },
    missingTest: "Missing test: verify hospital history entry and reference id after request creation.",
  },
  {
    id: "LAB-LOGIC-001",
    module: "Blood Stock & Inventory Management",
    type: "Logical operator change",
    file: "backend/controllers/bloodLabController.js",
    description: "Allow invalid stock payloads through add validation.",
    replacement: {
      find: "if (!bloodType || !quantity || quantity <= 0) {",
      replace: "if (!bloodType && !quantity && quantity <= 0) {",
    },
    missingTest: "Missing test: reject partially invalid stock payloads where only one field is bad (for example blank blood type with positive quantity).",
  },
  {
    id: "LAB-RETURN-002",
    module: "Blood Stock & Inventory Management",
    type: "Return value modification",
    file: "backend/controllers/bloodLabController.js",
    description: "Reduce existing stock instead of increasing it on add.",
    replacement: {
      find: "      stock.quantity += Number(quantity);",
      replace: "      stock.quantity -= Number(quantity);",
    },
    missingTest: "Missing test: add to an existing blood type and verify cumulative quantity.",
  },
  {
    id: "LAB-CONST-003",
    module: "Blood Stock & Inventory Management",
    type: "Constant alteration",
    file: "backend/controllers/bloodLabController.js",
    description: "Block removal when requested units equal available stock.",
    replacement: {
      find: "    if (stock.quantity < quantity) {",
      replace: "    if (stock.quantity <= quantity) {",
    },
    missingTest: "Missing test: allow exact-quantity removal and delete the stock record when it reaches zero.",
  },
  {
    id: "LAB-LOGIC-004",
    module: "Blood Stock & Inventory Management",
    type: "Logical operator change",
    file: "backend/controllers/bloodLabController.js",
    description: "Reject valid request-processing actions.",
    replacement: {
      find: '    if (!["accept", "reject"].includes(action)) {',
      replace: '    if (["accept", "reject"].includes(action)) {',
    },
    missingTest: "Covered by accept/reject action tests.",
  },
];

function summarizeStdout(stdout) {
  const interestingLines = stdout
    .split("\n")
    .filter((line) => line.startsWith("FAIL") || line.includes("Test Suites:") || line.includes("Tests:"));

  return interestingLines.slice(0, 10);
}

function applyReplacement(source, { find, replace }) {
  if (!source.includes(find)) {
    throw new Error(`Could not find mutation snippet: ${find}`);
  }

  return source.replace(find, replace);
}

function groupByModule(results) {
  const grouped = new Map();

  for (const result of results) {
    const entry = grouped.get(result.module) || {
      module: result.module,
      created: 0,
      killed: 0,
      survived: 0,
    };
    entry.created += 1;
    if (result.status === "Killed") {
      entry.killed += 1;
    } else {
      entry.survived += 1;
    }
    grouped.set(result.module, entry);
  }

  return [...grouped.values()].map((entry) => ({
    ...entry,
    mutationScore: Number(((entry.killed / entry.created) * 100).toFixed(1)),
  }));
}

function createMarkdown(results, moduleScores, overallScore) {
  const lines = [
    "# Assignment 3 Mutation Results",
    "",
    `Generated: ${nowIso()}`,
    "",
    "## Module Scores",
    "",
    "| Module | Mutants | Killed | Survived | Mutation Score |",
    "|---|---:|---:|---:|---:|",
  ];

  for (const score of moduleScores) {
    lines.push(
      `| ${score.module} | ${score.created} | ${score.killed} | ${score.survived} | ${score.mutationScore.toFixed(1)}% |`
    );
  }

  lines.push(`| Overall | ${results.length} | ${results.filter((item) => item.status === "Killed").length} | ${results.filter((item) => item.status === "Survived").length} | ${overallScore.toFixed(1)}% |`);
  lines.push("");
  lines.push("## Mutant Outcomes");
  lines.push("");
  lines.push("| ID | Module | Type | Status | Missing / Confirmed Coverage Insight |");
  lines.push("|---|---|---|---|---|");

  for (const result of results) {
    lines.push(
      `| ${result.id} | ${result.module} | ${result.type} | ${result.status} | ${result.status === "Survived" ? result.missingTest : "Detected by existing tests"} |`
    );
  }

  lines.push("");
  lines.push("## Recommendations");
  lines.push("");

  for (const result of results.filter((item) => item.status === "Survived")) {
    lines.push(`- ${result.id}: ${result.missingTest}`);
  }

  lines.push("");
  return `${lines.join("\n")}\n`;
}

async function main() {
  await cleanDir(artifactDir);

  const results = [];

  for (const mutant of mutants) {
    const absoluteFile = path.resolve(REPO_ROOT, mutant.file);
    const originalSource = await readFile(absoluteFile, "utf8");
    const mutatedSource = applyReplacement(originalSource, mutant.replacement);
    const mutantDir = await ensureDir(path.join(artifactDir, mutant.id));

    await writeFile(absoluteFile, mutatedSource, "utf8");

    try {
      const execution = await runCommand("npm", ["test"], {
        cwd: path.resolve(REPO_ROOT, "backend"),
        env: {
          NODE_ENV: "test",
        },
        timeoutMs: 240_000,
      });

      const status = execution.code === 0 ? "Survived" : "Killed";
      const result = {
        ...mutant,
        status,
        exitCode: execution.code,
        signal: execution.signal,
        summary: summarizeStdout(`${execution.stdout}\n${execution.stderr}`),
      };

      results.push(result);
      await writeJson(path.join(mutantDir, "result.json"), {
        mutant,
        status,
        exitCode: execution.code,
        signal: execution.signal,
        stdout: execution.stdout,
        stderr: execution.stderr,
      });
    } finally {
      await writeFile(absoluteFile, originalSource, "utf8");
    }
  }

  const moduleScores = groupByModule(results);
  const overallScore = Number(
    ((results.filter((item) => item.status === "Killed").length / results.length) * 100).toFixed(1)
  );

  await writeJson(path.join(artifactDir, "results.json"), {
    generatedAt: nowIso(),
    results,
    moduleScores,
    overallScore,
  });
  await writeFile(
    path.join(artifactDir, "results.md"),
    createMarkdown(results, moduleScores, overallScore),
    "utf8"
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
