// 견적 폼: 필수 항목 확인 → Supabase inquiries 저장(관리자 문의함) + 메일 알림(관리자 설정에 주소가 있을 때)
(function(){
  var SB_URL="https://oaqrjrrgntlqmyxxovfn.supabase.co";
  var SB_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hcXJqcnJnbnRscW15eHhvdmZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NjQzMTUsImV4cCI6MjA5NzE0MDMxNX0.3bOfZOXVKSoI9ELfE7ZjWETuxvjpNYHdCBSIMrbAGtU";
  var H={"apikey":SB_KEY,"Authorization":"Bearer "+SB_KEY,"Content-Type":"application/json"};
  var TAG="[하오DESIGN] ";
  var f=document.getElementById('quoteForm');if(!f)return;var note=f.querySelector('.qf-note'),btn=f.querySelector('.qf-btn');
  f.addEventListener('submit',function(e){e.preventDefault();
    var miss=[];
    if(!f.company.value.trim())miss.push('회사/브랜드명');if(!f.name.value.trim())miss.push('담당자명');
    if(!f.phone.value.trim())miss.push('연락처');if(!f.type.value)miss.push('의뢰 분야');
    var route=f.querySelector('input[name=route]:checked');if(!route)miss.push('유입 경로');if(!f.agree.checked)miss.push('개인정보 동의');
    note.classList.toggle('err',miss.length>0);
    if(miss.length){note.textContent='다음 항목을 확인해주세요: '+miss.join(', ');return;}
    var q={name:f.name.value.trim()+' ('+f.company.value.trim()+')',phone:f.phone.value.trim(),type:TAG+f.type.value,
      message:['이메일: '+(f.email.value.trim()||'-'),'경로: '+route.value,f.message.value.trim()?'내용: '+f.message.value.trim():''].filter(Boolean).join('\n')};
    btn.disabled=true;note.textContent='전송 중…';
    fetch(SB_URL+'/rest/v1/overrides?select=v&k=eq.hd_mail',{headers:H}).then(function(r){return r.ok?r.json():[]}).catch(function(){return[]}).then(function(rows){
      var m=rows[0]&&rows[0].v;
      if(m&&m.on&&m.url){try{fetch(m.url,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain'},body:JSON.stringify({name:q.name,phone:q.phone,type:q.type,message:q.message,to:m.to,date:new Date().toLocaleString('ko-KR')})}).catch(function(){})}catch(_){}}
      return fetch(SB_URL+'/rest/v1/inquiries',{method:'POST',headers:H,body:JSON.stringify([q])});
    }).then(function(r){
      if(!r||!r.ok)throw new Error();
      f.reset();note.classList.remove('err');note.textContent='접수되었습니다. 담당자가 확인 후 빠르게 연락드리겠습니다.';
    }).catch(function(){note.classList.add('err');note.textContent='전송에 실패했습니다. 1666-2027로 연락주시면 바로 도와드리겠습니다.';}).then(function(){btn.disabled=false;});
  });
})();
