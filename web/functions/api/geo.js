// functions/api/geo.js
// Cloudflare Pages Function — returns the visitor's country from CF's edge data.
// Deployed automatically by `wrangler pages deploy` as long as this file lives
// under a top-level `functions/` directory in the project root.

export async function onRequest(context) {
  const country = context.request.headers.get("CF-IPCountry") || "XX";

  return new Response(JSON.stringify({ country }), {
    headers: {
      "Content-Type": "application/json",
      // Short cache is fine — country doesn't change per-visitor mid-session,
      // and this avoids hammering the function on every asset load.
      "Cache-Control": "no-store",
    },
  });
}
