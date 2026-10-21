/* =====================================================================
   관리자(Supabase overrides, hd_*) → 정적 HTML 굽기
   ---------------------------------------------------------------------
   사용법:  node tools/bake.js            (Supabase 값 + admin/defaults.json 폴백)
            node tools/bake.js --local    (Supabase 안 읽고 defaults.json만)
   - HTML 안의 <!--B:key-->…<!--/B:key--> 사이를 다시 채운다 (idempotent).
   - 연락처(tel/email/address)는 마커 없이 "직전에 구운 값"(tools/bake-state.json) → 새 값 문자열 치환.
   - SEO(title/description/robots/og/canonical)는 <head> 태그를 직접 고쳐 쓴다.
   - 칼럼 본문이 있는 글은 column-{id}.html 상세 페이지를 board.html 틀로 생성한다.
   - sitemap.xml · robots.txt 를 생성한다.
===================================================================== */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SB_URL = "https://oaqrjrrgntlqmyxxovfn.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hcXJqcnJnbnRscW15eHhvdmZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NjQzMTUsImV4cCI6MjA5NzE0MDMxNX0.3bOfZOXVKSoI9ELfE7ZjWETuxvjpNYHdCBSIMrbAGtU";
const PREFIX = "hd_";
const KEYS = ["works", "posts", "hero", "copy", "settings", "slots", "faq", "svc", "seo", "headcode"];
const SERVICE = { catalog: "catalog-brochure", leaflet: "leaflet-pamphlet", poster: "poster-flyer", ci: "ci-logo", package: "package-label", global: "global-design" };

const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const rd = f => fs.readFileSync(path.join(ROOT, f), "utf8");
const changed = [];
const wrIfChanged = (f, s) => { const p = path.join(ROOT, f); if (!fs.existsSync(p) || fs.readFileSync(p, "utf8") !== s) { fs.writeFileSync(p, s); changed.push(f); } };
const deepMerge = (a, b) => { if (!b || typeof b !== "object" || Array.isArray(b)) return b === undefined ? a : b; const o = Object.assign({}, a); Object.keys(b).forEach(k => { o[k] = (a && typeof a[k] === "object" && !Array.isArray(a[k])) ? deepMerge(a[k], b[k]) : b[k]; }); return o; };

async function loadData() {
  const defaults = JSON.parse(rd("admin/defaults.json"));
  const data = {}; KEYS.forEach(k => data[k] = defaults[k]);
  ["cats", "faq_home_visible", "faq_page_visible"].forEach(k => data[k] = defaults[k]);
  if (process.argv.includes("--local")) return data;
  try {
    const q = KEYS.map(k => PREFIX + k).join(",");
    const r = await fetch(`${SB_URL}/rest/v1/overrides?select=k,v&k=in.(${q})`, { headers: { apikey: SB_KEY, Authorization: "Bearer " + SB_KEY } });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const rows = await r.json();
    rows.forEach(row => {
      const k = row.k.slice(PREFIX.length); if (!KEYS.includes(k) || row.v == null) return;
      data[k] = (k === "seo" || k === "svc" || k === "copy" || k === "slots" || k === "settings") ? deepMerge(defaults[k], row.v) : row.v; /* 객체형은 기본값 위에 덮음 */
    });
    console.log("Supabase overrides:", rows.map(r => r.k).join(", ") || "(없음 → 기본값)");
  } catch (e) { console.warn("Supabase 읽기 실패, 기본값 사용:", e.message); }
  return data;
}

function fill(html, key, inner) {
  const k = key.replace(/[.]/g, "\\.");
  return html.replace(new RegExp(`<!--B:${k}-->[\\s\\S]*?<!--/B:${k}-->`, "g"), () => `<!--B:${key}-->${inner}<!--/B:${key}-->`);
}

/* ---- 렌더러 ---- */
const catLabel = (cats, k) => (cats.find(c => c.k === k) || {}).label || k;
const imgTag = (src, alt, extra) => `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" decoding="async"${extra || ""}>`;

