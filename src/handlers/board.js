import boardsTemplate from '../templates/boards.js';
import boardTemplate from '../templates/board.js';
import boardEditTemplate from '../templates/board-edit.js';

const handleBoard = async (request, env, ctx) => {
  const url = new URL(request.url);

  if (['/boards', '/boards/'].includes(url.pathname)) {
    switch (request.method) {
      case 'GET':
        return renderBoards(request, env, ctx);
      case 'POST':
        return addBoard(request, env, ctx);
    }
  } else if (url.pathname.indexOf('/board/edit/') === 0) {
    switch (request.method) {
      case 'GET':
        return renderEditBoard(request, env, ctx);
      case 'POST':
        return saveBoard(request, env, ctx);
    }
  } else if (url.pathname.indexOf('/board/') === 0) {
    return renderBoard(request, env, ctx);
  }

  throw Error('Invalid method');
};

const renderBoards = async (request, env, ctx) => {
  const userObjId = env.USER.idFromString(request.user._id);
  const userObj = env.USER.get(userObjId);

  const boardsResponse = await userObj.fetch('http://test.com/boards');
  const boards = await boardsResponse.json();

  return new Response(boardsTemplate(env, { user: request.user, boards }), {
    headers: {
      'Content-Type': 'text/html; charset=utf8',
      'Cache-Control':
        'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
    },
  });
};

const addBoard = async (request, env, ctx) => {
  const id = env.BOARD.newUniqueId();
  const boardObj = env.BOARD.get(id);

  try {
    await boardObj.fetch(request);
  } catch (error) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: `/boards`,
      },
    });
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: `/board/${id}`,
    },
  });
};

const renderBoard = async (request, env, ctx) => {
  const url = new URL(request.url);
  const parts = url.pathname.split('/');

  if (parts.length !== 3) {
    throw Error('Invalid route');
  }

  const [, , idParam] = parts;

  const id = env.BOARD.idFromString(idParam);
  const boardObj = env.BOARD.get(id);

  const response = await boardObj.fetch(request);
  const { board, users, notes } = await response.json();

  if (!board) {
    throw Error('Not found');
  }

  return new Response(
    boardTemplate(env, {
      user: request.user,
      board,
      users,
      notes,
    }),
    {
      headers: {
        'Content-Type': 'text/html; charset=utf8',
        'Cache-Control':
          'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
      },
    }
  );
};

const renderEditBoard = async (request, env, ctx) => {
  const url = new URL(request.url);
  const parts = url.pathname.split('/');

  if (parts.length !== 4) {
    throw Error('Invalid route');
  }

  const [, , , idParam] = parts;

  const id = env.BOARD.idFromString(idParam);
  const boardObj = env.BOARD.get(id);

  const response = await boardObj.fetch(request);
  const { board } = await response.json();

  if (board.userId !== request.user._id) {
    throw Error('Not allowed');
  }

  if (!board) {
    throw Error('Not found');
  }

  return new Response(
    boardEditTemplate(env, {
      user: request.user,
      board,
    }),
    {
      headers: {
        'Content-Type': 'text/html; charset=utf8',
        'Cache-Control':
          'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
      },
    }
  );
};

const saveBoard = async (request, env, ctx) => {
  const url = new URL(request.url);
  const parts = url.pathname.split('/');

  if (parts.length !== 4) {
    throw Error('Invalid route');
  }

  const [, , , idParam] = parts;

  const id = env.BOARD.idFromString(idParam);
  const boardObj = env.BOARD.get(id);

  const response = await boardObj.fetch(request.url);
  const { board } = await response.json();

  if (board.userId !== request.user._id) {
    throw Error('Not allowed');
  }

  if (!board) {
    throw Error('Not found');
  }

  try {
    await boardObj.fetch(request);
  } catch (error) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: `/board/edit/${board._id}`,
      },
    });
  }
  return new Response(null, {
    status: 302,
    headers: {
      Location: `/board/${board._id}`,
    },
  });
};

export { handleBoard };
