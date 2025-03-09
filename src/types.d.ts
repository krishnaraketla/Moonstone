interface UploadResult {
  success: boolean;
  content: string;
  fileName: string;
  message?: string;
}

interface ElectronAPI {
  uploadFile: (fileType: string) => Promise<UploadResult>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {}; 