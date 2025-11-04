// @ts-check
module.exports = () => ({
    editorMode: 1,
    resizeViewport: () => {},
    shouldDisplayReloadModal: () => false,
    onViewportMouseButtonDown: (button) => {},
    onViewportMouseButtonUp: (button) => {},
    setCursorReleased: (released) => {},
    canShowModeShortcutToast: true,
    openPauseMenu() {},
    onViewportFocusAreaResized() {},
    openConsole() {},
    /**
     * @param {string} uri
     */
    navigateUri(uri) {
        console.log(`Navigating to URI: ${uri}`);
        require("electron").shell.openExternal(uri);
        return null;
    },
    getCursorBlockName() {},
});
