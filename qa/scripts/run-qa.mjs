import { spawn } from "node:child_process";

const runId = process.env.QA_RUN_ID || Date.now().toString();
const env = {
  ...process.env,
  QA_RUN_ID: runId,
};

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      env,
      shell: false,
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });

    child.on("error", reject);
  });
}

async function main() {
  const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

  console.log(`Running QA with shared QA_RUN_ID=${runId}`);
  await runCommand(npmCmd, ["run", "test:api"]);
  await runCommand(npmCmd, ["run", "test:ui"]);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
