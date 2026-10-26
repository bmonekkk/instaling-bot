const {contextBridge, ipcRenderer} = require('electron');

function subscribe(channel, callback) {
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on(channel, handler);
    return () => ipcRenderer.removeListener(channel, handler);
}

contextBridge.exposeInMainWorld('instaling', {
    getState: () => ipcRenderer.invoke('app:get-state'),
    saveSettings: settings => ipcRenderer.invoke('app:save-settings', settings),
    startBot: settings => ipcRenderer.invoke('bot:start', settings),
    stopBot: () => ipcRenderer.invoke('bot:stop'),
    openDataFolder: () => ipcRenderer.invoke('app:open-data-folder'),
    openLogFile: () => ipcRenderer.invoke('app:open-log-file'),
    openExternal: url => ipcRenderer.invoke('app:open-external', url),
    minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
    toggleMaximize: () => ipcRenderer.invoke('window:toggle-maximize'),
    closeWindow: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:is-maximized'),
    onLog: callback => subscribe('bot:log', callback),
    onStatus: callback => subscribe('bot:status', callback),
    onClearLog: callback => subscribe('bot:clear-log', callback),
    onMaximized: callback => subscribe('window:maximized', callback)
});
