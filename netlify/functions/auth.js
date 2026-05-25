// netlify/functions/auth.js
const { createClient } = require('@octokit/rest');

exports.handler = async function (event, context) {
  const code = event.queryStringParameters?.code;
  if (!code) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing code parameter' }),
    };
  }

  const client_id = process.env.OAUTH_CLIENT_ID;
  const client_secret = process.env.OAUTH_CLIENT_SECRET;

  if (!client_id || !client_secret) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing client id/secret environment variables' }),
    };
  }

  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id,
        client_secret,
        code,
      }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error_description || data.error);

    // Use the access token to get user info (optional, but good)
    const octokit = new createClient({ auth: data.access_token });
    const user = await octokit.rest.users.getAuthenticated();

    return {
      statusCode: 200,
      body: JSON.stringify({
        token: data.access_token,
        user: user.data.login,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};