/* =====================================================================
   관리자(Supabase overrides, hd_*) → 정적 HTML 굽기
   ---------------------------------------------------------------------
   사용법:  node tools/bake.js            (Supabase 값 + admin/defaults.json 폴백)
            node tools/bake.js --local    (Supabase 안 읽고 defaults.json만)
   - HTML 안의 <!--B:key-->…<!--/B:key--> 사이를 다시 채운다 (idempotent).
   - 연락처(tel/email/address)는 마커 없이 "직전에 구운 값"(tools/bake-state.json) → 새 값 문자열 치환.
   - 칼럼 본문이 있는 글은 column-{id}.html 상세 페이지를 board.html 틀로 생성한다.
===================================================================== */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SB_URL = "https://oaqrjrrgntlqmyxxovfn.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hcXJqcnJnbnRscW15eHhvdmZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NjQzMTUsImV4cCI6MjA5NzE0MDMxNX0.3bOfZOXVKSoI9ELfE7ZjWETuxvjpNYHdCBSIMrbAGtU";
const PREFIX = "hd_";
const KEYS = ["works", "posts", "hero", "copy", "settings"];
const SERVICE = { catalog: "catalog-brochure", leaflet: "leaflet-pamphlet", poster: "poster-flyer", ci: "ci-logo", package: "package-label", global: "global-design" };

const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const rd = f => fs.readFileSync(path.join(ROOT, f), "utf8");
const wrIfChanged = (f, s) => { const p = path.join(ROOT, f); if (!fs.existsSync(p) || fs.readFileSync(p, "utf8") !== s) { fs.writeFileSync(p, s); changed.push(f); } };
const changed = [];

async function loadData() {
  const defaults = JSON.parse(rd("admin/defaults.json"));
  const data = {}; KEYS.forEach(k => data[k] = defaults[k]);
  data.cats = defaults.cats;
  if (process.argv.includes("--local")) return data;
  try {
    const q = KEYS.map(k => PREFIX + k).join(",");
    const r = await fetch(`${SB_URL}/rest/v1/overrides?select=k,v&k=in.(${q})`, { headers: { apikey: SB_KEY, Authorization: "Bearer " + SB_KEY } });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const rows = await r.json();
    rows.forEach(row => { const k = row.k.slice(PREFIX.length); if (KEYS.includes(k) && row.v != null) data[k] = row.v; });
    console.log("Supabase overrides:", rows.map(r => r.k).join(", ") || "(없음 → 기본값)");
  } catch (e) { console.warn("Supabase 읽기 실패, 기본값 사용:", e.message); }
  return data;
}

function fill(html, key, inner) {
  const re = new RegExp(`<!--B:${key.replace(/\./g, "\\.")}-->[\\s\\S]*?<!--/B:${key.replace(/\./g, "\\.")}-->`, "g");
  return html.replace(re, () => `<!--B:${key}-->${inner}<!--/B:${key}-->`);
}

/* ---- 렌더러 ---- */
const catLabel = (cats, k) => (cats.find(c => c.k === k) || {}).label || k;

function renderWorks(works, cats) {
  return works.map(w => `<a class="wc" data-g="${esc(w.c)}"><div class="m"><img src="${esc(w.img)}" alt="하오 DESIGN ${esc(w.t)}" loading="lazy" decoding="async"></div><h4>${esc(w.t)}</h4><span>${esc(catLabel(cats, w.c))}</span></a>`).join("");
}
function renderSvc(works, cats, key) {
  /* 서비스 우선 노출(s:true, so 순서) → 나머지는 포트폴리오 순서 */
  const list = works.filter(w => w.c === key).map((w, i) => ({ w, i }))
    .sort((a, b) => (b.w.s ? 1 : 0) - (a.w.s ? 1 : 0) || (a.w.so || 1e9) - (b.w.so || 1e9) || a.i - b.i).map(x => x.w);
  const n = list.length >= 4 ? Math.min(12, Math.floor(list.length / 4) * 4) : list.length;
  return list.slice(0, n).map(w => `<a class="wf-item" href="work.html#${key}"><span class="wf-img"><img src="${esc(w.img)}" alt="하오 DESIGN ${esc(w.t)}" loading="lazy" decoding="async"></span><span class="wf-cap"><b>${esc(w.t)}</b><em>${esc(catLabel(cats, key))}</em></span></a>`).join("");
}
function isNew(p) { return p.isNew === true; }
function postHref(p) { return p.url && /^https?:/i.test(p.url) ? p.url : `column-${p.id}.html`; }
function renderPosts(posts) {
  const list = [...posts].sort((a, b) => (b.date || "").localeCompare(a.date || "") || b.id - a.id);
  return list.map(p => {
    const ext = /^https?:/i.test(p.url || "");
    return `<a class="cc reveal" href="${esc(postHref(p))}"${ext ? ' target="_blank" rel="noopener"' : ""}><div class="m"><img src="${esc(p.img)}" alt="${esc(p.title)}" loading="lazy">${isNew(p) ? '<span class="new">NEW</span>' : ""}</div><div class="b"><h3>${esc(p.title)}</h3><p>${esc(p.summary)}</p><time>${esc(p.date)}</time></div></a>`;
  }).join("");
}
function renderHero(hero) {
  return hero.map((s, i) => `<div class="slide${i === 0 ? " active" : ""}"><div class="ph dark"><img src="${esc(s.img)}" alt=""></div>
      <div class="hero-txt"><p class="badge">${esc(s.badge)}</p>${i === 0 ? `<h1>${s.title}</h1>` : `<h2 class="h1">${s.title}</h2>`}<p>${s.desc}</p><a class="btn" href="${esc(s.href || "#")}">문의하기 <span class="arr">→</span></a></div></div>
    `).join("");
}

