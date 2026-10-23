// ПК-версия «Брейнрот Комбат» для Steam: окно Electron без рамки и меню, игра грузится по протоколу app://
const { app, BrowserWindow, Menu, protocol, net } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');

protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } }]);
const GAME = path.join(__dirname, 'game');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280, height: 720, fullscreen: true, backgroundColor: '#000000', autoHideMenuBar: true,
    title: 'Брейнрот Комбат', webPreferences: { contextIsolation: true, sandbox: true }
  });
  // F11 / Alt+Enter — оконный или полноэкранный режим
  win.webContents.on('before-input-event', (e, i) => {
    if (i.type === 'keyDown' && (i.key === 'F11' || (i.alt && i.key === 'Enter'))) { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
  });
  win.loadURL('app://game/index.html');
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  protocol.handle('app', async req => {
    const rel = decodeURIComponent(new URL(req.url).pathname).replace(/^\/+/, '');
    const file = path.normalize(path.join(GAME, rel));
    if (!file.startsWith(GAME)) return new Response('', { status: 403 });
    try { return await net.fetch(pathToFileURL(file).toString()); } catch (e) { return new Response('', { status: 404 }); }
  });
  createWindow();
});
app.on('window-all-closed', () => app.quit());
