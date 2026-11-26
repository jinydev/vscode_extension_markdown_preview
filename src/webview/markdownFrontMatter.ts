export function frontMatterPlugin(md: any) {
  function frontMatterBlock(state: any, startLine: number, endLine: number, silent: boolean) {
    if (startLine !== 0) return false;

    const pos = state.bMarks[startLine] + state.tShift[startLine];
    const max = state.eMarks[startLine];

    if (state.src.slice(pos, max).trim() !== '---') {
      return false;
    }

    if (silent) return true;

    let nextLine = startLine;
    let hasEnd = false;

    while (++nextLine < endLine) {
      const p = state.bMarks[nextLine] + state.tShift[nextLine];
      const m = state.eMarks[nextLine];
      const lineText = state.src.slice(p, m).trim();
      if (lineText === '---' || lineText === '...') {
        hasEnd = true;
        break;
      }
    }

    if (!hasEnd) return false;

    const content = state.getLines(startLine + 1, nextLine, state.tShift[startLine], false);
    const token = state.push('front_matter', 'div', 0);
    token.block = true;
    token.content = content.replace(/\r?\n$/, '');
    token.map = [startLine, nextLine + 1];

    state.line = nextLine + 1;
    return true;
  }

  md.block.ruler.before('table', 'front_matter', frontMatterBlock, {
    alt: ['paragraph', 'reference', 'blockquote', 'list']
  });

  md.renderer.rules.front_matter = (tokens: any[], idx: number) => {
    const token = tokens[idx];
    const lineAttr = token.map ? ` data-line="${token.map[0] + 1}" data-line-end="${token.map[1]}"` : '';
    return `<div class="front-matter-block sync-line-block"${lineAttr}><pre class="front-matter-content">${md.utils.escapeHtml(token.content)}</pre></div>`;
  };
}