/* ---- 칼럼 상세 페이지 (board.html 틀 재사용) ---- */
function columnPage(boardHtml, p) {
  let h = boardHtml;
  h = h.replace(/<title>[^<]*<\/title>/, `<title>${esc(p.title)} | 하오 DESIGN</title>`);
  h = h.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(p.summary)}">`);
  h = h.replace(/<p class="sp-crumb">[\s\S]*?<\/p>\s*<h1>[^<]*<\/h1><p class="lead">[^<]*<\/p>/,
    `<p class="sp-crumb"><a href="index.html">HOME</a> / <a href="board.html">Column</a></p>\n<h1 style="font-size:clamp(26px,2.6vw,44px)">${esc(p.title)}</h1><p class="lead">${esc(p.date)}</p>`);
  const article = `<section class="sp-sec" style="padding-top:20px"><div class="wrap col-body" style="max-width:860px">${p.img ? `<p class="col-cover"><img src="${esc(p.img)}" alt="${esc(p.title)}" style="width:100%;border-radius:12px"></p>` : ""}${p.bodyHtml || ""}<p class="more" style="margin-top:48px"><a class="btn btn-line" href="board.html">목록으로 <span class="arr">→</span></a></p></div></section>`;
  h = h.replace(/<section class="sp-sec" style="padding-top:20px"><div class="wrap"><div class="cgrid">[\s\S]*?<\/div><\/div><\/section>/, article);
  if (!/col-body h3/.test(h)) h = h.replace("</style>", ".col-body{line-height:1.85;font-size:clamp(15px,1.05vw,17px);color:#333}.col-body h2,.col-body h3{margin:34px 0 12px;font-weight:800;line-height:1.4}.col-body h2{font-size:1.4em}.col-body h3{font-size:1.15em;white-space:pre-line;background:#faf7f6;padding:16px 20px;border-radius:10px}.col-body p{margin:0 0 16px}.col-body img{max-width:100%;height:auto}.col-cover{margin:0 0 28px}\n</style>");
  return h;
}

(async () => {
  const d = await loadData();
  const pages = fs.readdirSync(ROOT).filter(f => f.endsWith(".html") && !f.startsWith("_") && !/^column-\d+\.html$/.test(f));
  const state = JSON.parse(rd("tools/bake-state.json"));
  const S = Object.assign({}, state.settings, d.settings || {});

  for (const f of pages) {
    let h = rd(f);
    h = fill(h, "works", renderWorks(d.works, d.cats));
    Object.keys(SERVICE).forEach(k => { h = fill(h, "svc." + k, renderSvc(d.works, d.cats, k)); });
    h = fill(h, "posts", renderPosts(d.posts));
    h = fill(h, "hero", renderHero(d.hero));
    Object.keys(d.copy || {}).forEach(k => { h = fill(h, "copy." + k, d.copy[k]); });
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
    if (/^https?:/i.test(p.url || "") || !p.bodyHtml) return;
    const f = `column-${p.id}.html`; keep.add(f);
    wrIfChanged(f, columnPage(board, p));
  });
  fs.readdirSync(ROOT).filter(f => /^column-\d+\.html$/.test(f) && !keep.has(f)).forEach(f => { fs.unlinkSync(path.join(ROOT, f)); changed.push("(삭제) " + f); });

  fs.writeFileSync(path.join(ROOT, "tools/bake-state.json"), JSON.stringify({ settings: S, bakedAt: new Date().toISOString() }, null, 1) + "\n");
  console.log(changed.length ? "변경된 파일:\n  " + changed.join("\n  ") : "변경 없음");
})().catch(e => { console.error(e); process.exit(1); });
