'use strict';

/* ============================================================================
 * 업무정리 — 렌더러 로직
 * Electron(window.owp) 이 있으면 파일에 저장, 없으면 브라우저 localStorage 로 폴백
 * ==========================================================================*/

const hasElectron = typeof window !== 'undefined' && !!window.owp;

// ---- 저장소 추상화 ----------------------------------------------------------
const Store = {
  async load() {
    if (hasElectron) return await window.owp.load();
    try { return JSON.parse(localStorage.getItem('owp:workspace') || 'null'); }
    catch (_) { return null; }
  },
  async save(data) {
    if (hasElectron) return await window.owp.save(data);
    localStorage.setItem('owp:workspace', JSON.stringify(data));
    return { ok: true, path: 'localStorage (브라우저 미리보기)' };
  },
  async paths() {
    if (hasElectron) return await window.owp.paths();
    return { dataDir: '브라우저 미리보기 (localStorage)', packaged: false };
  },
  async export(data) {
    if (hasElectron) return await window.owp.export(data);
    // 브라우저: 파일 다운로드
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (data?.meta?.title || 'workspace') + '.owp';
    a.click();
    return { ok: true, path: a.download };
  },
  async import() {
    if (hasElectron) return await window.owp.import();
    return new Promise((resolve) => {
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = '.owp,.json';
      inp.onchange = () => {
        const f = inp.files[0]; if (!f) return resolve({ canceled: true });
        const rd = new FileReader();
        rd.onload = () => { try { resolve({ ok: true, data: JSON.parse(rd.result), path: f.name }); } catch (e) { resolve({ error: e.message }); } };
        rd.readAsText(f);
      };
      inp.click();
    });
  },
  async addAttachment() {
    if (hasElectron) return await window.owp.addAttachment();
    // 브라우저: 실제 복사 없이 메타만
    return new Promise((resolve) => {
      const inp = document.createElement('input');
      inp.type = 'file'; inp.multiple = true;
      inp.onchange = () => {
        const list = [...inp.files].map((f, i) => ({
          id: genId('at'), name: f.name, size: f.size, storedPath: '(브라우저 미리보기)',
        }));
        resolve(list.length ? { ok: true, attachments: list } : { canceled: true });
      };
      inp.click();
    });
  },
  openAttachment(p) { if (hasElectron) window.owp.openAttachment(p); },
};

