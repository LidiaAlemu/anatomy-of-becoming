exports.handler = async function (event) {
  // Try to get code from multiple places
  let code;
  if (event.queryStringParameters && event.queryStringParameters.code) {
    code = event.queryStringParameters.code;
  } else if (event.body) {
    // Try JSON body
    try {
      const body = JSON.parse(event.body);
      code = body.code;
    } catch (e) {
      // Try URL-encoded body
      const params = new URLSearchParams(event.body);
      code = params.get('code');
    }
  }

  // If still missing, return debug info
  if (!code) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Missing code parameter',
        query: event.queryStringParameters,
        body: event.body,
        method: event.httpMethod,
      }),
    };
  }

  // ... rest of token exchange stays the same
  const client_id = process.env.OAUTH_CLIENT_ID;
  const client_secret = process.env.OAUTH_CLIENT_SECRET;
  if (!client_id || !client_secret) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing client id/secret environment variables' }),
    };
  }

  try {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ client_id, client_secret, code }),
    });
    const tokenData = await tokenResponse.json();
    if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error);

    const userResponse = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: 'application/vnd.github.v3+json' },
    });
    const userData = await userResponse.json();

    return {
      statusCode: 200,
      body: JSON.stringify({ token: tokenData.access_token, user: userData.login }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};