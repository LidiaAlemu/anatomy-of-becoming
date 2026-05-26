function getSiteUrl() {
  return (process.env.SITE_URL || process.env.URL || process.env.DEPLOY_PRIME_URL || "https://anatomy-of-becoming.netlify.app").replace(
    /\/$/,
    ""
  );
}

function getRedirectUri(siteUrl) {
  return (process.env.OAUTH_REDIRECT_URI || `${siteUrl}/callback`).replace(/\/$/, "");
}

function authResponseHtml(provider, message, content, parentOrigin) {
  const authMessage = `authorization:${provider}:${message}:${JSON.stringify(content)}`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Authorizing…</title></head>
<body>
<p id="status">Finishing sign-in…</p>
<script>
(function() {
  var authMessage = ${JSON.stringify(authMessage)};
  var parentOrigin = ${JSON.stringify(parentOrigin)};
  var sent = false;

  function showError(text) {
    document.getElementById("status").textContent = text;
  }

  function finish() {
    if (sent) return;
    sent = true;
    try {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(authMessage, parentOrigin);
        setTimeout(function() { window.close(); }, 400);
        return;
      }
    } catch (err) {
      showError("Could not send login to the admin window. Close this tab and try again from /admin/.");
      return;
    }
    showError("Lost connection to the admin window. Close this tab, return to /admin/, and click Login with GitHub again.");
  }

  function receiveMessage(e) {
    if (e.origin !== parentOrigin) return;
    finish();
  }

  if (!window.opener || window.opener.closed) {
    showError("This sign-in window is not linked to the admin page. Close this tab, open /admin/, and log in again.");
    return;
  }

  window.addEventListener("message", receiveMessage, false);
  window.opener.postMessage("authorizing:${provider}", parentOrigin);

  setTimeout(function() {
    if (!sent) finish();
  }, 2000);
})();
</script>
</body>
</html>`;
}

const htmlHeaders = {
  "Content-Type": "text/html; charset=utf-8",
  "Cross-Origin-Opener-Policy": "unsafe-none",
  "Cache-Control": "no-store",
};

exports.handler = async function (event) {
  const parentOrigin = getSiteUrl();
  const code = event.queryStringParameters?.code;

  if (!code) {
    return {
      statusCode: 400,
      headers: htmlHeaders,
      body: authResponseHtml("github", "error", { error: "Missing authorization code" }, parentOrigin),
    };
  }

  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return {
      statusCode: 500,
      headers: htmlHeaders,
      body: authResponseHtml("github", "error", {
        error: "Missing OAUTH_CLIENT_ID or OAUTH_CLIENT_SECRET on Netlify",
      }, parentOrigin),
    };
  }

  const redirectUri = getRedirectUri(parentOrigin);

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
      headers: htmlHeaders,
      body: authResponseHtml("github", "success", {
        token: tokenData.access_token,
        provider: "github",
      }, parentOrigin),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: htmlHeaders,
      body: authResponseHtml("github", "error", { error: error.message }, parentOrigin),
    };
  }
};
