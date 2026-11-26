import { createMarkdownRenderer } from './markdownRenderer';
import { createHtmlToMarkdownConverter } from './htmlToMarkdown';

declare function acquireVsCodeApi(): {
  postMessage(message: any): void;
  getState(): any;
  setState(state: any): void;
};

const vscode = acquireVsCodeApi();

let currentText = '';
let currentBaseUri = '';
let isUserEditingInPreview = false;
let previewEditTimer: any = null;
let zoomLevel = 1.0;
let lastReportedLine = -1;
let lineSyncDebounce: any = null;

const mdRenderer = createMarkdownRenderer(() => currentBaseUri);
const htmlToMd = createHtmlToMarkdownConverter();

// DOM Elements
const previewContent = document.getElementById('preview-content') as HTMLDivElement;
const previewGutter = document.getElementById('preview-gutter') as HTMLDivElement;
const previewScroll = document.getElementById('preview-scroll') as HTMLDivElement;
const btnZoomIn = document.getElementById('btn-zoom-in') as HTMLButtonElement;
const btnZoomOut = document.getElementById('btn-zoom-out') as HTMLButtonElement;
const btnZoomReset = document.getElementById('btn-zoom-reset') as HTMLButtonElement;

// Zoom functionality
function setZoom(level: number) {
  zoomLevel = Math.max(0.5, Math.min(2.5, Math.round(level * 10) / 10));
  previewScroll.style.zoom = String(zoomLevel);
  if (btnZoomReset) {
    btnZoomReset.textContent = `${Math.round(zoomLevel * 100)}%`;
  }
  updateGutters();
}

if (btnZoomIn) {
  btnZoomIn.addEventListener('click', () => setZoom(zoomLevel + 0.1));
}
if (btnZoomOut) {
  btnZoomOut.addEventListener('click', () => setZoom(zoomLevel - 0.1));
}
if (btnZoomReset) {
  btnZoomReset.addEventListener('click', () => setZoom(1.0));
}

// Keyboard shortcuts for zoom (Cmd/Ctrl +, -, 0) & Save (Cmd/Ctrl + S)
window.addEventListener('keydown', (e) => {
  const isCmdOrCtrl = e.metaKey || e.ctrlKey;
  if (isCmdOrCtrl) {
    if (e.key === '=' || e.key === '+') {
      e.preventDefault();
      setZoom(zoomLevel + 0.1);
    } else if (e.key === '-' || e.key === '_') {
      e.preventDefault();
      setZoom(zoomLevel - 0.1);
    } else if (e.key === '0') {
      e.preventDefault();
      setZoom(1.0);
    } else if (e.key === 's' || e.key === 'S') {
      e.preventDefault();
      // Immediately flush any pending markdown conversion before saving
      if (previewEditTimer) {
        clearTimeout(previewEditTimer);
      }
      try {
        const newMarkdown = htmlToMd.turndown(previewContent.innerHTML);
        currentText = newMarkdown;
        vscode.postMessage({
          type: 'updateText',
          text: currentText
        });
      } catch (err) {
        console.error('Error updating text on save:', err);
      }
      vscode.postMessage({ type: 'saveDocument' });
    }
  }
});

// Wheel zoom with Cmd/Ctrl
window.addEventListener('wheel', (e) => {
  if (e.metaKey || e.ctrlKey) {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom(zoomLevel + 0.05);
    } else {
      setZoom(zoomLevel - 0.05);
    }
  }
}, { passive: false });

// Report active line in preview to left code editor
function reportActiveLineToEditor() {
  if (lineSyncDebounce) {
    clearTimeout(lineSyncDebounce);
  }
  lineSyncDebounce = setTimeout(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    let node: Node | null = sel.anchorNode;
    let block: HTMLElement | null = null;
    while (node && node !== previewContent) {
      if (node instanceof HTMLElement && node.hasAttribute('data-line')) {
        block = node;
        break;
      }
      node = node.parentNode;
    }
    if (block) {
      const line = parseInt(block.getAttribute('data-line') || '0', 10);
      if (line > 0 && line !== lastReportedLine) {
        lastReportedLine = line;
        vscode.postMessage({
          type: 'revealLineInEditor',
          line: line
        });
      }
    }
  }, 120);
}

// Smooth scroll preview to matching line from code editor
function scrollToEditorLine(targetLine: number) {
  if (isUserEditingInPreview) return;
  const blocks = Array.from(previewContent.querySelectorAll<HTMLElement>('[data-line]'));
  if (!blocks.length) return;

  let bestBlock: HTMLElement | null = null;
  let bestLine = -1;
  for (const b of blocks) {
    const line = parseInt(b.getAttribute('data-line') || '0', 10);
    if (line <= targetLine && line >= bestLine) {
      bestLine = line;
      bestBlock = b;
    }
  }
  if (!bestBlock && blocks.length > 0) {
    bestBlock = blocks[0];
  }

  if (bestBlock) {
    bestBlock.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    bestBlock.classList.add('active-sync-highlight');
    setTimeout(() => {
      bestBlock?.classList.remove('active-sync-highlight');
    }, 1200);
  }
}

// Render markdown to preview while strictly preserving scroll position
function renderPreview(text: string) {
  const savedScrollTop = previewScroll.scrollTop;

  const html = mdRenderer.render(text);
  previewContent.innerHTML = html;
  updateGutters();

  // Restore scroll position immediately and on next animation frame
  previewScroll.scrollTop = savedScrollTop;
  requestAnimationFrame(() => {
    previewScroll.scrollTop = savedScrollTop;
  });
}