// ---- 유틸 -------------------------------------------------------------------
function genId(prefix) { return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function today() { return new Date().toISOString().slice(0, 10); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function fmtSize(n) {
  if (n == null) return '';
  if (n < 1024) return n + ' B';
  if (n < 1048576) return (n / 1024).toFixed(0) + ' KB';
  return (n / 1048576).toFixed(1) + ' MB';
}
function extClass(name) {
  const e = (name.split('.').pop() || '').toLowerCase();
  if (e === 'pdf') return ['pdf', 'PDF'];
  if (['doc', 'docx'].includes(e)) return ['doc', 'DOC'];
  if (['xls', 'xlsx', 'csv'].includes(e)) return ['xls', 'XLS'];
  if (e === 'hwp' || e === 'hwpx') return ['hwp', 'HWP'];
  if (['png', 'jpg', 'jpeg', 'gif', 'bmp'].includes(e)) return ['img', 'IMG'];
  return ['etc', e ? e.slice(0, 3).toUpperCase() : 'FILE'];
}

// 본문 인라인 참조 토큰:  〔ref:<pageId>|<label>〕
const REF_TOKEN = /〔ref:([^|〕]+)\|([^〕]*)〕/g;

// ---- 상태 -------------------------------------------------------------------
let db = null;
let sel = { pageId: null }; // 현재 선택 페이지
const collapsed = new Set(); // 접힌 노드 id
let saveTimer = null;

// ---- 초기 샘플 데이터 --------------------------------------------------------
function sampleData() {
  const pgYeoncha = 'pg_yeoncha', pgByeonga = 'pg_byeonga', pgFlex = 'pg_flex';
  const pgRule31 = 'pg_rule31', pgSalary = 'pg_salary', pgBudget = 'pg_budget';
  return {
    format: 'owp', schemaVersion: 1,
    meta: { title: '인사규정', updatedAt: today(), app: '0.1.0' },
    notebooks: [
      {
        id: 'nb_hr', name: '인사·노무', color: '#3b5ba9',
        sections: [
          {
            id: 'sec_hr', name: '인사규정', color: '#c0392b',
            subtopics: [
              {
                id: 'sub_att', name: '근태·휴가',
                pages: [
                  {
                    id: pgYeoncha, title: '연차유급휴가 산정기준',
                    basis: '근로기준법 제60조', status: '현행', owner: '총무팀 김OO',
                    body: '연차유급휴가는 근로기준법 제60조에 따라 산정하며, 1년간 80% 이상 출근한 근로자에게 15일을 부여한다.\n\n제12조(연차휴가의 산정) ① 사용자는 1년간 8할 이상 출근한 근로자에게 15일의 유급휴가를 준다. 〔ref:' + pgRule31 + '|취업규칙 제31조〕\n\n가산휴가의 총 한도는 25일로 한다. 회계연도 기준 산정 시 입사 첫해는 〔ref:' + pgSalary + '|급여·보수규정 부칙3〕의 비례산정 방식을 함께 적용한다.',
                    currentVersion: 4,
                    history: [
                      { version: 4, date: '2026-07-01', author: '김OO', kind: '개정', summary: '가산휴가 한도 20일 → 25일 상향. 개정 근로기준법 반영.' },
                      { version: 3, date: '2025-01-15', author: '이OO', kind: '개정', summary: '회계연도 기준 비례산정 조항(제12조④) 신설.' },
                      { version: 2, date: '2023-04-01', author: '이OO', kind: '개정', summary: '1개월 개근 시 1일 부여 조항 문구 정비. 대법원 판례 반영.' },
                      { version: 1, date: '2021-07-01', author: '총무팀', kind: '제정', summary: '최초 제정.' },
                    ],
                    attachments: [
                      { id: 'at_s1', name: '개정법률_20260701.pdf', size: 2516582, storedPath: '(샘플)', linkedVersion: 4 },
                      { id: 'at_s2', name: '연차산정_예시표.hwp', size: 151552, storedPath: '(샘플)' },
                    ],
                    refs: [
                      { dir: 'out', targetId: pgRule31, label: '취업규칙 제31조 휴가 총칙' },
                      { dir: 'out', targetId: pgSalary, label: '급여·보수규정 부칙3 비례산정' },
                      { dir: 'in', sourceId: pgFlex, label: '유연근무·재택 운영 · 휴가 연동' },
                      { dir: 'in', sourceId: pgBudget, label: '예산편성지침 · 연차수당 반영' },
                    ],
                  },
                  {
                    id: pgByeonga, title: '병가 및 공가 처리', basis: '취업규칙 제33조', status: '현행', owner: '총무팀',
                    body: '병가는 업무 외 상병으로 인한 결근 시 적용한다. 연간 60일 한도.', currentVersion: 2,
                    history: [
                      { version: 2, date: '2026-05-12', author: '김OO', kind: '개정', summary: '진단서 제출 기준 명확화.' },
                      { version: 1, date: '2022-01-03', author: '총무팀', kind: '제정', summary: '최초 제정.' },
                    ],
                    attachments: [], refs: [],
                  },
                  {
                    id: pgFlex, title: '유연근무·재택 운영', basis: '취업규칙 제8조', status: '현행', owner: '총무팀',
                    body: '재택근무일에 연차를 사용하는 경우 〔ref:' + pgYeoncha + '|연차유급휴가 산정기준〕을 준용하여 1일로 차감한다.',
                    currentVersion: 3,
                    history: [{ version: 3, date: '2025-11-20', author: '박OO', kind: '개정', summary: '재택 휴가 연동 규정 신설.' }],
                    attachments: [], refs: [{ dir: 'out', targetId: pgYeoncha, label: '연차유급휴가 산정기준' }],
                  },
                ],
              },
              { id: 'sub_pay', name: '급여·보수', pages: [
                { id: pgSalary, title: '급여·보수규정 부칙3(비례산정)', basis: '급여규정 부칙', status: '현행', owner: '재무팀',
                  body: '회계연도 기준 적용 시 입사 첫해의 연차는 재직일수 ÷ 365 × 15일로 비례산정하며, 소수점 이하는 올림한다.',
                  currentVersion: 3, history: [{ version: 3, date: '2025-01-15', author: '재무팀', kind: '개정', summary: '비례산정식 명문화.' }],
                  attachments: [], refs: [{ dir: 'in', sourceId: pgYeoncha, label: '연차유급휴가 산정기준' }] },
              ] },
            ],
          },
          { id: 'sec_rule', name: '취업규칙', color: '#0f7a74', subtopics: [
            { id: 'sub_gen', name: '총칙', pages: [
              { id: pgRule31, title: '제31조 휴가의 통칙', basis: '취업규칙 제31조', status: '현행', owner: '총무팀',
                body: '직원의 휴가는 연차·병가·공가·특별휴가로 구분하며, 각 휴가의 산정·부여는 인사규정 및 관계 법령이 정하는 바에 따른다. 반차는 0.5일로 계산한다.',
                currentVersion: 2, history: [{ version: 2, date: '2024-03-01', author: '총무팀', kind: '개정', summary: '반차 규정 추가.' }],
                attachments: [], refs: [{ dir: 'in', sourceId: pgYeoncha, label: '연차유급휴가 산정기준' }] },
            ] },
          ] },
        ],
      },
      {
        id: 'nb_fin', name: '재무·회계', color: '#2f7d42',
        sections: [{ id: 'sec_bud', name: '예산편성지침', color: '#2f7d42', subtopics: [
          { id: 'sub_bud', name: '인건비', pages: [
            { id: pgBudget, title: '제14조 연차수당 예산 반영', basis: '예산편성지침 제14조', status: '현행', owner: '재무팀',
              body: '미사용 연차수당은 가산휴가 한도(25일)를 기준으로 익년도 인건비 예산에 반영한다.',
              currentVersion: 1, history: [{ version: 1, date: '2024-09-01', author: '재무팀', kind: '제정', summary: '최초 제정.' }],
              attachments: [], refs: [{ dir: 'out', targetId: pgYeoncha, label: '연차유급휴가 산정기준' }] },
          ] },
        ] }],
      },
    ],
  };
}

// ---- 페이지 탐색 헬퍼 --------------------------------------------------------
function* allPages() {
  for (const nb of db.notebooks) for (const sec of nb.sections) for (const sub of sec.subtopics)
    for (const pg of sub.pages) yield { nb, sec, sub, pg };
}
function findPage(pageId) { for (const p of allPages()) if (p.pg.id === pageId) return p; return null; }
function firstPageId() { for (const p of allPages()) return p.pg.id; return null; }

// ---- 저장 (디바운스) ---------------------------------------------------------
function scheduleSave() {
  setStatus('saving');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    db.meta.updatedAt = today();
    const r = await Store.save(db);
    setStatus('saved', r && r.path);
  }, 400);
}

