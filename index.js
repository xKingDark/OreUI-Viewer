require("v8-compile-cache");
require("@electron/remote/main").initialize();
const { app, BrowserWindow, globalShortcut, Menu } = require("electron");
const express = require("express");
const server = express();
server.use(express.static(__dirname));

const debug = true;
const port = 3000;
app.on("window-all-closed", () => app.quit());
app.on("ready", () => {
    console.log("\x1B[0m" + new Date().toLocaleTimeString() + " \x1B[33m\x1B[1m[INFO] \x1B[0m- Starting.");

    if (!debug) registerShortcuts();
    server.listen(port, () => {
        console.log(
            "\x1B[0m" + new Date().toLocaleTimeString() + " \x1B[33m\x1B[1m[INFO] \x1B[0m- The server is now running on port \x1B[33m" + port + "\x1B[0m!"
        );

        createWindow();
    });
});

const registerShortcuts = () => {
    globalShortcut.register("Control+R", () => false);
    globalShortcut.register("Control+Shift+R", () => false);
};

const createWindow = () => {
    console.log("\x1B[0m" + new Date().toLocaleTimeString() + " \x1B[33m\x1B[1m[INFO] \x1B[0m- Creating the window");

    const win = new BrowserWindow({
        minWidth: 1010,
        minHeight: 640,
        width: 1070,
        height: 648,
        title: "Ore UI Preview",
        icon: "./src/assets/mcpreview.png",
        autoHideMenuBar: true,
        resizable: true,
        titleBarStyle: "default",
        webPreferences: {
            preload: __dirname + "/engine.js",
            devTools: debug,
            webgl: true,
            webSecurity: true,
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            additionalArguments: [
                `--config-path=${JSON.stringify(require("path").join(__dirname, "config.json"))}`,
                `--facets-path=${JSON.stringify(require("path").join(__dirname, "src/facets/"))}`,
            ],
        },
    });

    const baseMenu = Menu.getApplicationMenu();

    const newMenu = Menu.buildFromTemplate([
        {
            role: "fileMenu",
            submenu: [
                {
                    role: "toggleDevTools",
                    visible: false,
                    accelerator: "F12",
                },
                ...baseMenu.items[0].submenu.items,
            ],
        },
        ...baseMenu.items.slice(1),
    ]);

    win.setMenu(newMenu);

    require("@electron/remote/main").enable(win.webContents);
    app.setAppUserModelId("Minecraft - OreUI");

    win.show();
    win.loadURL("http://127.0.0.1:3000/hbui");
};
