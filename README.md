# Jiny Markdown - Live Editor & preview

**English** | [한국어 (Korean)](./README_ko.md)

**Jiny Markdown** is a lightweight, distraction-free markdown live editor and split preview extension for Visual Studio Code and integrated IDEs (such as Antigravity IDE). It combines the seamless live-editing experience of Typora with side-by-side synchronized previewing, pure white paper styling, line numbers, LaTeX math (KaTeX), and relative image support.

---

## 🌟 Key Features

### 1. Typora-Style Live Rendering & Direct Editing
- Render markdown documents into clean, elegant typography.
- Click and edit text, lists, and tables directly inside the preview pane just like Typora.
- Changes made in the preview are bidirectionally synchronized back to your markdown source code buffer in real-time.

### 2. Distraction-Free Split View with Line Numbers Gutter
- Clean dual-pane workflow: Left is your native, feature-rich IDE code editor; Right is the pure rendered preview.
- **Pure White Background (`#ffffff`)**: Maximizes readability and document clarity.
- **Line Numbers Gutter**: Left gutter in the preview displays exact source code line numbers aligned with each block.
- **Scroll Synchronization**: Scrolling or navigating lines in the IDE editor automatically scrolls the preview in lockstep.

### 3. Full LaTeX Mathematical Formulas (KaTeX)
- Inline math: `$ ... $` (e.g. `$\pi_\theta(a \mid s)$`, `$Q(s, a)$`)
- Block math equations: `$$ ... $$`
- Bundled with complete offline KaTeX fonts and CSS—no internet connection required.
- Math syntax is safely preserved when editing inside the preview.

### 4. Local & Relative Image Support
- Seamlessly resolves local and relative image paths (such as `./img/cover.png` or `../assets/figure.jpg`).
- Preserves relative paths (`data-original-src`) during bidirectional edits.

---

## ⌨️ Keyboard Shortcuts

| Command | macOS | Windows / Linux | Description |
|---|---|---|---|
| **Open Side Preview** | **`Cmd + Option + M`** (`⌘⌥M`) | `Ctrl + Alt + M` | Open clean preview beside active editor |
| **Standard Preview** | **`Cmd + K V`** or **`Cmd + Shift + M`** | `Ctrl + K V` | Familiar standard preview shortcut |
| **Toggle Split** | **`Cmd + K M`** | `Ctrl + K M` | Toggle side preview panel |

---

## 🛠️ Development & Build

```bash
# 1. Install dependencies
npm install

# 2. Build extension bundles
npm run build

# 3. Watch for changes
npm run watch

# 4. Package VSIX extension file
npm run package
```

---

## 📦 Packaging & Publishing

### 1. Build VSIX File
```bash
npm run package
```
This generates the standalone `jiny-markdown-1.0.5.vsix` file.

### 2. Publishing to Marketplaces

#### Visual Studio Marketplace
1. Log in to the [Visual Studio Marketplace Management Portal](https://marketplace.visualstudio.com/manage) and create your Publisher ID (`jinydev`).
2. Generate an Azure DevOps Personal Access Token (PAT).
3. Publish using `vsce`:
   ```bash
   npx @vscode/vsce login jinydev
   npx @vscode/vsce publish
   ```

#### Open VSX Registry (Antigravity IDE / VSCodium / Gitpod)
1. Sign in to [Open VSX Registry](https://open-vsx.org) and register namespace (`jinydev`).
2. Generate an Access Token and publish:
   ```bash
   npx ovsx publish jiny-markdown-1.0.5.vsix -p <YOUR_OPENVSX_ACCESS_TOKEN>
   ```

---

## 💻 Installation & Usage

### Method A: Command Line (CLI)
Install the packaged `.vsix` file directly from your terminal:
```bash
# Visual Studio Code
code --install-extension jiny-markdown-1.0.5.vsix

# Antigravity IDE
antigravity --install-extension jiny-markdown-1.0.5.vsix
```

### Method B: IDE User Interface
1. Open the **Extensions** view (`Cmd + Shift + X` on macOS or `Ctrl + Shift + X` on Windows).
2. Click the `···` (Views and More Actions) menu at the top of the Extensions pane.
3. Select **'Install from VSIX...'**.
4. Choose the `jiny-markdown-1.0.5.vsix` file.

### How to Use
- Open any Markdown document (`.md`), then press **`Cmd + Option + M`** (or `Cmd + K V`) to launch the synchronized live preview beside your editor.