function renderWorks(works, cats) {
  return works.map(w => `<a class="wc" data-g="${esc(w.c)}"><div class="m">${imgTag(w.img, "하오 DESIGN " + w.t)}</div><h4>${esc(w.t)}</h4><span>${esc(catLabel(cats, w.c))}</span></a>`).join("");
}
function svcList(works, key) {
  /* 서비스 우선 노출(s:true, so 순서) → 나머지는 포트폴리오 순서 */
  return works.filter(w => w.c === key).map((w, i) => ({ w, i }))
    .sort((a, b) => (b.w.s ? 1 : 0) - (a.w.s ? 1 : 0) || (a.w.so || 1e9) - (b.w.so || 1e9) || a.i - b.i).map(x => x.w);
}
function renderSvc(works, cats, key) {
  const list = svcList(works, key);
  const n = list.length >= 4 ? Math.min(12, Math.floor(list.length / 4) * 4) : list.length;
  return list.slice(0, n).map(w => `<a class="wf-item" href="work.html#${key}"><span class="wf-img">${imgTag(w.img, "하오 DESIGN " + w.t)}</span><span class="wf-cap"><b>${esc(w.t)}</b><em>${esc(catLabel(cats, key))}</em></span></a>`).join("");
}
function renderGal(works, key, n) {
  /* 서비스 상단 갤러리: 포트폴리오 순서 그대로 상위 n장 */
  return works.filter(w => w.c === key).slice(0, n || 10).map(w => `<li><a class="sc-card" href="work.html#${key}"><span class="sc-img">${imgTag(w.img, "하오 DESIGN " + w.t)}</span><span class="sc-cap">${esc(w.t)}</span></a></li>`).join("");
}
function postHref(p) { return p.url && /^https?:/i.test(p.url) ? p.url : `column-${p.id}.html`; }
function renderPosts(posts) {
  const list = [...posts].filter(p => !p.hidden).sort((a, b) => (b.date || "").localeCompare(a.date || "") || b.id - a.id);
  return list.map(p => {
    const ext = /^https?:/i.test(p.url || "");
    return `<a class="cc reveal" href="${esc(postHref(p))}"${ext ? ' target="_blank" rel="noopener"' : ""}><div class="m"><img src="${esc(p.img)}" alt="${esc(p.title)}" loading="lazy">${p.isNew === true ? '<span class="new">NEW</span>' : ""}</div><div class="b"><h3>${esc(p.title)}</h3><p>${esc(p.summary)}</p><time>${esc(p.date)}</time></div></a>`;
  }).join("");
}
function renderHero(hero) {
  return hero.map((s, i) => `<div class="slide${i === 0 ? " active" : ""}"><div class="ph dark"><img src="${esc(s.img)}" alt=""></div>
      <div class="hero-txt"><p class="badge">${esc(s.badge)}</p>${i === 0 ? `<h1>${s.title}</h1>` : `<h2 class="h1">${s.title}</h2>`}<p>${s.desc}</p><a class="btn" href="${esc(s.href || "#")}">문의하기 <span class="arr">→</span></a></div></div>
    `).join("");
}
const BAND_POS = [
  'style="top:calc(8.6 * var(--r));left:0%;width:calc(13 * var(--r));--br:calc(3 * var(--r))"',
  'style="top:calc(52.8 * var(--r));left:0%;width:calc(24 * var(--r));--br:calc(2 * var(--r))"',
  'style="top:calc(26.7 * var(--r));left:20%;width:calc(13 * var(--r));--br:calc(2 * var(--r))"',
  'style="top:calc(81.2 * var(--r));left:40%;width:calc(13 * var(--r));--br:calc(3 * var(--r))"',
  'style="top:calc(6 * var(--r));left:60%;width:calc(26 * var(--r));--br:calc(3 * var(--r))"',
  'style="top:calc(63.7 * var(--r));left:80%;width:calc(24 * var(--r));--br:calc(2 * var(--r))"',
  'style="top:calc(23.2 * var(--r));left:100%;width:calc(13 * var(--r));--br:calc(3 * var(--r))"'];
