export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const raw = process.env.WEBDIAG_API_INTERNAL_URL;
    if (raw === "http://api:8000") {
      try {
        const res = await fetch("http://api:8000/ready", { signal: AbortSignal.timeout(2000) });
        const text = await res.text();
        if (res.status === 400 && text.includes("Invalid host header")) {
          console.warn(
            "[INSTRUMENTATION] Dokploy shared network collision detected on http://api:8000. Redirecting WEBDIAG_API_INTERNAL_URL to http://webdiag-webdiagcore-mlnqpr-api-1:8000",
          );
          process.env.WEBDIAG_API_INTERNAL_URL = "http://webdiag-webdiagcore-mlnqpr-api-1:8000";
        }
      } catch (err) {
        // If http://api:8000 is not reachable, test dedicated Dokploy container
        try {
          const fallbackRes = await fetch("http://webdiag-webdiagcore-mlnqpr-api-1:8000/ready", {
            signal: AbortSignal.timeout(2000),
          });
          if (fallbackRes.ok) {
            console.warn(
              "[INSTRUMENTATION] Falling back to dedicated container http://webdiag-webdiagcore-mlnqpr-api-1:8000",
            );
            process.env.WEBDIAG_API_INTERNAL_URL = "http://webdiag-webdiagcore-mlnqpr-api-1:8000";
          }
        } catch {
          // retain original
        }
      }
    }
  }
}
