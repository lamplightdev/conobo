import { fetchUser } from '../handlers/auth.js';

class Board {
  constructor(state, env) {
    this._state = state;
    this._env = env;

    this._members = [];
  }

  /**
   *
   * @param {Request} request
   * @returns {Promise<Response>}
   */
  async fetch(request) {
    request.user = await fetchUser(request, this._env);

    const url = new URL(request.url);

    if (['/boards', '/boards/'].includes(url.pathname)) {
      switch (request.method) {
        case 'POST':
          return this.addBoard(request);
      }
    } else if (url.pathname.indexOf('/board/') === 0) {
      switch (request.method) {
        case 'GET':
          return this.getBoard(request);
        case 'POST':
          return this.updateBoard(request);
      }
    } else if (url.pathname.indexOf('/ws/') === 0) {
      return this.handleSocket(request);
    }

    throw Error('Invalid method');
  }

  async addBoard(request) {
    const formData = await request.formData();
    const name = formData.get('boardname').trim();

    if (!name) {
      throw Error('Invalid name');
    }

    const dateAdded = Date.now();

    this._state.storage.put('meta', {
      _id: this._state.id.toString(),
      userId: request.user._id,
      name: name.substr(0, 32),
      dateAdded,
    });

    const userObjId = this._env.USER.idFromString(request.user._id);
    const userObj = this._env.USER.get(userObjId);

    return userObj.fetch('http://test.com/board', {
      method: 'PUT',
      body: JSON.stringify({
        _id: this._state.id.toString(),
        userId: request.user._id,
        name: name.substr(0, 32),
        dateAdded,
      }),
    });
  }

  async getBoard(request) {
    const board = await this._state.storage.get('meta');
    const notes = await this._state.storage.list({
      prefix: 'note:',
    });

    // might have the same user multiple times (different devices or sockets not closed)
    const users = [];
    for (const _member of this._members) {
      if (!users.find((member) => member._id === _member.user._id)) {
        users.push(_member.user);
      }
    }

    return new Response(
      JSON.stringify({ board, users, notes: [...notes.values()] })
    );
  }

  async updateBoard(request) {
    const formData = await request.formData();
    const name = formData.get('name') && formData.get('name').trim();

    if (!name) {
      throw Error('Invalid name');
    }

    const board = await this._state.storage.get('meta');
    this._state.storage.put('meta', {
      ...board,
      name: name.substr(0, 32),
    });

    return new Response();
  }

  async handleSocket(request) {
    const upgradeHeader = request.headers.get('Upgrade');

    if (upgradeHeader !== 'websocket') {
      return new Response('Expected websocket', { status: 400 });
    }

    const [client, server] = Object.values(new WebSocketPair());

    await this.handleSession(server, request.user);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async handleSession(socket, user) {
    socket.accept();

    const board = await this._state.storage.get('meta');

    const currentMember = {
      socket,
      user: { _id: user._id, username: user.username, avatar: user.avatar },
    };

    const userObjId = this._env.USER.idFromString(user._id);
    const userObj = this._env.USER.get(userObjId);

    userObj.fetch('http://test.com/board', {
      method: 'PUT',
      body: JSON.stringify({
        _id: this._state.id.toString(),
        userId: board.userId,
        dateAdded: board.dateAdded,
        name: board.name,
      }),
    });

    this._members.push(currentMember);

    socket.addEventListener('message', (event) => {
      this.onMessage(event, currentMember);
    });

    socket.addEventListener('close', (event) => {
      this.onClose(event, currentMember);
    });

    for (const _member of this._members) {
      if (_member !== currentMember) {
        _member.socket.send(
          JSON.stringify({
            type: 'BOARD',
            action: 'USER:ENTER',
            payload: currentMember.user,
          })
        );
      }
    }

    // might have the same user multiple times (different devices or sockets not closed)
    const currentMembers = [];
    for (const _member of this._members) {
      if (!currentMembers.find((member) => member._id === _member.user._id)) {
        currentMembers.push(_member.user);
      }
    }

    currentMember.socket.send(
      JSON.stringify({
        type: 'BOARD',
        action: 'USER:LIST',
        payload: currentMembers,
      })
    );

    const notes = await this._state.storage.list({
      prefix: 'note:',
    });

    currentMember.socket.send(
      JSON.stringify({
        type: 'BOARD',
        action: 'NOTE:LIST',
        payload: [...notes.values()],
      })
    );
  }

  async onMessage({ data: socketData }, member) {
    const board = await this._state.storage.get('meta');

    const { type, action, payload } = JSON.parse(socketData);

    if (type === 'BOARD') {
      switch (action) {
        case 'NOTE:SAVE': {
          const { note } = payload;
          // ensure the note is assigned to current user or current user is board owner
          if (
            note &&
            (note.userId === member.user._id ||
              board.userId === member.user._id)
          ) {
            const details = {
              _id: note._id,
              boardId: note.boardId,
              userId: note.userId,
              username: note.username,
              content: note.content.substr(0, 1024),
              size: note.size,
              position: note.position,
              color: note.color,
            };

            // if this note is being edited by the board owner, but they don't own the note
            if (
              board.userId === member.user._id &&
              note.userId !== member.user._id
            ) {
              const existingNote = await this._state.storage.get(
                `note:${note._id}`
              );

              details.content = existingNote.content;
            }

            this._state.storage.put(`note:${note._id}`, details);

            for (const _member of this._members) {
              // don't send to originating user
              if (_member !== member) {
                _member.socket.send(
                  JSON.stringify({ type, action, payload: note })
                );
              }
            }
          }

          return;
        }
        case 'NOTE:REMOVE': {
          const { _id } = payload;
          const note = await this._state.storage.get(`note:${_id}`);
          /// ensure the note is assigned to current user or current user is board owner
          if (
            note &&
            (note.userId === member.user._id ||
              board.userId === member.user._id)
          ) {
            this._state.storage.delete(`note:${_id}`);

            for (const _member of this._members) {
              // don't send to originating user
              if (_member !== member) {
                _member.socket.send(
                  JSON.stringify({ type, action, payload: _id })
                );
              }
            }
          }

          return;
        }
        case 'BOARD:CLEAR': {
          if (board.userId === member.user._id) {
            const notes = await this._state.storage.list({
              prefix: 'note:',
            });

            await this._state.storage.delete([...notes.keys()]);

            for (const _member of this._members) {
              _member.socket.send(
                JSON.stringify({
                  type: 'BOARD',
                  action: 'NOTE:LIST',
                  payload: [],
                })
              );
            }
          }

          return;
        }
      }
    }
  }

  onClose(event, member) {
    const memberIndex = this._members.findIndex(
      (existingMembers) => existingMembers === member
    );

    if (memberIndex > -1) {
      this._members.splice(memberIndex, 1);

      for (const _member of this._members) {
        if (_member !== member) {
          _member.socket.send(
            JSON.stringify({
              type: 'BOARD',
              action: 'USER:LEAVE',
              payload: { _id: member.user._id },
            })
          );
        }
      }
    }
  }
}

export { Board };
