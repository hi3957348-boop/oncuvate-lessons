(function(){
  'use strict';
  function escapePattern(value){return String(value).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}
  function normalize(item){
    var word=Array.isArray(item)?item[0]:item.word;
    var meaning=Array.isArray(item)?item[1]:item.meaning;
    var example=Array.isArray(item)?item[2]:item.example;
    var forms=Array.isArray(item)?item[3]:item.forms;
    var read=Array.isArray(item)?item[4]:item.read;
    var parts=String(meaning||'').split('·');
    return{word:String(word),meaningKo:(parts[parts.length-1]||meaning||'').trim(),example:String(example||''),forms:Array.isArray(forms)?forms:[String(word)],read:String(read||'')};
  }
  function create(options){
    options=options||{};
    var words=(options.words||[]).map(normalize),onOpen=typeof options.onOpen==='function'?options.onOpen:function(){},onClose=typeof options.onClose==='function'?options.onClose:function(){};
    var openedAt=0,openItem=null,views={};
    var lookup=new Map();
    words.forEach(function(item){item.forms.forEach(function(form){lookup.set(String(form).toLowerCase(),item)})});
    var forms=Array.from(lookup.keys()).sort(function(a,b){return b.length-a.length});
    var matcher=forms.length?new RegExp('\\b('+forms.map(escapePattern).join('|')+')\\b','gi'):null;
    var dialog=document.createElement('dialog');dialog.className='case-vocab-dialog';
    dialog.innerHTML='<div class="case-vocab-shell"><header><small>MY CASE WORD</small><strong></strong></header><p class="case-vocab-read"><small>READ IT · 이렇게 읽어요</small><span></span></p><p class="case-vocab-meaning"></p><div class="case-vocab-example"><small>ENGLISH EXAMPLE</small><p></p></div><button class="case-vocab-close" type="button">BACK TO THE CASE</button></div>';
    document.body.appendChild(dialog);
    var title=dialog.querySelector('strong'),meaning=dialog.querySelector('.case-vocab-meaning'),example=dialog.querySelector('.case-vocab-example p'),readLine=dialog.querySelector('.case-vocab-read'),readText=readLine.querySelector('span');
    function open(item){title.textContent=item.word;readText.textContent=item.read;readLine.hidden=!item.read;meaning.textContent=item.meaningKo;example.textContent=item.example;onOpen(item.word);openItem=item;openedAt=Date.now();views[item.word]=(views[item.word]||0)+1;dialog.showModal()}
    /* 카드를 얼마나 오래 보았나 — 뜻·예문·읽기 줄 글자 수 기준 최소 시간과 견준다(120ms/글자 + 300ms) */
    function report(){if(!openItem||!openedAt)return;var item=openItem,openMs=Date.now()-openedAt;var textLen=(item.meaningKo+item.example+item.read).replace(/\s+/g,'').length,minMs=300+120*textLen;openItem=null;openedAt=0;try{onClose(item.word,{openMs:openMs,visibleTextLen:textLen,expectedMinMs:minMs,tooFast:openMs<minMs,viewNo:views[item.word]||1,hasExample:Boolean(item.example)})}catch(_){}}
    dialog.querySelector('.case-vocab-close').addEventListener('click',function(){dialog.close();report()});
    dialog.addEventListener('cancel',function(e){e.preventDefault();dialog.close();report()});
    dialog.addEventListener('close',report);
    function render(element,text){
      element.replaceChildren();
      var source=String(text||'');
      if(!matcher){element.textContent=source;return}
      matcher.lastIndex=0;var last=0,match;
      while((match=matcher.exec(source))){
        if(match.index>last)element.append(document.createTextNode(source.slice(last,match.index)));
        let item=lookup.get(match[0].toLowerCase());var button=document.createElement('button');
        button.type='button';button.className='case-vocab-word';button.textContent=match[0];button.setAttribute('aria-label',match[0]+' 뜻과 예문 보기');button.addEventListener('click',function(){open(item)});element.append(button);last=matcher.lastIndex;
      }
      if(last<source.length)element.append(document.createTextNode(source.slice(last)));
    }
    return{render:render,open:open};
  }
  window.OncuvateCaseVocab={create:create};
}());
