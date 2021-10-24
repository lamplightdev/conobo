import { html, escapeHTML, escapeAttribute } from '../util/template.js';
import header from './header.js';
import footer from './footer.js';

export default (env, { user }) => {
  return html`
    ${header(env, { user })}
    <main>
      <form action="/user" method="POST">
        <label>
          <input
            type="text"
            name="username"
            value="${escapeAttribute(user.username)}"
            placeholder="Choose a username"
          />
        </label>
        <button class="button blue" type="submit">Update username</button>
      </form>
    </main>

    ${footer()}
  `;
};
