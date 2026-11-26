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

const mdRenderer = createMarkdownRenderer(() => currentBaseUri);
const htmlToMd = createHtmlToMarkdownConverter();

// DOM Elements
const previewContent = document.getElementById('preview-content') as HTMLDivElement;
const previewGutter = document.getElementById('preview-gutter') as HTMLDivElement;
const previewScroll = document.getElementById('preview-scroll') as HTMLDivElement;

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