// ============================================================================
// 렌더링
// ============================================================================
const $ = (id) => document.getElementById(id);

function render() { renderTree(); renderPageList(); renderEditor(); }

function renderTree() {
  const el = $('tree'); el.innerHTML = '';
  for (const nb of db.notebooks) {
    const nbEl = document.createElement('div');
    const nbCollapsed = collapsed.has(nb.id);
    nbEl.className = 'nb' + (nbCollapsed ? ' collapsed' : '');
    nbEl.innerHTML =
      `<div class="nb-top">
         <span class="chev" data-toggle="${nb.id}">${nbCollapsed ? '▸' : '▾'}</span>
         <span class="dot" style="background:${esc(nb.color)}"></span>
         <span class="nm" data-rename="nb" data-id="${nb.id}">${esc(nb.name)}</span>
         <span class="row-tools">
           <button class="tool" data-add-sec="${nb.id}" title="규정(섹션) 추가">＋</button>
           <button class="tool del" data-del="nb" data-id="${nb.id}" title="삭제">🗑</button>
         </span>
       </div>`;
    for (const sec of nb.sections) {
      const secDiv = document.createElement('div');
      secDiv.innerHTML =
        `<div class="sec" data-sec="${sec.id}">
           <span class="bar" style="background:${esc(sec.color || nb.color)}"></span>
           <span class="nm" data-rename="sec" data-id="${sec.id}">${esc(sec.name)}</span>
           <span class="row-tools">
             <button class="tool" data-add-sub="${sec.id}" title="하위주제 추가">＋</button>
             <button class="tool del" data-del="sec" data-id="${sec.id}" title="삭제">🗑</button>
           </span>
         </div>`;
      for (const sub of sec.subtopics) {
        const active = sel.pageId && findPage(sel.pageId) && findPage(sel.pageId).sub.id === sub.id;
        const subDiv = document.createElement('div');
        subDiv.className = 'sub' + (active ? ' on' : '');
        subDiv.dataset.sub = sub.id;
        subDiv.innerHTML =
          `<span class="chev">•</span>
           <span class="nm" data-rename="sub" data-id="${sub.id}">${esc(sub.name)} <span style="opacity:.5">(${sub.pages.length})</span></span>
           <span class="row-tools">
             <button class="tool" data-add-page="${sub.id}" title="페이지 추가">＋</button>
             <button class="tool del" data-del="sub" data-id="${sub.id}" title="삭제">🗑</button>
           </span>`;
        secDiv.appendChild(subDiv);
      }
      nbEl.appendChild(secDiv);
    }
    el.appendChild(nbEl);
  }
}

function currentSub() {
  const p = sel.pageId && findPage(sel.pageId);
  if (p) return p.sub;
  // 선택 없으면 첫 하위주제
  for (const nb of db.notebooks) for (const sec of nb.sections) for (const sub of sec.subtopics) return sub;
  return null;
}

