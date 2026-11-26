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
let isUpdatingFromSelf = false;
let updateTimer: any = null;

const mdRenderer = createMarkdownRenderer(() => currentBaseUri);
const htmlToMd = createHtmlToMarkdownConverter();

// DOM Elements
const previewContent = document.getElementById('preview-content') as HTMLDivElement;
const previewGutter = document.getElementById('preview-gutter') as HTMLDivElement;
const previewScroll = document.getElementById('preview-scroll') as HTMLDivElement;

// Render markdown to preview
function renderPreview(text: string) {
  const html = mdRenderer.render(text);
  previewContent.innerHTML = html;
  updateGutters();
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

// Event: User edits directly inside Preview (Typora Live Editing)
previewContent.addEventListener('input', () => {
  if (updateTimer) {
    clearTimeout(updateTimer);
  }

  updateTimer = setTimeout(() => {
    isUpdatingFromSelf = true;
    try {
      const newMarkdown = htmlToMd.turndown(previewContent.innerHTML);
      currentText = newMarkdown;

      vscode.postMessage({
        type: 'updateText',
        text: currentText
      });
      updateGutters();
    } catch (e) {
      console.error('Error converting HTML to Markdown:', e);
    }

    setTimeout(() => {
      isUpdatingFromSelf = false;
    }, 120);
  }, 250);
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
    case 'update':
      if (isUpdatingFromSelf) return;
      if (message.baseUri) {
        currentBaseUri = message.baseUri;
      }
      currentText = message.text || '';
      renderPreview(currentText);
      break;

    case 'scrollToLine':
      if (message.line) {
        const target = document.querySelector(`[data-line="${message.line}"]`);
        if (target) {
          (target as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
      break;
  }
});

// Tell VS Code webview is ready
vscode.postMessage({ type: 'ready' });
