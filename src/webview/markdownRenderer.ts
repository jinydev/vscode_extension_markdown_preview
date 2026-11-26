import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import { mathPlugin } from './markdownMath';
import { frontMatterPlugin } from './markdownFrontMatter';

export function createMarkdownRenderer(getBaseUri?: () => string) {
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: false, // Maintain exact verbatim characters without auto-converting .. into ellipsis (…)
    breaks: true,
    highlight: function (str: string, lang: string) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return `<pre class="hljs"><code class="language-${lang}">${
            hljs.highlight(str, { language: lang, ignoreIllegals: true }).value
          }</code></pre>`;
        } catch (__) {}
      }
      return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`;
    }
  });

  // Enable Typora-style Front Matter plugin
  md.use(frontMatterPlugin);

  // Enable KaTeX math plugin
  md.use(mathPlugin);

  // Support Korean intra-word closing emphasis (e.g. **REINFORCE(순수 정책 경사법)**였습니다)
  const origScanDelims = (md.inline as any).State.prototype.scanDelims;
  (md.inline as any).State.prototype.scanDelims = function (start: number, canSplitWord: boolean) {
    const res = origScanDelims.call(this, start, canSplitWord);
    const marker = this.src.charCodeAt(start);
    if (marker === 0x2A /* * */) {
      const lastChar = start > 0 ? this.src.charCodeAt(start - 1) : 0x20;
      const isLastWhiteSpace = lastChar === 0x20 || lastChar === 0x09 || lastChar === 0x0A || lastChar === 0x0D;
      if (!isLastWhiteSpace) {
        res.can_close = true;
      }
    }
    return res;
  };

  // Inject line number mapping attributes into block tags
  const injectLineNumbers = (originalRule: any) => {
    return (tokens: any[], idx: number, options: any, env: any, self: any) => {
      const token = tokens[idx];
      if (token.map && token.level === 0) {
        const startLine = token.map[0] + 1; // 1-based index
        const endLine = token.map[1];
        token.attrSet('data-line', String(startLine));
        token.attrSet('data-line-end', String(endLine));
        token.attrJoin('class', 'sync-line-block');
      }
      if (originalRule) {
        return originalRule(tokens, idx, options, env, self);
      }
      return self.renderToken(tokens, idx, options);
    };
  };

  const blockRules = [
    'paragraph_open',
    'heading_open',
    'blockquote_open',
    'bullet_list_open',
    'ordered_list_open',
    'table_open',
    'hr'
  ];

  blockRules.forEach((ruleName) => {
    md.renderer.rules[ruleName] = injectLineNumbers(md.renderer.rules[ruleName]);
  });

  // Special handling for fence and code blocks
  const originalFence = md.renderer.rules.fence || ((tokens: any[], idx: number, options: any, env: any, self: any) => self.renderToken(tokens, idx, options));
  md.renderer.rules.fence = (tokens: any[], idx: number, options: any, env: any, self: any) => {
    const token = tokens[idx];
    if (token.map) {
      token.attrSet('data-line', String(token.map[0] + 1));
      token.attrSet('data-line-end', String(token.map[1]));
      token.attrJoin('class', 'sync-line-block');
    }
    const html = originalFence(tokens, idx, options, env, self);
    if (token.map && !html.startsWith('<div') && html.startsWith('<pre')) {
      return `<div class="code-block-wrapper sync-line-block" data-line="${token.map[0] + 1}" data-line-end="${token.map[1]}">${html}</div>`;
    }
    return html;
  };

  // Task list support
  const defaultListItemOpen = md.renderer.rules.list_item_open || ((tokens: any[], idx: number, options: any, env: any, self: any) => self.renderToken(tokens, idx, options));
  md.renderer.rules.list_item_open = (tokens: any[], idx: number, options: any, env: any, self: any) => {
    const token = tokens[idx];
    if (token.map) {
      token.attrSet('data-line', String(token.map[0] + 1));
      token.attrJoin('class', 'sync-line-block');
    }
    return defaultListItemOpen(tokens, idx, options, env, self);
  };

  // Image handling: resolve relative paths and preserve original src
  const defaultImageRender = md.renderer.rules.image || ((tokens: any[], idx: number, options: any, env: any, self: any) => self.renderToken(tokens, idx, options));
  md.renderer.rules.image = (tokens: any[], idx: number, options: any, env: any, self: any) => {
    const token = tokens[idx];
    const srcIndex = token.attrIndex('src');
    if (srcIndex >= 0) {
      const originalSrc = token.attrs[srcIndex][1];
      token.attrSet('data-original-src', originalSrc);

      // If it's a relative path, resolve it with baseUri
      if (!/^(https?:|data:|vscode-webview:)/i.test(originalSrc) && getBaseUri) {
        const base = getBaseUri();
        if (base) {
          const cleanRel = originalSrc.replace(/^\.\//, '');
          const separator = base.endsWith('/') ? '' : '/';
          token.attrs[srcIndex][1] = `${base}${separator}${cleanRel}`;
        }
      }
    }
    return defaultImageRender(tokens, idx, options, env, self);
  };

  return md;
}
