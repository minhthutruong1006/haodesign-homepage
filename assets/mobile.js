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
