// 작업 사례: insplanet 'Our Projects' 방식 — 화면 고정, 휠 한 번에 한 단계(0.8초)
// 0단계 = 큰 제목, 1~N단계 = 작업물. 제목은 작아져 왼쪽 위로, 오른쪽 절반에 사진이 들어옴.
(function(){
  const sec=document.querySelector('.wproj');if(!sec)return;
  const title=sec.querySelector('.wp-title'),big=sec.querySelector('.wp-big'),sub=sec.querySelector('.wp-sub');
  const visual=sec.querySelector('.wp-visual'),info=sec.querySelector('.wp-info');
  const vises=[...sec.querySelectorAll('.wp-vis')],slides=[...sec.querySelectorAll('.wp-slide')],dots=[...sec.querySelectorAll('.wp-dot')];
  const N=vises.length;if(!N)return;
  sec.style.setProperty('--wp-steps',N);
  const clamp=v=>Math.min(1,Math.max(0,v)),lerp=(a,b,t)=>a+(b-a)*t,smooth=x=>x*x*x*(x*(x*6-15)+10);
  const mobile=()=>innerWidth<=1024;
  // 사진 층: 들어올 때 아래(40%)에서 올라오며 커지고, 나갈 때 카드처럼 작아지며 위로 빠짐
  function vis(d){
    if(d<=-1)return[40,.8,0]; if(d>=1)return[-40,.8,0];
    if(d<=0){const u=d+1;return[lerp(40,0,smooth(clamp(u/.82))),lerp(.8,1,smooth(clamp((u-.4)/.6))),clamp(u/.2)]}
    return[lerp(0,-40,smooth(clamp((d-.18)/.82))),lerp(1,.8,smooth(clamp(d/.6))),1-clamp((d-.6)/.4)];
  }
  let introDone=false;
  function render(pos){
    if(mobile()){title.style.cssText='';visual.style.cssText='';info.style.cssText='';vises.forEach(v=>v.style.cssText=v.style.cssText.replace(/transform[^;]*;|opacity[^;]*;/g,''));return}
    const q=clamp(pos),vh=innerHeight;
    // 제목: 가운데 큰 글씨 → 왼쪽 위 작은 라벨
    const scale=lerp(1,.32,q),ty=lerp(0,-(vh*.5-150),q);
    title.style.transform=`translateY(calc(-50% + ${ty.toFixed(1)}px)) scale(${scale.toFixed(3)})`;
    sub.style.opacity=(1-clamp(q/.5)).toFixed(3);
    const rev=clamp((q-.35)/.5);
    visual.style.opacity=rev.toFixed(3);visual.style.pointerEvents=rev>.5?'auto':'none';
    info.style.opacity=rev.toFixed(3);info.style.transform=`translateY(${(24*(1-rev)).toFixed(1)}px)`;
    const af=Math.max(0,Math.min(N-1,pos-1)),act=Math.round(af);
    dots.forEach((d,i)=>d.classList.toggle('on',i===act));
    for(let i=0;i<N;i++){
      const d=af-i,v=vis(d);
      vises[i].style.transform=`translateY(${v[0].toFixed(2)}%) scale(${v[1].toFixed(3)})`;vises[i].style.opacity=v[2].toFixed(3);
      const ad=Math.abs(d),sl=slides[i];
      sl.style.opacity=clamp(1-ad).toFixed(3);sl.style.filter=`blur(${(ad*9).toFixed(2)}px)`;
      const rise=d<0?-d:0;
      sl.querySelector('.wp-name').style.transform=`translateY(${(rise*40).toFixed(1)}px)`;
      sl.querySelector('.wp-meta').style.transform=`translateY(${(rise*64).toFixed(1)}px)`;
    }
  }
  const top=()=>sec.getBoundingClientRect().top+scrollY,run=()=>sec.offsetHeight-innerHeight;
  function tick(){
    const r=sec.getBoundingClientRect(),p=clamp(-r.top/run());
    render(p*N);
    // 처음 화면에 고정되면 큰 제목이 흐림에서 선명하게 나타남
    if(!introDone&&r.top<innerHeight*.4){introDone=true;big.classList.add('in');sub.classList.add('in')}
  }
  addEventListener('scroll',tick,{passive:true});addEventListener('resize',tick);tick();
  // 휠 한 번 = 한 단계
  let busy=false;
  addEventListener('wheel',e=>{
    if(mobile()||e.ctrlKey||!window.__lenis)return;
    const T=top(),R=run(),y=window.__lenis.targetScroll??scrollY;
    if(y<T-innerHeight*.1||y>T+R+2)return;
    const pos=clamp((y-T)/R)*N,cur=Math.round(pos),dir=e.deltaY>0?1:-1;
    const to=cur+dir;
    if(y<T-2&&dir<0)return;
    if(to>N||to<0){return}                       // 끝에서는 원래대로 스크롤 이어짐
    e.preventDefault();e.stopImmediatePropagation();
    if(busy)return;busy=true;
    window.__lenis.scrollTo(T+R*to/N,{duration:.8,easing:smooth,lock:true,force:true,onComplete:()=>setTimeout(()=>busy=false,120)});
    setTimeout(()=>busy=false,1300);
  },{passive:false,capture:true});
})();
