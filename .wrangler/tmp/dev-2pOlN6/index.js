var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.ts
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
var validReactions = ["like", "love", "fire", "celebrate", "clap"];
function isHtmlPageRequest(pathname, acceptHeader) {
  const hasFileExtension = /\.[a-zA-Z0-9]+$/.test(pathname);
  return acceptHeader.includes("text/html") || !hasFileExtension && !pathname.startsWith("/api");
}
__name(isHtmlPageRequest, "isHtmlPageRequest");
async function handle404(request, env, originalResponse) {
  if (request.method !== "GET") {
    return originalResponse;
  }
  const url = new URL(request.url);
  const acceptHeader = request.headers.get("accept") || "";
  if (!isHtmlPageRequest(url.pathname, acceptHeader)) {
    return originalResponse;
  }
  try {
    const notFoundUrl = new URL(request.url);
    notFoundUrl.pathname = "/404";
    const notFoundResponse = await env.ASSETS.fetch(
      new Request(notFoundUrl, request)
    );
    if (notFoundResponse.status === 200) {
      return new Response(notFoundResponse.body, {
        status: 404,
        headers: notFoundResponse.headers
      });
    }
  } catch (error) {
    console.error("Error fetching 404 page:", error);
  }
  return originalResponse;
}
__name(handle404, "handle404");
function handleOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders,
      "Access-Control-Max-Age": "86400"
    }
  });
}
__name(handleOptions, "handleOptions");
async function handleGetReactions(postId, env) {
  try {
    if (!postId) {
      return new Response(JSON.stringify({ error: "Post ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    const stored = await env.REACTIONS_KV.get(`reactions:${postId}`);
    const reactions = stored ? JSON.parse(stored) : {};
    return new Response(JSON.stringify({ reactions }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60",
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error("Error fetching reactions:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch reactions",
        message: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }
}
__name(handleGetReactions, "handleGetReactions");
async function handlePostReaction(postId, request, env) {
  try {
    const body = await request.json();
    const { reactionKey } = body;
    if (!postId) {
      return new Response(JSON.stringify({ error: "Post ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    if (!reactionKey || typeof reactionKey !== "string") {
      return new Response(
        JSON.stringify({ error: "Reaction key is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }
    if (!validReactions.includes(reactionKey)) {
      return new Response(JSON.stringify({ error: "Invalid reaction key" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    const stored = await env.REACTIONS_KV.get(`reactions:${postId}`);
    const reactions = stored ? JSON.parse(stored) : {};
    if (!reactions[reactionKey]) {
      reactions[reactionKey] = 0;
    }
    reactions[reactionKey] += 1;
    await env.REACTIONS_KV.put(`reactions:${postId}`, JSON.stringify(reactions));
    return new Response(
      JSON.stringify({
        success: true,
        reactions,
        count: reactions[reactionKey]
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  } catch (error) {
    console.error("Error updating reactions:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to update reactions",
        message: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }
}
__name(handlePostReaction, "handlePostReaction");
var src_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/reactions/")) {
      const postId = url.pathname.replace("/api/reactions/", "").replace(/\/$/, "");
      if (request.method === "OPTIONS") {
        return handleOptions();
      }
      if (request.method === "GET") {
        return handleGetReactions(postId, env);
      }
      if (request.method === "POST") {
        return handlePostReaction(postId, request, env);
      }
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    const response = await env.ASSETS.fetch(request);
    if (response.status === 404) {
      return handle404(request, env, response);
    }
    return response;
  }
};

// ../../../../../private/var/folders/rt/8hbc6_k16j1_td_h0cvkh45m0000gn/T/cursor-sandbox-cache/91613a8440c875975a01cba87a31770d/npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../../../private/var/folders/rt/8hbc6_k16j1_td_h0cvkh45m0000gn/T/cursor-sandbox-cache/91613a8440c875975a01cba87a31770d/npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-SXdSUH/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// ../../../../../private/var/folders/rt/8hbc6_k16j1_td_h0cvkh45m0000gn/T/cursor-sandbox-cache/91613a8440c875975a01cba87a31770d/npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-SXdSUH/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
