import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { Client } from 'minecraft-launcher-core';
import { v4 as uuidv4 } from 'uuid';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

let win: BrowserWindow | null = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1000,
    height: 700,
    frame: false,                 // без системной рамки
    transparent: true,            // полно-прозрачный фон
    backgroundColor: '#00000000',
    resizable: false,
    title: 'SexCraft Launcher',
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: app.isPackaged,
      allowRunningInsecureContent: !app.isPackaged,
    },
  });

  win.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  win.on('closed', () => { win = null; });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

/* запуск Minecraft detatched */
ipcMain.handle('launch-minecraft', async (_e, opts) => {
  const launcher = new Client();
  const [ip, portStr] = opts.serverIp.split(':');
  const port = portStr || '25565';

  const options = {
    authorization: {
      name: opts.username,
      uuid: uuidv4(),
      access_token: 'fake',
      client_token: 'fake',
      user_properties: {},
      user_type: 'mojang',
    },
    root: path.join(app.getPath('appData'), '.sexcraft'),
    version: { number: opts.version, type: 'release' },
    javaPath: opts.javaPath,
    memory: { min: '1G', max: '2G' },
    extraArguments: ['--server', ip, '--port', port],
    detached: true,
  };

  try { await launcher.launch(options); return { success: true }; }
  catch (err:any) { return { success: false, error: err.message }; }
});

/* закрыть окно по запросу из React */
ipcMain.handle('close-window', () => { if (win) win.close(); });
