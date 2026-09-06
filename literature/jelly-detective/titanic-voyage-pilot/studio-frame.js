(function(){
  'use strict';
  var root=document.documentElement;
  var ratio=987/521;
  function fitStudioFrame(){
    if(!window.matchMedia('(min-width:901px)').matches){
      ['--studio-frame-width','--studio-frame-height','--studio-frame-left','--studio-frame-top'].forEach(function(name){root.style.removeProperty(name)});
      return;
    }
    var width=Math.min(1480,window.innerWidth,window.innerHeight*ratio);
    var height=width/ratio;
    root.style.setProperty('--studio-frame-width',width.toFixed(2)+'px');
    root.style.setProperty('--studio-frame-height',height.toFixed(2)+'px');
    root.style.setProperty('--studio-frame-left',((window.innerWidth-width)/2).toFixed(2)+'px');
    root.style.setProperty('--studio-frame-top',((window.innerHeight-height)/2).toFixed(2)+'px');
  }
  fitStudioFrame();
  window.addEventListener('resize',fitStudioFrame,{passive:true});
  window.addEventListener('orientationchange',fitStudioFrame,{passive:true});
  window.OncuvateStudioFrame={fit:fitStudioFrame,ratio:'987:521'};
}());
