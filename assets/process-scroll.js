// 진행 과정: 화면 고정, 세로 스크롤 진행률만큼 카드 줄을 왼쪽으로 (codle 방식, 선형)
(function(){
  const sec = document.querySelector('.pscroll'); if (!sec) return;
  const track = sec.querySelector('.ps-track');
  new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { sec.classList.add('in'); o.disconnect(); } }), { threshold: .15 }).observe(sec);
  let dist = 0;
  function measure(){ dist = Math.max(0, track.scrollWidth - innerWidth); }
  function tick(){
    if (innerWidth <= 1024) { track.style.transform = ''; return; }
    // 고정 영역은 카드 높이만큼(화면 가운데) — 그 위치에 붙은 동안의 진행률
    const pin = sec.querySelector('.ps-pin'), stick = (innerHeight - pin.offsetHeight) / 2;
    const r = sec.getBoundingClientRect(), run = sec.offsetHeight - pin.offsetHeight;
    const p = Math.min(1, Math.max(0, (stick - r.top) / run));
    track.style.transform = `translate3d(${(-p * dist).toFixed(1)}px,0,0)`;
  }
  let raf = 0; const req = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; tick(); }); };
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', () => { measure(); req(); });
  addEventListener('load', () => { measure(); req(); });
  measure(); tick();
})();
