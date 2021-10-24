import { html, escapeAttribute, escapeHTML } from '../util/template.js';
import header from './header.js';
import footer from './footer.js';

const renderBoard = (board) => {
  return html`
    <a class="button yellow" href="/board/${escapeAttribute(board._id)}"
      >${escapeHTML(board.name)}</a
    >
  `;
};

export default (env, { boards, user }) => {
  const ownerBoards = [];
  const otherBoards = [];

  for (const board of boards) {
    if (board.userId === user._id) {
      ownerBoards.push(board);
    } else {
      otherBoards.push(board);
    }
  }

  return html`
    ${header(env, { user })}

    <main class="boards">
      <form method="POST" action="/boards">
        <input name="boardname" placeholder="Choose a board name" />
        <button class="button blue" type="submit">Create new board</button>
      </form>

      <h2>Your boards</h2>

      ${ownerBoards.length
        ? ownerBoards.map((board) => renderBoard(board)).join('')
        : '<p>None</p>'}

      <h2>Other boards</h2>

      ${otherBoards.length
        ? otherBoards.map((board) => renderBoard(board)).join('')
        : '<p>None</p>'}
    </main>
    ${footer()}
  `;
};
