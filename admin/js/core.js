/* 하오 DESIGN 관리자 — 코어: Supabase 저장소, 로그인, 저장+로그, 업로드, 토스트/모달, 드래그 정렬, 반영 상태
   저장: Supabase overrides (키 접두사 hd_) · 사진: Storage images 버킷 · 문의: inquiries 테이블 · 반영: tools/bake.js (Actions 30분) */
window.HD = (function () {
  "use strict";
  var SB_URL = "https://oaqrjrrgntlqmyxxovfn.supabase.co";
  var SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hcXJqcnJnbnRscW15eHhvdmZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NjQzMTUsImV4cCI6MjA5NzE0MDMxNX0.3bOfZOXVKSoI9ELfE7ZjWETuxvjpNYHdCBSIMrbAGtU";
  var SB_H = { "apikey": SB_KEY, "Authorization": "Bearer " + SB_KEY, "Content-Type": "application/json" };
  var P = "hd_", INQ_TAG = "[하오DESIGN]";
  var REPO = "minhthutruong1006/haodesign-homepage", WORKFLOW = "bake.yml";
  var KEYS = ["works", "posts", "hero", "copy", "settings", "mail", "accounts", "slots", "faq", "svc", "seo", "headcode", "inq_meta", "log"];
  var LABEL = { works: "포트폴리오", posts: "칼럼", hero: "히어로", copy: "문구", settings: "연락처", mail: "메일 알림", accounts: "계정", slots: "사진 슬롯", faq: "FAQ", svc: "서비스 문구", seo: "SEO", headcode: "헤드 코드", inq_meta: "문의 메모" };
  var BAKED = ["works", "posts", "hero", "copy", "settings", "slots", "faq", "svc", "seo", "headcode"]; /* 굽기에 반영되는 키 */

  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  var src = function (u) { return !u || /^(https?:|data:|\/)/.test(u) ? (u || "") : "../" + u; }; /* 사이트 루트 상대경로를 /admin/에서 보이게 */
  var fmtDate = function (d, short) { if (!d) return "-"; var t = new Date(d); if (isNaN(t)) return String(d); return short ? t.toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : t.toLocaleString("ko-KR"); };

  /* ---- 토스트 · 모달 ---- */
  var toastT; function toast(m, bad) { var t = $("toast"); t.textContent = m; t.classList.toggle("bad", !!bad); t.hidden = false; clearTimeout(toastT); toastT = setTimeout(function () { t.hidden = true; }, bad ? 4200 : 2600); }
  function confirmBox(title, body, okLabel, danger) {
    return new Promise(function (res) {
      var m = $("modal"); m.innerHTML = '<div class="mbox"><h4>' + esc(title) + '</h4>' + (body ? '<p>' + esc(body) + '</p>' : "") + '<div class="macts"><button class="lite" data-m="0">취소</button><button class="save' + (danger ? " danger" : "") + '" data-m="1">' + esc(okLabel || "확인") + '</button></div></div>';
      m.hidden = false; m.querySelector("[data-m='1']").focus();
      m.onclick = function (e) { var b = e.target.closest("[data-m]"); if (!b && e.target !== m) return; m.hidden = true; res(!!(b && b.dataset.m === "1")); };
      m.onkeydown = function (e) { if (e.key === "Escape") { m.hidden = true; res(false); } };
    });
  }

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
  /* 파일 → 긴 변 maxPx JPEG(또는 PNG 유지) → 업로드 → URL */
  function uploadFile(file, maxPx) {
    return new Promise(function (res, rej) {
      if (!file || !/^image\//.test(file.type)) return rej(new Error("이미지 파일이 아닙니다: " + (file && file.name)));
      if (/gif$/.test(file.type)) return sbUpload(file, "gif").then(res, rej); /* GIF는 원본 그대로 */
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var MAX = maxPx || 1600, w = img.width, h = img.height, r = Math.min(1, MAX / Math.max(w, h));
        var c = document.createElement("canvas"); c.width = Math.round(w * r); c.height = Math.round(h * r);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
        var png = /png$/.test(file.type) && file.size < 600 * 1024; /* 작은 PNG(로고 등)는 투명 유지 */
        c.toBlob(function (b) { sbUpload(b, png ? "png" : "jpg").then(res, rej); }, png ? "image/png" : "image/jpeg", 0.86);
      };
      img.onerror = function () { rej(new Error("이미지를 읽지 못했습니다: " + file.name)); }; img.src = url;
    });
  }
  /* 여러 파일 순서대로 업로드 (실패한 파일만 알리고 계속) */
  function uploadMany(files, each) {
    var list = Array.prototype.slice.call(files), done = [];
    return list.reduce(function (p, f, i) {
      return p.then(function () { toast("업로드 중… " + (i + 1) + "/" + list.length); return uploadFile(f).then(function (u) { done.push({ file: f, url: u }); if (each) each(f, u, i); }).catch(function (e) { toast(e.message, true); }); });
    }, Promise.resolve()).then(function () { return done; });
  }

  /* ---- 데이터 ---- */
  var DEF = null, D = {}, META = {}, bakedAt = null, me = "";
  var DEFAULT_ACCOUNTS = [{ id: "admin", pw: "haodesign2026" }]; /* 전용 계정이 하나도 없을 때만 쓰는 초기 계정 — 계정 탭에서 바꾸세요 */
  function load() {
    return Promise.all([
      fetch("defaults.json?v=" + Date.now()).then(function (r) { return r.json(); }),
      sbGet("/rest/v1/overrides?select=k,v,updated_at&k=like." + P + "*").catch(function () { return []; })
    ]).then(function (a) {
      DEF = a[0];
      ["works", "posts", "hero", "copy", "settings", "mail", "slots", "faq", "svc", "seo"].forEach(function (k) { D[k] = clone(DEF[k]); });
      D.headcode = DEF.headcode || ""; D.accounts = []; D.inq_meta = {}; D.log = [];
      a[1].forEach(function (row) {
        var k = row.k.slice(P.length); if (row.v == null) return;
        if (k === "bake") { bakedAt = row.v.bakedAt || null; return; } /* 마지막 굽기 시각 (bake.js가 기록) */
        if (KEYS.indexOf(k) < 0) return;
        D[k] = (k === "copy" || k === "svc" || k === "seo" || k === "slots" || k === "settings") ? merge(clone(DEF[k] || {}), row.v) : row.v;
        META[k] = row.updated_at;
      });
    });
  }
  function merge(a, b) { Object.keys(b || {}).forEach(function (k) { a[k] = (b[k] && typeof b[k] === "object" && !Array.isArray(b[k]) && a[k] && typeof a[k] === "object") ? merge(a[k], b[k]) : b[k]; }); return a; }

  /* 저장 + 로그 + 반영 상태 갱신 */
  var saving = 0;
  function store(k, v, msg, what) {
    saving++; setBusy(true);
    return sbSave(k, v).then(function () {
      META[k] = new Date().toISOString();
      if (k !== "log" && k !== "inq_meta") addLog((what || msg || LABEL[k] || k));
      toast(msg || "저장되었습니다"); renderStatus();
    }).catch(function (e) { toast("저장 실패: " + e.message + " — 다시 시도해 주세요", true); throw e; })
      .then(function () { if (--saving === 0) setBusy(false); }, function (e) { if (--saving === 0) setBusy(false); throw e; });
  }
  function setBusy(on) { document.body.classList.toggle("busy", on); }
  function addLog(what) {
    D.log = [{ t: new Date().toISOString(), who: me, what: what }].concat(D.log || []).slice(0, 120);
    sbSave("log", D.log).catch(function () {});
    if (window.HDApp && HDApp.renderLog) HDApp.renderLog();
  }
  /* 마지막 굽기 이후 바뀐 키 */
  function pending() { return BAKED.filter(function (k) { return META[k] && (!bakedAt || META[k] > bakedAt); }).map(function (k) { return LABEL[k] || k; }); }
  function renderStatus() {
    var p = pending(), el = $("bakeStatus"); if (!el) return;
    el.innerHTML = (p.length ? '<span class="dot wait"></span><b>반영 대기 ' + p.length + '건</b> <small>' + esc(p.join(" · ")) + '</small>' : '<span class="dot ok"></span><b>사이트와 동일</b>') +
      ' <small class="muted">마지막 반영 ' + fmtDate(bakedAt, true) + '</small>';
    $("bakeBtn").textContent = localStorage.getItem("hd_gh_token") ? "지금 반영" : "Actions에서 반영";
  }
  /* GitHub Actions 굽기 실행 (토큰이 있으면 API, 없으면 Actions 페이지 열기) */
  function bakeNow() {
    var tok = localStorage.getItem("hd_gh_token");
    if (!tok) { window.open("https://github.com/" + REPO + "/actions/workflows/" + WORKFLOW, "_blank"); toast("Actions 페이지에서 'Run workflow'를 눌러주세요. 설정 탭에 GitHub 토큰을 넣으면 여기서 바로 실행됩니다."); return Promise.resolve(false); }
    $("bakeBtn").disabled = true;
    return fetch("https://api.github.com/repos/" + REPO + "/actions/workflows/" + WORKFLOW + "/dispatches", { method: "POST", headers: { "Authorization": "Bearer " + tok, "Accept": "application/vnd.github+json", "Content-Type": "application/json" }, body: JSON.stringify({ ref: "main" }) })
      .then(function (r) { if (r.status !== 204) throw new Error("HTTP " + r.status); toast("굽기를 시작했습니다. 2~3분 뒤 사이트에 반영됩니다."); addLog("사이트 굽기 실행"); return true; })
      .catch(function (e) { toast("굽기 실행 실패: " + e.message + " (토큰 권한 확인)", true); return false; })
      .then(function (ok) { $("bakeBtn").disabled = false; return ok; });
  }

  /* ---- 로그인 ---- */
  function verify(id, pw) { var list = (D.accounts && D.accounts.length) ? D.accounts : DEFAULT_ACCOUNTS; return list.some(function (a) { return a && a.id === id && a.pw === pw; }); }
  function login(id, pw) { if (!verify(id, pw)) return false; me = id; sessionStorage.setItem("hd_admin", id); localStorage.setItem("hd_session", JSON.stringify({ id: id, exp: Date.now() + 12 * 3600e3 })); return true; }
  function logout() { sessionStorage.removeItem("hd_admin"); localStorage.removeItem("hd_session"); location.reload(); }
  function restore() {
    var s = sessionStorage.getItem("hd_admin"); if (s) { me = s; return true; }
    try { var j = JSON.parse(localStorage.getItem("hd_session") || "null"); if (j && j.exp > Date.now()) { me = j.id; sessionStorage.setItem("hd_admin", me); return true; } } catch (_) {}
    return false;
  }

  /* ---- 드래그 정렬 (마우스/터치 공용, 컨테이너 안 .drag 항목) ---- */
  function dragSort(container, onDrop) {
    var dragging = null, placeholder = null;
    container.addEventListener("dragstart", function (e) { var it = e.target.closest(".drag"); if (!it) return; dragging = it; it.classList.add("dragging"); e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", ""); } catch (_) {} });
    container.addEventListener("dragend", function () { if (dragging) dragging.classList.remove("dragging"); container.querySelectorAll(".drop-before,.drop-after").forEach(function (x) { x.classList.remove("drop-before", "drop-after"); }); dragging = null; });
    container.addEventListener("dragover", function (e) {
      if (!dragging) return; e.preventDefault(); var it = e.target.closest(".drag"); if (!it || it === dragging) return;
      var r = it.getBoundingClientRect(), horiz = container.classList.contains("grid"), before = horiz ? (e.clientX - r.left) < r.width / 2 : (e.clientY - r.top) < r.height / 2;
      container.querySelectorAll(".drop-before,.drop-after").forEach(function (x) { x.classList.remove("drop-before", "drop-after"); });
      it.classList.add(before ? "drop-before" : "drop-after");
    });
    container.addEventListener("drop", function (e) {
      if (!dragging) return; e.preventDefault(); var it = e.target.closest(".drag"); if (!it || it === dragging) return;
      var items = Array.prototype.slice.call(container.querySelectorAll(".drag")), from = items.indexOf(dragging), to = items.indexOf(it);
      if (it.classList.contains("drop-after")) to++; if (from < to) to--;
      onDrop(from, to);
    });
  }

  /* ---- CSV ---- */
  function csv(rows, name) {
    var s = "﻿" + rows.map(function (r) { return r.map(function (c) { return '"' + String(c == null ? "" : c).replace(/"/g, '""') + '"'; }).join(","); }).join("\n");
    var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([s], { type: "text/csv;charset=utf-8" })); a.download = name; a.click();
  }

  return { SB_URL: SB_URL, SB_H: SB_H, INQ_TAG: INQ_TAG, REPO: REPO, $: $, esc: esc, clone: clone, src: src, fmtDate: fmtDate, toast: toast, confirm: confirmBox,
    sbGet: sbGet, sbSave: sbSave, uploadFile: uploadFile, uploadMany: uploadMany, load: load, store: store, addLog: addLog, pending: pending, renderStatus: renderStatus, bakeNow: bakeNow,
    login: login, logout: logout, restore: restore, dragSort: dragSort, csv: csv, LABEL: LABEL,
    get D() { return D; }, get DEF() { return DEF; }, get META() { return META; }, get me() { return me; }, get bakedAt() { return bakedAt; } };
})();
