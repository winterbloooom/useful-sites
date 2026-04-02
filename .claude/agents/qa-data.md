# QA: 데이터 무결성 검사

JSON 데이터 파일들의 무결성을 자동 점검하는 에이전트.

## 점검 대상 파일
- `toolbox.json`
- `design-colors.json`
- `design-fonts.json`

## 점검 항목

### 1. JSON 파싱
- 각 파일이 유효한 JSON인지 확인

### 2. 빈 항목
- `name`이 빈 문자열("")인 항목이 없는지 확인
- 빈 항목이 있으면 목록으로 보고

### 3. 필수 필드 누락
- toolbox.json: 모든 항목에 `name`, `url`, `desc`, `pick` 필드가 있는지
- `pick`이 boolean 타입인지
- design-fonts.json: `name`, `url`, `tag`, `desc` 필드
- design-colors.json: `palettes` 배열 내 각 항목이 문자열 배열인지

### 4. 중복 검사
- 동일 `name` 중복 항목 검출
- 동일 `url` 중복 항목 검출 (빈 URL 제외)

### 5. URL 형식
- `url`이 빈 문자열이 아닌 경우 `http://` 또는 `https://`로 시작하는지

## 실행 방법
각 항목을 순서대로 점검하고, 문제가 발견되면 카테고리/항목명과 함께 보고.
문제가 없으면 "데이터 무결성 검사 통과"로 요약.
