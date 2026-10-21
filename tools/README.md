# 관리자 · 굽기 구조

사이트는 정적 HTML(GitHub Pages)이고, 관리자에서 고친 내용은 Supabase에 저장된 뒤 `tools/bake.js`가 HTML에 굽습니다.

```
/admin/                 관리자 (index.html · admin.css · js/core.js · js/app.js · defaults.json)
/assets/inquiry.js      견적 폼 → Supabase inquiries 저장(+메일 알림)
/tools/bake.js          Supabase(hd_*) → HTML 굽기 (+ column-*.html · sitemap.xml · robots.txt)
/tools/bake-state.json  직전에 구운 연락처 값(문자열 치환용) · 마지막 굽기 시각
/tools/seed.py seed2.py 최초 1회: HTML에서 defaults.json 추출 + 마커 삽입 (다시 실행하지 않음)
/.github/workflows/bake.yml  30분마다 / 수동(Run workflow) / tools·defaults 푸시 때 굽고 커밋
```

## 관리자 탭
대시보드(반영 대기·최근 문의·서비스별 노출 장수·작업 기록) · 견적 문의(상태/메모/검색/CSV) · 포트폴리오(드래그 정렬·검색·다중 업로드·일괄 분류/삭제·서비스 우선·제목 인라인 수정) · 칼럼(편집기·HTML·미리보기·숨김·복제·글 FAQ) · FAQ(드래그 정렬) · 히어로 배너 · 사진 슬롯(홈 띠 7장·CREATIVE 사진) · 문구(홈·견적·서브·서비스 6페이지) · SEO(페이지별 제목/설명/noindex/og·점검) · 사이트 설정(연락처·메일 알림·헤드 코드·GitHub 토큰) · 관리자 계정 · 작업 기록

상단 **지금 반영**: 설정 탭에 GitHub fine-grained 토큰(Actions: Read and write)을 넣어두면 버튼으로 `Bake site` 워크플로를 바로 실행합니다. 토큰이 없으면 Actions 페이지를 열어줍니다. 토큰은 브라우저 localStorage에만 저장됩니다.

## 저장 위치 (Supabase 프로젝트 oaqrjrrgntlqmyxxovfn — 하오디자인 센터들과 공유)
| 키 | 내용 |
|---|---|
| `hd_works` | 포트폴리오 `[ {id, t, c, img, s, so} ]` — c: catalog/leaflet/poster/ci/package/photo/global, s: 서비스 페이지 우선 노출 |
| `hd_posts` | 칼럼 `[ {id, title, summary, img, date, url, bodyHtml, isNew, hidden, faqs, keywords} ]` — url 있으면 외부 링크, 없고 bodyHtml 있으면 column-{id}.html 생성 |
| `hd_hero` | 홈 슬라이드 `[ {img, badge, title, desc, href} ]` |
| `hd_slots` | `{band:[7장], creative_img, creative_pos}` |
| `hd_copy` | 문구 `{cr_*, qt_*, pg_<page>_h1/lead}` (HTML 허용) |
| `hd_svc` | 서비스 페이지 상단 `{catalog:{l1,l2,tag,h1,desc,gal_n}, …}` |
| `hd_faq` | `[ {q, a} ]` — 홈은 앞 5개, FAQ 페이지는 전체 + FAQPage JSON-LD |
| `hd_seo` | `{siteUrl, ogImage, pages:{file:{title, desc, noindex, ogImage}}}` → title/description/robots/og/canonical, sitemap.xml, robots.txt |
| `hd_headcode` | 전 페이지 `<head>` 끝에 삽입되는 코드 |
| `hd_settings` | `{tel, email, address}` · `hd_mail` `{on, to, url}` · `hd_accounts` `[ {id, pw} ]` |
| `hd_inq_meta` | 문의별 `{id:{st: new/doing/done, memo}}` · `hd_log` 작업 기록 120건 |
| `inquiries` 테이블 | 문의. 이 사이트 건은 type이 `[하오DESIGN] `로 시작 |

사진은 Supabase Storage `images` 버킷에 올라가고 공개 URL을 씁니다(긴 변 1600px로 줄여 올림).

## HTML 마커
`<!--B:key-->…<!--/B:key-->` 사이가 굽기 대상입니다. 마커 안쪽은 손으로 고치지 마세요(다음 굽기 때 덮어씁니다).
- `works` work.html 전체 · `svc.<cat>` 서비스 작업 사례(4열, 최대 12장: 서비스 우선 → 포트폴리오 순) · `gal.<cat>` 서비스 상단 갤러리(포트폴리오 순 상위 10) · `svc.<cat>.head/tag/h1/desc`
- `posts` 칼럼 카드 · `hero` 홈 슬라이드 · `band` 홈 띠 · `creative_img` · `faq.home` `faq.page` `faq.ld` · `copy.*` · `headcode`
- 연락처는 마커 없이 "직전 값 → 새 값" 문자열 치환 (`bake-state.json`) · SEO는 `<head>` 태그를 직접 고쳐 씀

## 수동 굽기
```bash
node tools/bake.js          # Supabase 값으로 굽기
node tools/bake.js --local  # defaults.json 만으로 굽기(오프라인 점검)
```
