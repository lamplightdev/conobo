import nouserTemplate from '../templates/nouser.js';
import userTemplate from '../templates/user.js';

const _userCookieName = '_clipUser';
const _redirectCookieName = '_clipRedirect';

const _signingAlgorithm = {
  name: 'HMAC',
  hash: 'SHA-512',
};

const handleAuth = (request, env, ctx) => {
  const url = new URL(request.url);

  switch (url.pathname) {
    case '/user':
      return user(request, env, ctx);
    case '/signout':
      return signOut();
    default:
      throw Error('Invalid auth route');
  }
};

const user = async (request, env, ctx) => {
  if (!request.user) {
    if (request.method === 'GET') {
      return new Response(nouserTemplate(env), {
        headers: {
          'Content-Type': 'text/html; charset=utf8',
          'Cache-Control':
            'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
        },
      });
    } else if (request.method === 'POST') {
      const formData = await request.formData();
      const username =
        formData.get('username') && formData.get('username').trim();

      if (username) {
        return setCookieAndRedirect(
          {
            user: {
              identity: `anon:${
                crypto.randomUUID ? crypto.randomUUID() : Date.now()
              }`,
              username: username.substr(0, 32),
              type: 'anon',
            },
            location: '/user',
          },
          env
        );
      } else {
        return new Response(null, {
          status: 302,
          headers: {
            Location: '/user',
          },
        });
      }
    }

    throw Error('Invalid user route');
  }

  if (request.method === 'POST') {
    const formData = await request.formData();
    const username =
      formData.get('username') && formData.get('username').trim();

    if (username) {
      const userObjId = env.USER.idFromString(request.user._id);
      const userObj = env.USER.get(userObjId);

      await userObj.fetch('http://test.com/', {
        method: 'POST',
        body: JSON.stringify({
          username: username.substr(0, 32),
        }),
      });
    }

    return new Response(null, {
      status: 302,
      headers: {
        Location: '/user',
      },
    });
  }

  const cookies = getCookies(request);

  if (cookies[_redirectCookieName]) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: atob(cookies[_redirectCookieName]),
        'Set-Cookie': `${_redirectCookieName}=; Path=/; Max-Age=-1; HttpOnly; Secure; SameSite=Lax`,
      },
    });
  }

  return new Response(userTemplate(env, { user: request.user }), {
    headers: {
      'Content-Type': 'text/html; charset=utf8',
      'Cache-Control':
        'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
    },
  });
};

const signOut = () => {
  const headers = new Headers({
    Location: '/',
  });

  headers.append(
    'Set-Cookie',
    `${_userCookieName}=; Path=/; Max-Age=-1; HttpOnly; Secure; SameSite=Lax`
  );
  headers.append(
    'Set-Cookie',
    `${_redirectCookieName}=; Path=/; Max-Age=-1; HttpOnly; Secure; SameSite=Lax`
  );

  return new Response(null, {
    status: 302,
    headers,
  });
};

const signCookie = async (userId, secret) => {
  const encoder = new TextEncoder();

  const signingKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    _signingAlgorithm,
    false,
    ['sign', 'verify']
  );

  const signature = await crypto.subtle.sign(
    _signingAlgorithm,
    signingKey,
    encoder.encode(userId)
  );

  return `${userId}:${btoa(String.fromCharCode(...new Uint8Array(signature)))}`;
};

const verifyCookie = async (cookie, secret) => {
  const encoder = new TextEncoder();

  const signingKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    _signingAlgorithm,
    false,
    ['sign', 'verify']
  );

  const [userId, signature] = cookie.split(':');

  const verified = await crypto.subtle.verify(
    _signingAlgorithm,
    signingKey,
    Uint8Array.from(atob(signature), (c) => c.charCodeAt(0)),
    encoder.encode(userId)
  );

  if (verified) {
    return userId;
  }

  return null;
};

const setCookieAndRedirect = async ({ user, location }, env) => {
  const userObjId = env.USER.idFromName(user.identity);
  const userObj = env.USER.get(userObjId);

  await userObj.fetch('http://test.com/signin', {
    method: 'POST',
    body: JSON.stringify({
      ...user,
      _id: userObjId.toString(),
    }),
  });

  const signedCookie = await signCookie(
    userObjId.toString(),
    env.COOKIE_SECRET
  );

  return new Response(null, {
    status: 302,
    headers: {
      Location: location,
      'Set-Cookie': `${_userCookieName}=${signedCookie}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`,
    },
  });
};

const setRedirectToAndRedirect = ({ location, redirectTo }) => {
  return new Response(null, {
    status: 302,
    headers: {
      Location: location,
      'Set-Cookie': `${_redirectCookieName}=${btoa(
        redirectTo
      )}; Path=/; Max-Age=300; HttpOnly; Secure; SameSite=Lax`,
    },
  });
};

const getCookies = (request) => {
  const cookieHeader = request.headers.get('cookie');
  const cookies = {};

  if (cookieHeader) {
    for (const cookie of cookieHeader.split(';')) {
      const [name, value] = cookie.split('=');
      cookies[name.trim()] = value.trim();
    }
  }

  return cookies;
};

/**
 *
 * @param {Request} request
 * @returns
 */
const getUserId = (request, env) => {
  const cookies = getCookies(request);

  if (cookies[_userCookieName]) {
    return verifyCookie(cookies[_userCookieName], env.COOKIE_SECRET);
  }

  return null;
};

const fetchUser = async (request, env) => {
  const userId = await getUserId(request, env);

  if (userId) {
    try {
      const userObjId = env.USER.idFromString(userId);
      const userObj = env.USER.get(userObjId);

      if (userObj) {
        const userResponse = await userObj.fetch(
          new Request('http://test.com/')
        );

        return await userResponse.json();
      }
    } catch (error) {
      return undefined;
    }
  }

  return undefined;
};

export { handleAuth, fetchUser, setRedirectToAndRedirect, signOut };
