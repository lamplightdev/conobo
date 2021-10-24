import { html, escapeHTML, escapeAttribute } from '../util/template.js';

export default (env, { head = '', user = null, showMenu = true } = {}) => {
  return html`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <title>conobo</title>
        <meta name="viewport" content="width=device-width,initial-scale=1.0" />
        <link
          rel="icon"
          type="image/svg"
          href="${env.STATIC_URL}/images/icon.svg"
        />
        <link rel="stylesheet" href="${env.STATIC_URL}/css/common.css" />
        ${head}
      </head>

      <body>
        ${showMenu
          ? html`
              <div id="menu">
                <a href="/"
                  ><img
                    id="logo"
                    alt="conobo"
                    src="${env.STATIC_URL}/images/logo.svg"
                /></a>

                <div id="user">
                  <div id="name-container">
                    <div id="username">
                      ${escapeHTML(user ? user.username : '')}
                    </div>
                  </div>
                  <div id="avatar">
                    <a href="/user"
                      ><img
                        alt=""
                        src="${escapeAttribute(
                          user && user.avatar
                            ? user.avatar
                            : `${env.STATIC_URL}/images/icon.svg`
                        )}"
                    /></a>
                  </div>
                </div>
              </div>

              ${user
                ? html`
                    <div id="links">
                      <a href="/user" class="button">Profile</a>
                      <a href="/boards" class="button">Boards</a>
                      <a href="/signout" class="button red">Sign out</a>
                    </div>
                  `
                : ''}
            `
          : ''}
  `;
};
