console.log('=== PRELOAD IS RUNNING! ===');

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  invoke: (channel, args) => ipcRenderer.invoke(channel, args),
  closeWindow: () => ipcRenderer.invoke('close-window'),
});