interface UploadResult {
  success: boolean;
  content: string;
  fileName: string;
  message?: string;
}

interface SavedResume {
  _id: string;
  name: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface SaveResumeRequest {
  name: string;
  content: string;
}

interface ElectronAPI {
  uploadFile: (fileType: string) => Promise<UploadResult>;
  getSavedResumes: () => Promise<SavedResume[]>;
  saveResume: (data: SaveResumeRequest) => Promise<SavedResume>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {}; 