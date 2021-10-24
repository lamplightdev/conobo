const handleSocket = async (request, env, error) => {
  const url = new URL(request.url);

  const [, , type, idString] = url.pathname.split('/');

  switch (type) {
    case 'board':
      const id = env.BOARD.idFromString(idString);
      const obj = env.BOARD.get(id);

      return obj.fetch(request);
  }

  throw Error('Invalid socket route');
};

export { handleSocket };
