import { html, escapeHTML } from '../util/template.js';
import header from './header.js';
import footer from './footer.js';

export default (env, { user, error }) => {
  return html`
    ${header(env, { user })}

    <main>
      <h1>${escapeHTML(error.message)}</h1>
      ${!['production', 'staging'].includes(env.ENVIRONMENT)
        ? html`<div>${error.stack ? escapeHTML(error.stack) : ''}</div>`
        : ''}
    </main>
    ${footer()}
  `;
};
