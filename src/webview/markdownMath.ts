import katex from 'katex';

export function mathPlugin(md: any) {
  // Inline math rule
  function mathInline(state: any, silent: boolean): boolean {
    if (state.src[state.pos] !== '$') {
      return false;
    }
    // Check if escaped: \$
    if (state.pos > 0 && state.src[state.pos - 1] === '\\') {
      return false;
    }

    const isDisplay = state.src[state.pos + 1] === '$';
    const openPos = state.pos;
    const start = isDisplay ? openPos + 2 : openPos + 1;
    const matchStr = isDisplay ? '$$' : '$';

    let closePos = state.src.indexOf(matchStr, start);
    while (closePos !== -1 && state.src[closePos - 1] === '\\') {
      closePos = state.src.indexOf(matchStr, closePos + 1);
    }

    if (closePos === -1) {
      return false;
    }

    const content = state.src.slice(start, closePos);
    if (!content.trim()) {
      return false;
    }

    if (!silent) {
      const token = state.push(isDisplay ? 'math_block' : 'math_inline', 'math', 0);
      token.content = content;
      token.markup = matchStr;
    }

    state.pos = closePos + (isDisplay ? 2 : 1);
    return true;
  }

  // Block math rule: $$ ... $$
  function mathBlock(state: any, startLine: number, endLine: number, silent: boolean): boolean {
    let pos = state.bMarks[startLine] + state.tShift[startLine];
    let max = state.eMarks[startLine];

    if (pos + 2 > max || state.src.slice(pos, pos + 2) !== '$$') {
      return false;
    }

    if (silent) return true;

    // Single-line block: $$ math $$
    const firstLineText = state.src.slice(pos + 2, max).trim();
    if (firstLineText.endsWith('$$') && firstLineText.length >= 2) {
      const content = firstLineText.slice(0, -2).trim();
      const token = state.push('math_block', 'math', 0);
      token.block = true;
      token.content = content;
      token.map = [startLine, startLine + 1];
      state.line = startLine + 1;
      return true;
    }

    // Multi-line block math
    let nextLine = startLine;
    let hasEnd = false;

    while (++nextLine < endLine) {
      pos = state.bMarks[nextLine] + state.tShift[nextLine];
      max = state.eMarks[nextLine];
      const lineText = state.src.slice(pos, max).trim();
      if (lineText.startsWith('$$')) {
        hasEnd = true;
        break;
      }
    }

    if (!hasEnd) return false;

    const content = state.getLines(startLine + 1, nextLine, state.tShift[startLine], true);
    const token = state.push('math_block', 'math', 0);
    token.block = true;
    token.content = content.trim();
    token.map = [startLine, nextLine + 1];

    state.line = nextLine + 1;
    return true;
  }

  md.inline.ruler.before('escape', 'math_inline', mathInline);
  md.block.ruler.before('fence', 'math_block', mathBlock, {
    alt: ['paragraph', 'reference', 'blockquote', 'list']
  });

  // Renderer for inline math
  md.renderer.rules.math_inline = (tokens: any[], idx: number) => {
    const math = tokens[idx].content;
    try {
      const rendered = katex.renderToString(math, {
        displayMode: false,
        throwOnError: false
      });
      return `<span class="katex-inline-wrapper" data-math="${md.utils.escapeHtml(math)}" data-display="false">${rendered}</span>`;
    } catch (e: any) {
      return `<span class="katex-error" title="${md.utils.escapeHtml(e?.message || '')}">$${md.utils.escapeHtml(math)}$</span>`;
    }
  };

  // Renderer for block math
  md.renderer.rules.math_block = (tokens: any[], idx: number) => {
    const token = tokens[idx];
    const math = token.content;
    const lineAttr = token.map ? ` data-line="${token.map[0] + 1}" data-line-end="${token.map[1]}"` : '';
    try {
      const rendered = katex.renderToString(math, {
        displayMode: true,
        throwOnError: false
      });
      return `<div class="katex-block-wrapper sync-line-block"${lineAttr} data-math="${md.utils.escapeHtml(math)}" data-display="true">${rendered}</div>`;
    } catch (e: any) {
      return `<div class="katex-error sync-line-block"${lineAttr}>$$${md.utils.escapeHtml(math)}$$</div>`;
    }
  };
}
