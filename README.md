# 만물상자 + 디자인 치트시트

유용한 웹사이트/프로그램 링크 모음과 디자인 참고 자료를 한곳에 모아둔 정적 웹 페이지.

## 구조

| 섹션 | 설명 | 데이터 |
|------|------|--------|
| **만물상자** | 글쓰기, 연구, 변환, 개발, 시각화, 디자인소재, 템플릿, 통계·동향, 브랜딩 (173개) | `toolbox.json` |
| **디자인 치트시트** | 컬러 팔레트, 폰트 리스트 | `design-colors.json`, `design-fonts.json` |

## 사이트 보기

GitHub Pages: [https://winterbloooom.github.io/useful-sites/](https://winterbloooom.github.io/useful-sites/)

**기능**
- 카테고리 탭 전환
- 텍스트 검색 (이름/설명)
- 정렬 (기본 / 이름순 / 자주사용순)
- 리스트 / 카드 뷰 토글

## 사이트 편집 (추가/수정/삭제)

GitHub Issue를 통해 편집 가능. Issue 생성 시 GitHub Actions가 `toolbox.json`을 자동 업데이트하고, Issue Template 드롭다운도 함께 동기화.

| 작업 | 방법 |
|------|------|
| 추가 | 웹 페이지 toolbar의 **+ 추가** 버튼 또는 [Issue 직접 생성](../../issues/new?template=add_site.yml) |
| 수정 | 웹 페이지에서 항목 hover → **수정** 클릭 또는 [Issue 직접 생성](../../issues/new?template=edit_site.yml) |
| 삭제 | 웹 페이지에서 항목 hover → **삭제** 클릭 또는 [Issue 직접 생성](../../issues/new?template=delete_site.yml) |

## QA

Claude Code에서 `/qa` 명령으로 전체 품질 점검 실행. 3개 에이전트가 병렬로 동작.

| 에이전트 | 점검 내용 |
|----------|-----------|
| **qa-data** | JSON 유효성, 빈 항목, 필드 누락, 중복, URL 형식 |
| **qa-design** | 반응형, CSS 변수 일관성, 인터랙션 피드백, 시맨틱 HTML, 폰트 로딩 |
| **qa-ux** | 편집 링크 정합성, 단일 소스 원칙, 터치 타겟, 키보드 접근성 |

## 파일 구조

```
index.html              # SPA 메인 페이지
script.js               # 네비게이션, 검색, 정렬, 뷰 토글
style.css               # 스타일 (Warm Craft 테마, 반응형)
toolbox.json            # 만물상자 데이터 (단일 소스)
design-colors.json      # 컬러 팔레트 데이터
design-fonts.json       # 폰트 리스트 데이터
CLAUDE.md               # 프로젝트 가이드
.github/
  ISSUE_TEMPLATE/       # 사이트 추가/수정/삭제 폼
  workflows/            # Issue → JSON 업데이트 + 템플릿 동기화
.claude/
  agents/               # QA 에이전트 (qa-data, qa-design, qa-ux)
  commands/             # /qa 슬래시 커맨드
```
