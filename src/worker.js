import {
  fetchUser,
  setRedirectToAndRedirect,
  handleAuth,
} from './handlers/auth.js';
import { handleHome } from './handlers/home.js';
import { handleBoard } from './handlers/board.js';
import { handleSocket } from './handlers/socket.js';
import { handleError } from './handlers/error.js';

export { User } from './do/user.js';
export { Board } from './do/board.js';

/**
 *
 * @param {Request} request
 * @param {*} env
 * @param {*} ctx
 * @returns {Promise<Response>}
 */
const handleRequest = async (request, env, ctx) => {
  const url = new URL(request.url);

  request.user = await fetchUser(request, env);

  if (url.pathname === '/') {
    return handleHome(request, env, ctx);
  }

  if (['/user', '/signout'].includes(url.pathname)) {
    return handleAuth(request, env, ctx);
  }

  if (url.pathname.indexOf('/board') === 0) {
    if (!request.user) {
      return setRedirectToAndRedirect({
        location: '/user',
        redirectTo: url.pathname,
      });
    }

    return handleBoard(request, env, ctx);
  }

  if (request.user) {
    if (url.pathname.indexOf('/ws/board/') === 0) {
      return handleSocket(request, env, ctx);
    }
  }

  return handleError(request, env, { message: 'Not found', status: 404 });
};

export default {
  async fetch(request, env, ctx) {
    try {
      return await handleRequest(request, env, ctx);
    } catch (error) {
      return handleError(request, env, error);
    }
  },
};
