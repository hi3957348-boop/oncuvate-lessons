(()=>{
  const runtime=window.ONCUVATE||{};
  if(!runtime.room||(runtime.role!=="coach"&&runtime.role!=="child"))return;
  const coach=runtime.role==="coach";
  const NS="http://www.w3.org/2000/svg";
  const svg=document.createElementNS(NS,"svg");
  svg.classList.add("screen-ink-layer");svg.setAttribute("viewBox","0 0 1000 1000");svg.setAttribute("preserveAspectRatio","none");svg.setAttribute("aria-hidden","true");
  document.body.append(svg);
  const note=document.createElement("div");note.className="screen-ink-viewer-note";note.textContent="코치 판서가 화면에 표시됩니다.";note.hidden=coach;document.body.append(note);

  let mode="off",color="#E56F71",width=6,opacity=1,drawing=false,current=null,bound=false,allPages={};
  const pageKey=()=>`p${Number(document.body.dataset.lessonPage||0)+1}`;
  const strokes=()=>Array.isArray(allPages[pageKey()]?.strokes)?allPages[pageKey()].strokes:[];
  const clamp=v=>Math.max(0,Math.min(1,v));
  const point=e=>({x:clamp(e.clientX/innerWidth),y:clamp(e.clientY/innerHeight)});
  const dFor=points=>points.map((p,i)=>`${i?"L":"M"} ${(p.x*1000).toFixed(1)} ${(p.y*1000).toFixed(1)}`).join(" ");
  function drawPath(stroke){const path=document.createElementNS(NS,"path");path.dataset.strokeId=stroke.id;path.setAttribute("d",dFor(stroke.points||[]));path.setAttribute("stroke",stroke.color||"#E56F71");path.setAttribute("stroke-width",String(stroke.width||6));path.setAttribute("opacity",String(stroke.opacity??1));if(coach)path.addEventListener("click",()=>{if(mode!=="eraser")return;removeStroke(stroke.id)});svg.append(path)}
  function render(){svg.replaceChildren();strokes().forEach(drawPath);note.hidden=coach||!strokes().length}
  function publish(next){if(!bound||!window._set)return;allPages[pageKey()]={strokes:next,updatedAt:Date.now()};render();window._set(window.pth(`annotations/${pageKey()}`),allPages[pageKey()])?.catch?.(()=>{})}
  function removeStroke(id){publish(strokes().filter(item=>item.id!==id))}
  function start(e){if(!coach||mode!=="pen"||e.button>0||e.target.closest?.(".screen-ink-toolbar"))return;drawing=true;svg.setPointerCapture?.(e.pointerId);current={id:`s${Date.now()}${Math.random().toString(36).slice(2,6)}`,color,width,opacity,points:[point(e)]};drawPath(current);e.preventDefault()}
  function move(e){if(!drawing||!current)return;const next=point(e),last=current.points[current.points.length-1];if(Math.hypot(next.x-last.x,next.y-last.y)<.002)return;current.points.push(next);const path=svg.querySelector(`[data-stroke-id="${current.id}"]`);if(path)path.setAttribute("d",dFor(current.points));e.preventDefault()}
  function end(e){if(!drawing||!current)return;drawing=false;if(current.points.length>1)publish([...strokes(),current]);else render();current=null;svg.releasePointerCapture?.(e.pointerId)}
  svg.addEventListener("pointerdown",start);svg.addEventListener("pointermove",move);svg.addEventListener("pointerup",end);svg.addEventListener("pointercancel",end);

  let status;
  function setMode(next){mode=next;svg.classList.toggle("drawing",mode==="pen");svg.classList.toggle("erasing",mode==="eraser");document.querySelectorAll("[data-ink-mode]").forEach(b=>b.classList.toggle("on",b.dataset.inkMode===mode));if(status)status.textContent=mode==="pen"?"화면에 바로 그릴 수 있어요.":mode==="eraser"?"지울 선을 눌러 주세요.":"판서 보기만 하는 중"}
  if(coach){
    const bar=document.createElement("div");bar.className="screen-ink-toolbar";bar.setAttribute("aria-label","화면 판서 도구");
    bar.innerHTML='<button type="button" data-ink-mode="pen">판서</button><button class="ink-color" type="button" data-color="#E56F71" style="--ink-color:#E56F71" aria-label="빨간색"></button><button class="ink-color" type="button" data-color="#4B24A5" style="--ink-color:#4B24A5" aria-label="보라색"></button><button class="ink-color" type="button" data-color="#2785C7" style="--ink-color:#2785C7" aria-label="파란색"></button><button type="button" data-highlighter>형광펜</button><button type="button" data-ink-mode="eraser">지우개</button><button type="button" data-undo>되돌리기</button><button type="button" data-clear>현재 쪽 지우기</button><button type="button" data-ink-mode="off">판서 종료</button><span class="screen-ink-status">판서 보기만 하는 중</span>';
    document.body.append(bar);status=bar.querySelector(".screen-ink-status");
    bar.addEventListener("click",event=>{const button=event.target.closest("button");if(!button)return;if(button.dataset.inkMode)setMode(button.dataset.inkMode);else if(button.dataset.color){color=button.dataset.color;width=6;opacity=1;setMode("pen")}else if(button.hasAttribute("data-highlighter")){color="#E1B72C";width=22;opacity=.32;setMode("pen")}else if(button.hasAttribute("data-undo")){publish(strokes().slice(0,-1))}else if(button.hasAttribute("data-clear")){if(confirm("현재 페이지의 판서를 모두 지울까요?"))publish([])}});
  }

  function bind(){if(bound||window._firebaseReady!==true||typeof window.pth!=="function"||typeof window._onValue!=="function")return false;bound=true;window._onValue(window.pth("annotations"),snapshot=>{allPages=typeof snapshot?.val==="function"?(snapshot.val()||{}):(snapshot||{});render()});return true}
  window.addEventListener("oncuvate:pilot-realtime-ready",bind);
  const timer=setInterval(()=>{if(bind())clearInterval(timer)},250);setTimeout(()=>clearInterval(timer),20000);
  new MutationObserver(render).observe(document.body,{attributes:true,attributeFilter:["data-lesson-page"]});
  render();
})();
