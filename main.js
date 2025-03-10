const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const PDFParser = require('pdf-parse');
const mammoth = require('mammoth');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

// MongoDB connection string from environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'resume_tuner';
const COLLECTION_NAME = 'saved_resumes';

let mongoClient;
let db;

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    console.log('Connected to MongoDB');
    db = mongoClient.db(DB_NAME);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Enable live reload in development
if (process.env.NODE_ENV === 'development') {
  try {
    require('electron-reloader')(module, {
      watchRenderer: true,
      ignore: [
        'node_modules/**/*',
        'dist/**/*',
        'package-lock.json',
        'package.json'
      ]
    });
    console.log('Electron reloader enabled for development');
  } catch (err) {
    console.error('Error setting up electron-reloader:', err);
  }
}

let mainWindow;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#FFFFFF',
    titleBarStyle: 'customButtonsOnHover',
    trafficLightPosition: { x: 15, y: 10 },
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // and load the index.html of the app.
  // In production, use the built file
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadFile('dist/index.html');
  } else {
    mainWindow.loadFile('dist/index.html');
  }

  // Open the DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Handle file uploads
ipcMain.handle('upload-file', async (event, fileType) => {
  if (!mainWindow) return { success: false, message: 'Window not ready' };

  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: fileType === 'pdf' 
        ? [{ name: 'PDF Files', extensions: ['pdf'] }]
        : [{ name: 'Word Documents', extensions: ['docx'] }]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, message: 'No file selected' };
    }

    const filePath = result.filePaths[0];
    const fileName = path.basename(filePath);
    const fileData = fs.readFileSync(filePath);
    
    let content = '';
    
    if (fileType === 'pdf') {
      // PDF extraction with basic formatting preservation
      const pdfData = await PDFParser(fileData, {
        // Enable text formatting detection if the library supports it
        preserveFormatting: true
      });
      
      // Process text to preserve newlines and basic formatting
      content = pdfData.text
        // Convert multiple spaces to &nbsp; entities to preserve spacing
        .replace(/ {2,}/g, match => '&nbsp;'.repeat(match.length))
        // Convert newlines to <br> tags
        .replace(/\n/g, '<br>');
    } else if (fileType === 'docx') {
      // Use mammoth's HTML conversion instead of text extraction
      const docxResult = await mammoth.convertToHtml({ buffer: fileData }, {
        styleMap: [
          "b => strong",
          "i => em",
          "u => u",
          "p[style-name='Heading 1'] => h1",
          "p[style-name='Heading 2'] => h2",
          "p[style-name='Heading 3'] => h3"
        ]
      });
      content = docxResult.value;
    }
    
    return {
      success: true,
      content,
      fileName
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    return {
      success: false,
      message: `Error uploading file: ${error.message}`
    };
  }
});

// Handle saving a resume to MongoDB
ipcMain.handle('save-resume', async (event, data) => {
  if (!db) {
    await connectToMongoDB();
  }
  
  try {
    const collection = db.collection(COLLECTION_NAME);
    const resumeData = {
      name: data.name,
      content: data.content,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await collection.insertOne(resumeData);
    return {
      ...resumeData,
      _id: result.insertedId.toString()
    };
  } catch (error) {
    console.error('Error saving resume:', error);
    throw error;
  }
});

// Handle retrieving saved resumes from MongoDB
ipcMain.handle('get-saved-resumes', async () => {
  if (!db) {
    await connectToMongoDB();
  }
  
  try {
    const collection = db.collection(COLLECTION_NAME);
    const resumes = await collection.find({})
      .sort({ updatedAt: -1 })
      .toArray();
    
    // Convert ObjectId to string for JSON serialization
    return resumes.map(resume => ({
      ...resume,
      _id: resume._id.toString()
    }));
  } catch (error) {
    console.error('Error retrieving saved resumes:', error);
    throw error;
  }
}); 