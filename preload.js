const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  uploadFile: (fileType) => ipcRenderer.invoke('upload-file', fileType),
  getSavedResumes: () => ipcRenderer.invoke('get-saved-resumes'),
  saveResume: (data) => ipcRenderer.invoke('save-resume', data)
}); 