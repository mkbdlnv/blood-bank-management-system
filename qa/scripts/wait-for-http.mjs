const urls = process.argv.slice(2);

if (urls.length === 0) {
  console.error("Usage: node ./scripts/wait-for-http.mjs <url> [url...]");
  process.exit(1);
}

const timeoutMs = Number(process.env.WAIT_FOR_TIMEOUT_MS || 120_000);
const intervalMs = Number(process.env.WAIT_FOR_INTERVAL_MS || 2_000);

async function waitForUrl(url) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        console.log(`Ready: ${url}`);
        return;
      }
      console.log(`Waiting for ${url} (status ${response.status})`);
    } catch (error) {
      console.log(`Waiting for ${url} (${error.message})`);
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(`Timed out after ${timeoutMs}ms waiting for ${url}`);
}

Promise.all(urls.map(waitForUrl))
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
