/* 하오 DESIGN 관리자 — 디자인센터(haod-new/design) 관리자를 이 사이트 전용으로 줄인 판
   저장소: Supabase overrides (키 접두사 hd_) · 사진: Supabase Storage images 버킷 · 문의: inquiries 테이블
   사이트 반영: tools/bake.js (GitHub Actions 30분 주기) */
(function () {
  "use strict";
  var SB_URL = "https://oaqrjrrgntlqmyxxovfn.supabase.co";
  var SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hcXJqcnJnbnRscW15eHhvdmZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NjQzMTUsImV4cCI6MjA5NzE0MDMxNX0.3bOfZOXVKSoI9ELfE7ZjWETuxvjpNYHdCBSIMrbAGtU";
  var SB_H = { "apikey": SB_KEY, "Authorization": "Bearer " + SB_KEY, "Content-Type": "application/json" };
  var P = "hd_", INQ_TAG = "[하오DESIGN]";
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  /* 사이트 루트 기준 상대경로(assets/…)를 관리자(/admin/)에서 보이게 */
  var src = function (u) { return !u || /^(https?:|data:|\/)/.test(u) ? (u || "") : "../" + u; };
  var toastT; function toast(m, bad) { var t = $("toast"); t.textContent = m; t.style.background = bad ? "#c62828" : ""; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(function () { t.hidden = true; }, 2600); }

  /* ---- Supabase ---- */
  function sbGet(path) { return fetch(SB_URL + path, { headers: SB_H }).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }); }
  function sbSave(k, v) {
    return fetch(SB_URL + "/rest/v1/overrides", { method: "POST", headers: Object.assign({ "Prefer": "resolution=merge-duplicates" }, SB_H), body: JSON.stringify([{ k: P + k, v: v, updated_at: new Date().toISOString() }]) })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); });
  }
  function sbUpload(blob, ext) {
    var name = "img_" + Date.now() + "_" + Math.floor(Math.random() * 1e9).toString(36) + "." + (ext || "jpg");
    return fetch(SB_URL + "/storage/v1/object/images/" + name, { method: "POST", headers: { "apikey": SB_KEY, "Authorization": "Bearer " + SB_KEY, "Content-Type": blob.type || "image/jpeg", "x-upsert": "true" }, body: blob })
      .then(function (r) { if (!r.ok) throw new Error("업로드 실패 " + r.status); return SB_URL + "/storage/v1/object/public/images/" + name; });
  }
  /* 파일 → 긴 변 1280px JPEG → 업로드 → URL */
  function uploadFile(file) {
    return new Promise(function (res, rej) {
      if (!file || !/^image\//.test(file.type)) return rej(new Error("이미지 파일이 아닙니다"));
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var MAX = 1280, w = img.width, h = img.height, r = Math.min(1, MAX / Math.max(w, h));
        var c = document.createElement("canvas"); c.width = Math.round(w * r); c.height = Math.round(h * r);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
        c.toBlob(function (b) { sbUpload(b, "jpg").then(res, rej); }, "image/jpeg", 0.85);
      };
      img.onerror = function () { rej(new Error("이미지를 읽지 못했습니다")); }; img.src = url;
    });
  }

  /* ---- 데이터 ---- */
  var DEF = null, D = {}, hub = [{ id: "admin", pw: "haohub1234" }];
  function load() {
    return Promise.all([
      fetch("defaults.json?v=" + Date.now()).then(function (r) { return r.json(); }),
      sbGet("/rest/v1/overrides?select=k,v&k=like." + P + "*").catch(function () { return []; }),
      sbGet("/rest/v1/overrides?select=v&k=eq.hub_accounts").catch(function () { return []; })
    ]).then(function (a) {
      DEF = a[0];
      ["works", "posts", "hero", "copy", "settings", "mail"].forEach(function (k) { D[k] = clone(DEF[k]); });
      D.accounts = [];
      a[1].forEach(function (row) { var k = row.k.slice(P.length); if (row.v != null) D[k] = row.v; });
      if (a[2][0] && Array.isArray(a[2][0].v) && a[2][0].v.length) hub = a[2][0].v;
    });
  }
  function store(k, v, msg) { return sbSave(k, v).then(function () { toast(msg || "저장되었습니다"); renderCounts(); }).catch(function (e) { toast("저장 실패: " + e.message, true); throw e; }); }

  /* ---- 로그인 ---- */
  function ok(id, pw) { return hub.concat(D.accounts || []).some(function (a) { return a && a.id === id && a.pw === pw; }); }
  function showAdmin() { $("loginView").hidden = true; $("adminView").hidden = false; renderAll(); }
  $("loginForm").addEventListener("submit", function (e) {
    e.preventDefault();
    if (ok($("loginId").value.trim(), $("loginPw").value)) { sessionStorage.setItem("hd_admin", "1"); showAdmin(); }
    else $("loginErr").textContent = "아이디 또는 비밀번호가 올바르지 않습니다.";
  });
  $("logoutBtn").addEventListener("click", function () { sessionStorage.removeItem("hd_admin"); location.reload(); });

  /* ---- 탭 ---- */
  $("sideMenu").addEventListener("click", function (e) {
    var b = e.target.closest("[data-tab]"); if (!b) return;
    document.querySelectorAll("#sideMenu button").forEach(function (x) { x.classList.toggle("on", x === b); });
    document.querySelectorAll(".tab").forEach(function (s) { s.classList.toggle("on", s.id === "tab-" + b.dataset.tab); });
    if (b.dataset.tab === "inq") refreshInq();
  });

  function renderCounts() {
    $("cntWorks").textContent = $("stWorks").textContent = D.works.length;
    $("cntPosts").textContent = $("stPosts").textContent = D.posts.length;
  }
  function renderAll() {
    renderCounts(); renderHero(); renderCopy(); renderWorks(); renderPosts(); renderSet(); renderAcc(); refreshInq();
    fetch("../tools/bake-state.json?v=" + Date.now()).then(function (r) { return r.json(); }).then(function (s) { $("stBaked").textContent = s.bakedAt ? new Date(s.bakedAt).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "-"; }).catch(function () {});
  }

  /* ---- 히어로 ---- */
  function renderHero() {
    $("heroList").innerHTML = D.hero.map(function (s, i) {
      return '<div class="hcard"><div><div class="pv"><img id="hPv' + i + '" src="' + esc(src(s.img)) + '" alt=""></div><input type="file" accept="image/*" data-hfile="' + i + '" style="margin-top:8px;width:100%;font-size:.78rem"></div>' +
        '<div class="fs"><div><label>슬라이드 ' + (i + 1) + ' · 작은 글씨(배지)</label><input type="text" data-h="' + i + '" data-k="badge" value="' + esc(s.badge) + '"></div>' +
        '<div><label>큰 제목 (HTML)</label><textarea data-h="' + i + '" data-k="title">' + esc(s.title) + '</textarea></div>' +
        '<div><label>설명 (HTML)</label><textarea data-h="' + i + '" data-k="desc">' + esc(s.desc) + '</textarea></div>' +
        '<div><label>이미지 URL</label><input type="text" data-h="' + i + '" data-k="img" value="' + esc(s.img) + '"></div></div></div>';
    }).join("");
  }
  $("heroList").addEventListener("input", function (e) { var el = e.target; if (el.dataset.h != null) { D.hero[+el.dataset.h][el.dataset.k] = el.value; if (el.dataset.k === "img") $("hPv" + el.dataset.h).src = src(el.value); } });
  $("heroList").addEventListener("change", function (e) {
    var el = e.target; if (el.dataset.hfile == null) return; var i = +el.dataset.hfile;
    toast("업로드 중…"); uploadFile(el.files[0]).then(function (u) { D.hero[i].img = u; renderHero(); toast("업로드 완료, 저장을 눌러주세요"); }).catch(function (er) { toast(er.message, true); });
  });
  $("heroSave").addEventListener("click", function () { store("hero", D.hero, "히어로 저장 완료"); });

  /* ---- 문구 ---- */
  var COPY_LABEL = { cr_title: ["CREATIVE 섹션 제목", "홈"], cr_p1: ["CREATIVE 설명 1 (<p> 두 줄)", "홈"], cr_p2: ["CREATIVE 설명 2 (<p> 두 줄)", "홈"], qt_title: ["견적 섹션 제목", "전 페이지"], qt_desc: ["견적 섹션 설명", "전 페이지"] };
  function renderCopy() {
    $("copyList").innerHTML = Object.keys(DEF.copy).map(function (k) {
      var l = COPY_LABEL[k] || [k, ""];
      return '<div class="ccard"><label>' + esc(l[0]) + '<small>' + esc(l[1]) + '</small></label><textarea data-c="' + k + '">' + esc(D.copy[k] != null ? D.copy[k] : DEF.copy[k]) + '</textarea><div class="pv" id="cpv_' + k + '">' + (D.copy[k] != null ? D.copy[k] : DEF.copy[k]) + '</div></div>';
    }).join("");
  }
  $("copyList").addEventListener("input", function (e) { var el = e.target; if (el.dataset.c) { D.copy[el.dataset.c] = el.value; $("cpv_" + el.dataset.c).innerHTML = el.value; } });
  $("copySave").addEventListener("click", function () { store("copy", D.copy, "문구 저장 완료"); });

  /* ---- 포트폴리오 ---- */
  var wFilter = "all", wImg = "";
  function catLabel(k) { for (var i = 0; i < DEF.cats.length; i++) if (DEF.cats[i].k === k) return DEF.cats[i].label; return k; }
  function renderWorks() {
    var counts = { all: D.works.length }; D.works.forEach(function (w) { counts[w.c] = (counts[w.c] || 0) + 1; });
    $("workChips").innerHTML = [{ k: "all", label: "전체" }].concat(DEF.cats).map(function (c) { return '<button class="chip' + (wFilter === c.k ? " on" : "") + '" data-f="' + c.k + '">' + esc(c.label) + '<b>' + (counts[c.k] || 0) + '</b></button>'; }).join("");
    $("wCat").innerHTML = DEF.cats.map(function (c) { return '<option value="' + c.k + '">' + esc(c.label) + '</option>'; }).join("");
    var list = D.works.map(function (w, i) { return { w: w, i: i }; }).filter(function (x) { return wFilter === "all" || x.w.c === wFilter; });
    $("workList").innerHTML = list.length ? list.map(function (x) {
      return '<div class="wk"><img src="' + esc(src(x.w.img)) + '" alt="" loading="lazy"><div class="t">' + esc(x.w.t) + '</div><div class="c">' + esc(catLabel(x.w.c)) + (x.w.s ? "<b>서비스 우선</b>" : "") + '</div>' +
        '<div class="ac"><button data-up="' + x.i + '" title="앞으로">▲</button><button data-down="' + x.i + '" title="뒤로">▼</button><button data-edit="' + x.i + '">수정</button><button data-del="' + x.i + '">삭제</button></div></div>';
    }).join("") : '<p class="empty">작품이 없습니다.</p>';
  }
  $("workChips").addEventListener("click", function (e) { var b = e.target.closest(".chip"); if (b) { wFilter = b.dataset.f; renderWorks(); } });
  function openWork(i) {
    var w = i >= 0 ? D.works[i] : { t: "", c: wFilter === "all" ? DEF.cats[0].k : wFilter, img: "", s: false };
    $("wIdx").value = i; $("wTitle").value = w.t; $("wCat").value = w.c; $("wImgUrl").value = w.img; $("wPrev").src = src(w.img); $("wSvc").checked = !!w.s; wImg = w.img || ""; $("wFile").value = "";
    $("workForm").hidden = false; $("workForm").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  $("workAdd").addEventListener("click", function () { openWork(-1); });
  $("workCancel").addEventListener("click", function () { $("workForm").hidden = true; });
  $("wImgUrl").addEventListener("input", function () { wImg = this.value.trim(); $("wPrev").src = src(wImg); });
  $("wFile").addEventListener("change", function () { toast("업로드 중…"); uploadFile(this.files[0]).then(function (u) { wImg = u; $("wImgUrl").value = u; $("wPrev").src = u; toast("업로드 완료"); }).catch(function (er) { toast(er.message, true); }); });
  $("workForm").addEventListener("submit", function (e) {
    e.preventDefault(); var i = +$("wIdx").value;
    if (!wImg) return toast("이미지를 올리거나 URL을 넣어주세요", true);
    var w = { id: i >= 0 ? D.works[i].id : Math.max.apply(null, [0].concat(D.works.map(function (x) { return x.id || 0; }))) + 1, t: $("wTitle").value.trim(), c: $("wCat").value, img: wImg, s: $("wSvc").checked };
    if (i >= 0) { w.so = D.works[i].so; D.works[i] = w; } else { D.works.unshift(w); }
    $("workForm").hidden = true; renderWorks(); store("works", D.works, "포트폴리오 저장 완료");
  });
  $("workList").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    if (b.dataset.edit) openWork(+b.dataset.edit);
    else if (b.dataset.del) { if (confirm("이 작품을 삭제할까요?")) { D.works.splice(+b.dataset.del, 1); renderWorks(); store("works", D.works, "삭제했습니다"); } }
    else if (b.dataset.up != null || b.dataset.down != null) {
      var i = +(b.dataset.up != null ? b.dataset.up : b.dataset.down), j = b.dataset.up != null ? i - 1 : i + 1;
      /* 같은 분류 안에서 이웃과 자리 바꿈 */
      while (j >= 0 && j < D.works.length && wFilter !== "all" && D.works[j].c !== wFilter) j += (b.dataset.up != null ? -1 : 1);
      if (j < 0 || j >= D.works.length) return;
      var t = D.works[i]; D.works[i] = D.works[j]; D.works[j] = t;
      D.works.forEach(function (w) { delete w.so; }); /* 수동 순서를 썼으니 서비스 우선순위는 목록 순서로 */
      renderWorks(); store("works", D.works, "순서 저장 완료");
    }
  });

  /* ---- 칼럼 ---- */
  var pImg = "";
  function renderPosts() {
    var list = D.posts.slice().sort(function (a, b) { return (b.date || "").localeCompare(a.date || "") || b.id - a.id; });
    $("postList").innerHTML = '<div class="panel">' + (list.length ? list.map(function (p) {
      var i = D.posts.indexOf(p);
      return '<div class="row"><img src="' + esc(src(p.img)) + '" alt=""><div class="t"><b>' + esc(p.title) + '</b><small>' + esc(p.date) + (p.url ? " · 외부 링크" : " · column-" + p.id + ".html") + "\n" + esc(p.summary) + '</small></div><div class="ac"><button data-pedit="' + i + '">수정</button></div></div>';
    }).join("") : '<p class="empty">칼럼이 없습니다.</p>') + "</div>";
  }
  function openPost(i) {
    var p = i >= 0 ? D.posts[i] : { title: "", date: new Date().toISOString().slice(0, 10), img: "", summary: "", url: "", bodyHtml: "", isNew: true };
    $("pIdx").value = i; $("pTitle").value = p.title; $("pDate").value = p.date || ""; $("pNew").checked = !!p.isNew; $("pImgUrl").value = p.img; $("pPrev").src = src(p.img); pImg = p.img || "";
    $("pSummary").value = p.summary || ""; $("pUrl").value = p.url || ""; $("pEditor").innerHTML = p.bodyHtml || ""; $("pFile").value = ""; $("postDel").hidden = i < 0;
    $("postForm").hidden = false; $("postForm").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  $("postAdd").addEventListener("click", function () { openPost(-1); });
  $("postCancel").addEventListener("click", function () { $("postForm").hidden = true; });
  $("postList").addEventListener("click", function (e) { var b = e.target.closest("[data-pedit]"); if (b) openPost(+b.dataset.pedit); });
  $("pImgUrl").addEventListener("input", function () { pImg = this.value.trim(); $("pPrev").src = src(pImg); });
  $("pFile").addEventListener("change", function () { toast("업로드 중…"); uploadFile(this.files[0]).then(function (u) { pImg = u; $("pImgUrl").value = u; $("pPrev").src = u; toast("업로드 완료"); }).catch(function (er) { toast(er.message, true); }); });
  $("pTools").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-cmd]"); if (!b) return; var c = b.dataset.cmd; $("pEditor").focus();
    if (c === "h3" || c === "p") document.execCommand("formatBlock", false, c); else if (c === "hr") document.execCommand("insertHorizontalRule"); else document.execCommand(c);
  });
  $("pBodyImg").addEventListener("change", function () { var f = this.files[0]; toast("업로드 중…"); uploadFile(f).then(function (u) { $("pEditor").focus(); document.execCommand("insertImage", false, u); toast("사진 삽입 완료"); }).catch(function (er) { toast(er.message, true); }); this.value = ""; });
  $("postForm").addEventListener("submit", function (e) {
    e.preventDefault(); var i = +$("pIdx").value, body = $("pEditor").innerHTML.trim(), url = $("pUrl").value.trim();
    if (!url && !body) return toast("본문을 쓰거나 외부 링크를 넣어주세요", true);
    var p = { id: i >= 0 ? D.posts[i].id : Math.max.apply(null, [0].concat(D.posts.map(function (x) { return x.id || 0; }))) + 1, title: $("pTitle").value.trim(), date: $("pDate").value, img: pImg, summary: $("pSummary").value.trim() || $("pEditor").textContent.trim().slice(0, 60), url: url, bodyHtml: url ? "" : body, isNew: $("pNew").checked };
    if (i >= 0) D.posts[i] = p; else D.posts.unshift(p);
    $("postForm").hidden = true; renderPosts(); store("posts", D.posts, "칼럼 저장 완료");
  });
  $("postDel").addEventListener("click", function () { var i = +$("pIdx").value; if (i >= 0 && confirm("이 글을 삭제할까요?")) { D.posts.splice(i, 1); $("postForm").hidden = true; renderPosts(); store("posts", D.posts, "삭제했습니다"); } });

  /* ---- 문의 ---- */
  var inq = [], inqF = "mine";
  function refreshInq() {
    sbGet("/rest/v1/inquiries?select=*&order=created_at.desc&limit=300").then(function (rows) {
      inq = rows.map(function (r) { return { id: r.id, name: r.name, phone: r.phone, type: r.type || "", message: r.message || "", date: r.created_at ? new Date(r.created_at).toLocaleString("ko-KR") : "", mine: (r.type || "").indexOf(INQ_TAG) === 0 }; });
      var mine = inq.filter(function (q) { return q.mine; }).length;
      $("cntInq").textContent = $("stInq").textContent = mine;
      $("inqChips").innerHTML = '<button class="chip' + (inqF === "mine" ? " on" : "") + '" data-f="mine">이 사이트<b>' + mine + '</b></button><button class="chip' + (inqF === "all" ? " on" : "") + '" data-f="all">하오 전체<b>' + inq.length + '</b></button>';
      renderInq();
    }).catch(function () { $("inqList").innerHTML = '<p class="empty">불러오지 못했습니다.</p>'; });
  }
  function renderInq() {
    var rows = inqF === "all" ? inq : inq.filter(function (q) { return q.mine; });
    $("inqList").innerHTML = rows.length ? rows.map(function (q) {
      return '<div class="row"><span class="tag" style="' + (q.mine ? "" : "background:#999") + '">' + esc(q.mine ? "하오 DESIGN" : (q.type.match(/^\[([^\]]+)\]/) || [, "디자인센터"])[1]) + '</span><div class="t"><b>' + esc(q.name) + " · " + esc(q.phone) + (q.type ? " · " + esc(q.type.replace(/^\[[^\]]*\]\s*/, "")) : "") + '</b><small>' + esc(q.date) + "\n" + esc(q.message) + '</small></div><div class="ac"><button data-idel="' + q.id + '">삭제</button></div></div>';
    }).join("") : '<p class="empty">문의가 없습니다.</p>';
  }
  $("inqChips").addEventListener("click", function (e) { var b = e.target.closest(".chip"); if (b) { inqF = b.dataset.f; refreshInq(); } });
  $("inqRefresh").addEventListener("click", refreshInq);
  $("inqList").addEventListener("click", function (e) {
    var b = e.target.closest("[data-idel]"); if (!b || !confirm("이 문의를 삭제할까요?")) return;
    fetch(SB_URL + "/rest/v1/inquiries?id=eq." + b.dataset.idel, { method: "DELETE", headers: SB_H }).then(refreshInq).catch(function () { toast("삭제 실패", true); });
  });

  /* ---- 설정 ---- */
  function renderSet() {
    $("sTel").value = D.settings.tel || ""; $("sEmail").value = D.settings.email || ""; $("sAddress").value = D.settings.address || "";
    $("mOn").checked = !!D.mail.on; $("mTo").value = D.mail.to || ""; $("mUrl").value = D.mail.url || "";
  }
  $("setSave").addEventListener("click", function () { D.settings = { tel: $("sTel").value.trim(), email: $("sEmail").value.trim(), address: $("sAddress").value.trim() }; store("settings", D.settings, "연락처 저장 완료"); });
  $("mailSave").addEventListener("click", function () { D.mail = { on: $("mOn").checked, to: $("mTo").value.trim(), url: $("mUrl").value.trim() }; store("mail", D.mail, "메일 설정 저장 완료"); });

  /* ---- 계정 ---- */
  function renderAcc() {
    $("accList").innerHTML = (D.accounts.length ? D.accounts : []).map(function (a, i) {
      return '<div class="accrow"><input type="text" data-ai="' + i + '" data-ak="id" value="' + esc(a.id) + '" placeholder="아이디" autocomplete="off"><input type="text" data-ai="' + i + '" data-ak="pw" value="' + esc(a.pw) + '" placeholder="비밀번호" autocomplete="off"><button class="lite" data-adel="' + i + '">삭제</button></div>';
    }).join("") || '<p class="empty">전용 계정이 없습니다. 통합 관리자 계정으로 로그인합니다.</p>';
  }
  $("accList").addEventListener("input", function (e) { var el = e.target; if (el.dataset.ai != null) D.accounts[+el.dataset.ai][el.dataset.ak] = el.value; });
  $("accList").addEventListener("click", function (e) { var b = e.target.closest("[data-adel]"); if (b) { D.accounts.splice(+b.dataset.adel, 1); renderAcc(); } });
  $("accAdd").addEventListener("click", function () { D.accounts.push({ id: "", pw: "" }); renderAcc(); });
  $("accSave").addEventListener("click", function () {
    D.accounts = D.accounts.map(function (a) { return { id: (a.id || "").trim(), pw: a.pw || "" }; }).filter(function (a) { return a.id && a.pw; });
    renderAcc(); store("accounts", D.accounts, "계정 저장 완료");
  });

  /* ---- 부팅 ---- */
  load().then(function () {
    var t = +localStorage.getItem("hub_session");
    if (sessionStorage.getItem("hd_admin") === "1" || (t && Date.now() < t)) showAdmin();
  }).catch(function (e) { $("loginErr").textContent = "데이터를 불러오지 못했습니다: " + e.message; });
})();
