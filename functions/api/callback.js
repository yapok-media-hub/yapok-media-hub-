// Retour de GitHub : échange le code contre un jeton et le transmet à Decap CMS.
export async function onRequest(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookie = request.headers.get("Cookie") || "";
  const saved = (cookie.match(/(?:^|;\s*)decap_state=([^;]+)/) || [])[1];

  if (!code || !state || state !== saved) {
    return page("error", { message: "Connexion refusée : la session a expiré. Fermez cette fenêtre et réessayez." });
  }

  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": "yapok-media-hub" },
    body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code })
  });
  const data = await res.json().catch(() => ({}));
  if (!data.access_token) {
    return page("error", { message: "GitHub n'a pas délivré de jeton. Vérifiez l'application OAuth." });
  }
  return page("success", { token: data.access_token, provider: "github" });
}

function page(status, content) {
  const msg = `authorization:github:${status}:${JSON.stringify(content)}`;
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Connexion</title></head><body>
<p>Connexion en cours…</p>
<script>
(function () {
  var msg = ${JSON.stringify(msg)};
  function receive(e) {
    window.opener.postMessage(msg, e.origin);
    window.removeEventListener("message", receive, false);
  }
  window.addEventListener("message", receive, false);
  window.opener && window.opener.postMessage("authorizing:github", "*");
})();
</script></body></html>`;
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Set-Cookie": "decap_state=; Path=/api; Max-Age=0; HttpOnly; Secure; SameSite=Lax"
    }
  });
}