function renderBand(imgs) {
  return imgs.slice(0, 7).map((src, i) => `<div class="hz-img n${i + 1}" ${BAND_POS[i]}><i><span>${imgTag(src, "하오 DESIGN 포트폴리오")}</span></i></div>`).join("\n    ");
}
function renderFaq(faq, visible) {
  return faq.map((f, i) => `<div class="fq${i < visible ? "" : " more"}"><button class="fq-q" aria-expanded="false"><span>${esc(f.q)}</span></button><button class="fq-pl" aria-label="답변 열기" tabindex="-1"><i></i></button><div class="fq-a"><div>${/^\s*<p/.test(f.a) ? f.a : "<p>" + f.a + "</p>"}</div></div></div>`).join("\n      ");
}
function renderFaqLd(faq) {
  const text = s => String(s).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  return `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": faq.map(f => ({ "@type": "Question", "name": f.q, "acceptedAnswer": { "@type": "Answer", "text": text(f.a) } })) })}</script>`;
}

/* ---- SEO: <head> 태그 직접 수정 ---- */
function applySeo(html, file, seo) {
  const pg = (seo.pages || {})[file]; if (!pg) return html;
  const site = (seo.siteUrl || "").replace(/\/$/, "");
  const url = site ? site + "/" + (file === "index.html" ? "" : file) : "";
  if (pg.title) html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(pg.title)}</title>`);
  if (pg.desc != null) html = /<meta name="description"/.test(html) ? html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(pg.desc)}">`) : html.replace(/<title>[^<]*<\/title>/, m => m + `\n<meta name="description" content="${esc(pg.desc)}">`);
  html = html.replace(/\s*<meta name="robots" content="[^"]*">/, "");
  if (pg.noindex) html = html.replace(/(<meta name="description" content="[^"]*">)/, `$1\n<meta name="robots" content="noindex, nofollow">`);
  /* og / canonical: 기존 것은 지우고 다시 넣는다 */
  html = html.replace(/\s*<meta property="og:[a-z_]+" content="[^"]*">/g, "").replace(/\s*<link rel="canonical" href="[^"]*">/g, "");
  const og = [];
  if (pg.title) og.push(`<meta property="og:title" content="${esc(pg.title)}">`);
  if (pg.desc) og.push(`<meta property="og:description" content="${esc(pg.desc)}">`);
  og.push(`<meta property="og:type" content="website">`);
  if (url) { og.push(`<meta property="og:url" content="${esc(url)}">`); og.push(`<link rel="canonical" href="${esc(url)}">`); }
  const img = pg.ogImage || seo.ogImage; if (img) og.push(`<meta property="og:image" content="${esc(/^https?:/.test(img) || !site ? img : site + "/" + img)}">`);
  if (og.length) html = html.replace(/(<meta name="description" content="[^"]*">(?:\n<meta name="robots" content="[^"]*">)?)/, `$1\n${og.join("\n")}`);
  return html;
}

