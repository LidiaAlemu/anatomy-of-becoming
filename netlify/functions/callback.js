function getSiteUrl() {
  return (process.env.SITE_URL || process.env.URL || process.env.DEPLOY_PRIME_URL || "https://anatomy-of-becoming.netlify.app").replace(
    /\/$/,
    ""
  );
}

function getRedirectUri(siteUrl) {
  return (process.env.OAUTH_REDIRECT_URI || `${siteUrl}/callback`).replace(/\/$/, "");
}

function authResponseHtml(provider, message, content) {
  const payload = JSON.stringify(content);
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Authorizing…</title></head>
<body>
<script>
(function() {
  function receiveMessage(e) {
    window.opener.postMessage(
      "authorization:${provider}:${message}:${payload}",
      e.origin
    );
  }
  window.addEventListener("message", receiveMessage, false);
  window.opener.postMessage("authorizing:${provider}", "*");
})();
</script>
</body>
</html>`;
}

exports.handler = async function (event) {
  const code = event.queryStringParameters?.code;
  if (!code) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
      body: authResponseHtml("github", "error", { error: "Missing authorization code" }),
    };
  }

  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
      body: authResponseHtml("github", "error", {
        error: "Missing OAUTH_CLIENT_ID or OAUTH_CLIENT_SECRET on Netlify",
      }),
    };
  }

  const redirectUri = getRedirectUri(getSiteUrl());

  try {
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });
    const tokenData = await tokenResponse.json();
    if (tokenData.error) {
      throw new Error(tokenData.error_description || tokenData.error);
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
      body: authResponseHtml("github", "success", {
        token: tokenData.access_token,
        provider: "github",
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
      body: authResponseHtml("github", "error", { error: error.message }),
    };
  }
};
