/* 하오 DESIGN 관리자 — 탭 화면 (대시보드·히어로·사진 슬롯·문구·포트폴리오·칼럼·FAQ·문의·SEO·설정·계정·로그) */
window.HDApp = (function () {
  "use strict";
  var H = window.HD, $ = H.$, esc = H.esc, src = H.src, toast = H.toast, D, DEF;
  var SERVICE = [["catalog", "카탈로그·브로슈어"], ["leaflet", "팜플렛·리플렛"], ["poster", "포스터·전단지"], ["ci", "CI·로고디자인"], ["package", "패키지·라벨"], ["global", "다국어디자인"]];
  var SVC_PAGE = { catalog: "catalog-brochure.html", leaflet: "leaflet-pamphlet.html", poster: "poster-flyer.html", ci: "ci-logo.html", package: "package-label.html", global: "global-design.html" };
  function catLabel(k) { for (var i = 0; i < DEF.cats.length; i++) if (DEF.cats[i].k === k) return DEF.cats[i].label; return k; }
  function svcList(key) { return D.works.map(function (w, i) { return { w: w, i: i }; }).filter(function (x) { return x.w.c === key; }).sort(function (a, b) { return (b.w.s ? 1 : 0) - (a.w.s ? 1 : 0) || (a.w.so || 1e9) - (b.w.so || 1e9) || a.i - b.i; }).map(function (x) { return x.w; }); }
  function svcCount(key) { var n = svcList(key).length; return n >= 4 ? Math.min(12, Math.floor(n / 4) * 4) : n; }
  function nextId(arr) { return Math.max.apply(null, [0].concat(arr.map(function (x) { return x.id || 0; }))) + 1; }
  function imgField(id, val, ph) { return '<div class="imgrow"><input type="text" id="' + id + '" value="' + esc(val || "") + '" placeholder="' + esc(ph || "https://… 또는 파일 선택") + '"><label class="lite up">파일 선택<input type="file" accept="image/*" data-upto="' + id + '" hidden></label><img id="' + id + 'Pv" src="' + esc(src(val)) + '" alt=""></div>'; }

  /* ================= 대시보드 ================= */
  function renderDash() {
    $("stWorks").textContent = D.works.length; $("stPosts").textContent = D.posts.filter(function (p) { return !p.hidden; }).length;
    $("stFaq").textContent = (D.faq || []).length;
    var p = H.pending();
    $("dashPending").innerHTML = p.length ? p.map(function (x) { return '<span class="chip wait">' + esc(x) + '</span>'; }).join("") + '<p class="muted" style="margin-top:8px">30분마다 자동 반영됩니다. 바로 반영하려면 상단 버튼을 누르세요.</p>' : '<p class="muted">저장한 내용이 모두 사이트에 반영되어 있습니다.</p>';
    $("dashSvc").innerHTML = SERVICE.map(function (s) { var n = svcList(s[0]).length, c = svcCount(s[0]); return '<div class="st sm"><b>' + c + '<small>/' + n + '</small></b><span>' + esc(s[1]) + (c < 12 ? ' <em class="warn">' + (n < 12 ? "사진 " + (12 - n) + "장 부족" : "") + '</em>' : "") + '</span></div>'; }).join("");
    renderLog(true);
  }
  function renderLog(dashOnly) {
    var rows = D.log || [];
    var html = rows.length ? rows.map(function (l) { return '<div class="row slim"><small class="muted">' + esc(H.fmtDate(l.t, true)) + '</small><b>' + esc(l.who || "") + '</b><span>' + esc(l.what) + '</span></div>'; }).join("") : '<p class="empty">아직 기록이 없습니다.</p>';
    $("dashLog").innerHTML = rows.slice(0, 8).map(function (l) { return '<div class="row slim"><small class="muted">' + esc(H.fmtDate(l.t, true)) + '</small><span>' + esc(l.what) + '</span></div>'; }).join("") || '<p class="muted">아직 기록이 없습니다.</p>';
    if (!dashOnly || true) $("logList").innerHTML = html;
  }

  /* ================= 히어로 ================= */
  function renderHero() {
    $("heroList").innerHTML = D.hero.map(function (s, i) {
      return '<div class="hcard drag" draggable="true" data-i="' + i + '"><div><div class="pv"><img id="hImg' + i + 'Pv" src="' + esc(src(s.img)) + '" alt=""></div><div class="acts" style="margin-top:8px"><label class="lite up">사진 교체<input type="file" accept="image/*" data-upto="hImg' + i + '" hidden></label>' + (D.hero.length > 1 ? '<button class="lite danger" data-hdel="' + i + '">삭제</button>' : "") + '</div></div>' +
        '<div class="fs"><div><label>슬라이드 ' + (i + 1) + ' · 작은 글씨(배지)</label><input type="text" data-h="' + i + '" data-k="badge" value="' + esc(s.badge) + '"></div>' +
        '<div><label>큰 제목 <small>&lt;br&gt; 줄바꿈, &lt;em&gt;강조&lt;/em&gt;</small></label><textarea data-h="' + i + '" data-k="title">' + esc(s.title) + '</textarea></div>' +
        '<div><label>설명</label><textarea data-h="' + i + '" data-k="desc">' + esc(s.desc) + '</textarea></div>' +
        '<div class="two"><div><label>이미지 URL</label><input type="text" id="hImg' + i + '" data-h="' + i + '" data-k="img" value="' + esc(s.img) + '"></div><div><label>버튼 링크</label><input type="text" data-h="' + i + '" data-k="href" value="' + esc(s.href || "#") + '"></div></div></div></div>';
    }).join("");
  }
  function bindHero() {
    $("heroList").addEventListener("input", function (e) { var el = e.target; if (el.dataset.h != null) { D.hero[+el.dataset.h][el.dataset.k] = el.value; if (el.dataset.k === "img") $("hImg" + el.dataset.h + "Pv").src = src(el.value); } });
    $("heroList").addEventListener("click", function (e) { var b = e.target.closest("[data-hdel]"); if (!b) return; H.confirm("슬라이드 삭제", "이 슬라이드를 지울까요?", "삭제", true).then(function (ok) { if (ok) { D.hero.splice(+b.dataset.hdel, 1); renderHero(); } }); });
    $("heroAdd").addEventListener("click", function () { D.hero.push({ img: "", badge: "", title: "", desc: "", href: "#contact" }); renderHero(); });
    $("heroSave").addEventListener("click", function () { if (D.hero.some(function (s) { return !s.img; })) return toast("사진이 없는 슬라이드가 있습니다", true); H.store("hero", D.hero, "히어로 저장 완료"); });
    H.dragSort($("heroList"), function (from, to) { var it = D.hero.splice(from, 1)[0]; D.hero.splice(to, 0, it); renderHero(); });
  }

  /* ================= 사진 슬롯 ================= */
  function renderSlots() {
    var s = D.slots;
    $("bandList").innerHTML = s.band.map(function (u, i) { return '<div class="wk drag" draggable="true"><img src="' + esc(src(u)) + '" alt=""><div class="ac"><button data-bpick="' + i + '">포트폴리오에서</button><label class="up">업로드<input type="file" accept="image/*" data-bup="' + i + '" hidden></label></div></div>'; }).join("");
    $("crImgPv").src = src(s.creative_img); $("crImg").value = s.creative_img; $("crPos").value = s.creative_pos || "center 20%";
    $("galInfo").innerHTML = SERVICE.map(function (x) { var list = D.works.filter(function (w) { return w.c === x[0]; }); var n = (D.svc[x[0]] || {}).gal_n || 10; return '<div class="row slim"><b>' + esc(x[1]) + '</b><span>포트폴리오 순서 상위 ' + Math.min(n, list.length) + '장: ' + esc(list.slice(0, n).map(function (w) { return w.t; }).join(", ")) + '</span></div>'; }).join("");
  }
  function pickWork(cb) {
    var m = $("modal"); var cat = "all";
    function draw() {
      var list = D.works.filter(function (w) { return cat === "all" || w.c === cat; });
      m.innerHTML = '<div class="mbox wide"><h4>포트폴리오에서 사진 선택</h4><div class="chips">' + [{ k: "all", label: "전체" }].concat(DEF.cats).map(function (c) { return '<button class="chip' + (cat === c.k ? " on" : "") + '" data-pc="' + c.k + '">' + esc(c.label) + '</button>'; }).join("") + '</div><div class="pickgrid">' + list.map(function (w) { return '<button data-pick="' + esc(w.img) + '"><img src="' + esc(src(w.img)) + '" alt=""><span>' + esc(w.t) + '</span></button>'; }).join("") + '</div><div class="macts"><button class="lite" data-m="0">닫기</button></div></div>';
    }
    draw(); m.hidden = false;
    m.onclick = function (e) { var c = e.target.closest("[data-pc]"); if (c) { cat = c.dataset.pc; draw(); return; } var p = e.target.closest("[data-pick]"); if (p) { m.hidden = true; cb(p.dataset.pick); return; } if (e.target.closest("[data-m]") || e.target === m) m.hidden = true; };
  }
  function bindSlots() {
    $("bandList").addEventListener("click", function (e) { var b = e.target.closest("[data-bpick]"); if (!b) return; pickWork(function (u) { D.slots.band[+b.dataset.bpick] = u; renderSlots(); }); });
    $("bandList").addEventListener("change", function (e) { var f = e.target.closest("[data-bup]"); if (!f) return; toast("업로드 중…"); H.uploadFile(f.files[0]).then(function (u) { D.slots.band[+f.dataset.bup] = u; renderSlots(); toast("업로드 완료, 저장을 눌러주세요"); }).catch(function (er) { toast(er.message, true); }); });
    H.dragSort($("bandList"), function (from, to) { var it = D.slots.band.splice(from, 1)[0]; D.slots.band.splice(to, 0, it); renderSlots(); });
    $("crPick").addEventListener("click", function () { pickWork(function (u) { D.slots.creative_img = u; renderSlots(); }); });
    $("crImg").addEventListener("input", function () { D.slots.creative_img = this.value.trim(); $("crImgPv").src = src(this.value.trim()); });
    $("crPos").addEventListener("input", function () { D.slots.creative_pos = this.value.trim(); $("crImgPv").style.objectPosition = this.value; });
    $("slotsSave").addEventListener("click", function () { H.store("slots", D.slots, "사진 슬롯 저장 완료"); });
  }

  /* ================= 문구 ================= */
  var COPY_GROUPS = [
    { title: "홈 · CREATIVE 섹션", keys: [["cr_title", "제목 (HTML)"], ["cr_p1", "설명 1 (<p> 두 줄)"], ["cr_p2", "설명 2 (<p> 두 줄)"]] },
    { title: "전 페이지 · 견적 섹션", keys: [["qt_title", "제목"], ["qt_desc", "설명"]] },
    { title: "서브페이지 상단", keys: [["pg_work_h1", "포트폴리오 제목"], ["pg_work_lead", "포트폴리오 설명"], ["pg_board_h1", "칼럼 제목"], ["pg_board_lead", "칼럼 설명"], ["pg_faq_h1", "FAQ 제목"], ["pg_faq_lead", "FAQ 설명"], ["pg_contact_h1", "견적문의 제목"], ["pg_contact_lead", "견적문의 설명"]] }
  ];
  function renderCopy() {
    $("copyList").innerHTML = COPY_GROUPS.map(function (g) {
      return '<h3>' + esc(g.title) + '</h3>' + g.keys.map(function (k) { var v = D.copy[k[0]] != null ? D.copy[k[0]] : (DEF.copy[k[0]] || ""); var multi = /<|\n/.test(v) || v.length > 40; return '<div class="ccard"><label>' + esc(k[1]) + (D.copy[k[0]] !== DEF.copy[k[0]] ? '<small class="mod">수정됨</small>' : "") + '</label>' + (multi ? '<textarea data-c="' + k[0] + '">' + esc(v) + '</textarea>' : '<input type="text" data-c="' + k[0] + '" value="' + esc(v) + '">') + '<div class="pv" id="cpv_' + k[0] + '">' + v + '</div></div>'; }).join("");
    }).join("") + '<h3>서비스 페이지 상단 <small>6개 서비스 페이지의 첫 화면 문구</small></h3>' + SERVICE.map(function (s) {
      var v = D.svc[s[0]];
      return '<div class="ccard svc"><label>' + esc(s[1]) + ' <small><a href="../' + SVC_PAGE[s[0]] + '" target="_blank">페이지 보기 ↗</a></small></label><div class="two"><div><small>인용 첫 줄</small><input type="text" data-s="' + s[0] + '" data-k="l1" value="' + esc(v.l1) + '"></div><div><small>인용 둘째 줄</small><input type="text" data-s="' + s[0] + '" data-k="l2" value="' + esc(v.l2) + '"></div><div><small>해시태그</small><input type="text" data-s="' + s[0] + '" data-k="tag" value="' + esc(v.tag) + '"></div><div><small>H1 제목</small><input type="text" data-s="' + s[0] + '" data-k="h1" value="' + esc(v.h1) + '"></div></div><small>설명 (&lt;br&gt; 줄바꿈)</small><textarea data-s="' + s[0] + '" data-k="desc">' + esc(v.desc) + '</textarea></div>';
    }).join("");
  }
  function bindCopy() {
    $("copyList").addEventListener("input", function (e) { var el = e.target; if (el.dataset.c) { D.copy[el.dataset.c] = el.value; $("cpv_" + el.dataset.c).innerHTML = el.value; } else if (el.dataset.s) { D.svc[el.dataset.s][el.dataset.k] = el.value; } });
    $("copySave").addEventListener("click", function () { Promise.all([H.store("copy", D.copy, "문구 저장 완료"), H.store("svc", D.svc, "서비스 문구 저장 완료", "서비스 문구")]).then(renderCopy).catch(function () {}); });
  }

  /* ================= 포트폴리오 ================= */
  var wFilter = "all", wQuery = "", wSel = {}, wImg = "", wView = "grid";
  function workIdx(w) { return D.works.indexOf(w); }
  function renderWorks() {
    var counts = { all: D.works.length }; D.works.forEach(function (w) { counts[w.c] = (counts[w.c] || 0) + 1; });
    $("workChips").innerHTML = [{ k: "all", label: "전체" }].concat(DEF.cats).map(function (c) { return '<button class="chip' + (wFilter === c.k ? " on" : "") + '" data-f="' + c.k + '">' + esc(c.label) + '<b>' + (counts[c.k] || 0) + '</b></button>'; }).join("");
    $("wCat").innerHTML = DEF.cats.map(function (c) { return '<option value="' + c.k + '">' + esc(c.label) + '</option>'; }).join("");
    var q = wQuery.trim().toLowerCase();
    var list = D.works.filter(function (w) { return (wFilter === "all" || w.c === wFilter) && (!q || (w.t || "").toLowerCase().indexOf(q) >= 0); });
    var svcPos = {}; if (wFilter !== "all") svcList(wFilter).slice(0, svcCount(wFilter)).forEach(function (w, i) { svcPos[workIdx(w)] = i + 1; });
    var selN = Object.keys(wSel).length; $("wSelBar").hidden = !selN; $("wSelN").textContent = selN;
    $("workCount").textContent = list.length + "장" + (wFilter !== "all" ? " · 서비스 페이지 노출 " + svcCount(wFilter) + "장" : "");
    var g = $("workList"); g.className = wView === "grid" ? "grid" : "list";
    g.innerHTML = list.length ? list.map(function (w) {
      var i = workIdx(w), sp = svcPos[i];
      return '<div class="wk drag' + (wSel[i] ? " sel" : "") + '" draggable="true" data-i="' + i + '"><label class="ck"><input type="checkbox" data-sel="' + i + '"' + (wSel[i] ? " checked" : "") + '></label>' + (sp ? '<span class="pos">서비스 ' + sp + '</span>' : "") + '<img src="' + esc(src(w.img)) + '" alt="" loading="lazy"><div class="t" data-inline="' + i + '" title="두 번 클릭해 제목 수정">' + esc(w.t) + '</div><div class="c">' + esc(catLabel(w.c)) + (w.s ? "<b>서비스 우선</b>" : "") + '</div>' +
        '<div class="ac"><button data-edit="' + i + '">수정</button><button data-svc="' + i + '">' + (w.s ? "우선 해제" : "서비스 우선") + '</button><button data-del="' + i + '">삭제</button></div></div>';
    }).join("") : '<p class="empty">작품이 없습니다. "+ 작품 추가" 또는 사진 여러 장을 끌어다 놓으세요.</p>';
  }
  function openWork(i) {
    var w = i >= 0 ? D.works[i] : { t: "", c: wFilter === "all" ? DEF.cats[0].k : wFilter, img: "", s: false };
    $("wIdx").value = i; $("wTitle").value = w.t; $("wCat").value = w.c; $("wImg").value = w.img; $("wImgPv").src = src(w.img); $("wSvc").checked = !!w.s; wImg = w.img || "";
    $("workForm").hidden = false; $("workForm").scrollIntoView({ behavior: "smooth", block: "start" }); $("wTitle").focus();
  }
  function saveWorks(msg) { return H.store("works", D.works, msg || "포트폴리오 저장 완료"); }
  function bindWorks() {
    $("workChips").addEventListener("click", function (e) { var b = e.target.closest(".chip"); if (b) { wFilter = b.dataset.f; renderWorks(); } });
    $("workSearch").addEventListener("input", function () { wQuery = this.value; renderWorks(); });
    $("workView").addEventListener("click", function () { wView = wView === "grid" ? "list" : "grid"; this.textContent = wView === "grid" ? "목록으로" : "그리드로"; renderWorks(); });
    $("workAdd").addEventListener("click", function () { openWork(-1); });
    $("workCancel").addEventListener("click", function () { $("workForm").hidden = true; });
    $("wImg").addEventListener("input", function () { wImg = this.value.trim(); $("wImgPv").src = src(wImg); });
    $("workForm").addEventListener("submit", function (e) {
      e.preventDefault(); var i = +$("wIdx").value;
      if (!wImg) return toast("이미지를 올리거나 URL을 넣어주세요", true);
      var w = { id: i >= 0 ? D.works[i].id : nextId(D.works), t: $("wTitle").value.trim(), c: $("wCat").value, img: wImg, s: $("wSvc").checked };
      if (i >= 0) { w.so = D.works[i].so; D.works[i] = w; } else D.works.unshift(w);
      $("workForm").hidden = true; renderWorks(); saveWorks();
    });
    /* 다중 업로드: 파일 여러 장 → 작품 자동 생성 (제목 = 파일명) */
    function addFiles(files) {
      var cat = wFilter === "all" ? DEF.cats[0].k : wFilter, added = 0;
      H.uploadMany(files, function (f, u) { D.works.unshift({ id: nextId(D.works), t: f.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "), c: cat, img: u, s: false }); added++; renderWorks(); })
        .then(function () { if (added) saveWorks(added + "장 추가 완료 (분류: " + catLabel(cat) + ") — 제목을 두 번 클릭해 고치세요"); });
    }
    $("wMulti").addEventListener("change", function () { addFiles(this.files); this.value = ""; });
    var dz = $("workDrop"); ["dragenter", "dragover"].forEach(function (ev) { dz.addEventListener(ev, function (e) { if (e.dataTransfer && e.dataTransfer.types.indexOf("Files") >= 0) { e.preventDefault(); dz.classList.add("over"); } }); });
    dz.addEventListener("dragleave", function () { dz.classList.remove("over"); });
    dz.addEventListener("drop", function (e) { if (e.dataTransfer && e.dataTransfer.files.length) { e.preventDefault(); dz.classList.remove("over"); addFiles(e.dataTransfer.files); } });
    /* 카드 동작 */
    $("workList").addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return; var i = +(b.dataset.edit || b.dataset.del || b.dataset.svc);
      if (b.dataset.edit) openWork(i);
      else if (b.dataset.svc) { D.works[i].s = !D.works[i].s; delete D.works[i].so; renderWorks(); saveWorks(D.works[i].s ? "서비스 페이지 우선 노출" : "우선 노출 해제"); }
      else if (b.dataset.del) H.confirm("작품 삭제", '"' + D.works[i].t + '"을(를) 지울까요?', "삭제", true).then(function (ok) { if (ok) { D.works.splice(i, 1); wSel = {}; renderWorks(); saveWorks("삭제했습니다"); } });
    });
    $("workList").addEventListener("change", function (e) { var c = e.target.closest("[data-sel]"); if (c) { if (c.checked) wSel[c.dataset.sel] = 1; else delete wSel[c.dataset.sel]; renderWorks(); } });
    $("workList").addEventListener("dblclick", function (e) {
      var t = e.target.closest("[data-inline]"); if (!t) return; var i = +t.dataset.inline, inp = document.createElement("input"); inp.type = "text"; inp.value = D.works[i].t; inp.className = "inline"; t.replaceWith(inp); inp.focus(); inp.select();
      function done(save) { if (save && inp.value.trim() && inp.value.trim() !== D.works[i].t) { D.works[i].t = inp.value.trim(); saveWorks("제목 수정 완료"); } renderWorks(); }
      inp.addEventListener("keydown", function (ev) { if (ev.key === "Enter") done(true); if (ev.key === "Escape") done(false); }); inp.addEventListener("blur", function () { done(true); });
    });
    /* 드래그 정렬: 화면에 보이는 목록 기준으로 실제 배열 재배치 */
    H.dragSort($("workList"), function (from, to) {
      var cards = Array.prototype.slice.call($("workList").querySelectorAll(".drag")).map(function (c) { return +c.dataset.i; });
      var moving = cards[from], target = cards[to]; if (moving === target) return;
      var w = D.works.splice(moving, 1)[0]; var ti = D.works.indexOf(D.works.filter(function (x, i) { return i === (target > moving ? target - 1 : target); })[0]);
      D.works.splice(target > moving ? target - 1 : target, 0, w);
      if (wFilter !== "all") { /* 분류 보기에서 옮기면 서비스 우선 순서도 이 순서로 */ svcList(wFilter).forEach(function (x) { if (x.s) x.so = D.works.indexOf(x); }); }
      wSel = {}; renderWorks(); saveWorks("순서 저장 완료");
    });
    /* 일괄 */
    $("wSelAll").addEventListener("click", function () { var all = $("workList").querySelectorAll("[data-sel]"); var allOn = Array.prototype.every.call(all, function (c) { return c.checked; }); wSel = {}; if (!allOn) Array.prototype.forEach.call(all, function (c) { wSel[c.dataset.sel] = 1; }); renderWorks(); });
    $("wSelCat").innerHTML = DEF.cats.map(function (c) { return '<option value="' + c.k + '">' + esc(c.label) + '</option>'; }).join("");
    $("wBulkCat").addEventListener("click", function () { var c = $("wSelCat").value; Object.keys(wSel).forEach(function (i) { D.works[+i].c = c; }); var n = Object.keys(wSel).length; wSel = {}; renderWorks(); saveWorks(n + "장 분류 변경 → " + catLabel(c)); });
    $("wBulkSvc").addEventListener("click", function () { var on = Object.keys(wSel).some(function (i) { return !D.works[+i].s; }); Object.keys(wSel).forEach(function (i) { D.works[+i].s = on; delete D.works[+i].so; }); wSel = {}; renderWorks(); saveWorks(on ? "서비스 우선 지정" : "서비스 우선 해제"); });
    $("wBulkDel").addEventListener("click", function () { var n = Object.keys(wSel).length; H.confirm("작품 " + n + "장 삭제", "선택한 작품을 모두 지웁니다.", "삭제", true).then(function (ok) { if (!ok) return; var ids = Object.keys(wSel).map(Number).sort(function (a, b) { return b - a; }); ids.forEach(function (i) { D.works.splice(i, 1); }); wSel = {}; renderWorks(); saveWorks(n + "장 삭제"); }); });
    $("wSelClear").addEventListener("click", function () { wSel = {}; renderWorks(); });
  }

  /* ================= 칼럼 ================= */
  var pImg = "", pQuery = "";
  function renderPosts() {
    var q = pQuery.trim().toLowerCase();
    var list = D.posts.map(function (p, i) { return { p: p, i: i }; }).filter(function (x) { return !q || (x.p.title + " " + x.p.summary).toLowerCase().indexOf(q) >= 0; }).sort(function (a, b) { return (b.p.date || "").localeCompare(a.p.date || "") || b.p.id - a.p.id; });
    $("postCount").textContent = D.posts.length + "편 · 공개 " + D.posts.filter(function (p) { return !p.hidden; }).length;
    $("postList").innerHTML = '<div class="panel">' + (list.length ? list.map(function (x) {
      var p = x.p; return '<div class="row' + (p.hidden ? " dim" : "") + '"><img src="' + esc(src(p.img)) + '" alt=""><div class="t"><b>' + esc(p.title) + (p.isNew ? ' <span class="tag sm">NEW</span>' : "") + (p.hidden ? ' <span class="tag sm gray">숨김</span>' : "") + '</b><small>' + esc(p.date) + " · " + (p.url ? "외부 링크" : (p.bodyHtml ? "column-" + p.id + ".html" : "본문 없음")) + "\n" + esc(p.summary) + '</small></div><div class="ac"><button data-pedit="' + x.i + '">수정</button><button data-phide="' + x.i + '">' + (p.hidden ? "공개" : "숨김") + '</button><button data-pcopy="' + x.i + '">복제</button></div></div>';
    }).join("") : '<p class="empty">칼럼이 없습니다.</p>') + "</div>";
  }
  function openPost(i) {
    var p = i >= 0 ? D.posts[i] : { title: "", date: new Date().toISOString().slice(0, 10), img: "", summary: "", url: "", bodyHtml: "", isNew: true, faqs: [], keywords: "" };
    $("pIdx").value = i; $("pTitle").value = p.title; $("pDate").value = p.date || ""; $("pNew").checked = !!p.isNew; $("pHidden").checked = !!p.hidden; $("pImg").value = p.img || ""; $("pImgPv").src = src(p.img); pImg = p.img || "";
    $("pSummary").value = p.summary || ""; $("pUrl").value = p.url || ""; $("pKeywords").value = p.keywords || ""; $("pEditor").innerHTML = p.bodyHtml || ""; $("pHtml").value = p.bodyHtml || ""; $("pHtml").hidden = true; $("pEditor").hidden = false;
    renderPostFaqs(p.faqs || []); $("postDel").hidden = i < 0;
    $("postForm").hidden = false; $("postForm").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function renderPostFaqs(list) { $("pFaqs").innerHTML = list.map(function (f, i) { return '<div class="two faqrow"><input type="text" data-pfq="' + i + '" placeholder="질문" value="' + esc(f.q) + '"><div class="imgrow2"><input type="text" data-pfa="' + i + '" placeholder="답변" value="' + esc(f.a) + '"><button type="button" class="lite" data-pfdel="' + i + '">×</button></div></div>'; }).join(""); }
  function readPostFaqs() { return Array.prototype.map.call($("pFaqs").querySelectorAll("[data-pfq]"), function (q, i) { return { q: q.value.trim(), a: $("pFaqs").querySelector('[data-pfa="' + i + '"]').value.trim() }; }).filter(function (f) { return f.q && f.a; }); }
  function bindPosts() {
    $("postSearch").addEventListener("input", function () { pQuery = this.value; renderPosts(); });
    $("postAdd").addEventListener("click", function () { openPost(-1); });
    $("postCancel").addEventListener("click", function () { $("postForm").hidden = true; });
    $("postList").addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.pedit) openPost(+b.dataset.pedit);
      else if (b.dataset.phide) { var p = D.posts[+b.dataset.phide]; p.hidden = !p.hidden; renderPosts(); H.store("posts", D.posts, p.hidden ? "숨김 처리" : "공개 처리"); }
      else if (b.dataset.pcopy) { var c = H.clone(D.posts[+b.dataset.pcopy]); c.id = nextId(D.posts); c.title += " (복사)"; c.hidden = true; c.isNew = false; D.posts.unshift(c); renderPosts(); H.store("posts", D.posts, "복제했습니다 (숨김 상태)"); }
    });
    $("pImg").addEventListener("input", function () { pImg = this.value.trim(); $("pImgPv").src = src(pImg); });
    $("pTools").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-cmd]"); if (!b) return; var c = b.dataset.cmd, ed = $("pEditor"); ed.focus();
      if (c === "h2" || c === "h3" || c === "p" || c === "blockquote") document.execCommand("formatBlock", false, c);
      else if (c === "hr") document.execCommand("insertHorizontalRule");
      else if (c === "link") { var u = prompt("링크 주소"); if (u) document.execCommand("createLink", false, u); }
      else if (c === "html") { var on = $("pHtml").hidden; if (on) { $("pHtml").value = ed.innerHTML; } else { ed.innerHTML = $("pHtml").value; } $("pHtml").hidden = !on; ed.hidden = on; b.classList.toggle("on", on); }
      else document.execCommand(c);
    });
    $("pEditor").addEventListener("paste", function (e) { /* 붙여넣기 정리: 서식 떼고 문단만 */ e.preventDefault(); var t = (e.clipboardData || window.clipboardData).getData("text/plain"); document.execCommand("insertHTML", false, t.split(/\n{2,}/).map(function (x) { return "<p>" + esc(x).replace(/\n/g, "<br>") + "</p>"; }).join("")); });
    $("pBodyImg").addEventListener("change", function () { var f = this.files[0]; toast("업로드 중…"); H.uploadFile(f).then(function (u) { $("pEditor").focus(); document.execCommand("insertImage", false, u); toast("사진 삽입 완료"); }).catch(function (er) { toast(er.message, true); }); this.value = ""; });
    $("pFaqAdd").addEventListener("click", function () { var l = readPostFaqs(); l.push({ q: "", a: "" }); renderPostFaqs(l); });
    $("pFaqs").addEventListener("click", function (e) { var b = e.target.closest("[data-pfdel]"); if (!b) return; var l = readPostFaqs(); l.splice(+b.dataset.pfdel, 1); renderPostFaqs(l); });
    $("pPreview").addEventListener("click", function () {
      var body = $("pHtml").hidden ? $("pEditor").innerHTML : $("pHtml").value;
      var w = window.open("", "_blank"); w.document.write('<!doctype html><meta charset="utf-8"><title>미리보기</title><link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css"><style>body{font-family:Pretendard,sans-serif;max-width:860px;margin:40px auto;padding:0 20px;line-height:1.85;color:#333}h1{font-size:1.8em;line-height:1.3}h2,h3{margin:34px 0 12px;font-weight:800}h3{background:#faf7f6;padding:14px 18px;border-radius:10px;white-space:pre-line}img{max-width:100%;border-radius:10px}blockquote{margin:18px 0;padding:14px 20px;border-left:4px solid #e83817;background:#fff6f3}</style>' + '<h1>' + esc($("pTitle").value) + '</h1><p style="color:#888">' + esc($("pDate").value) + '</p>' + (pImg ? '<img src="' + esc(pImg) + '">' : "") + body); w.document.close();
    });
    $("postForm").addEventListener("submit", function (e) {
      e.preventDefault(); var i = +$("pIdx").value, body = ($("pHtml").hidden ? $("pEditor").innerHTML : $("pHtml").value).trim(), url = $("pUrl").value.trim();
      if (!$("pTitle").value.trim()) return toast("제목을 입력해주세요", true);
      if (!url && !body) return toast("본문을 쓰거나 외부 링크를 넣어주세요", true);
      var tmp = document.createElement("div"); tmp.innerHTML = body;
      var p = { id: i >= 0 ? D.posts[i].id : nextId(D.posts), title: $("pTitle").value.trim(), date: $("pDate").value, img: pImg, summary: $("pSummary").value.trim() || tmp.textContent.trim().replace(/\s+/g, " ").slice(0, 60), url: url, bodyHtml: url ? "" : body, isNew: $("pNew").checked, hidden: $("pHidden").checked, faqs: readPostFaqs(), keywords: $("pKeywords").value.trim() };
      if (i >= 0) D.posts[i] = p; else D.posts.unshift(p);
      $("postForm").hidden = true; renderPosts(); H.store("posts", D.posts, "칼럼 저장 완료" + (p.url ? "" : " — 반영 후 column-" + p.id + ".html 생성"));
    });
    $("postDel").addEventListener("click", function () { var i = +$("pIdx").value; if (i < 0) return; H.confirm("칼럼 삭제", '"' + D.posts[i].title + '"을(를) 지울까요?', "삭제", true).then(function (ok) { if (ok) { D.posts.splice(i, 1); $("postForm").hidden = true; renderPosts(); H.store("posts", D.posts, "삭제했습니다"); } }); });
  }

  /* ================= FAQ ================= */
  function renderFaq() {
    $("faqList").innerHTML = (D.faq || []).map(function (f, i) { return '<div class="ccard drag" draggable="true"><label><span class="grip">⠿</span> Q' + (i + 1) + (i < (DEF.faq_home_visible || 5) ? ' <small class="mod">홈에 노출</small>' : "") + '<button class="lite danger xs" data-fdel="' + i + '" style="float:right">삭제</button></label><input type="text" data-fq="' + i + '" value="' + esc(f.q) + '" placeholder="질문"><textarea data-fa="' + i + '" placeholder="답변 (문단은 <p>로, 비우면 자동)">' + esc(f.a) + '</textarea></div>'; }).join("") || '<p class="empty">FAQ가 없습니다.</p>';
  }
  function bindFaq() {
    $("faqList").addEventListener("input", function (e) { var el = e.target; if (el.dataset.fq != null) D.faq[+el.dataset.fq].q = el.value; if (el.dataset.fa != null) D.faq[+el.dataset.fa].a = el.value; });
    $("faqList").addEventListener("click", function (e) { var b = e.target.closest("[data-fdel]"); if (!b) return; H.confirm("FAQ 삭제", "이 질문을 지울까요?", "삭제", true).then(function (ok) { if (ok) { D.faq.splice(+b.dataset.fdel, 1); renderFaq(); } }); });
    $("faqAdd").addEventListener("click", function () { D.faq.push({ q: "", a: "" }); renderFaq(); $("faqList").lastElementChild.scrollIntoView({ behavior: "smooth" }); });
    $("faqSave").addEventListener("click", function () { D.faq = D.faq.filter(function (f) { return f.q.trim() && f.a.trim(); }); renderFaq(); H.store("faq", D.faq, "FAQ 저장 완료"); });
    H.dragSort($("faqList"), function (from, to) { var it = D.faq.splice(from, 1)[0]; D.faq.splice(to, 0, it); renderFaq(); });
  }

  /* ================= 문의 ================= */
  var inq = [], inqF = "mine", inqSt = "all", inqQ = "";
  var ST = { "new": "신규", "doing": "연락중", "done": "완료" };
  function refreshInq() {
    H.sbGet("/rest/v1/inquiries?select=*&order=created_at.desc&limit=500").then(function (rows) {
      inq = rows.map(function (r) { var m = D.inq_meta[r.id] || {}; return { id: r.id, name: r.name || "", phone: r.phone || "", type: r.type || "", message: r.message || "", at: r.created_at, date: H.fmtDate(r.created_at), mine: (r.type || "").indexOf(H.INQ_TAG) === 0, st: m.st || "new", memo: m.memo || "" }; });
      var mine = inq.filter(function (q) { return q.mine; }), fresh = mine.filter(function (q) { return q.st === "new"; }).length;
      $("cntInq").textContent = fresh || ""; $("stInq").textContent = mine.length; $("stInqNew").textContent = fresh;
      $("dashInq").innerHTML = mine.slice(0, 5).map(function (q) { return '<div class="row slim"><span class="tag sm st-' + q.st + '">' + ST[q.st] + '</span><b>' + esc(q.name) + '</b><span>' + esc(q.type.replace(/^\[[^\]]*\]\s*/, "")) + '</span><small class="muted">' + esc(H.fmtDate(q.at, true)) + '</small></div>'; }).join("") || '<p class="muted">아직 문의가 없습니다.</p>';
      renderInq();
    }).catch(function () { $("inqList").innerHTML = '<p class="empty">불러오지 못했습니다.</p>'; });
  }
  function renderInq() {
    var q = inqQ.trim().toLowerCase();
    var rows = inq.filter(function (x) { return (inqF === "all" || x.mine) && (inqSt === "all" || x.st === inqSt) && (!q || (x.name + x.phone + x.type + x.message + x.memo).toLowerCase().indexOf(q) >= 0); });
    var mine = inq.filter(function (x) { return x.mine; });
    $("inqChips").innerHTML = '<button class="chip' + (inqF === "mine" ? " on" : "") + '" data-f="mine">이 사이트<b>' + mine.length + '</b></button><button class="chip' + (inqF === "all" ? " on" : "") + '" data-f="all">하오 전체<b>' + inq.length + '</b></button><span class="sep"></span>' + [["all", "전체"], ["new", "신규"], ["doing", "연락중"], ["done", "완료"]].map(function (s) { return '<button class="chip' + (inqSt === s[0] ? " on" : "") + '" data-st="' + s[0] + '">' + s[1] + '</button>'; }).join("");
    $("inqCount").textContent = rows.length + "건";
    $("inqList").innerHTML = rows.length ? rows.map(function (x) {
      var lines = x.message.split("\n"), mail = (x.message.match(/이메일:\s*(\S+)/) || [])[1];
      return '<div class="row inqrow' + (x.st === "done" ? " dim" : "") + '"><div class="t"><div class="inqhead"><select class="stsel st-' + x.st + '" data-ist="' + x.id + '">' + Object.keys(ST).map(function (k) { return '<option value="' + k + '"' + (x.st === k ? " selected" : "") + '>' + ST[k] + '</option>'; }).join("") + '</select><b>' + esc(x.name) + '</b><a href="tel:' + esc(x.phone.replace(/\D/g, "")) + '">' + esc(x.phone) + '</a>' + (mail && mail !== "-" ? '<a href="mailto:' + esc(mail) + '">' + esc(mail) + '</a>' : "") + '<span class="tag sm' + (x.mine ? "" : " gray") + '">' + esc(x.mine ? x.type.replace(/^\[[^\]]*\]\s*/, "") : x.type) + '</span><small class="muted">' + esc(x.date) + '</small></div><small>' + esc(lines.filter(function (l) { return !/^이메일:/.test(l); }).join("\n")) + '</small><input type="text" class="memo" data-imemo="' + x.id + '" placeholder="내부 메모 (포커스가 빠지면 저장)" value="' + esc(x.memo) + '"></div><div class="ac"><button data-idel="' + x.id + '">삭제</button></div></div>';
    }).join("") : '<p class="empty">문의가 없습니다.</p>';
  }
  function saveMeta(id, patch) { D.inq_meta[id] = Object.assign({}, D.inq_meta[id] || {}, patch, { t: new Date().toISOString() }); return H.sbSave("inq_meta", D.inq_meta).then(function () { toast("저장"); }).catch(function () { toast("저장 실패", true); }); }
  function bindInq() {
    $("inqChips").addEventListener("click", function (e) { var b = e.target.closest(".chip"); if (!b) return; if (b.dataset.f) inqF = b.dataset.f; if (b.dataset.st) inqSt = b.dataset.st; renderInq(); });
    $("inqSearch").addEventListener("input", function () { inqQ = this.value; renderInq(); });
    $("inqRefresh").addEventListener("click", refreshInq);
    $("inqCsv").addEventListener("click", function () { var rows = inq.filter(function (x) { return inqF === "all" || x.mine; }); H.csv([["접수일시", "이름", "연락처", "분야", "내용", "상태", "메모"]].concat(rows.map(function (x) { return [x.date, x.name, x.phone, x.type, x.message, ST[x.st], x.memo]; })), "문의_" + new Date().toISOString().slice(0, 10) + ".csv"); });
    $("inqList").addEventListener("change", function (e) { var s = e.target.closest("[data-ist]"); if (!s) return; var x = inq.filter(function (q) { return String(q.id) === s.dataset.ist; })[0]; x.st = s.value; s.className = "stsel st-" + s.value; saveMeta(x.id, { st: s.value }).then(function () { refreshInq(); }); });
    $("inqList").addEventListener("focusout", function (e) { var m = e.target.closest("[data-imemo]"); if (!m) return; var x = inq.filter(function (q) { return String(q.id) === m.dataset.imemo; })[0]; if (x.memo !== m.value) { x.memo = m.value; saveMeta(x.id, { memo: m.value }); } });
    $("inqList").addEventListener("click", function (e) {
      var b = e.target.closest("[data-idel]"); if (!b) return;
      H.confirm("문의 삭제", "이 문의를 지웁니다. 되돌릴 수 없습니다.", "삭제", true).then(function (ok) { if (!ok) return; fetch(H.SB_URL + "/rest/v1/inquiries?id=eq." + b.dataset.idel, { method: "DELETE", headers: H.SB_H }).then(function () { H.addLog("문의 삭제 #" + b.dataset.idel); refreshInq(); }).catch(function () { toast("삭제 실패", true); }); });
    });
  }

  /* ================= SEO ================= */
  var PAGE_LABEL = { "index.html": "홈", "about.html": "회사소개", "work.html": "포트폴리오", "board.html": "칼럼", "faq.html": "FAQ", "contact.html": "견적문의", "catalog-brochure.html": "카탈로그·브로슈어", "leaflet-pamphlet.html": "팜플렛·리플렛", "poster-flyer.html": "포스터·전단지", "ci-logo.html": "CI·로고", "package-label.html": "패키지·라벨", "global-design.html": "다국어디자인" };
  function renderSeo() {
    var s = D.seo; $("seoSite").value = s.siteUrl || ""; $("seoOg").value = s.ogImage || ""; $("seoOgPv").src = src(s.ogImage);
    $("seoPages").innerHTML = Object.keys(PAGE_LABEL).map(function (f) {
      var p = s.pages[f] || {}, d = (DEF.seo.pages[f] || {}); var tl = (p.title || "").length, dl = (p.desc || "").length;
      return '<div class="ccard"><label>' + esc(PAGE_LABEL[f]) + ' <small>' + f + '</small>' + (p.noindex ? ' <small class="warnchip">검색 제외(noindex)</small>' : "") + ((p.title !== d.title || p.desc !== d.desc) ? ' <small class="mod">수정됨</small>' : "") + '</label>' +
        '<div class="two"><div><small>제목 <em class="' + (tl > 60 ? "warn" : "") + '">' + tl + '/60</em></small><input type="text" data-sf="' + f + '" data-k="title" value="' + esc(p.title) + '"></div><div><small>검색 설명 <em class="' + (dl > 160 || (dl && dl < 50) ? "warn" : "") + '">' + dl + '/160</em></small><input type="text" data-sf="' + f + '" data-k="desc" value="' + esc(p.desc) + '"></div></div>' +
        '<div class="two" style="margin-top:8px"><div><small>공유 이미지(이 페이지만, 비우면 공통)</small><input type="text" data-sf="' + f + '" data-k="ogImage" value="' + esc(p.ogImage || "") + '"></div><label class="chk" style="margin-top:18px"><input type="checkbox" data-sf="' + f + '" data-k="noindex"' + (p.noindex ? " checked" : "") + '> 검색엔진 색인 제외</label></div></div>';
    }).join("");
    seoCheck();
  }
  function seoCheck() {
    var s = D.seo, issues = [];
    if (!s.siteUrl) issues.push("사이트 주소가 비어 있어 canonical·sitemap이 안 만들어집니다.");
    if (!s.ogImage) issues.push("공통 공유 이미지(og:image)가 없습니다. 카톡·페북 공유 시 사진이 안 뜹니다.");
    Object.keys(PAGE_LABEL).forEach(function (f) { var p = s.pages[f] || {}; if (p.noindex) issues.push(PAGE_LABEL[f] + ": 검색엔진에서 제외되어 있습니다." + (f === "index.html" ? " ★ 홈이 제외되면 검색에 전혀 안 나옵니다." : "")); if (!p.desc) issues.push(PAGE_LABEL[f] + ": 검색 설명이 비어 있습니다."); else if (/템플릿|플레이스홀더/.test(p.desc)) issues.push(PAGE_LABEL[f] + ": 설명이 템플릿 문구 그대로입니다."); if ((p.title || "").length > 60) issues.push(PAGE_LABEL[f] + ": 제목이 60자를 넘습니다."); });
    $("seoIssues").innerHTML = issues.length ? issues.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join("") : '<li class="ok">문제 없음</li>';
  }
  function bindSeo() {
    $("seoSite").addEventListener("input", function () { D.seo.siteUrl = this.value.trim(); seoCheck(); });
    $("seoOg").addEventListener("input", function () { D.seo.ogImage = this.value.trim(); $("seoOgPv").src = src(this.value.trim()); seoCheck(); });
    $("seoPages").addEventListener("input", function (e) { var el = e.target; if (!el.dataset.sf) return; var p = D.seo.pages[el.dataset.sf] = D.seo.pages[el.dataset.sf] || {}; p[el.dataset.k] = el.type === "checkbox" ? el.checked : el.value; seoCheck(); });
    $("seoPages").addEventListener("change", function (e) { var el = e.target; if (el.type === "checkbox" && el.dataset.sf) { D.seo.pages[el.dataset.sf].noindex = el.checked; renderSeo(); } });
    $("seoSave").addEventListener("click", function () { H.store("seo", D.seo, "SEO 저장 완료").then(renderSeo).catch(function () {}); });
  }

  /* ================= 설정 ================= */
  function renderSet() {
    $("sTel").value = D.settings.tel || ""; $("sEmail").value = D.settings.email || ""; $("sAddress").value = D.settings.address || "";
    $("mOn").checked = !!D.mail.on; $("mTo").value = D.mail.to || ""; $("mUrl").value = D.mail.url || "";
    $("headCode").value = D.headcode || ""; $("ghToken").value = localStorage.getItem("hd_gh_token") || "";
  }
  function bindSet() {
    $("setSave").addEventListener("click", function () { D.settings = { tel: $("sTel").value.trim(), email: $("sEmail").value.trim(), address: $("sAddress").value.trim() }; H.store("settings", D.settings, "연락처 저장 완료"); });
    $("mailSave").addEventListener("click", function () { D.mail = { on: $("mOn").checked, to: $("mTo").value.trim(), url: $("mUrl").value.trim() }; H.store("mail", D.mail, "메일 설정 저장 완료"); });
    $("mailTest").addEventListener("click", function () { var u = $("mUrl").value.trim(); if (!u) return toast("Apps Script 주소를 먼저 넣어주세요", true); fetch(u, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ name: "테스트", phone: "010-0000-0000", type: H.INQ_TAG + " 테스트", message: "관리자에서 보낸 테스트 메일입니다.", to: $("mTo").value.trim(), date: new Date().toLocaleString("ko-KR") }) }).then(function () { toast("테스트 메일을 요청했습니다. 받은편지함을 확인하세요."); }).catch(function () { toast("요청 실패", true); }); });
    $("headSave").addEventListener("click", function () { D.headcode = $("headCode").value; H.store("headcode", D.headcode, "헤드 코드 저장 완료"); });
    $("ghSave").addEventListener("click", function () { var t = $("ghToken").value.trim(); if (t) localStorage.setItem("hd_gh_token", t); else localStorage.removeItem("hd_gh_token"); H.renderStatus(); toast(t ? "이 브라우저에 토큰을 저장했습니다" : "토큰을 지웠습니다"); });
  }

  /* ================= 계정 ================= */
  function renderAcc() {
    $("accList").innerHTML = (D.accounts || []).map(function (a, i) { return '<div class="accrow"><input type="text" data-ai="' + i + '" data-ak="id" value="' + esc(a.id) + '" placeholder="아이디" autocomplete="off"><input type="text" data-ai="' + i + '" data-ak="pw" value="' + esc(a.pw) + '" placeholder="비밀번호" autocomplete="off"><button class="lite" data-adel="' + i + '">삭제</button></div>'; }).join("") || '<p class="empty">전용 계정이 없습니다. 통합 관리자 계정으로 로그인 중입니다.</p>';
    $("accMe").textContent = H.me;
  }
  function bindAcc() {
    $("accList").addEventListener("input", function (e) { var el = e.target; if (el.dataset.ai != null) D.accounts[+el.dataset.ai][el.dataset.ak] = el.value; });
    $("accList").addEventListener("click", function (e) { var b = e.target.closest("[data-adel]"); if (b) { D.accounts.splice(+b.dataset.adel, 1); renderAcc(); } });
    $("accAdd").addEventListener("click", function () { D.accounts.push({ id: "", pw: "" }); renderAcc(); });
    $("accSave").addEventListener("click", function () { D.accounts = D.accounts.map(function (a) { return { id: (a.id || "").trim(), pw: a.pw || "" }; }).filter(function (a) { return a.id && a.pw; }); renderAcc(); H.store("accounts", D.accounts, "계정 저장 완료"); });
  }

  /* ================= 공통: 업로드 버튼(data-upto), 탭, 단축키 ================= */
  function bindCommon() {
    document.body.addEventListener("change", function (e) {
      var f = e.target.closest("[data-upto]"); if (!f || !f.files.length) return; var id = f.dataset.upto; toast("업로드 중…");
      H.uploadFile(f.files[0]).then(function (u) { var inp = $(id); if (inp) { inp.value = u; inp.dispatchEvent(new Event("input", { bubbles: true })); } var pv = $(id + "Pv"); if (pv) pv.src = u; if (id === "wImg") wImg = u; if (id === "pImg") pImg = u; toast("업로드 완료"); }).catch(function (er) { toast(er.message, true); }); f.value = "";
    });
    $("sideMenu").addEventListener("click", function (e) { var b = e.target.closest("[data-tab]"); if (b) showTab(b.dataset.tab); });
    $("bakeBtn").addEventListener("click", function () { H.bakeNow(); });
    $("logoutBtn").addEventListener("click", H.logout);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") { ["workForm", "postForm"].forEach(function (id) { $(id).hidden = true; }); } if ((e.ctrlKey || e.metaKey) && e.key === "s") { var cur = document.querySelector(".tab.on"), btn = cur && cur.querySelector(".save[id$='Save']"); if (btn) { e.preventDefault(); btn.click(); } } });
  }
  function showTab(t) {
    document.querySelectorAll("#sideMenu button").forEach(function (x) { x.classList.toggle("on", x.dataset.tab === t); });
    document.querySelectorAll(".tab").forEach(function (s) { s.classList.toggle("on", s.id === "tab-" + t); });
    if (t === "inq") refreshInq(); if (t === "dash") renderDash(); location.hash = t; window.scrollTo(0, 0);
  }
  function renderAll() { renderDash(); renderHero(); renderSlots(); renderCopy(); renderWorks(); renderPosts(); renderFaq(); renderSeo(); renderSet(); renderAcc(); renderLog(); refreshInq(); H.renderStatus(); $("whoami").textContent = H.me; }
  var started = false;
  function start() { if (started) { renderAll(); return; } started = true; D = H.D; DEF = H.DEF; bindCommon(); bindHero(); bindSlots(); bindCopy(); bindWorks(); bindPosts(); bindFaq(); bindInq(); bindSeo(); bindSet(); bindAcc(); renderAll(); var t = location.hash.replace("#", ""); if (t && $("tab-" + t)) showTab(t); }
  return { start: start, renderLog: renderLog, showTab: showTab };
})();

/* ---- 부팅 ---- */
(function () {
  var H = window.HD, $ = H.$;
  function enter() { $("loginView").hidden = true; $("adminView").hidden = false; HDApp.start(); }
  $("loginForm").addEventListener("submit", function (e) { e.preventDefault(); if (H.login($("loginId").value.trim(), $("loginPw").value)) enter(); else $("loginErr").textContent = "아이디 또는 비밀번호가 올바르지 않습니다."; });
  H.load().then(function () { if (H.restore()) enter(); }).catch(function (e) { $("loginErr").textContent = "데이터를 불러오지 못했습니다: " + e.message; });
})();
