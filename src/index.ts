// Minimal Worker script to enable environment variables in Cloudflare Pages
// This Worker serves static assets and allows environment variable access

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Defer to static assets - Cloudflare Pages will handle routing
    // This script exists only to enable environment variables
    return env.ASSETS.fetch(request);
  },
};

interface Env {
  ASSETS: Fetcher;
  // Add your environment variables here as needed
  // They will be available at runtime via env.*
}
