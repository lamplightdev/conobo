import errorTemplate from '../templates/error.js';

const handleError = (request, env, error) => {
  return new Response(errorTemplate(env, { user: request.user, error }), {
    status: error.status || 500,
    headers: {
      'Content-Type': 'text/html; charset=utf8',
      'Cache-Control':
        'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
    },
  });
};

export { handleError };
