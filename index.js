const {app, BrowserWindow } = require('electron');
let win = null;
app.allowRendererProcessReuse=false

function createWindow () {
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }, width: 400, height: 800, maxHeight: 800, minHeight: 800, maxWidth: 400, minWidth: 400
    });
    mainWindow.loadURL(`file://${app.getAppPath()}/index.html`);
    mainWindow.on('closed', () => {
        win = null;
    });
}
app.on('ready', createWindow);