# Jiny Markdown - Live Editor & preview

[English](./README.md) | **한국어**

Jiny Markdown은 VS Code 및 통합 IDE(Antigravity 등) 환경에서 **Typora 스타일의 실시간 위지윅(WYSIWYG) 편집**과 **코드/미리보기 분할 뷰**, **라인 번호 표시**, **수학 공식(KaTeX) 렌더링**을 제공하는 마크다운 확장 프로그램입니다.

---

## 🌟 주요 기능

### 1. Typora 스타일 실시간 렌더링 및 직접 수정
- 마크다운 문서를 깔끔하고 정돈된 타이포그래피로 실시간 렌더링합니다.
- Typora처럼 미리보기 화면에서 글이나 표, 리스트를 직접 클릭하여 실시간으로 내용을 수정할 수 있습니다.
- 미리보기에서 수정된 내용은 좌측 소스 코드 버퍼에 즉시 동기화됩니다.

### 2. 깔끔한 분할 뷰 & 줄 번호 표시
- 좌측은 IDE의 원래 코드 에디터를 사용하고, 우측에는 렌더링된 문서만 깔끔하게 출력합니다.
- **흰색 배경 (`#ffffff`)**: 가독성을 극대화하기 위해 미리보기 배경을 깨끗한 흰색으로 제공합니다.
- **미리보기 줄 번호 (Line Numbers)**: 우측 미리보기 화면의 왼쪽 거터(Gutter)에 원본 코드 줄 번호가 깔끔하게 정렬되어 표시됩니다.
- **스크롤 동기화**: 좌측 에디터에서 스크롤하거나 커서를 이동하면 우측 프리뷰도 해당 위치로 자동 스크롤됩니다.

### 3. LaTeX 수학 공식 (KaTeX) 완벽 지원
- 인라인 수식: `$ ... $` (예: `$\pi_\theta(a \mid s)$`, `$Q(s, a)$`)
- 블록 수식: `$$ ... $$`
- KaTeX 전용 폰트와 스타일이 내장되어 있어 인터넷 연결 없이도 즉시 고품질 수식이 렌더링됩니다.

### 4. 로컬 및 상대 경로 이미지 지원
- 마크다운 파일과 같은 디렉터리나 하위 폴더에 있는 이미지(`./img/...`)를 자동으로 감지하여 선명하게 표시합니다.
- 미리보기에서 글을 편집하더라도 상대 경로(`data-original-src`)가 깨지지 않고 그대로 보존됩니다.

---

## ⌨️ 단축키 안내

| 기능 | macOS (Mac 키보드) | Windows / Linux | 설명 |
|---|---|---|---|
| **미리보기 분할 열기** | **`Cmd + Option + M`** (`⌘⌥M`) | `Ctrl + Alt + M` | IDE 에디터 우측에 깔끔한 프리뷰 실행 |
| **VS Code 표준 단축키** | **`Cmd + K V`** 또는 **`Cmd + Shift + M`** | `Ctrl + K V` | 친숙한 표준 프리뷰 단축키 지원 |
| **분할 뷰 토글** | **`Cmd + K M`** | `Ctrl + K M` | 분할 뷰 토글 |

---

## 🛠️ 개발 및 빌드 방법

```bash
# 1. 의존성 설치
npm install

# 2. 번들 빌드
npm run build

# 3. 변경 사항 감지 및 자동 빌드
npm run watch

# 4. VSIX 패키징 (.vsix 파일 생성)
npm run package
```

---

## 📦 패키징 및 배포 방법

### 1. VSIX 파일 생성 (로컬 패키징)
```bash
npm run package
```
명령어를 실행하면 `jiny-markdown-1.0.5.vsix` 파일이 생성됩니다.

### 2. 마켓플레이스 배포 (Visual Studio Marketplace & Open VSX)
1. **VS Code Marketplace 배포**:
   - [Visual Studio Marketplace Portal](https://marketplace.visualstudio.com/manage)에 로그인하여 퍼블리셔(`jinydev`)를 확인합니다.
   - 개인 액세스 토큰(PAT) 발급 후 배포:
     ```bash
     npx @vscode/vsce login jinydev
     npx @vscode/vsce publish
     ```
2. **Open VSX 배포 (Antigravity IDE / VSCodium / Gitpod 지원)**:
   - [Open VSX Registry](https://open-vsx.org)에 로그인하여 네임스페이스(`jinydev`)를 생성합니다.
   - 액세스 토큰 발급 후 배포:
     ```bash
     npx ovsx publish jiny-markdown-1.0.5.vsix -p <YOUR_OPENVSX_ACCESS_TOKEN>
     ```

---

## 💻 설치 및 사용 방법

### 방법 A: CLI 명령어로 설치
터미널에서 생성된 `.vsix` 파일을 직접 설치합니다:
```bash
# VS Code
code --install-extension jiny-markdown-1.0.5.vsix

# Antigravity IDE
antigravity --install-extension jiny-markdown-1.0.5.vsix
```

### 방법 B: IDE UI에서 설치
1. IDE 좌측 사이드바의 **확장(Extensions)** 탭(`Cmd + Shift + X`)을 엽니다.
2. 우측 상단의 `···` (추가 옵션) 아이콘을 클릭합니다.
3. **'VSIX에서 설치...(Install from VSIX...)'** 를 선택합니다.
4. 빌드된 `jiny-markdown-1.0.5.vsix` 파일을 선택하여 설치를 완료합니다.

### 사용 방법
- 일반 마크다운 파일(`.md`)을 열고 **`Cmd + Option + M`** (또는 `Cmd + K V`)을 누르면 우측에 실시간 분할 미리보기가 실행됩니다.
