(function(){
  'use strict';
  function escapeHtml(value){return String(value||'').replace(/[&<>'"]/g,function(ch){return({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch])})}
  function create(options){
    options=options||{};
    var guides=options.guides||{},current='',index=0,lines=[],showKorean=false,toast=options.blocking!==true,autoTimer=0;
    var seenKey=(options.key||location.pathname)+':focus-guide:v1';
    var seen={};
    try{seen=JSON.parse(sessionStorage.getItem(seenKey)||'{}')||{}}catch(_){seen={}}
    var dialog=document.createElement('dialog');
    dialog.className='focus-guide-dialog'+(toast?' is-toast':'');
    dialog.setAttribute('aria-labelledby','focusGuideMessage');
    dialog.innerHTML='<div class="focus-guide-shell"><div class="focus-guide-kicker"><span>JELLY DETECTIVE · ONE STEP NOW</span><span class="focus-guide-count" id="focusGuideCount"></span>'+(toast?'<button class="focus-guide-x" type="button" aria-label="안내 닫기">×</button>':'')+'</div><div class="focus-guide-conversation"><img class="focus-guide-avatar" src="'+escapeHtml(options.avatar||'assets/jelly-detective-magnifier.png')+'" alt="젤리 탐정"><div class="focus-guide-bubble"><p class="focus-guide-message" id="focusGuideMessage"></p></div></div><div class="focus-guide-actions"><button class="focus-guide-hold" type="button">한국어 · 누르는 동안 보기</button><button class="focus-guide-next" type="button">NEXT</button></div></div>';
    document.body.appendChild(dialog);
    document.body.classList.add('focus-guide-enabled');
    var message=dialog.querySelector('.focus-guide-message');
    var count=dialog.querySelector('.focus-guide-count');
    var hold=dialog.querySelector('.focus-guide-hold');
    var next=dialog.querySelector('.focus-guide-next');
    var replay=document.getElementById(options.replayButton||'focusGuideReplay');
    function saveSeen(){try{sessionStorage.setItem(seenKey,JSON.stringify(seen))}catch(_){}}
    function render(){
      var line=lines[index]||{};
      message.textContent=showKorean?(line.ko||line.en):(line.en||line.ko||'');
      count.textContent=(index+1)+' / '+lines.length;
      next.textContent=index===lines.length-1?(toast?'알겠어요':'START ACTIVITY'):'NEXT';
      hold.classList.toggle('active',showKorean);
    }
    function setKorean(on){showKorean=!!on;render()}
    function close(){
      clearTimeout(autoTimer);
      if(dialog.open)dialog.close();
      if(toast){seen[current]=true;saveSeen();return}
      var active=document.querySelector('.screen:not([hidden])');
      var target=active&&active.querySelector('button:not(.focus-guide-replay):not([disabled]),input:not([disabled]),textarea:not([disabled])');
      if(target)setTimeout(function(){target.focus({preventScroll:true})},30);
    }
    function nextLine(){
      if(index<lines.length-1){index+=1;setKorean(false);scheduleAuto();return}
      seen[current]=true;saveSeen();close();
    }
    function open(screen,force){
      lines=Array.isArray(guides[screen])?guides[screen]:[];
      current=screen;index=0;showKorean=false;
      if(replay)replay.hidden=!lines.length;
      if(!lines.length||(!force&&seen[screen])||dialog.open)return;
      render();
      if(toast){try{dialog.show()}catch(_){}scheduleAuto();return}
      try{dialog.showModal();next.focus({preventScroll:true})}catch(_){}
    }
    /* 말풍선 모드: 한 줄씩 저절로 넘어가고, 마지막 줄은 잠시 뒤 닫힌다. 아이가 활동을 누르면 바로 닫힌다. */
    function scheduleAuto(){
      if(!toast)return;clearTimeout(autoTimer);
      autoTimer=setTimeout(function(){if(!dialog.open||showKorean)return scheduleAuto();if(index<lines.length-1){index+=1;render();scheduleAuto()}else close()},index<lines.length-1?4200:6000);
    }
    next.addEventListener('click',nextLine);
    hold.addEventListener('pointerdown',function(e){e.preventDefault();setKorean(true)});
    ['pointerup','pointercancel','lostpointercapture','mouseleave','blur'].forEach(function(name){hold.addEventListener(name,function(){setKorean(false)})});
    hold.addEventListener('keydown',function(e){if((e.key===' '||e.key==='Enter')&&!e.repeat)setKorean(true)});
    hold.addEventListener('keyup',function(){setKorean(false)});
    hold.addEventListener('contextmenu',function(e){e.preventDefault()});
    dialog.addEventListener('cancel',function(e){e.preventDefault()});
    if(replay)replay.addEventListener('click',function(){open(current,true)});
    if(toast){
      var x=dialog.querySelector('.focus-guide-x');if(x)x.addEventListener('click',close);
      document.addEventListener('pointerdown',function(e){if(dialog.open&&!dialog.contains(e.target)&&!(replay&&replay.contains(e.target)))close()},true);
      document.addEventListener('keydown',function(e){if(dialog.open&&!dialog.contains(e.target)&&e.key!=='Tab')close()},true);
    }
    return{visit:function(screen){setTimeout(function(){open(screen,false)},0)},replay:function(){open(current,true)},isOpen:function(){return dialog.open},close:close};
  }
  window.OncuvateFocusGuide={create:create};
}());

