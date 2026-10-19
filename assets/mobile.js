// 휴대폰 메뉴: 헤더에 햄버거 버튼을 넣고, 상단 메뉴(+하위 메뉴) 내용으로 펼침 메뉴를 만듦
(function(){
  const hd = document.querySelector('header .hd'), gnb = document.querySelector('.gnb'), mega = document.querySelectorAll('.mega ul');
  if (!hd || !gnb || document.querySelector('.m-burger')) return;
  const btn = document.createElement('button');
  btn.className = 'm-burger'; btn.type = 'button'; btn.setAttribute('aria-label', '메뉴 열기'); btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = '<i></i><i></i><i></i>';
  hd.appendChild(btn);
  const nav = document.createElement('nav'); nav.className = 'm-nav'; nav.setAttribute('aria-label', '모바일 메뉴');
  let html = '';
  [...gnb.children].forEach((li, i) => {
    const a = li.querySelector('a'), sub = mega[i] ? [...mega[i].querySelectorAll('a')] : [];
    if (sub.length > 1) html += `<div class="m-grp"><button type="button">${a.textContent}</button><ul>${sub.map(s => `<li><a href="${s.getAttribute('href')}">${s.textContent}</a></li>`).join('')}</ul></div>`;
    else html += `<div class="m-grp"><a href="${a.getAttribute('href')}">${a.textContent}</a></div>`;
  });
  html += '<a class="m-call" href="tel:16662027">☎ 1666-2027 전화 상담</a>';
  nav.innerHTML = html;
  document.body.appendChild(nav);
  const root = document.documentElement;
  function set(open){ root.classList.toggle('m-open', open); btn.setAttribute('aria-expanded', open); btn.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    if (window.__lenis) open ? window.__lenis.stop && window.__lenis.stop() : window.__lenis.start && window.__lenis.start(); }
  btn.addEventListener('click', () => set(!root.classList.contains('m-open')));
  nav.querySelectorAll('.m-grp>button').forEach(b => b.addEventListener('click', () => b.parentElement.classList.toggle('open')));
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => set(false)));
  addEventListener('resize', () => { if (innerWidth > 1024) set(false); });
})();

// 휴대폰 효과: 블록이 화면에 들어오면 아래에서 떠오름 / 옆으로 넘기는 카드 점 표시 / 원 확대
(function(){
  if (!matchMedia('(max-width:768px)').matches) return;
  const sel = ['.svc', '.wc', '.sc-gal li', '.ps-card', '.wf-item', '.bx-item', '.fp-block', '.fq', '.cc', '.os-stat', '.doc-frame', '.qf', '.qt-info', '.loc > *', '.rv-card', '.hw-pic', '.hw-texts'];
  const els = [];
  sel.forEach(s => document.querySelectorAll(s).forEach(e => { if (!e.closest('.m-nav') && !e.classList.contains('reveal')) els.push(e); }));
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('m-in'); io.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  els.forEach(e => { const r = e.getBoundingClientRect(); if (r.top < innerHeight * .9) return; e.classList.add('m-rv'); io.observe(e); });
  // 옆으로 넘기는 카드: 아래 점으로 위치 표시
  document.querySelectorAll('.dv-list, .ab-orbit').forEach(list => {
    const items = [...list.children].filter(c => c.matches('.dv, .ab-orb')); if (items.length < 2) return;
    const dots = document.createElement('div'); dots.className = 'm-dots'; dots.innerHTML = items.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('');
    list.after(dots);
    list.addEventListener('scroll', () => { const c = list.scrollLeft + list.clientWidth / 2; let best = 0, bd = 1e9;
      items.forEach((it, i) => { const d = Math.abs(it.offsetLeft + it.offsetWidth / 2 - c); if (d < bd) { bd = d; best = i; } });
      [...dots.children].forEach((d, i) => d.classList.toggle('on', i === best)); }, { passive: true });
  });
  // '무엇이 다를까요' 원: 화면 가운데로 올수록 커짐
  const circ = document.querySelector('.hwi-circle');
  if (circ) { const f = () => { const r = circ.getBoundingClientRect(); const p = 1 - Math.min(1, Math.abs(r.top + r.height / 2 - innerHeight / 2) / (innerHeight * .8));
      circ.style.transform = `scale(${(.55 + p * .5).toFixed(3)})`; };
    addEventListener('scroll', f, { passive: true }); f(); }
})();
