const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  uploadFile: (fileType) => ipcRenderer.invoke('upload-file', fileType)
}); 