// Update line numbers gutter cleanly
function updateGutters() {
  const blocks = previewContent.querySelectorAll('[data-line]');
  const lineMap = new Map<number, HTMLElement>();

  blocks.forEach((el) => {
    const line = parseInt(el.getAttribute('data-line') || '0', 10);
    if (line > 0 && !lineMap.has(line)) {
      lineMap.set(line, el as HTMLElement);
    }
  });

  const sortedLines = Array.from(lineMap.keys()).sort((a, b) => a - b);
  let gutterHtml = '';

  sortedLines.forEach((line) => {
    gutterHtml += `<div class="preview-line-num" id="prev-line-${line}" data-line="${line}">${line}</div>`;
  });

  previewGutter.innerHTML = gutterHtml;

  // Align positions with block offsets cleanly
  requestAnimationFrame(() => {
    let lastTop = -999;
    sortedLines.forEach((line) => {
      const block = lineMap.get(line);
      const marker = document.getElementById(`prev-line-${line}`);
      if (block && marker) {
        let targetTop = block.offsetTop;
        if (targetTop < lastTop + 16) {
          targetTop = lastTop + 16;
        }
        marker.style.top = `${targetTop}px`;
        lastTop = targetTop;

        block.addEventListener('mouseenter', () => marker.classList.add('active'));
        block.addEventListener('mouseleave', () => marker.classList.remove('active'));

        marker.addEventListener('click', () => {
          block.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
      }
    });
  });
}

// Track user focus inside preview
previewContent.addEventListener('focus', () => {
  isUserEditingInPreview = true;
});

previewContent.addEventListener('blur', () => {
  setTimeout(() => {
    const isStillFocused = document.activeElement === previewContent || previewContent.contains(document.activeElement);
    if (!isStillFocused) {
      isUserEditingInPreview = false;
    }
  }, 1000);
});

// Event: User edits directly inside Preview (Typora Live Editing)
previewContent.addEventListener('input', () => {
  isUserEditingInPreview = true;
  reportActiveLineToEditor();

  if (previewEditTimer) {
    clearTimeout(previewEditTimer);
  }

  previewEditTimer = setTimeout(() => {
    try {
      const newMarkdown = htmlToMd.turndown(previewContent.innerHTML);
      currentText = newMarkdown;

      vscode.postMessage({
        type: 'updateText',
        text: currentText
      });

      // Update gutter markers without resetting user DOM
      updateGutters();
    } catch (e) {
      console.error('Error converting HTML to Markdown:', e);
    }

    // Keep editing lock active for 1.5s after typing to absorb echoes
    setTimeout(() => {
      const isStillFocused = document.activeElement === previewContent || previewContent.contains(document.activeElement);
      if (!isStillFocused) {
        isUserEditingInPreview = false;
      }
    }, 1500);
  }, 200);
});

// Auto-transform '---' into horizontal rule <hr> on Enter (Typora Live UX)
previewContent.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      let node: Node | null = sel.anchorNode;
      let block: HTMLElement | null = null;
      while (node && node !== previewContent) {
        if (node instanceof HTMLElement && (node.tagName === 'P' || node.tagName === 'DIV' || node.hasAttribute('data-line'))) {
          block = node;
          break;
        }
        node = node.parentNode;
      }

      if (block) {
        const text = block.textContent?.trim() || '';
        if (/^(-{3,}|\*{3,}|_{3,})$/.test(text)) {
          e.preventDefault();
          const hr = document.createElement('hr');
          hr.className = 'sync-line-block';
          const newP = document.createElement('p');
          newP.innerHTML = '<br>';

          block.parentNode?.replaceChild(hr, block);
          hr.after(newP);

          const range = document.createRange();
          range.setStart(newP, 0);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);

          previewContent.dispatchEvent(new Event('input', { bubbles: true }));
          return;
        }
      }
    }
  }
});

// Track active cursor line as user navigates inside Preview
previewContent.addEventListener('keyup', () => {
  reportActiveLineToEditor();
});

previewContent.addEventListener('mouseup', () => {
  reportActiveLineToEditor();
});

// Checkbox click support
previewContent.addEventListener('change', (e) => {
  const target = e.target as HTMLElement;
  if (target && target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'checkbox') {
    previewContent.dispatchEvent(new Event('input', { bubbles: true }));
  }
});

// Window Resize -> realign line numbers
window.addEventListener('resize', () => {
  updateGutters();
});

// Messages from VS Code extension host
window.addEventListener('message', (event) => {
  const message = event.data;
  switch (message.type) {
    case 'init':
      if (message.baseUri) {
        currentBaseUri = message.baseUri;
      }
      currentText = message.text || '';
      renderPreview(currentText);
      break;

    case 'update':
      if (message.baseUri) {
        currentBaseUri = message.baseUri;
      }
      // If user is currently focused or typing in preview, do not destroy active DOM/cursor!
      const isFocused = document.activeElement === previewContent || previewContent.contains(document.activeElement);
      if (isUserEditingInPreview || isFocused) {
        currentText = message.text || '';
        return;
      }

      currentText = message.text || '';
      // Re-render HTML while strictly maintaining scroll position
      renderPreview(currentText);

      // If update was triggered from code editor, sync scroll to the active line being edited
      if (typeof message.activeLine === 'number') {
        requestAnimationFrame(() => {
          scrollToEditorLine(message.activeLine);
        });
      }
      break;

    case 'syncFromEditorLine':
      if (typeof message.line === 'number') {
        scrollToEditorLine(message.line);
      }
      break;
  }
});

// Immediate render from embedded HTML data
const win = window as any;
if (win.__INITIAL_TEXT__ !== undefined) {
  currentText = win.__INITIAL_TEXT__ || '';
  currentBaseUri = win.__INITIAL_BASE_URI__ || '';
  renderPreview(currentText);
}

// Tell VS Code webview is ready
vscode.postMessage({ type: 'ready' });
