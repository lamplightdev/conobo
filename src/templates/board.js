import { html, escapeHTML, escapeAttribute } from '../util/template.js';
import header from './header.js';
import footer from './footer.js';

export default (env, { user, board, users, notes }) => {
  return html`
    ${header(env, {
      showMenu: false,
      user,
      head: html`
        <script type="module" src="${env.STATIC_URL}/js/board.js"></script>
      `,
    })}
    <clip-board
      user="${escapeAttribute(JSON.stringify(user))}"
      board="${escapeAttribute(JSON.stringify(board))}"
      users="${escapeAttribute(JSON.stringify(users))}"
      notes="${escapeAttribute(JSON.stringify(notes))}"
      env="${escapeAttribute(
        JSON.stringify({
          STATIC_URL: env.STATIC_URL,
        })
      )}"
    ></clip-board>
    ${footer()}
  `;
};