function renderPageList() {
  const el = $('pageList'); el.innerHTML = '';
  const sub = currentSub();
  const q = ($('searchInput').value || '').trim().toLowerCase();
  $('pageListLabel').textContent = sub ? sub.name : '페이지';

  let pages = [];
  if (q) { // 검색: 전체에서
    for (const p of allPages())
      if ((p.pg.title + ' ' + (p.pg.body || '') + ' ' + (p.pg.basis || '')).toLowerCase().includes(q))
        pages.push(p.pg);
    $('pageListLabel').textContent = `검색 "${q}"`;
  } else if (sub) {
    pages = sub.pages;
  }

  if (!pages.length) {
    el.innerHTML = `<div class="empty">${q ? '검색 결과가 없습니다.' : '페이지가 없습니다.<br>＋ 로 새 페이지를 추가하세요.'}</div>`;
    return;
  }
  for (const pg of pages) {
    const div = document.createElement('div');
    div.className = 'page' + (pg.id === sel.pageId ? ' on' : '');
    div.dataset.page = pg.id;
    const lastDate = pg.history && pg.history[0] ? pg.history[0].date : '';
    div.innerHTML =
      `<div class="t">${esc(pg.title)}</div>
       <div class="m">
         <span class="mini h">개정 v${pg.currentVersion || 1}</span>
         ${pg.attachments && pg.attachments.length ? `<span class="mini a">첨부 ${pg.attachments.length}</span>` : ''}
         <span>${esc(lastDate)}</span>
       </div>`;
    el.appendChild(div);
  }
}

function bodyToHtml(text) {
  // 참조 토큰 → 호버 링크, 나머지는 escape + 줄바꿈
  let out = ''; let last = 0; const s = text || '';
  REF_TOKEN.lastIndex = 0; let m;
  while ((m = REF_TOKEN.exec(s))) {
    out += esc(s.slice(last, m.index));
    out += `<a class="reflink" data-reftarget="${esc(m[1])}" data-dir="out">${esc(m[2] || '참조')}</a>`;
    last = m.index + m[0].length;
  }
  out += esc(s.slice(last));
  return out.replace(/\n/g, '<br>');
}

function renderEditor() {
  const doc = $('doc'); const crumb = $('crumb');
  const found = sel.pageId && findPage(sel.pageId);
  if (!found) {
    crumb.innerHTML = '';
    doc.innerHTML = `<div class="empty" style="margin-top:80px">왼쪽에서 페이지를 선택하거나<br>＋ 로 새 페이지를 만드세요.</div>`;
    updateStatBar(null); return;
  }
  const { nb, sec, sub, pg } = found;
  crumb.innerHTML = `${esc(nb.name)} <span>›</span> <b>${esc(sec.name)}</b> <span>›</span> ${esc(sub.name)} <span>›</span> <b>${esc(pg.title)}</b>`;

  const histHtml = (pg.history || []).map((h, i) =>
    `<div class="tl ${i === 0 ? '' : 'old'}">
       <div class="tl-head">
         <span class="tl-ver">v${h.version}${i === 0 ? ' · 현행' : ''}</span>
         <span class="tl-date">${esc(h.date)} ${esc(h.kind || '')}</span>
         <span class="tl-who">${esc(h.author || '')}</span>
       </div>
       <div class="tl-body">${esc(h.summary || '')}</div>
     </div>`).join('');

  const filesHtml = (pg.attachments || []).map(a => {
    const [cls, lbl] = extClass(a.name);
    return `<div class="file">
        <div class="ext ${cls}">${lbl}</div>
        <div class="fmeta"><div class="fn">${esc(a.name)}</div>
          <div class="fs">${fmtSize(a.size)}${a.linkedVersion ? ` · v${a.linkedVersion} 연결` : ''}</div></div>
        <button class="del" data-del-attach="${a.id}" title="제거">✕</button>
      </div>`;
  }).join('') || `<div class="prose-note">첨부된 문서가 없습니다. 상단 「📎 문서 첨부」로 추가하세요.</div>`;

  const refsHtml = (pg.refs || []).map((r, idx) => {
    const dir = r.dir === 'in' ? '← 참조됨' : '참조함 →';
    const tid = r.dir === 'in' ? r.sourceId : r.targetId;
    return `<div class="ref-row">
        <span class="dir">${dir}</span>
        <span class="rt reflink" data-reftarget="${esc(tid)}" data-dir="${esc(r.dir)}" style="border:none;cursor:help">${esc(r.label)}</span>
        <button class="del" data-del-ref="${idx}" title="참조 삭제">✕</button>
      </div>`;
  }).join('') || `<div class="prose-note">연결된 참조가 없습니다. 상단 「🔗 참조 연결」로 다른 규정과 연결하세요.</div>`;

  doc.innerHTML = `
    <div class="title-row">
      <input class="pt" id="fTitle" value="${esc(pg.title)}" />
      <button class="status-pill" id="fStatus" style="background:${pg.status === '폐지' ? 'var(--danger)' : pg.status === '개정예정' ? 'var(--hist)' : 'var(--good)'}">${esc(pg.status || '현행')}</button>
    </div>
    <div class="meta-line">
      <label>근거법령 <input id="fBasis" value="${esc(pg.basis || '')}" placeholder="예: 근로기준법 제60조" /></label>
      <span>현재버전 <b>v${pg.currentVersion || 1}</b></span>
      <span>최종개정 <b>${esc(pg.history && pg.history[0] ? pg.history[0].date : '-')}</b></span>
      <label>담당 <input id="fOwner" value="${esc(pg.owner || '')}" placeholder="담당자" /></label>
    </div>

    <div class="section-label" style="color:var(--accent)"><span class="pip" style="background:var(--accent)"></span> 본문 <span class="rule"></span>
      <button class="add-inline" id="btnInsertRef" style="color:var(--ref);border-color:var(--ref)">＋ 본문에 참조 삽입</button></div>
    <div id="bodyView" class="body-edit" style="cursor:text" title="클릭하여 편집">${bodyToHtml(pg.body) || '<span style="color:var(--ink-faint)">본문을 입력하려면 클릭하세요…</span>'}</div>
    <textarea id="bodyEdit" class="body-edit" hidden></textarea>

    <div class="section-label hist"><span class="pip"></span> 변경 히스토리 <span class="rule"></span>
      <button class="add-inline" id="btnAddHist">＋ 개정 기록</button></div>
    <div class="timeline">${histHtml || '<div class="prose-note">기록이 없습니다.</div>'}</div>

    <div class="section-label attach"><span class="pip"></span> 첨부 문서 <span class="rule"></span></div>
    <div class="files">${filesHtml}</div>

    <div class="section-label ref"><span class="pip"></span> 관련 주제 · 상호 참조 <span class="rule"></span></div>
    <div class="refs">${refsHtml}</div>
  `;

  wireEditor(pg);
  updateStatBar(pg);
}

