# Jiny Markdown - Live Editor & preview

Jiny Markdown은 VS Code 및 통합 IDE(Antigravity 등) 환경에서 **Typora 스타일의 실시간 위지윅(WYSIWYG) 편집**과 **코드/미리보기 분할 뷰**, **라인 번호 표시** 기능을 제공하는 마크다운 확장 프로그램입니다.

---

## 🌟 주요 기능

### 1. Typora 스타일 실시간 렌더링 및 직접 수정 (기능 1)
- 마크다운 문서를 깔끔한 서식 문서 형태로 렌더링합니다.
- Typora처럼 미리보기 화면에서 글이나 표, 리스트를 직접 클릭하여 실시간으로 내용을 수정할 수 있습니다.
- 상단 툴바(H1~H3, 볼드, 이탤릭, 취소선, 인라인 코드, 코드 블록, 인용구, 목록, 할 일 목록, 표, 링크 등)를 통해 간편하게 서식을 적용할 수 있습니다.

### 2. 코드와 미리보기 분할 뷰 및 줄 번호 표시 (기능 2)
- 코드 영역과 미리보기 영역을 좌우로 분할하여 동시에 보며 작업할 수 있습니다.
- **배경색**: 가독성을 극대화하기 위해 미리보기 영역의 배경을 **깨끗한 흰색 (`#ffffff`)** 으로 유지합니다.
- **미리보기 줄 번호**: 미리보기 화면 왼쪽 거터(Gutter)에 원본 마크다운 코드의 줄 번호(Line Numbers)가 함께 표시됩니다.
- **양방향 동기화**: 코드에서 수정하면 미리보기가 즉시 갱신되며, 미리보기에서 수정해도 코드가 즉시 동기화됩니다.
- **스크롤 동기화**: 한쪽 영역을 스크롤하면 다른 쪽도 비례하여 동기화되어 편리합니다.

### 3. 3가지 뷰 모드 지원 (기능 3)
- **코드 보기 모드 (`Code`)**: 소스 코드 전용 편집 모드
- **분할 모드 (`Split`)**: 좌측 소스 코드 + 우측 흰색 배경 미리보기 (줄 번호 포함)
- **미리보기 모드 (`Preview / Typora`)**: 전체 화면 Typora 스타일 실시간 문서 편집 모드
- 모드 전환은 상단 툴바 버튼, 하단 상태 표시줄, 단축키로 손쉽게 전환할 수 있습니다.

---

## ⌨️ 단축키 안내

| 기능 | macOS (Mac 키보드) | Windows / Linux | 설명 |
|---|---|---|---|
| **미리보기 분할 열기** | **`Cmd + Option + M`** (`⌘⌥M`) | `Ctrl + Alt + M` | IDE 에디터 우측에 깔끔한 프리뷰 실행 |
| **VS Code 표준 단축키** | **`Cmd + K V`** 또는 **`Cmd + Shift + M`** | `Ctrl + K V` | 친숙한 표준 프리뷰 단축키 지원 |
| **분할 토글** | **`Cmd + K M`** | `Ctrl + K M` | 분할 뷰 토글 |

---

## 🛠️ 개발 및 빌드 방법

```bash
# 1. 의존성 설치
npm install

# 2. 확장 번들 빌드
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
npx @vscode/vsce package --no-dependencies --allow-missing-repository --skip-license
```
명령어를 실행하면 `jiny-markdown-1.0.0.vsix` 파일이 생성됩니다.

### 2. 마켓플레이스 배포 (Visual Studio Marketplace & Open VSX)
1. **VS Code Marketplace 배포**:
   - [Visual Studio Marketplace Management Portal](https://marketplace.visualstudio.com/manage)에 로그인하여 퍼블리셔(Publisher)를 등록합니다.
   - 개인 액세스 토큰(PAT)을 발급받은 뒤 다음 명령어로 배포합니다:
     ```bash
     npx @vscode/vsce login jiny
     npx @vscode/vsce publish
     ```
2. **Open VSX 배포 (Antigravity IDE / VSCodium / Gitpod 지원)**:
   - [Open VSX Registry](https://open-vsx.org)에 로그인하여 네임스페이스(`jiny`)를 생성합니다.
   - 액세스 토큰 발급 후 배포:
     ```bash
     npx ovsx publish jiny-markdown-1.0.0.vsix -p <YOUR_OPENVSX_ACCESS_TOKEN>
     ```

---

## 💻 설치 및 사용 방법

### 방법 A: CLI 명령어로 설치
터미널에서 생성된 `.vsix` 파일을 직접 설치합니다:
```bash
# VS Code
code --install-extension jiny-markdown-1.0.0.vsix

# Antigravity IDE
antigravity --install-extension jiny-markdown-1.0.0.vsix
# 또는
agy --install-extension jiny-markdown-1.0.0.vsix
```

### 방법 B: IDE UI에서 설치
1. IDE 좌측 사이드바의 **확장(Extensions)** 탭(또는 `Cmd+Shift+X` / `Ctrl+Shift+X`)을 엽니다.
2. 우측 상단의 `···` (추가 옵션) 아이콘을 클릭합니다.
3. **'VSIX에서 설치...(Install from VSIX...)'** 를 선택합니다.
4. 빌드된 `jiny-markdown-1.0.0.vsix` 파일을 선택하여 설치를 완료합니다.

### 마크다운 파일 열기
- `.md` 파일을 우클릭한 후 **'연결 프로그램으로 열기...(Open With...)'** -> **'Jiny Markdown Editor'** 를 선택하면 Typora 스타일의 단독 에디터로 실행됩니다.
- 일반 코드 에디터에서 작성 중일 때는 `Cmd + Alt + M` (macOS) 또는 `Ctrl + Alt + M` (Windows)을 누르면 바로 분할 미리보기가 실행됩니다.
