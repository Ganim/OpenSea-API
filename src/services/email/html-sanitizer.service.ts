import sanitizeHtml from 'sanitize-html';

/**
 * Sanitizes HTML content from email messages, removing dangerous tags
 * and attributes while preserving email-typical formatting elements.
 */
export function sanitizeEmailHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      // Structure
      'html',
      'head',
      'body',
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
      // Style
      'style',
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
    // Block dangerous tags explicitly (sanitize-html strips unknown tags by default)
    disallowedTagsMode: 'discard',
  });
}
