# 관리자 · 굽기 구조

사이트는 정적 HTML(GitHub Pages)이고, 관리자에서 고친 내용은 Supabase에 저장된 뒤 `tools/bake.js`가 HTML에 굽습니다.

```
/admin/               관리자 (index.html · admin.js · admin.css · defaults.json)
/assets/inquiry.js    견적 폼 → Supabase inquiries 저장(+메일 알림)
/tools/bake.js        Supabase(hd_*) → HTML 굽기
/tools/bake-state.json  직전에 구운 연락처 값(문자열 치환용) · 마지막 굽기 시각
/tools/seed.py        최초 1회: HTML에서 defaults.json 추출 + 마커 삽입 (다시 실행하지 않음)
/.github/workflows/bake.yml  30분마다 / 수동 / 푸시 때 굽고 커밋
```

## 저장 위치 (Supabase 프로젝트 oaqrjrrgntlqmyxxovfn — 하오디자인 센터들과 공유)
| 키 | 내용 |
|---|---|
| `hd_works` | 포트폴리오 `[ {id, t, c, img, s, so} ]` — c: catalog/leaflet/poster/ci/package/photo/global, s: 서비스 페이지 우선 노출 |
| `hd_posts` | 칼럼 `[ {id, title, summary, img, date, url, bodyHtml, isNew} ]` — url 있으면 외부 링크, 없고 bodyHtml 있으면 column-{id}.html 생성 |
| `hd_hero` | 홈 슬라이드 3장 `[ {img, badge, title, desc, href} ]` |
| `hd_copy` | 문구 `{cr_title, cr_p1, cr_p2, qt_title, qt_desc}` (HTML 허용) |
| `hd_settings` | `{tel, email, address}` |
| `hd_mail` | `{on, to, url}` 문의 메일 알림(Apps Script /exec) |
| `hd_accounts` | 전용 관리자 계정 `[ {id, pw} ]` — 통합 관리자 `hub_accounts`도 항상 로그인 가능 |
| `inquiries` 테이블 | 문의. 이 사이트 건은 type이 `[하오DESIGN] `로 시작 |

사진은 Supabase Storage `images` 버킷에 올라가고 공개 URL을 씁니다.

## HTML 마커
`<!--B:key-->…<!--/B:key-->` 사이가 굽기 대상입니다. 마커 안쪽은 손으로 고치지 마세요(다음 굽기 때 덮어씁니다).
- `works` work.html 전체 포트폴리오 · `svc.catalog` 등 서비스 6페이지 작업 사례(4열, 최대 12장) · `posts` board.html 카드
- `hero` 홈 슬라이드 · `copy.*` 문구 (견적 섹션 문구는 13페이지 공통)
- 연락처는 마커 없이 "직전 값 → 새 값" 문자열 치환 (`bake-state.json`)

## 수동 굽기
```bash
node tools/bake.js          # Supabase 값으로 굽기
node tools/bake.js --local  # defaults.json 만으로 굽기(오프라인 점검)
```