function updateStatBar(pg) {
  $('statVer').textContent = pg ? `버전 v${pg.currentVersion || 1} · 히스토리 ${(pg.history || []).length}건` : '';
  $('statRef').textContent = pg ? `참조 ${(pg.refs || []).length} · 첨부 ${(pg.attachments || []).length}` : '';
}

// ============================================================================
// 편집기 이벤트 연결
// ============================================================================
function wireEditor(pg) {
  $('fTitle').oninput = (e) => { pg.title = e.target.value; renderTree(); renderPageList(); crumbQuick(); scheduleSave(); };
  $('fBasis').oninput = (e) => { pg.basis = e.target.value; scheduleSave(); };
  $('fOwner').oninput = (e) => { pg.owner = e.target.value; scheduleSave(); };
  $('fStatus').onclick = () => cycleStatus(pg);

  // 본문: 보기 ↔ 편집 토글
  const view = $('bodyView'), edit = $('bodyEdit');
  view.onclick = () => {
    edit.value = pg.body || '';
    view.hidden = true; edit.hidden = false; edit.focus();
  };
  edit.onblur = () => {
    pg.body = edit.value;
    edit.hidden = true; view.hidden = false;
    view.innerHTML = bodyToHtml(pg.body) || '<span style="color:var(--ink-faint)">본문을 입력하려면 클릭하세요…</span>';
    scheduleSave();
  };

  $('btnAddHist').onclick = () => addHistory(pg);
  $('btnInsertRef').onclick = () => insertRefIntoBody(pg);

  $('doc').querySelectorAll('[data-del-attach]').forEach(b => b.onclick = () => {
    pg.attachments = pg.attachments.filter(a => a.id !== b.dataset.delAttach); renderEditor(); scheduleSave();
  });
  $('doc').querySelectorAll('[data-del-ref]').forEach(b => b.onclick = () => {
    pg.refs.splice(Number(b.dataset.delRef), 1); renderEditor(); scheduleSave();
  });
}

function crumbQuick() {
  const f = findPage(sel.pageId); if (!f) return;
  $('crumb').innerHTML = `${esc(f.nb.name)} <span>›</span> <b>${esc(f.sec.name)}</b> <span>›</span> ${esc(f.sub.name)} <span>›</span> <b>${esc(f.pg.title)}</b>`;
}

function cycleStatus(pg) {
  const order = ['현행', '개정예정', '폐지'];
  pg.status = order[(order.indexOf(pg.status || '현행') + 1) % order.length];
  renderEditor(); scheduleSave();
}

