import { html, escapeHTML } from '../util/template.js';
import header from './header.js';
import footer from './footer.js';

export default (env) => {
  return html`
    ${header(env)}
    <main>
      <form method="post" action="/user">
        <label>
          <input name="username" placeholder="Choose a username" />
        </label>
        <button class="button blue" type="submit">Go</button>
      </form>
    </main>
    ${footer()}
  `;
};
