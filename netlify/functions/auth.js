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
      body: JSON.stringify({ error: "Missing OAUTH_CLIENT_ID environment variable" }),
    };
  }

  // Decap CMS provider discovery (optional ?provider=github)
  if (event.queryStringParameters?.provider) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        provider: "github",
        authorize_url: buildAuthorizeUrl(clientId, siteUrl),
      }),
    };
  }

  // Standard flow: redirect popup to GitHub
  return {
    statusCode: 302,
    headers: {
      Location: buildAuthorizeUrl(clientId, siteUrl),
    },
    body: "",
  };
};
