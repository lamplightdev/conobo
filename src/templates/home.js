import { html } from '../util/template.js';
import header from './header.js';
import footer from './footer.js';

export default (env, { user }) => {
  return html`
    ${header(env, {
      showMenu: false,
      head: html`
        <style>
          main {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 2rem;
            min-height: 100vh;
          }

          #homelogo {
            margin-bottom: 2rem;
          }

          #homelogo img {
            height: 10rem;
          }

          h1 {
            padding-bottom: 2rem;
          }

          p {
            padding-bottom: 2rem;
          }

          .credit {
            text-transform: uppercase;
            font-size: 0.8rem;
            padding-bottom: 1rem;
          }

          .twitter a {
            display: inline-block;
          }

          .twitter img {
            height: 1rem;
            width: auto;
            display: block;
          }
        </style>
      `,
    })}

    <main>
      <div id="homelogo">
        <img src="${env.STATIC_URL}/images/logo.svg" />
      </div>
      <h1>Collborative Notice Board</h1>
      <p class="credit">
        made by <a href="https://lamplightdev.com">lamplightdev</a>
      </p>
      <p class="twitter">
        <a href="https://twitter.com/lamplightdev"
          ><img src="${env.STATIC_URL}/images/twitter.svg" alt="twitter"
        /></a>
      </p>
      <p>
        <a href="/boards" class="button">Try it out</a>
      </p>
    </main>

    ${footer()}
  `;
};
