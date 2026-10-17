// 서비스 작업 사례: 카드 묶음이 화면에 40% 들어오면 펼침 (medi.soijeong 'Why' 섹션과 같은 방식, 한 번만)
(function(){
  const els = document.querySelectorAll('.wf-slide');
  if (!els.length) return;
  if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('active')); return; }
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('active'); io.unobserve(e.target); }
  }), { threshold: .4 });
  els.forEach(e => io.observe(e));
})();
