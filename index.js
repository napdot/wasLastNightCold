const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
let mainWindow = null;

app.allowRendererProcessReuse=false

app.on('window-all-closed',() => {
    if (process.platform !== 'darwin') app.quit();
});
app.on('ready', () => {
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        width: 400,
        height: 800,
        maxHeight: 800,
        minHeight: 800,
        maxWidth: 400,
        minWidth: 400,
    });
    mainWindow.loadURL(`file://${app.getAppPath()}/index.html`);
    mainWindow.on('closed', () => { mainWindow = null; });
});