// ============================================================================
// CRUD 동작
// ============================================================================
async function addNotebook() {
  const name = await prompt2('새 노트북', '노트북 이름', '');
  if (!name) return;
  const colors = ['#3b5ba9', '#7a4fb5', '#2f7d42', '#c0392b', '#0f7a74', '#e08b00'];
  db.notebooks.push({ id: genId('nb'), name, color: colors[db.notebooks.length % colors.length], sections: [] });
  render(); scheduleSave();
}
function addSection(nbId) {
  const nb = db.notebooks.find(n => n.id === nbId);
  prompt2('새 규정(섹션)', '규정 이름', '').then(name => {
    if (!name) return;
    nb.sections.push({ id: genId('sec'), name, color: nb.color, subtopics: [] });
    render(); scheduleSave();
  });
}
function addSubtopic(secId) {
  const sec = findSection(secId);
  prompt2('새 하위주제', '하위주제 이름', '').then(name => {
    if (!name) return;
    sec.subtopics.push({ id: genId('sub'), name, pages: [] });
    render(); scheduleSave();
  });
}
function addPage(subId) {
  const sub = findSub(subId);
  prompt2('새 페이지', '페이지(조문) 제목', '').then(title => {
    if (!title) return;
    const pg = { id: genId('pg'), title, basis: '', status: '현행', owner: '', body: '', currentVersion: 1,
      history: [{ version: 1, date: today(), author: '', kind: '제정', summary: '최초 작성.' }], attachments: [], refs: [] };
    sub.pages.push(pg); sel.pageId = pg.id; render(); scheduleSave();
  });
}

function findSection(id) { for (const nb of db.notebooks) { const s = nb.sections.find(x => x.id === id); if (s) return s; } return null; }
function findSub(id) { for (const nb of db.notebooks) for (const sec of nb.sections) { const s = sec.subtopics.find(x => x.id === id); if (s) return s; } return null; }

function renameNode(kind, id) {
  let node;
  if (kind === 'nb') node = db.notebooks.find(n => n.id === id);
  else if (kind === 'sec') node = findSection(id);
  else node = findSub(id);
  if (!node) return;
  prompt2('이름 변경', '새 이름', node.name).then(v => { if (v) { node.name = v; render(); scheduleSave(); } });
}

async function delNode(kind, id) {
  const ok = await confirm2('삭제하시겠습니까? 하위 내용도 함께 삭제됩니다.');
  if (!ok) return;
  if (kind === 'nb') db.notebooks = db.notebooks.filter(n => n.id !== id);
  else if (kind === 'sec') for (const nb of db.notebooks) nb.sections = nb.sections.filter(s => s.id !== id);
  else for (const nb of db.notebooks) for (const sec of nb.sections) sec.subtopics = sec.subtopics.filter(s => s.id !== id);
  if (sel.pageId && !findPage(sel.pageId)) sel.pageId = firstPageId();
  render(); scheduleSave();
}

// 개정 이력 추가 → 버전 +1
async function addHistory(pg) {
  const summary = await prompt2(`개정 기록 (v${(pg.currentVersion || 1) + 1})`, '개정 내용 요약', '');
  if (!summary) return;
  const author = await prompt2('담당자', '개정 담당자', pg.owner || '');
  pg.currentVersion = (pg.currentVersion || 1) + 1;
  pg.history.unshift({ version: pg.currentVersion, date: today(), author: author || '', kind: '개정', summary });
  renderEditor(); renderPageList(); scheduleSave();
}

// 본문에 참조 삽입 + refs 등록
async function insertRefIntoBody(pg) {
  const target = await pickPage('본문에 삽입할 참조 대상을 선택하세요', pg.id);
  if (!target) return;
  const label = await prompt2('표시 텍스트', '본문에 보일 링크 텍스트', target.pg.title);
  if (label == null) return;
  const token = `〔ref:${target.pg.id}|${label || target.pg.title}〕`;
  const edit = $('bodyEdit');
  if (!edit.hidden) { // 편집 중이면 커서 위치에 삽입
    const s = edit.selectionStart || edit.value.length;
    edit.value = edit.value.slice(0, s) + token + edit.value.slice(s);
    pg.body = edit.value;
  } else {
    pg.body = (pg.body || '') + (pg.body ? '\n' : '') + token;
  }
  addRefPair(pg, target.pg, label || target.pg.title);
  renderEditor(); scheduleSave();
}

// 참조 연결(툴바) — 본문 삽입 없이 관계만
async function addRefStandalone() {
  const f = sel.pageId && findPage(sel.pageId); if (!f) { toast('먼저 페이지를 선택하세요.'); return; }
  const target = await pickPage('연결할 참조 대상을 선택하세요', f.pg.id);
  if (!target) return;
  addRefPair(f.pg, target.pg, target.pg.title);
  renderEditor(); scheduleSave();
}

