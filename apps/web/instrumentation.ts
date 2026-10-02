const DOKPLOY_API_CONTAINER_URL = "http://webdiag-webdiagcore-mlnqpr-api-1:8000";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (process.env.WEBDIAG_API_INTERNAL_URL === "http://api:8000") {
      process.env.WEBDIAG_API_INTERNAL_URL = DOKPLOY_API_CONTAINER_URL;
    }
  }
}
