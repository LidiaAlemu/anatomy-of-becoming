function getSiteUrl() {
  return (process.env.URL || process.env.DEPLOY_PRIME_URL || "https://anatomy-of-becoming.netlify.app").replace(
    /\/$/,
    ""
  );
}

function buildAuthorizeUrl(clientId, siteUrl) {
  const redirectUri = `${siteUrl}/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    scope: "repo user",
    redirect_uri: redirectUri,
  });
  return `https://github.com/login/oauth/authorize?${params}`;
}

exports.handler = async function (event) {
  const clientId = process.env.OAUTH_CLIENT_ID;
  const siteUrl = getSiteUrl();

  if (!clientId) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
      body: "Missing OAUTH_CLIENT_ID environment variable",
    };
  }

  // Always redirect the popup to GitHub (never return JSON in the browser)
  return {
    statusCode: 302,
    headers: {
      Location: buildAuthorizeUrl(clientId, siteUrl),
      "Cache-Control": "no-store",
    },
    body: "",
  };
};
