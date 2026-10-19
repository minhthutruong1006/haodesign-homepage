// 메가메뉴: 각 열을 위 메뉴 항목 바로 아래에 맞춤 (메뉴 칸과 열 너비를 같게 + 시작 위치 맞춤)
(function(){
  const g = document.querySelector('.gnb'), w = document.querySelector('.mega .wrap');
  if (!g || !w) return;
  function align(){
    w.style.paddingLeft = '0px';
    const first = g.firstElementChild; if (!first || !first.offsetWidth) return;
    w.style.paddingLeft = Math.max(0, first.getBoundingClientRect().left - w.getBoundingClientRect().left) + 'px';
  }
  addEventListener('resize', align); addEventListener('load', align);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(align);
  align();
})();
