'use strict';

const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');

/**
 * 완전 포터블 데이터 경로 결정
 * - 개발 모드: 프로젝트 루트/data
 * - 포터블 exe 모드: 실행파일이 있는 폴더/data  (PORTABLE_EXECUTABLE_DIR 는 electron-builder portable 타겟이 주입)
 */
function resolveDataDir() {
  const portableDir = process.env.PORTABLE_EXECUTABLE_DIR;
  const base = app.isPackaged
    ? (portableDir || path.dirname(process.execPath))
    : path.join(__dirname, '..');
  return path.join(base, 'data');
}

const DATA_DIR = resolveDataDir();
const ATTACH_DIR = path.join(DATA_DIR, 'attachments');
const WORKSPACE_FILE = path.join(DATA_DIR, 'workspace.owp');

function ensureDirs() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(ATTACH_DIR, { recursive: true });
}

// ---- 파일 IO (IPC 핸들러) --------------------------------------------------

function readWorkspace() {
  try {
    if (fs.existsSync(WORKSPACE_FILE)) {
      return JSON.parse(fs.readFileSync(WORKSPACE_FILE, 'utf-8'));
    }
  } catch (err) {
    return { __error: '워크스페이스 파일을 읽을 수 없습니다: ' + err.message };
  }
  return null; // 최초 실행 → 렌더러에서 샘플 데이터로 초기화
}

function writeWorkspace(data) {
  ensureDirs();
  // 저장 전 직전 상태를 .bak 으로 백업
  if (fs.existsSync(WORKSPACE_FILE)) {
    try { fs.copyFileSync(WORKSPACE_FILE, WORKSPACE_FILE + '.bak'); } catch (_) {}
  }
  const json = JSON.stringify(data, null, 2);
  fs.writeFileSync(WORKSPACE_FILE, json, 'utf-8');
  return { ok: true, path: WORKSPACE_FILE };
}

function registerIpc() {
  ipcMain.handle('workspace:load', () => readWorkspace());
  ipcMain.handle('workspace:save', (_e, data) => writeWorkspace(data));

  ipcMain.handle('workspace:paths', () => ({
    dataDir: DATA_DIR,
    attachDir: ATTACH_DIR,
    workspaceFile: WORKSPACE_FILE,
    packaged: app.isPackaged,
  }));

  // .owp 내보내기
  ipcMain.handle('workspace:export', async (_e, data) => {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: '공유용 파일 내보내기',
      defaultPath: (data?.meta?.title || 'workspace') + '.owp',
      filters: [{ name: '업무정리 파일', extensions: ['owp'] }],
    });
    if (canceled || !filePath) return { canceled: true };
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return { ok: true, path: filePath };
  });

  // .owp 가져오기
  ipcMain.handle('workspace:import', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: '공유 파일 가져오기',
      filters: [{ name: '업무정리 파일', extensions: ['owp', 'json'] }],
      properties: ['openFile'],
    });
    if (canceled || !filePaths.length) return { canceled: true };
    try {
      const data = JSON.parse(fs.readFileSync(filePaths[0], 'utf-8'));
      return { ok: true, data, path: filePaths[0] };
    } catch (err) {
      return { error: '가져오기 실패: ' + err.message };
    }
  });

  // 첨부 문서 추가 → data/attachments 로 복사(포터블 보관)
  ipcMain.handle('attachment:add', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: '문서 첨부',
      properties: ['openFile', 'multiSelections'],
    });
    if (canceled || !filePaths.length) return { canceled: true };
    ensureDirs();
    const added = [];
    for (const src of filePaths) {
      const base = path.basename(src);
      let dest = path.join(ATTACH_DIR, base);
      let i = 1;
      while (fs.existsSync(dest)) {
        const ext = path.extname(base);
        const stem = path.basename(base, ext);
        dest = path.join(ATTACH_DIR, `${stem}(${i})${ext}`);
        i++;
      }
      fs.copyFileSync(src, dest);
      const stat = fs.statSync(dest);
      added.push({
        id: 'at_' + stat.mtimeMs.toString(36) + '_' + i,
        name: path.basename(dest),
        size: stat.size,
        storedPath: dest,
      });
    }
    return { ok: true, attachments: added };
  });

  // 첨부/폴더 열기
  ipcMain.handle('attachment:open', (_e, storedPath) => {
    if (storedPath && fs.existsSync(storedPath)) { shell.openPath(storedPath); return { ok: true }; }
    return { error: '파일을 찾을 수 없습니다.' };
  });
  ipcMain.handle('data:reveal', () => { shell.openPath(DATA_DIR); return { ok: true }; });
}

// ---- 창 및 앱 수명주기 -----------------------------------------------------

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#202027',
    title: '업무정리',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  buildMenu();
}

function buildMenu() {
  const template = [
    {
      label: '파일',
      submenu: [
        { label: '공유 파일 내보내기(.owp)', accelerator: 'CmdOrCtrl+E', click: () => mainWindow?.webContents.send('menu:export') },
        { label: '공유 파일 가져오기', accelerator: 'CmdOrCtrl+I', click: () => mainWindow?.webContents.send('menu:import') },
        { type: 'separator' },
        { label: '데이터 폴더 열기', click: () => shell.openPath(DATA_DIR) },
        { type: 'separator' },
        { role: 'quit', label: '종료' },
      ],
    },
    {
      label: '편집',
      submenu: [
        { role: 'undo', label: '실행 취소' }, { role: 'redo', label: '다시 실행' },
        { type: 'separator' },
        { role: 'cut', label: '잘라내기' }, { role: 'copy', label: '복사' }, { role: 'paste', label: '붙여넣기' },
        { role: 'selectAll', label: '모두 선택' },
      ],
    },
    {
      label: '보기',
      submenu: [
        { role: 'reload', label: '새로고침' },
        { role: 'toggleDevTools', label: '개발자 도구' },
        { type: 'separator' },
        { role: 'resetZoom', label: '기본 배율' }, { role: 'zoomIn', label: '확대' }, { role: 'zoomOut', label: '축소' },
        { role: 'togglefullscreen', label: '전체화면' },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  ensureDirs();
  registerIpc();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
