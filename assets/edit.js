// 화면 편집 모드: 주소 뒤에 ?edit=1 을 붙이고 관리자에 로그인되어 있으면 문구를 화면에서 바로 고칠 수 있다.
// 마커 <!--B:copy.KEY-->…<!--/B:copy.KEY--> 로 감싸진 요소만 편집 대상. 저장 → Supabase hd_copy (반영은 굽기 때).
(function(){
  if(!/[?&]edit=1/.test(location.search))return;
  var sess=null;try{sess=JSON.parse(localStorage.getItem('hd_session')||'null')}catch(_){}
  if(!sess||sess.exp<Date.now()){alert('관리자에 먼저 로그인한 뒤 다시 열어주세요.');return;}
  var SB_URL="https://oaqrjrrgntlqmyxxovfn.supabase.co";
  var SB_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hcXJqcnJnbnRscW15eHhvdmZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NjQzMTUsImV4cCI6MjA5NzE0MDMxNX0.3bOfZOXVKSoI9ELfE7ZjWETuxvjpNYHdCBSIMrbAGtU";
  var H={"apikey":SB_KEY,"Authorization":"Bearer "+SB_KEY,"Content-Type":"application/json"};
  var items={},changed={},copy={},svc={};
  // 1) 마커 찾기: 주석 노드 B:copy.KEY 의 부모 요소가 편집 대상 (마커가 부모 내용 전체를 감쌀 때만)
  var walker=document.createTreeWalker(document.body,NodeFilter.SHOW_COMMENT);var n;
  while((n=walker.nextNode())){var m=n.data.match(/^B:(copy\.[A-Za-z0-9_.]+|svc\.[a-z]+\.(?:head|tag|h1|desc))$/);if(!m)continue;
    var el=n.parentNode,key=m[1];if(!el||items[key])continue;
    var first=el.firstChild,last=el.lastChild;while(first&&first.nodeType===3&&!first.data.trim())first=first.nextSibling;while(last&&last.nodeType===3&&!last.data.trim())last=last.previousSibling;
    if(first!==n||!last||last.nodeType!==8||last.data!=='/'+m[0].replace(/^B:/,'B:').slice(0))continue; // 마커가 처음·끝이 아니면 건너뜀
    if(/^svc\.[a-z]+\.head$/.test(key))continue; // 두 줄 span 구조는 관리자에서
    items[key]=el;el.setAttribute('data-hd-edit',key);}
  // ("/B:" 비교를 느슨하게) — 위 조건이 너무 엄격하면 끝 주석만 확인
  if(!Object.keys(items).length){walker=document.createTreeWalker(document.body,NodeFilter.SHOW_COMMENT);while((n=walker.nextNode())){var mm=n.data.match(/^B:(copy\.[A-Za-z0-9_.]+)$/);if(mm&&n.parentNode&&!items[mm[1]]){items[mm[1]]=n.parentNode;n.parentNode.setAttribute('data-hd-edit',mm[1]);}}}
  // 2) 스타일 + 툴바
  var st=document.createElement('style');st.textContent='[data-hd-edit]{outline:1.5px dashed rgba(232,56,23,.55)!important;outline-offset:3px;cursor:text;transition:outline-color .15s}[data-hd-edit]:hover{outline-color:#e83817!important;background:rgba(232,56,23,.05)}[data-hd-edit][data-hd-changed]{outline:2px solid #f59e0b!important;background:rgba(245,158,11,.08)}[data-hd-edit]:focus{outline:2px solid #e83817!important;background:#fff}#hdEditBar{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:99999;display:flex;align-items:center;gap:10px;background:#17150f;color:#fff;border-radius:999px;padding:10px 14px 10px 20px;font:700 14px Pretendard,system-ui,sans-serif;box-shadow:0 14px 40px -10px rgba(0,0,0,.5)}#hdEditBar button{border:0;border-radius:999px;padding:9px 16px;font:inherit;cursor:pointer;background:#2b2822;color:#fff}#hdEditBar button.save{background:#e83817}#hdEditBar button:disabled{opacity:.5}#hdEditBar small{color:#b5b0a6;font-weight:500}';document.head.appendChild(st);
  var bar=document.createElement('div');bar.id='hdEditBar';bar.innerHTML='<span>화면 편집 <small id="hdN">· 글자를 클릭해 고치세요</small></span><button id="hdUndo">되돌리기</button><button class="save" id="hdSave" disabled>저장</button><button id="hdExit">나가기</button>';document.body.appendChild(bar);
  // 3) 편집 가능하게
  var orig={};
  Object.keys(items).forEach(function(k){var el=items[k];orig[k]=inner(el);el.contentEditable='true';el.spellcheck=false;
    el.addEventListener('input',function(){changed[k]=inner(el);if(changed[k]===orig[k]){delete changed[k];el.removeAttribute('data-hd-changed')}else el.setAttribute('data-hd-changed','1');upd();});
    el.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey&&/^(H1|H2|H3|H4|SPAN|LI|DT)$/.test(el.tagName)){e.preventDefault();}});
    el.addEventListener('paste',function(e){e.preventDefault();document.execCommand('insertText',false,(e.clipboardData||window.clipboardData).getData('text/plain'));});
    // 링크·버튼 클릭 막기
    el.addEventListener('click',function(e){if(e.target.closest('a'))e.preventDefault();});});
  function inner(el){var c=el.cloneNode(true);var w=document.createTreeWalker(c,NodeFilter.SHOW_COMMENT),x,rm=[];while((x=w.nextNode()))if(/^\/?B:/.test(x.data))rm.push(x);rm.forEach(function(x){x.parentNode.removeChild(x)});return c.innerHTML.replace(/\s*contenteditable="true"|\s*spellcheck="false"|\s*data-hd-[a-z]+="[^"]*"/g,'').trim();}
  function upd(){var n=Object.keys(changed).length;document.getElementById('hdN').textContent=n?'· 고친 문구 '+n+'개':'· 글자를 클릭해 고치세요';document.getElementById('hdSave').disabled=!n;}
  document.getElementById('hdUndo').onclick=function(){Object.keys(changed).forEach(function(k){items[k].innerHTML='<!--B:'+k+'-->'+orig[k]+'<!--/B:'+k+'-->';items[k].removeAttribute('data-hd-changed')});changed={};upd();};
  document.getElementById('hdExit').onclick=function(){if(Object.keys(changed).length&&!confirm('저장하지 않은 수정이 있습니다. 나갈까요?'))return;location.href=location.pathname;};
  document.getElementById('hdSave').onclick=function(){
    var btn=this;btn.disabled=true;btn.textContent='저장 중…';
    fetch(SB_URL+'/rest/v1/overrides?select=k,v&k=in.(hd_copy,hd_svc)',{headers:H}).then(function(r){return r.json()}).then(function(rows){
      rows.forEach(function(r){if(r.k==='hd_copy')copy=r.v||{};if(r.k==='hd_svc')svc=r.v||{};});
      Object.keys(changed).forEach(function(k){var m=k.match(/^svc\.([a-z]+)\.(tag|h1|desc)$/);if(m){svc[m[1]]=svc[m[1]]||{};svc[m[1]][m[2]]=changed[k];}else copy[k.replace(/^copy\./,'')]=changed[k];});
      var now=new Date().toISOString(),body=[{k:'hd_copy',v:copy,updated_at:now}];if(Object.keys(svc).length)body.push({k:'hd_svc',v:svc,updated_at:now});
      return fetch(SB_URL+'/rest/v1/overrides',{method:'POST',headers:Object.assign({'Prefer':'resolution=merge-duplicates'},H),body:JSON.stringify(body)});
    }).then(function(r){if(!r.ok)throw new Error(r.status);
      Object.keys(changed).forEach(function(k){orig[k]=changed[k];items[k].removeAttribute('data-hd-changed')});changed={};upd();btn.textContent='저장됨 ✓';setTimeout(function(){btn.textContent='저장'},1500);
      var log=[{t:now2(),who:sess.id||'',what:'화면 편집으로 문구 저장 ('+document.title.split('|')[0].trim()+')'}];fetch(SB_URL+'/rest/v1/overrides?select=v&k=eq.hd_log',{headers:H}).then(function(r){return r.json()}).then(function(rows){var l=(rows[0]&&rows[0].v)||[];fetch(SB_URL+'/rest/v1/overrides',{method:'POST',headers:Object.assign({'Prefer':'resolution=merge-duplicates'},H),body:JSON.stringify([{k:'hd_log',v:log.concat(l).slice(0,120),updated_at:now2()}])});}).catch(function(){});
    }).catch(function(e){alert('저장 실패: '+e.message);btn.disabled=false;btn.textContent='저장';});
  };
  function now2(){return new Date().toISOString()}
  // 스크롤 라이브러리(lenis)가 있으면 편집 중 입력 방해 방지
  if(window.__lenis&&window.__lenis.stop){/* 유지 */}
})();
