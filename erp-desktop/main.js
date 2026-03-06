const { app, BrowserWindow } = require('electron');
const path = require('path');
const { startExpressServer } = require('./server');

let mainWindow;

async function createWindow() {
    let backendPort = 3000;

    try {
        // Start our local backend on a dynamically assigned OS port
        const result = await startExpressServer();
        backendPort = result.port;

        // Wait a moment just in case, though the promise should be enough
        await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
        console.error("Failed to start backend server:", error);
    }

    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
        autoHideMenuBar: true, // Hide the default windows menu bar for a cleaner app feel
    });

    // Load the React app from the local server
    mainWindow.loadURL(`http://localhost:${backendPort}`);

    // Open the DevTools to debug the white screen
    mainWindow.webContents.openDevTools();

    mainWindow.on('closed', function () {
        // Dereference the window object
        mainWindow = null;
    });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// Quit when all windows are closed
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});
