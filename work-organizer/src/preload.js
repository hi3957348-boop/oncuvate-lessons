'use strict';

const { contextBridge, ipcRenderer } = require('electron');

// 렌더러에 안전하게 노출하는 API (contextIsolation 유지)
contextBridge.exposeInMainWorld('owp', {
  load: () => ipcRenderer.invoke('workspace:load'),
  save: (data) => ipcRenderer.invoke('workspace:save', data),
  paths: () => ipcRenderer.invoke('workspace:paths'),
  export: (data) => ipcRenderer.invoke('workspace:export', data),
  import: () => ipcRenderer.invoke('workspace:import'),
  addAttachment: () => ipcRenderer.invoke('attachment:add'),
  openAttachment: (p) => ipcRenderer.invoke('attachment:open', p),
  revealData: () => ipcRenderer.invoke('data:reveal'),
  onMenu: (channel, cb) => {
    const valid = ['menu:export', 'menu:import'];
    if (valid.includes(channel)) ipcRenderer.on(channel, () => cb());
  },
});
