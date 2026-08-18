(()=>{
  const config=window.WATER_PLAY_PILOT_CONFIG,lesson=window.WATER_PLAY_ENTRY;
  if(!config||!lesson){location.replace('course.html');return}
  const studentTab=document.getElementById('studentTab'),coachTab=document.getElementById('coachTab');
  const studentPanel=document.getElementById('studentPanel'),coachPanel=document.getElementById('coachPanel');
  const studentRoom=document.getElementById('studentRoom'),coachRoom=document.getElementById('coachRoom');
  const status=document.getElementById('entryStatus'),grid=document.getElementById('nicknameGrid');
  let picked=localStorage.getItem(config.nicknameStorageKey)||'',relayReady=false,apiPromise=null;
  function makeRoom(){return String(Math.floor(10000+Math.random()*90000))}
  function childCode(){const key='oncuvate.pilot.water-play.child-code';let value=localStorage.getItem(key)||'';if(!/^[A-Z2-9]{4}$/.test(value)){const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';value=Array.from({length:4},()=>chars[Math.floor(Math.random()*chars.length)]).join('');localStorage.setItem(key,value)}return value}
  function renderNames(){grid.innerHTML=config.nicknames.map(name=>`<button type="button" class="entry-nickname ${picked===name?'on':''}" aria-pressed="${picked===name}" data-name="${name}">${name}</button>`).join('')}
  function showRole(role){const student=role==='student';studentTab.setAttribute('aria-selected',String(student));coachTab.setAttribute('aria-selected',String(!student));studentPanel.hidden=!student;coachPanel.hidden=student;requestAnimationFrame(()=>student?studentRoom.focus():coachRoom.focus())}
  async function api(){return apiPromise||(apiPromise=import('./session04-pilot-firebase.js'))}
  async function checkRelay(){try{await api();relayReady=true;status.className='entry-status ready';status.textContent='실시간 수업방 준비 완료'}catch(_){relayReady=false;status.className='entry-status error';status.textContent='수업방에 연결할 수 없어요. 인터넷 연결을 확인해 주세요.'}}
  function normalize(input){input.value=input.value.replace(/\D/g,'').slice(0,5)}
  grid.addEventListener('click',event=>{const button=event.target.closest('[data-name]');if(!button)return;picked=button.dataset.name;renderNames()});
  studentTab.addEventListener('click',()=>showRole('student'));coachTab.addEventListener('click',()=>showRole('coach'));
  studentRoom.addEventListener('input',()=>normalize(studentRoom));studentRoom.addEventListener('keydown',event=>{if(event.key==='Enter')document.getElementById('joinStudent').click()});
  coachRoom.addEventListener('input',()=>normalize(coachRoom));coachRoom.addEventListener('keydown',event=>{if(event.key==='Enter')document.getElementById('joinCoach').click()});
  document.getElementById('newRoom').addEventListener('click',()=>{coachRoom.value=makeRoom();status.className='entry-status';status.textContent='무작위 코드를 넣었어요. 그대로 쓰거나 바꿀 수 있어요.';coachRoom.focus();coachRoom.select()});
  document.getElementById('joinCoach').addEventListener('click',async()=>{normalize(coachRoom);const room=coachRoom.value.trim();if(!/^\d{5}$/.test(room)){status.className='entry-status error';status.textContent='사용할 룸코드 다섯 자리를 적어 주세요.';coachRoom.focus();return}if(!relayReady)return checkRelay();status.textContent='수업방을 여는 중…';try{await (await api()).createRoom(room,lesson.key);location.href=`${lesson.file}?pilotRole=coach&room=${room}`}catch(_){status.className='entry-status error';status.textContent='이미 사용 중인 코드예요. 다른 코드를 적어 주세요.';coachRoom.focus();coachRoom.select()}});
  document.getElementById('joinStudent').addEventListener('click',async()=>{normalize(studentRoom);const room=studentRoom.value,child=childCode();if(!config.nicknames.includes(picked)){status.className='entry-status error';status.textContent='별명을 먼저 골라 주세요.';return}if(!/^\d{5}$/.test(room)){status.className='entry-status error';status.textContent='룸코드 다섯 자리를 입력해 주세요.';studentRoom.focus();return}if(!relayReady)return checkRelay();status.textContent='수업방과 별명을 확인하는 중…';try{const live=await api(),exists=await live.roomExists(room,lesson.key);if(!exists.ok){status.className='entry-status error';status.textContent='이 회차에 열려 있지 않은 방이에요. 코치에게 번호를 확인해 주세요.';return}await live.reserveNickname(room,picked,child,lesson.key);localStorage.setItem(config.nicknameStorageKey,picked);location.href=`${lesson.file}?pilotRole=child&room=${room}&child=${child}`}catch(error){status.className='entry-status error';status.textContent=error?.message==='nickname-taken'?'이 별명은 이미 사용 중이에요. 다른 별명을 골라 주세요.':'수업방에 들어가지 못했어요. 잠시 후 다시 시도해 주세요.'}});
  const initialError=new URLSearchParams(location.search).get('error');
  renderNames();checkRelay().then(()=>{if(initialError==='room'){status.className='entry-status error';status.textContent='이 회차의 수업방이 없거나 시간이 끝났어요. 코치가 새 방을 만들어 주세요.'}});
})();