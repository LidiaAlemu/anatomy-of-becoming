exports.handler = async function (event) {
  // --- Provider discovery request (no code) ---
  if (!event.queryStringParameters?.code && event.queryStringParameters?.provider) {
    const clientId = process.env.OAUTH_CLIENT_ID;
    const siteUrl = process.env.URL || "https://anatomy-of-becoming.netlify.app";
    const redirectUri = `${siteUrl}/.netlify/functions/auth`;

    return {
      statusCode: 200,
      body: JSON.stringify({
        provider: "github",
        authorize_url: `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo&redirect_uri=${encodeURIComponent(redirectUri)}`,
      }),
    };
  }

  // --- Token exchange request (has code) ---
  let code = event.queryStringParameters?.code;
  if (!code && event.body) {
    try {
      const body = JSON.parse(event.body);
      code = body.code;
    } catch (e) {
      const params = new URLSearchParams(event.body);
      code = params.get("code");
    }
  }

  if (!code) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing code parameter" }),
    };
  }

  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Missing client id/secret environment variables" }),
    };
  }

  try {
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    });
    const tokenData = await tokenResponse.json();
    if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error);

    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
    const userData = await userResponse.json();

    return {
      statusCode: 200,
      body: JSON.stringify({ token: tokenData.access_token, user: userData.login }),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};