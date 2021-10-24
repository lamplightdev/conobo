class User {
  constructor(state, env) {
    this._state = state;
    this._env = env;
  }

  /**
   *
   * @param {Request} request
   * @returns {Promise<Response>}
   */
  async fetch(request) {
    const url = new URL(request.url);

    switch (url.pathname) {
      case '/':
        if (request.method === 'GET') {
          return this.retrieveUser();
        } else if (request.method === 'POST') {
          return this.updateUser(request);
        }
        break;
      case '/signin':
        if (request.method === 'POST') {
          return this.signIn(request);
        }
        break;
      case '/board':
        if (request.method === 'PUT') {
          return this.addBoard(request);
        }
        break;
      case '/boards':
        if (request.method === 'GET') {
          return this.retrieveBoards();
        }
        break;
    }

    throw Error('Invalid user DO route');
  }

  /**
   *
   * @param {Request} request
   * @returns {Promise<Response>}
   */
  async signIn(request) {
    const user = await request.json();

    this._state.storage.put('user', user);

    return new Response();
  }

  async addBoard(request) {
    const board = await request.json();

    this._state.storage.put(`board:${board.dateAdded}:${board.userId}`, board);

    return new Response();
  }

  async retrieveUser() {
    const user = await this._state.storage.get('user');
    return new Response(JSON.stringify(user));
  }

  async retrieveBoards() {
    const boards = await this._state.storage.list({
      prefix: 'board:',
    });

    return new Response(JSON.stringify([...boards.values()]));
  }

  async updateUser(request) {
    const toUpdate = await request.json();

    const user = await this._state.storage.get('user');
    this._state.storage.put('user', {
      ...user,
      ...toUpdate,
    });

    return new Response();
  }
}

export { User };
