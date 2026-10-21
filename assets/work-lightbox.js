// 포트폴리오 상세 보기(라이트박스): 카드를 누르면 큰 사진 + 프로젝트 정보, 이전/다음, 확대(휠·버튼·더블클릭·드래그), ESC 닫기
(function(){
  const grid = document.getElementById('wgrid'); if (!grid) return;
  const DEF = {
    '카탈로그·브로슈어': ['제품 특징과 브랜드 강점이 한눈에 보이도록 구성한 카탈로그 · 브로슈어 제작 사례입니다. 하오 DESIGN이 기획부터 디자인, 인쇄까지 함께 진행했습니다.', '카탈로그 · 브로슈어', '기획 · 디자인 · 인쇄', ['catalog-brochure.html', '카탈로그 · 브로슈어 디자인']],
    '리플렛': ['펼치고 접는 동선에 맞춰 핵심 정보를 담아낸 팜플렛 · 리플렛 제작 사례입니다. 하오 DESIGN이 구성 기획부터 디자인, 인쇄까지 함께 진행했습니다.', '팜플렛 · 리플렛', '기획 · 디자인 · 인쇄', ['leaflet-pamphlet.html', '팜플렛 · 리플렛 디자인']],
    '포스터·전단지': ['멀리서도 읽히는 위계와 임팩트를 담은 포스터 · 전단지 제작 사례입니다. 하오 DESIGN이 디자인부터 인쇄 · 납품까지 함께 진행했습니다.', '포스터 · 전단지', '디자인 · 인쇄 · 납품', ['poster-flyer.html', '포스터 · 전단지 디자인']],
    'CI·로고디자인': ['브랜드의 방향을 담아 다양한 매체에 일관되게 확장되는 CI · 로고 제작 사례입니다.', 'CI · 로고', '기획 · 디자인 · 응용 시스템', ['ci-logo.html', 'CI · 로고 디자인']],
    '패키지·라벨': ['제품의 가치가 매대에서 그대로 전해지도록 만든 패키지 · 라벨 제작 사례입니다. 구조 설계부터 인쇄까지 함께 진행했습니다.', '패키지 · 라벨', '구조 설계 · 디자인 · 인쇄', ['package-label.html', '패키지 · 라벨 디자인']],
    '촬영서비스': ['제품의 질감과 형태가 살아나도록 촬영해 바로 디자인에 반영한 제품 촬영 사례입니다.', '제품 촬영', '촬영 · 보정', null],
    '다국어디자인': ['원본의 레이아웃과 브랜드 톤을 유지하며 언어별로 재조판한 다국어 인쇄물 제작 사례입니다.', '다국어 카탈로그 · 브로슈어', '번역 협업 · 다국어 편집 · 인쇄', ['global-design.html', '다국어 카탈로그 · 브로슈어 디자인']]
  };
  const lb = document.createElement('div'); lb.className = 'wlb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true');
  lb.innerHTML = '<div class="wlb-bg"></div><div class="wlb-wrap"><figure class="wlb-box"><img class="wlb-img" alt=""></figure>' +
    '<aside class="wlb-info"><span class="wlb-cat"></span><h3 class="wlb-title"></h3><p class="wlb-desc"></p><p class="wlb-label">Project Info</p><div class="wlb-rows"></div><p class="wlb-count"></p></aside></div>' +
    '<button class="wlb-close" aria-label="닫기">&times;</button><button class="wlb-nav prev" aria-label="이전">&#8249;</button><button class="wlb-nav next" aria-label="다음">&#8250;</button>' +
    '<div class="wlb-zoom"><button data-z="out" aria-label="축소">&minus;</button><span class="wlb-zval">100%</span><button data-z="in" aria-label="확대">+</button><button data-z="reset" aria-label="원래 크기">&#8634;</button></div>';
  document.body.appendChild(lb);
  const $ = s => lb.querySelector(s), img = $('.wlb-img');
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  let list = [], cur = -1, scale = 1, tx = 0, ty = 0;
  function apply(){ img.style.transform = scale === 1 ? '' : `translate(${tx}px,${ty}px) scale(${scale})`; $('.wlb-zval').textContent = Math.round(scale * 100) + '%'; lb.classList.toggle('zoomed', scale > 1); }
  function zoom(ns){ scale = Math.min(4, Math.max(1, ns)); if (scale === 1) { tx = ty = 0; } apply(); }
  function show(i){
    cur = (i + list.length) % list.length; const c = list[cur], im = c.querySelector('img');
    const title = c.querySelector('h4').textContent, cat = c.querySelector('span').textContent, d = DEF[cat] || ['', '', '', null];
    img.src = im.getAttribute('src').replace('/work-hd/thumb/', '/work-hd/large/'); img.alt = im.alt;
    $('.wlb-cat').textContent = cat; $('.wlb-title').textContent = title; $('.wlb-desc').textContent = d[0];
    $('.wlb-rows').innerHTML = (d[1] ? `<div><b>제작물</b><span>${esc(d[1])}</span></div>` : '') + (d[2] ? `<div><b>작업 범위</b><span>${esc(d[2])}</span></div>` : '') + (d[3] ? `<div><b>관련 서비스</b><span><a href="${d[3][0]}">${esc(d[3][1])} &rarr;</a></span></div>` : '');
    $('.wlb-count').textContent = `${cur + 1} / ${list.length}`;
    zoom(1); lb.classList.add('open'); document.documentElement.style.overflow = 'hidden';
    if (window.__lenis && window.__lenis.stop) window.__lenis.stop();
  }
  function close(){ lb.classList.remove('open'); document.documentElement.style.overflow = ''; if (window.__lenis && window.__lenis.start) window.__lenis.start(); zoom(1); }
  grid.addEventListener('click', e => { const c = e.target.closest('.wc'); if (!c) return; e.preventDefault(); list = [...grid.querySelectorAll('.wc')].filter(x => !x.classList.contains('hide')); show(list.indexOf(c)); });
  grid.querySelectorAll('.wc').forEach(c => { c.setAttribute('role', 'button'); c.tabIndex = 0; c.addEventListener('keydown', e => { if (e.key === 'Enter') c.click(); }); });
  $('.wlb-close').onclick = close; $('.wlb-bg').onclick = close;
  $('.wlb-nav.prev').onclick = () => show(cur - 1); $('.wlb-nav.next').onclick = () => show(cur + 1);
  lb.querySelectorAll('.wlb-zoom button').forEach(b => b.onclick = () => zoom(b.dataset.z === 'in' ? scale + .5 : b.dataset.z === 'out' ? scale - .5 : 1));
  img.addEventListener('dblclick', () => zoom(scale > 1 ? 1 : 2));
  $('.wlb-box').addEventListener('wheel', e => { e.preventDefault(); e.stopPropagation(); zoom(scale * (e.deltaY < 0 ? 1.15 : 1 / 1.15)); }, { passive: false });
  let drag = null;
  img.addEventListener('pointerdown', e => { if (scale === 1) return; drag = { x: e.clientX - tx, y: e.clientY - ty }; img.setPointerCapture(e.pointerId); });
  img.addEventListener('pointermove', e => { if (!drag) return; tx = e.clientX - drag.x; ty = e.clientY - drag.y; apply(); });
  img.addEventListener('pointerup', () => { drag = null; });
  addEventListener('keydown', e => { if (!lb.classList.contains('open')) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') show(cur - 1); if (e.key === 'ArrowRight') show(cur + 1); });
})();
