import homeTemplate from '../templates/home.js';

const handleHome = async (request, env, ctx) => {
  return new Response(homeTemplate(env, { user: request.user }), {
    headers: {
      'Content-Type': 'text/html; charset=utf8',
      'Cache-Control':
        'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
    },
  });
};

export { handleHome };