/* ---- 칼럼 상세 페이지 (board.html 틀 재사용) ---- */
function columnPage(boardHtml, p, seo) {
  let h = boardHtml;
  h = h.replace(/<title>[^<]*<\/title>/, `<title>${esc(p.title)} | 하오 DESIGN</title>`);
  h = h.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(p.summary)}">`);
  h = h.replace(/\s*<meta property="og:[a-z_]+" content="[^"]*">/g, "").replace(/\s*<link rel="canonical" href="[^"]*">/g, "");
  const site = (seo.siteUrl || "").replace(/\/$/, "");
  const og = [`<meta property="og:title" content="${esc(p.title)}">`, `<meta property="og:description" content="${esc(p.summary)}">`, `<meta property="og:type" content="article">`];
  if (site) { og.push(`<meta property="og:url" content="${site}/column-${p.id}.html">`); og.push(`<link rel="canonical" href="${site}/column-${p.id}.html">`); }
  if (p.img) og.push(`<meta property="og:image" content="${esc(p.img)}">`);
  h = h.replace(/(<meta name="description" content="[^"]*">)/, `$1\n${og.join("\n")}`);
  h = h.replace(/<p class="sp-crumb">[\s\S]*?<\/p>\s*<h1>[\s\S]*?<\/h1><p class="lead">[\s\S]*?<\/p>/,
    `<p class="sp-crumb"><a href="index.html">HOME</a> / <a href="board.html">Column</a></p>\n<h1 style="font-size:clamp(26px,2.6vw,44px)">${esc(p.title)}</h1><p class="lead">${esc(p.date)}</p>`);
  const ld = { "@context": "https://schema.org", "@type": "Article", "headline": p.title, "datePublished": p.date, "image": p.img || undefined, "author": { "@type": "Organization", "name": "하오 DESIGN" }, "publisher": { "@type": "Organization", "name": "하오 DESIGN" } };
  const article = `<section class="sp-sec" style="padding-top:20px"><div class="wrap col-body" style="max-width:860px">${p.img ? `<p class="col-cover"><img src="${esc(p.img)}" alt="${esc(p.title)}" style="width:100%;border-radius:12px"></p>` : ""}${p.bodyHtml || ""}${(p.faqs || []).length ? `<h2>자주 묻는 질문</h2>` + p.faqs.map(f => `<h3>Q. ${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join("") : ""}<p class="more" style="margin-top:48px"><a class="btn btn-line" href="board.html">목록으로 <span class="arr">→</span></a></p></div><script type="application/ld+json">${JSON.stringify(ld)}</script></section>`;
  h = h.replace(/<section class="sp-sec" style="padding-top:20px"><div class="wrap"><div class="cgrid">[\s\S]*?<\/div><\/div><\/section>/, article);
  if (!/col-body h3/.test(h)) h = h.replace("</style>", ".col-body{line-height:1.85;font-size:clamp(15px,1.05vw,17px);color:#333}.col-body h2,.col-body h3{margin:34px 0 12px;font-weight:800;line-height:1.4}.col-body h2{font-size:1.4em}.col-body h3{font-size:1.15em;white-space:pre-line;background:#faf7f6;padding:16px 20px;border-radius:10px}.col-body p{margin:0 0 16px}.col-body img{max-width:100%;height:auto}.col-body blockquote{margin:18px 0;padding:14px 20px;border-left:4px solid #e83817;background:#fff6f3;border-radius:0 10px 10px 0}.col-cover{margin:0 0 28px}\n</style>");
  return h;
}

(async () => {
  const d = await loadData();
  const pages = fs.readdirSync(ROOT).filter(f => f.endsWith(".html") && !f.startsWith("_") && !/^column-\d+\.html$/.test(f));
  const state = JSON.parse(rd("tools/bake-state.json"));
  const S = Object.assign({}, state.settings, d.settings || {});
  const slots = d.slots || {};

  for (const f of pages) {
    let h = rd(f);
    h = fill(h, "works", renderWorks(d.works, d.cats));
    Object.keys(SERVICE).forEach(k => {
      h = fill(h, "svc." + k, renderSvc(d.works, d.cats, k));
      const sv = (d.svc || {})[k]; if (!sv) return;
      h = fill(h, "gal." + k, renderGal(d.works, k, sv.gal_n));
      h = fill(h, `svc.${k}.head`, `<span class="l1">${esc(sv.l1)}</span><span class="l2">${esc(sv.l2)}</span>`);
      h = fill(h, `svc.${k}.tag`, esc(sv.tag)); h = fill(h, `svc.${k}.h1`, esc(sv.h1)); h = fill(h, `svc.${k}.desc`, sv.desc);
    });
    h = fill(h, "posts", renderPosts(d.posts));
    h = fill(h, "hero", renderHero(d.hero));
    if (slots.band) h = fill(h, "band", renderBand(slots.band));
    if (slots.creative_img) h = fill(h, "creative_img", `<img src="${esc(slots.creative_img)}" alt="하오 DESIGN 제작 사례" style="object-position:${esc(slots.creative_pos || "center 20%")}">`);
    if (d.faq) { h = fill(h, "faq.home", renderFaq(d.faq, d.faq_home_visible || 5)); h = fill(h, "faq.page", renderFaq(d.faq, d.faq_page_visible || 99)); h = fill(h, "faq.ld", renderFaqLd(d.faq)); }
    Object.keys(d.copy || {}).forEach(k => { h = fill(h, "copy." + k, d.copy[k]); });
    h = fill(h, "headcode", d.headcode || "");
    h = applySeo(h, f, d.seo || {});
    /* 연락처: 직전 값 → 새 값 */
    const old = state.settings;
    if (old.tel && S.tel && old.tel !== S.tel) h = h.split(old.tel).join(S.tel).split("tel:" + old.tel.replace(/\D/g, "")).join("tel:" + S.tel.replace(/\D/g, ""));
    if (old.email && S.email && old.email !== S.email) h = h.split(old.email).join(S.email);
    if (old.address && S.address && old.address !== S.address) h = h.split(old.address).join(S.address);
    wrIfChanged(f, h);
  }

  /* 칼럼 상세 */
  const board = rd("board.html");
  const keep = new Set();
  (d.posts || []).forEach(p => {
    if (p.hidden || /^https?:/i.test(p.url || "") || !p.bodyHtml) return;
    const f = `column-${p.id}.html`; keep.add(f);
    wrIfChanged(f, columnPage(board, p, d.seo || {}));
  });
  fs.readdirSync(ROOT).filter(f => /^column-\d+\.html$/.test(f) && !keep.has(f)).forEach(f => { fs.unlinkSync(path.join(ROOT, f)); changed.push("(삭제) " + f); });

  /* sitemap.xml · robots.txt */
  const site = ((d.seo || {}).siteUrl || "").replace(/\/$/, "");
  if (site) {
    const today = new Date().toISOString().slice(0, 10);
    const urls = pages.filter(f => !((d.seo.pages || {})[f] || {}).noindex).map(f => site + "/" + (f === "index.html" ? "" : f)).concat([...keep].map(f => site + "/" + f));
    const existing = fs.existsSync(path.join(ROOT, "sitemap.xml")) ? rd("sitemap.xml") : "";
    const sm = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${esc(u)}</loc><lastmod>${today}</lastmod></url>`).join("\n")}\n</urlset>\n`;
    if (existing.replace(/<lastmod>[^<]*<\/lastmod>/g, "") !== sm.replace(/<lastmod>[^<]*<\/lastmod>/g, "")) wrIfChanged("sitemap.xml", sm); /* 날짜만 바뀐 경우는 안 씀 */
    wrIfChanged("robots.txt", `User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: ${site}/sitemap.xml\n`);
  }

  /* 연락처 상태 파일은 값이 바뀌었을 때만 (매 굽기마다 커밋이 생기지 않도록) */
  if (JSON.stringify(state.settings) !== JSON.stringify(S)) fs.writeFileSync(path.join(ROOT, "tools/bake-state.json"), JSON.stringify({ settings: S }, null, 1) + "\n");
  console.log(changed.length ? "변경된 파일:\n  " + changed.join("\n  ") : "변경 없음");
  /* 마지막 굽기 시각은 Supabase(hd_bake)에 기록 → 관리자 '반영 대기' 계산에 사용 */
  if (!process.argv.includes("--local")) {
    try {
      const r = await fetch(`${SB_URL}/rest/v1/overrides`, { method: "POST", headers: { apikey: SB_KEY, Authorization: "Bearer " + SB_KEY, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" }, body: JSON.stringify([{ k: PREFIX + "bake", v: { bakedAt: new Date().toISOString(), changed: changed }, updated_at: new Date().toISOString() }]) });
      if (!r.ok) console.warn("hd_bake 기록 실패 HTTP " + r.status);
    } catch (e) { console.warn("hd_bake 기록 실패:", e.message); }
  }
})().catch(e => { console.error(e); process.exit(1); });
