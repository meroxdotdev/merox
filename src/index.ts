// Worker script for Cloudflare Pages with environment variables and KV bindings
// This script serves static assets and enables environment variable access

type Fetcher = {
  fetch(request: Request): Promise<Response>;
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Defer to static assets - Cloudflare Pages will handle routing
    // This script exists to enable environment variables and KV bindings
    return env.ASSETS.fetch(request);
  },
};

interface Env {
  ASSETS: Fetcher;
  // KV namespace for reactions
  REACTIONS_KV: KVNamespace;
  // Environment variables (add your API keys here)
  // These will be available via env.* at runtime
  // Example: env.UMAMI_API_KEY, env.GISCUS_REPO_ID, env.LASTFM_API_KEY
}