// 양방향 참조 등록 (out 쪽 + 상대편 in 쪽)
function addRefPair(fromPg, toPg, label) {
  fromPg.refs = fromPg.refs || [];
  if (!fromPg.refs.some(r => r.dir === 'out' && r.targetId === toPg.id))
    fromPg.refs.push({ dir: 'out', targetId: toPg.id, label });
  toPg.refs = toPg.refs || [];
  if (!toPg.refs.some(r => r.dir === 'in' && r.sourceId === fromPg.id))
    toPg.refs.push({ dir: 'in', sourceId: fromPg.id, label: fromPg.title });
}

// ============================================================================
// 참조 호버 미리보기
// ============================================================================
function setupRefHover() {
  const pop = $('refPop');
  let hideTimer = null;
  document.addEventListener('mouseover', (e) => {
    const t = e.target.closest('[data-reftarget]');
    if (!t) return;
    clearTimeout(hideTimer);
    const f = findPage(t.dataset.reftarget);
    if (!f) { pop.hidden = true; return; }
    const dir = t.dataset.dir === 'in' ? '역참조' : '참조';
    const excerpt = (f.pg.body || '').replace(REF_TOKEN, '$2').replace(/\n+/g, ' ').slice(0, 150);
    pop.innerHTML =
      `<div class="refcard-top">
         <span class="rc-badge">${dir}</span>
         <span class="rc-path">${esc(f.sec.name)} › ${esc(f.sub.name)}</span>
         <span class="rc-ver">v${f.pg.currentVersion || 1}</span>
       </div>
       <div class="refcard-body">
         <div class="rc-title">${esc(f.pg.title)}</div>
         <div class="rc-text">${esc(excerpt)}${excerpt.length >= 150 ? '…' : ''}</div>
       </div>
       <div class="refcard-foot">클릭하면 해당 규정으로 이동 →</div>`;
    pop.hidden = false;
    positionPop(pop, t);
    pop.dataset.goto = f.pg.id;
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest('[data-reftarget]')) { hideTimer = setTimeout(() => { pop.hidden = true; }, 120); }
  });
  // 참조 클릭 → 이동
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-reftarget]');
    if (!t) return;
    const id = t.dataset.reftarget;
    if (findPage(id)) { sel.pageId = id; pop.hidden = true; render(); }
  });
}
function positionPop(pop, anchor) {
  const r = anchor.getBoundingClientRect();
  const pw = 340, ph = pop.offsetHeight || 160;
  let left = r.left; if (left + pw > window.innerWidth - 12) left = window.innerWidth - pw - 12;
  if (left < 12) left = 12;
  let top = r.top - ph - 9;
  if (top < 12) top = r.bottom + 9; // 위 공간 없으면 아래로
  pop.style.left = left + 'px'; pop.style.top = top + 'px';
}

// ============================================================================
// 모달 (prompt / confirm / pickPage)
// ============================================================================
function openModal(title, bodyHtml) {
  return new Promise((resolve) => {
    $('modalTitle').textContent = title;
    $('modalBody').innerHTML = bodyHtml;
    $('modalWrap').hidden = false;
    const cleanup = () => { $('modalWrap').hidden = true; $('modalOk').onclick = null; $('modalCancel').onclick = null; };
    $('modalOk').onclick = () => { const v = collectModal(); cleanup(); resolve(v); };
    $('modalCancel').onclick = () => { cleanup(); resolve(null); };
    const first = $('modalBody').querySelector('input,select,textarea'); if (first) { first.focus(); if (first.select) first.select(); }
    $('modalBody').onkeydown = (e) => { if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') $('modalOk').click(); };
  });
}
let modalCollector = () => null;
function collectModal() { return modalCollector(); }

function prompt2(title, label, def) {
  return new Promise((resolve) => {
    modalCollector = () => $('m_input') ? $('m_input').value.trim() : null;
    openModal(title, `<label>${esc(label)}<input id="m_input" value="${esc(def || '')}" /></label>`).then(resolve);
  });
}
function confirm2(msg) {
  return new Promise((resolve) => {
    modalCollector = () => true;
    openModal('확인', `<div>${esc(msg)}</div>`).then(v => resolve(v === true));
  });
}
function pickPage(title, excludeId) {
  return new Promise((resolve) => {
    const opts = [];
    for (const p of allPages()) if (p.pg.id !== excludeId)
      opts.push(`<option value="${p.pg.id}">${esc(p.sec.name)} › ${esc(p.sub.name)} › ${esc(p.pg.title)}</option>`);
    modalCollector = () => { const id = $('m_page') ? $('m_page').value : null; return id ? findPage(id) : null; };
    openModal(title, `<label>대상 규정<select id="m_page">${opts.join('')}</select></label>`).then(resolve);
  });
}

// ============================================================================
// 내보내기 / 가져오기 / 첨부
// ============================================================================
async function doExport() { const r = await Store.export(db); if (r && r.ok) toast('내보냄: ' + r.path); }
async function doImport() {
  const r = await Store.import();
  if (r && r.ok && r.data) {
    if (!(await confirm2('가져온 파일로 현재 작업을 대체합니다. 계속할까요?'))) return;
    db = normalize(r.data); sel.pageId = firstPageId(); render(); scheduleSave(); toast('가져오기 완료: ' + (r.path || ''));
  } else if (r && r.error) toast('오류: ' + r.error);
}
async function doAttach() {
  const f = sel.pageId && findPage(sel.pageId); if (!f) { toast('먼저 페이지를 선택하세요.'); return; }
  const r = await Store.addAttachment();
  if (r && r.ok) { f.pg.attachments.push(...r.attachments.map(a => ({ ...a, linkedVersion: f.pg.currentVersion }))); renderEditor(); renderPageList(); scheduleSave(); }
}

// ---- 상태바 / 토스트 --------------------------------------------------------
function setStatus(state, path) {
  const el = $('statSaved');
  if (state === 'saving') { el.textContent = '저장 중…'; el.classList.add('saving'); }
  else { el.textContent = '저장됨'; el.classList.remove('saving'); }
}
let toastTimer = null;
function toast(msg) {
  const el = $('statSaved'); const orig = el.textContent;
  el.textContent = msg; clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.textContent = orig; }, 2500);
}

