import TurndownService from 'turndown';

export function createHtmlToMarkdownConverter() {
  const turndown = new TurndownService({
    headingStyle: 'atx',
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '*'
  });

  // Custom escape override: prevent markdown divider markers (---, ***, ___) from being escaped to \---
  const defaultEscape = turndown.escape.bind(turndown);
  turndown.escape = function (string: string) {
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(string)) {
      return string.trim();
    }
    let res = defaultEscape(string);
    res = res.replace(/^\\(-{3,})/gm, '$1');
    res = res.replace(/^\\(\*{3,})/gm, '$1');
    res = res.replace(/^\\(_{3,})/gm, '$1');
    // Prevent double-escaped bold asterisks (**word**) from becoming \*\*word\*\*
    res = res.replace(/\\\*\\\*/g, '**');
    return res;
  };

  // Explicit Horizontal Rule handling
  turndown.addRule('horizontalRule', {
    filter: 'hr',
    replacement: function () {
      return '\n\n---\n\n';
    }
  });

  // Handle horizontal divider typed as paragraph/div (e.g. <p>---</p> or <div>---</div>)
  turndown.addRule('horizontalRuleParagraph', {
    filter: function (node) {
      if (node.nodeName === 'P' || node.nodeName === 'DIV') {
        const text = node.textContent?.trim() || '';
        return /^(-{3,}|\*{3,}|_{3,})$/.test(text);
      }
      return false;
    },
    replacement: function () {
      return '\n\n---\n\n';
    }
  });

  // Preserve Front Matter block
  turndown.addRule('frontMatter', {
    filter: function (node) {
      return (
        node.nodeName === 'DIV' &&
        node.classList &&
        node.classList.contains('front-matter-block')
      );
    },
    replacement: function (_content, node) {
      const text = node.textContent || '';
      return `---\n${text.trim()}\n---\n\n`;
    }
  });

  // Preserve KaTeX math formulas
  turndown.addRule('katexMath', {
    filter: function (node) {
      return (
        node.nodeName === 'SPAN' && node.classList?.contains('katex-inline-wrapper') ||
        node.nodeName === 'DIV' && node.classList?.contains('katex-block-wrapper') ||
        node.hasAttribute('data-math')
      );
    },
    replacement: function (_content, node) {
      const el = node as HTMLElement;
      const math = el.getAttribute('data-math') || '';
      const isDisplay = el.getAttribute('data-display') === 'true';
      if (isDisplay) {
        return `\n\n$$\n${math}\n$$\n\n`;
      }
      return `$${math}$`;
    }
  });

  // Preserve empty image placeholder badges
  turndown.addRule('emptyImageBadge', {
    filter: function (node) {
      return (
        node.nodeName === 'SPAN' &&
        (Boolean(node.classList?.contains('empty-image-badge')) || node.hasAttribute('data-empty-image'))
      );
    },
    replacement: function (_content, node) {
      const el = node as HTMLElement;
      const alt = el.getAttribute('data-alt') || '';
      return `![${alt}]()`;
    }
  });

  // Preserve original relative image sources
  turndown.addRule('imagePreserveOriginal', {
    filter: 'img',
    replacement: function (_content, node) {
      const img = node as HTMLImageElement;
      const originalSrc = img.getAttribute('data-original-src');
      const src = originalSrc !== null ? originalSrc : (img.getAttribute('src') || '');
      const alt = img.getAttribute('alt') || '';
      const title = img.getAttribute('title');
      if (!src || src.trim() === '') {
        return `![${alt}]()`;
      }
      return `![${alt}](${src}${title ? ` "${title}"` : ''})`;
    }
  });

  // Keep tables intact
  turndown.addRule('table', {
    filter: ['table'],
    replacement: function (_content, node) {
      const table = node as HTMLTableElement;
      let mdTable = '\n\n';
      const rows = Array.from(table.rows);
      if (rows.length === 0) return '';

      // Header row
      const firstRow = rows[0];
      const headers = Array.from(firstRow.cells).map(cell => cell.textContent?.trim() || '');
      mdTable += '| ' + headers.join(' | ') + ' |\n';
      mdTable += '| ' + headers.map(() => '---').join(' | ') + ' |\n';

      // Body rows
      for (let i = 1; i < rows.length; i++) {
        const cells = Array.from(rows[i].cells).map(cell => cell.textContent?.trim() || '');
        mdTable += '| ' + cells.join(' | ') + ' |\n';
      }
      return mdTable + '\n';
    }
  });

  // Handle task lists
  turndown.addRule('taskList', {
    filter: function (node) {
      return node.nodeName === 'INPUT' && (node as HTMLInputElement).type === 'checkbox';
    },
    replacement: function (_content, node) {
      const checkbox = node as HTMLInputElement;
      return checkbox.checked ? '[x] ' : '[ ] ';
    }
  });

  // Clean code blocks
  turndown.addRule('fencedCodeBlock', {
    filter: function (node) {
      return (
        node.nodeName === 'PRE' &&
        node.firstChild &&
        node.firstChild.nodeName === 'CODE'
      );
    },
    replacement: function (_content, node) {
      const code = node.firstChild as HTMLElement;
      let lang = '';
      const classes = code.className.split(' ');
      for (const cls of classes) {
        if (cls.startsWith('language-')) {
          lang = cls.replace('language-', '');
          break;
        }
      }
      return '\n```' + lang + '\n' + (code.textContent || '') + '\n```\n';
    }
  });

  return turndown;
}
