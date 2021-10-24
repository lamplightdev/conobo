import { html, escapeHTML, escapeAttribute } from '../util/template.js';
import header from './header.js';
import footer from './footer.js';

export default (env, { board, user }) => {
  return html`
    ${header(env, { user })}

    <main>
      <form action="/board/edit/${escapeAttribute(board._id)}" method="POST">
        <label>
          <input
            type="text"
            name="name"
            value="${escapeAttribute(board.name)}"
            placeholder="Enter a name"
          />
        </label>
        <button class="button blue" type="submit">Update board name</button>
      </form>
    </main>

    ${footer()}
  `;
};
