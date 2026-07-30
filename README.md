# 신상지도

Instagram에서 본 신상 과자·아이스크림이 **어디에서 목격됐는지** 공개 제보로 함께 찾는 모바일 우선 지도입니다.

## 현재 MVP

- 제품명 검색 및 추천/최근 검색어
- 제품 상세의 최신 제보·신뢰도·최신성 상태
- Leaflet + OpenStreetMap 지도와 리스트 보기
- 구 단위 대략 위치 표시 및 `정확한 주소 아님` 안내
- GitHub Issues 기반 판매처 제보 작성
- 저장한 제품·최근 검색·제보 초안의 localStorage 저장
- 개발용 샘플과 실제 사용자 요청 제품을 명시적으로 구분

기본 예시는 `비얀코 트리플 피넛&버터`입니다. 실제 판매처와 재고를 확인한 데이터가 없을 때는 판매처 제보 대기 상태로 표시하며, 임의의 매장 주소를 만들지 않습니다.

## 로컬 실행

```bash
python3 -m http.server 4173
# 브라우저에서 http://127.0.0.1:4173 접속
```

정적 파일 앱이므로 별도 빌드가 필요하지 않습니다. `file://` 직접 열기보다 로컬 HTTP 서버를 사용하는 것이 Leaflet과 해시 라우팅 확인에 안전합니다.

## 검증

```bash
node --check js/app.js
python3 - <<'PY'
from pathlib import Path
required = ['index.html', 'css/tokens.css', 'css/app.css', 'js/data.js', 'js/app.js']
missing = [p for p in required if not Path(p).exists()]
assert not missing, missing
print('static file check: PASS')
PY
```

브라우저 QA 기준:

- 320px, 768px, 1280px에서 가로 스크롤 없음
- 검색 → 제품 상세 → 지도/리스트 전환
- 제보 폼 검증 → GitHub Issue prefill 링크 생성
- Leaflet 지도 로드 및 샘플 마커 팝업
- 저장/최근 검색/초안 새로고침 보존
- 콘솔 오류 없음

## 제보 흐름

제보 작성 완료 후 `josephleee/snackmap`의 `stock-report` 라벨이 채워진 새 GitHub Issue 작성 화면이 열립니다. GitHub 로그인 후 Submit new issue를 눌러야 실제 제보가 등록됩니다.

제보는 그 시점의 목격 정보이며 실제 재고를 보장하지 않습니다. 제품·매장·지역·확인 시각을 정확히 적고, 주소 대신 시/도와 구 단위를 권장합니다.

## GitHub Pages 배포

`main` 브랜치에 push하면 `.github/workflows/pages.yml`이 정적 파일을 GitHub Pages에 배포합니다. 저장소 설정에서 Pages의 Source를 `GitHub Actions`로 선택해야 합니다.
