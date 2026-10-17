// 서비스 소개: 왼쪽 제목은 화면 가운데 고정, 오른쪽 글 블록은 화면 가운데에 온 것만 선명하게 (회사소개 설비 섹션과 같은 방식)
(function(){
  const items = [...document.querySelectorAll('.bx-item')]; if (!items.length) return;
  function tick(){
    const mid = innerHeight / 2; let best = null, bd = 1e9;
    items.forEach(el => { const r = el.getBoundingClientRect(); const d = Math.abs(r.top + r.height / 2 - mid); if (d < bd) { bd = d; best = el; } });
    items.forEach(el => el.classList.toggle('on', el === best));
  }
  addEventListener('scroll', tick, { passive: true }); addEventListener('resize', tick); tick();
})();
