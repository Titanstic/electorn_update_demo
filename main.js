const { app, BrowserWindow, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');

let mainWindow;
const SILENT_INSTALL = false; // set true to skip prompt and auto install

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: { nodeIntegration: true }
    });
    mainWindow.loadFile('index.html');
}

function sendStatus(text) {
    console.log('[updater]', text);
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('update-status', text);
    }
}

app.on('ready', () => {
    createWindow();
    // Optional: delay a bit to ensure network
    setTimeout(() => {
        sendStatus('Checking for updates...');
        autoUpdater.checkForUpdates();
    }, 2000);
});

autoUpdater.on('checking-for-update', () => sendStatus('Checking for update'));
autoUpdater.on('update-available', info => {
    sendStatus(`Update available: ${info.version}`);
    dialog.showMessageBox({
        type: 'info',
        title: 'Update Available',
        message: `Downloading version ${info.version}...`
    });
});
autoUpdater.on('update-not-available', () => sendStatus('No update available'));
autoUpdater.on('download-progress', p => {
    const msg = `Download ${Math.round(p.percent)}% (${(p.transferred/1024/1024).toFixed(1)}MB/${(p.total/1024/1024).toFixed(1)}MB)`;
    sendStatus(msg);
});
autoUpdater.on('error', err => {
    sendStatus(`Error: ${err == null ? 'unknown' : (err.stack || err.message)}`);
});

autoUpdater.on('update-downloaded', info => {
    sendStatus(`Update downloaded: ${info.version}`);
    if (SILENT_INSTALL) {
        sendStatus('Installing update...');
        setTimeout(() => autoUpdater.quitAndInstall(), 1000);
        return;
    }
    dialog.showMessageBox({
        type: 'info',
        title: 'Update Ready',
        message: `Install version ${info.version} now?`,
        buttons: ['Yes', 'Later'],
        defaultId: 0,
        cancelId: 1
    }).then(result => {
        if (result.response === 0) {
            sendStatus('Quitting and installing');
            autoUpdater.quitAndInstall();
        }
    });
});