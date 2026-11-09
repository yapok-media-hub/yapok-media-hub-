// Connexion GitHub pour l'administration (Decap CMS) sur Cloudflare Pages.
// Variables à définir dans Cloudflare Pages : GITHUB_CLIENT_ID et GITHUB_CLIENT_SECRET.
export async function onRequest(context) {
  const { env, request } = context;
  if (!env.GITHUB_CLIENT_ID) {
    return new Response("GITHUB_CLIENT_ID manquant dans les réglages Cloudflare Pages.", { status: 500 });
  }
  const url = new URL(request.url);
  const state = crypto.randomUUID();
  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  authorize.searchParams.set("redirect_uri", `${url.origin}/api/callback`);
  authorize.searchParams.set("scope", "repo,user");
  authorize.searchParams.set("state", state);
  return new Response(null, {
    status: 302,
    headers: {
      Location: authorize.toString(),
      "Set-Cookie": `decap_state=${state}; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
    }
  });
}
