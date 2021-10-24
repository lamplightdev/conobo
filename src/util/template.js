const htmlSubstitutions = {
  '\xA0': '&nbsp;',
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
};

export const escapeHTML = (raw) => {
  return raw.replace(/[<>&\xA0]/g, (match) => {
    htmlSubstitutions[match];
  });
};

export const escapeAttribute = (attr) => {
  return attr.replace(/"/g, '&quot;');
};

export const html = (strings, ...subs) => {
  return String.raw({ raw: strings }, ...subs);
};
