# Project Overview

유용한 웹사이트/프로그램 모음(만물상자)과 디자인 치트시트를 제공하는 정적 웹 페이지 프로젝트.
GitHub Pages로 호스팅되며, SPA(단일 페이지) 구조.

## 최상위 구조

사이트는 두 개의 큰 섹션으로 구성된다:

1. **만물상자** — 모든 유용한 웹사이트/프로그램 링크 모음 (toolbox.json 기반, 13개 카테고리: 글쓰기, 연구, 변환, 개발, 시각화, 색, 글꼴, 아이콘·일러스트, 사진·영상, 편집, 레퍼런스, 통계·동향, 브랜딩). 이 중 색·글꼴·아이콘·일러스트·사진·영상·편집·레퍼런스 6개는 UI에서 "디자인" 상위 탭 아래 하위 탭으로 묶임(script.js의 `DESIGN_SUBCATS`).
2. **디자인 치트시트** — 컬러 팔레트 + 폰트 리스트 (design-colors.json, design-fonts.json 기반). 향후 재구성 예정이므로 현재는 단순 나열.

## 주요 파일

- `index.html` — 통합 SPA 페이지
- `script.js` — 네비게이션, 검색, 정렬, 뷰 토글, 항목별 수정/삭제 링크 생성
- `style.css` — 전체 스타일 (Warm Craft 테마, 반응형 포함)
- `toolbox.json` — 만물상자 데이터 (13개 카테고리, ~177개 항목). **단일 소스**. 디자인 하위 카테고리는 `색`처럼 접두사 없이 저장되며, Issue Template 드롭다운에서는 `디자인 - 색` 형태로 노출되고 워크플로우의 `stripParent`가 접두사를 제거해 저장한다. 카테고리를 추가/변경하면 Issue Template 드롭다운(add_site.yml, edit_site.yml)과 script.js의 `DESIGN_SUBCATS`를 **수동으로** 맞춰야 한다.
- `design-colors.json` — 컬러 팔레트 데이터
- `design-fonts.json` — 폰트 리스트 데이터

## 편집 시스템

GitHub Issue 기반으로 항목 추가/수정/삭제 가능:
- `.github/ISSUE_TEMPLATE/` — 사이트 추가/수정/삭제 Issue Form 템플릿
- `.github/workflows/update_json.yml` — Issue 파싱 → toolbox.json 업데이트(추가/수정/삭제) → 커밋. 드롭다운 자동 동기화 스텝은 없으며, 카테고리 변경 시 템플릿은 수동 갱신한다.
- 웹 페이지의 "추가" 버튼 및 각 항목의 "수정"/"삭제" 링크가 Issue 생성 URL로 연결 (카테고리·이름 파라미터 자동 전달)

## QA

`.claude/agents/`에 QA 에이전트 3종, `.claude/commands/qa.md`로 `/qa` 슬래시 커맨드 통합 실행.
- **qa-data**: JSON 데이터 무결성 (빈 항목, 중복, 필드 누락, URL 형식)
- **qa-design**: 디자인 품질 (반응형, CSS 변수 일관성, 접근성, 폰트 로딩)
- **qa-ux**: UX/사용성 (편집 링크 정합성, 단일 소스 원칙, 터치 타겟, 키보드 접근성)

## Rules

1. 외부 의존성을 설치하거나 사용하지 말 것. 순수 HTML/CSS/JS만 사용.
2. git add, commit, push는 반드시 별도 허락을 받고 수행할 것. 자주 커밋하지 않음.
3. GitHub 퍼블릭 레포에만 저장되며 별도 웹서버나 스토리지 없음. GitHub 시스템(GitHub Pages, Actions 등)을 최대한 활용할 것.
