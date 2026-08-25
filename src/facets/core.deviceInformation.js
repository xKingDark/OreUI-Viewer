// @ts-check
const { Platform, InputMethod, ARVRPlatform, StorageType } = require("../types.js");
const IS_TOUCH_DEVICE = false;
const DEFAULT_PLATFORM = IS_TOUCH_DEVICE ? Platform.IOS : Platform.WIN32;
const GUI_SCALE_VALUES = [1, 2, 3, 4, 5, 6, 7, 8];
const getGuiScaleIndexForLargeScreen = (width, height) => {
    const widthNeeded = 376;
    const heightNeeded = 250;
    const widthScale = width / widthNeeded;
    const heightScale = height / heightNeeded;

    const index = getGuiScaleIndex(Math.min(heightScale, widthScale));
    const scale = /** @type {number} */ (GUI_SCALE_VALUES[index]);
    return scale;
};

const resolveGuiScale = (index) => /** @type {number} */ (GUI_SCALE_VALUES[Math.min(GUI_SCALE_VALUES.length - 1, Math.max(0, index))]);
const getGuiScaleIndex = (scale) => {
    let scaleIndex = 0;
    const guiScaleSize = GUI_SCALE_VALUES.length;

    for (let index = 0; index < guiScaleSize; ++index) {
        if (resolveGuiScale(index) > scale) break;
        scaleIndex = index;
    }

    return scaleIndex;
};

const getDefaultSupportedInputMethods = (platform = DEFAULT_PLATFORM) => {
    switch (platform) {
        case Platform.IOS:
        case Platform.GOOGLE:
        case Platform.AMAZON_HANDHELD:
            return [InputMethod.TOUCH, InputMethod.GAMEPAD, InputMethod.MOUSE];

        case Platform.NX_TV:
            return [InputMethod.GAMEPAD];

        case Platform.NX_HANDHELD:
            return [InputMethod.GAMEPAD, InputMethod.TOUCH];

        case Platform.UWP:
        case Platform.XBOX:
        case Platform.PS4:
        case Platform.GEARVR:
        case Platform.AMAZON_TV:
        case Platform.PS5:
        case Platform.WIN32:
        case Platform.MACOS:
        default:
            return [InputMethod.GAMEPAD, InputMethod.MOUSE];
    }
};

module.exports = () => ({
    inputMethods: getDefaultSupportedInputMethods(),
    platform: DEFAULT_PLATFORM,
    arvrPlatform: ARVRPlatform.ARVR_None,
    isLowMemoryDevice: false,
    guiScaleModifier: -Math.min(2, Math.max(0, getGuiScaleIndexForLargeScreen(window.innerWidth, window.innerHeight) - 2)) /* 0 */,
    guiScaleBase: getGuiScaleIndexForLargeScreen(window.innerWidth, window.innerHeight),
    pixelsPerMillimeter: 3.779527559,
    // 96dpi,
    displayWidth: globalThis.screen?.width ?? 1920,
    displayHeight: globalThis.screen?.height ?? 1080,
    storageSize: Math.pow(1024, 4),
    storageUsed: Math.pow(1024, 4) * 0.75,
    isStorageFull: false,
    isStorageLow: false,
    storageType: StorageType.NONE,
    isUsingAlternativeStorage: false,
    isOnline: true,

    // 1.21.93.
    activeMultiplayerServiceIds: [0],
    changeStorageTask: 0,
    supportsSizeQuery: true,
    storageAvailableSize: "1009.7GB",
    supportsManualAddedServers: true,
    onlyCellularAvailable: false,
    showCellularDataFee: false,
    isLANAllowed: true,
    changeStorage() {},
});