// ---- 데이터 정규화(가져온 파일 방어) ----------------------------------------
function normalize(data) {
  if (!data || !Array.isArray(data.notebooks)) return sampleData();
  data.meta = data.meta || { title: '워크스페이스', updatedAt: today() };
  for (const nb of data.notebooks) {
    nb.sections = nb.sections || [];
    for (const sec of nb.sections) {
      sec.subtopics = sec.subtopics || [];
      for (const sub of sec.subtopics) {
        sub.pages = sub.pages || [];
        for (const pg of sub.pages) {
          pg.history = pg.history || []; pg.attachments = pg.attachments || []; pg.refs = pg.refs || [];
          pg.currentVersion = pg.currentVersion || (pg.history[0] && pg.history[0].version) || 1;
        }
      }
    }
  }
  return data;
}

// ============================================================================
// 전역 이벤트 바인딩
// ============================================================================
function bindGlobal() {
  $('btnAddNotebook').onclick = addNotebook;
  $('btnAddNotebook2').onclick = addNotebook;
  $('btnExport').onclick = doExport;
  $('btnImport').onclick = doImport;
  $('btnAttach').onclick = doAttach;
  $('btnAddRef').onclick = addRefStandalone;
  $('searchInput').oninput = renderPageList;
  $('btnAddPage').onclick = () => { const sub = currentSub(); if (sub) addPage(sub.id); else toast('하위주제를 먼저 만드세요.'); };

  // 트리 위임
  $('tree').addEventListener('click', (e) => {
    const el = e.target.closest('[data-toggle],[data-add-sec],[data-add-sub],[data-add-page],[data-del],[data-rename],[data-sub],[data-sec]');
    if (!el) return;
    if (el.dataset.toggle) { const id = el.dataset.toggle; collapsed.has(id) ? collapsed.delete(id) : collapsed.add(id); renderTree(); return; }
    if (el.dataset.addSec) return addSection(el.dataset.addSec);
    if (el.dataset.addSub) return addSubtopic(el.dataset.addSub);
    if (el.dataset.addPage) return addPage(el.dataset.addPage);
    if (el.dataset.del) return delNode(el.dataset.del, el.dataset.id);
    if (el.dataset.rename !== undefined && el.dataset.rename) { e.stopPropagation(); return renameNode(el.dataset.rename, el.dataset.id); }
    if (el.dataset.sub) { const sub = findSub(el.dataset.sub); if (sub && sub.pages[0]) { sel.pageId = sub.pages[0].id; render(); } else { sel.pageId = null; renderPageList(); renderEditor(); renderTree(); } }
  });

  // 페이지 목록 위임
  $('pageList').addEventListener('click', (e) => {
    const p = e.target.closest('[data-page]'); if (!p) return;
    sel.pageId = p.dataset.page; render();
  });

  // Electron 메뉴
  if (hasElectron) {
    window.owp.onMenu('menu:export', doExport);
    window.owp.onMenu('menu:import', doImport);
  }
}

// ============================================================================
// 부팅
// ============================================================================
async function boot() {
  const loaded = await Store.load();
  db = (loaded && !loaded.__error) ? normalize(loaded) : sampleData();
  sel.pageId = firstPageId();
  bindGlobal();
  setupRefHover();
  render();
  const paths = await Store.paths();
  $('statMode').textContent = (hasElectron ? '완전 포터블 · ' : '브라우저 미리보기 · ') + (paths.dataDir || '');
  if (!loaded) scheduleSave(); // 최초 실행 시 샘플 저장
}
document.addEventListener('DOMContentLoaded', boot);
