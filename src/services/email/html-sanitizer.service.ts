import sanitizeHtml from 'sanitize-html';

/**
 * Sanitizes HTML content from email messages, removing dangerous tags
 * and attributes while preserving email-typical formatting elements.
 */
export function sanitizeEmailHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      // Structure
      'div',
      'span',
      'p',
      'br',
      'hr',
      'section',
      'article',
      'header',
      'footer',
      'main',
      'center',
      // Text formatting
      'b',
      'i',
      'u',
      'em',
      'strong',
      'small',
      'sub',
      'sup',
      'mark',
      's',
      'strike',
      'del',
      'ins',
      'font',
      'blockquote',
      'pre',
      'code',
      // Headings
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      // Lists
      'ul',
      'ol',
      'li',
      'dl',
      'dt',
      'dd',
      // Tables (very common in email templates)
      'table',
      'thead',
      'tbody',
      'tfoot',
      'tr',
      'th',
      'td',
      'caption',
      'colgroup',
      'col',
      // Links & images
      'a',
      'img',
    ],
    allowedAttributes: {
      '*': ['style', 'class', 'id', 'dir', 'lang', 'title'],
      a: ['href', 'target', 'rel', 'name'],
      img: ['src', 'alt', 'width', 'height', 'border'],
      table: [
        'width',
        'height',
        'border',
        'cellpadding',
        'cellspacing',
        'align',
        'bgcolor',
        'role',
      ],
      td: [
        'width',
        'height',
        'align',
        'valign',
        'bgcolor',
        'colspan',
        'rowspan',
      ],
      th: [
        'width',
        'height',
        'align',
        'valign',
        'bgcolor',
        'colspan',
        'rowspan',
      ],
      tr: ['align', 'valign', 'bgcolor'],
      font: ['color', 'face', 'size'],
      col: ['span', 'width'],
      colgroup: ['span', 'width'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'cid', 'data'],
    allowedSchemesByTag: {
      img: ['http', 'https', 'cid', 'data'],
      a: ['http', 'https', 'mailto'],
    },
    // Block data:image/svg+xml (XSS vector) — only allow safe bitmap data URIs
    transformTags: {
      img: (tagName: string, attribs: Record<string, string>) => {
        if (attribs.src && attribs.src.startsWith('data:')) {
          const isSafeBitmap =
            /^data:image\/(png|jpe?g|gif|webp|bmp|x-icon);/i.test(attribs.src);
          if (!isSafeBitmap) {
            delete attribs.src;
          }
        }
        return { tagName, attribs };
      },
    },
    // Whitelist safe CSS properties to prevent UI spoofing attacks
    // (position:fixed overlays, z-index abuse, external background images)
    allowedStyles: {
      '*': {
        color: [/.*/],
        'background-color': [/.*/],
        'text-align': [/^(left|right|center|justify)$/],
        'font-size': [/.*/],
        'font-family': [/.*/],
        'font-weight': [/.*/],
        'font-style': [/.*/],
        'text-decoration': [/.*/],
        'line-height': [/.*/],
        'letter-spacing': [/.*/],
        width: [/.*/],
        'max-width': [/.*/],
        height: [/.*/],
        'min-height': [/.*/],
        margin: [/.*/],
        'margin-top': [/.*/],
        'margin-bottom': [/.*/],
        'margin-left': [/.*/],
        'margin-right': [/.*/],
        padding: [/.*/],
        'padding-top': [/.*/],
        'padding-bottom': [/.*/],
        'padding-left': [/.*/],
        'padding-right': [/.*/],
        border: [/.*/],
        'border-top': [/.*/],
        'border-bottom': [/.*/],
        'border-left': [/.*/],
        'border-right': [/.*/],
        'border-radius': [/.*/],
        'border-collapse': [/.*/],
        'border-spacing': [/.*/],
        'border-color': [/.*/],
        'vertical-align': [/.*/],
        'white-space': [/.*/],
        'word-break': [/.*/],
        'overflow-wrap': [/.*/],
        display: [
          /^(block|inline|inline-block|none|flex|table|table-row|table-cell)$/,
        ],
        'list-style-type': [/.*/],
        'text-transform': [/.*/],
        opacity: [/.*/],
      },
    },
    // Block dangerous tags explicitly (sanitize-html strips unknown tags by default)
    disallowedTagsMode: 'discard',
  });
}
