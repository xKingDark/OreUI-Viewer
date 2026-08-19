/* eslint-disable no-prototype-builtins */
/* eslint-disable no-undef */
// @ts-check
/**
 * @import {} from "ore-ui-types";
 */
require("v8-compile-cache");
const fs = require("fs");
const path = require("path");
const { Cubemap } = require("./libs/@hatchibombotar-cubemap");
const { ipcRenderer } = require("electron/renderer");
const { VanillaGameplayContainerChestType, StorageType } = require("@ore-ui-types/enums");
/**
 * The path to the config file.
 *
 * @type {string}
 */
const configPath = String(JSON.parse(process.argv.find((arg) => arg.startsWith("--config-path="))?.split("=")[1] || "null") ?? "./config.json");
/**
 * @type {{ pathname: string; file: string; panorama: string; texts_path?: string | undefined; ddui_path?: string | undefined; vanilla_resource_packs_path?: string | undefined; } & ({ use_translation: true; locale: string; } | { use_translation: false; locale?: string | undefined; })}
 */
globalThis.__internal_Config__ =
    JSON.parse(JSON.parse(process.argv.find((arg) => arg.startsWith("--config-data="))?.split("=")[1] || '"null"')) ?? require(configPath);
/**
 * The path containing all of the facets.
 *
 * @type {string}
 */
const facetsPath = String(JSON.parse(process.argv.find((arg) => arg.startsWith("--facets-path="))?.split("=")[1] || "null") ?? __dirname + "/src/facets/");
/**
 * The path for where to look to resolve DDUI screen definitions.
 *
 * This should either be a folder containing the DDUI screen definitions from a resource pack, a resource pack, or a folder containing multiple resource packs
 * (like the vanilla `C:/XboxGames/Minecraft Preview for Windows/Content/data/resource_packs/` folder).
 *
 * @type {string}
 */
const dduiPath = String(
    JSON.parse(process.argv.find((arg) => arg.startsWith("--ddui-path="))?.split("=")[1] || "null") ??
        path
            .resolve(__dirname, __internal_Config__.ddui_path ?? "./src/ddui/")
            .replaceAll("\\", "/")
            .replace(/(?<!\/)$/, "/")
);
/**
 * The path for where to look to resolve vanilla resource pack assets.
 *
 * This should either be a resource pack or a folder containing multiple resource packs
 * (like the vanilla `C:/XboxGames/Minecraft Preview for Windows/Content/data/resource_packs/` folder).
 *
 * @type {string}
 */
globalThis.vanillaResourcePacksPath = String(
    JSON.parse(process.argv.find((arg) => arg.startsWith("--vanilla-resource-packs-path="))?.split("=")[1] || "null") ??
        path
            .resolve(__dirname, __internal_Config__.vanilla_resource_packs_path ?? "./src/vanilla_resource_packs/")
            .replaceAll("\\", "/")
            .replace(/(?<!\/)$/, "/")
);
/**
 * The path to the folder containing the cubemap images.
 *
 * @type {string}
 */
const cuebmapImagesPath = String(
    JSON.parse(process.argv.find((arg) => arg.startsWith("--cubemap-images-path="))?.split("=")[1] || "null") ?? "/src/assets/cubemap/"
);
if (window.location.pathname != __internal_Config__.file) window.location.pathname = __internal_Config__.file;

globalThis.textsPath = String(
    JSON.parse(process.argv.find((arg) => arg.startsWith("--texts-path="))?.split("=")[1] || "null") ??
        path
            .resolve(__dirname, __internal_Config__.texts_path ?? "./src/texts/")
            .replaceAll("\\", "/")
            .replace(/(?<!\/)$/, "/")
);

ipcRenderer.on("oreUIViewer:setConfig", (event, config) => {
    globalThis.__internal_Config__ = config;
    window.location.pathname = __internal_Config__.file;
});

/**
 * The list of loaded facets.
 *
 * @type {Partial<{ [FacetType in FacetList[number]]: (...args: unknown[]) => FacetTypeMap[FacetType] }> & Record<string, (...args: unknown[]) => unknown>}
 */
let loadedFacets = {};
/**
 * Loads a facet given its ID.
 *
 * @param {string} facet The ID of the facet to load.
 * @returns {Promise<void>} A promise that resolves when the facet is loaded or and error occurs.
 */
async function loadFacet(facet) {
    try {
        const f = await require(path.join(facetsPath, facet + ".js"));

        //console.log( "[EngineWrapper] Facet Loaded: " + facet, f );
        loadedFacets[facet] = f;
    } catch (e) {
        console.error(e);
    }
}

/**
 * Loads all the DDUI screens from the given folders.
 *
 * @param {string[]} folders The list of folders to search in, from lowest to highest priority.
 * @returns {{[screenID: string]: Record<string, any>}} The loaded screen data.
 */
function getDDUIScreens(folders) {
    /**
     * @type {{[screenID: string]: Record<string, any>}}
     */
    const screens = {};
    for (const folder of folders) {
        const files = fs.readdirSync(folder, { withFileTypes: true, recursive: true }).filter((f) => f.isFile() && f.name.endsWith(".json"));
        for (const file of files) {
            try {
                var screen = require(path.join(file.parentPath, file.name));
            } catch (e) {
                console.error("[EngineWrapper::getDDUIScreens] Error loading screen:", path.join(file.parentPath, file.name), e);
            }
            if (typeof screen["minecraft:ui-composition"]?.description?.identifier !== "string") {
                console.warn("[EngineWrapper::getDDUIScreens] Skipping screen with no identifier:", path.join(file.parentPath, file.name), screen);
            }
            screens[screen["minecraft:ui-composition"]?.description?.identifier] = screen;
        }
    }
    return screens;
}

/**
 * Gets the list of folders to search for DDUI screens.
 *
 * @returns {string[]} The list of folders.
 */
function getDDUIScreensFolders() {
    if (fs.existsSync(path.join(dduiPath, "ddui"))) return [path.join(dduiPath, "ddui")];
    const folders = fs
        .readdirSync(dduiPath, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory() && fs.existsSync(path.join(dirent.parentPath, dirent.name, "ddui")))
        .toSorted((a, b) =>
            a.name.startsWith("vanilla") && !b.name.startsWith("vanilla") ? 1
            : b.name.startsWith("vanilla") && !a.name.startsWith("vanilla") ? -1
            : a.name.startsWith("vanilla") && b.name.startsWith("vanilla") ?
                a.name === "vanilla" ? 1
                : b.name === "vanilla" ? -1
                : -a.name.localeCompare(b.name)
            :   a.name.localeCompare(b.name)
        )
        .map((dirent) => path.join(dirent.parentPath, dirent.name, "ddui"));
    if (folders.length === 0) return [dduiPath];
    return folders;
}

/**
 *
 * @param {Record<string, any>} screen
 * @returns
 * @todo Change the type of the screen parameter from Record<string, any> to DDUIScreen once that type is added into the `ore-ui-types` module.
 * @todo Change the return type to ResolvedDDUIScreen once that type is added into the `ore-ui-types` module.
 */
function resolveDDUIScreen(screen) {
    /**
     * @type {{children: any[]}}
     */
    const resolvedDDUIScreen = {
        children: [],
    };
    /**
     *
     * @param {Record<string, any> & {children?: any[]}} component
     * @returns
     * @todo Change the type of the component parameter from Record<string, any> to DDUIScreenComponent once that type is added into the `ore-ui-types` module.
     * @todo Change the return type to ResolvedDDUIScreenComponent once that type is added into the `ore-ui-types` module.
     */
    function resolveComponent(component) {
        const resolvedComponent = {
            __Type: `DataDrivenUIGenericNode$_$${++lastDDUINodeID}`,
            dynamicAttribs: component.attribs ? JSON.stringify(component.attribs) : null,
            text: null, // TODO
            children: component.children?.map(/** @returns {any} */ (child) => resolveComponent(child)) ?? [],
            tag: component.tag,
        };
        return resolvedComponent;
    }
    screen["minecraft:ui-composition"].layout.markup.forEach(
        /** @param {any} child */ (child) => {
            resolvedDDUIScreen.children.push(resolveComponent(child));
        }
    );
    return resolvedDDUIScreen;
}
/**
 * The next ID that will be used for a query response.
 */
let queryResponseId = 0n;
var engine = /** @satisfies {Engine} */ ({
    facets: loadedFacets,
    /**
     * @type {{[key in keyof EngineQueryNonFacetResultMap]?: (...args: EngineQuerySubscribeEventParamsMap[key] | (key extends keyof EngineQuerySubscribeEventDeprecatedParamsMap ? EngineQuerySubscribeEventDeprecatedParamsMap[key] : never)) => EngineQueryNonFacetResultMap[key]}}
     */
    __queryResolvers__: {
        "core.device.display"() {
            if (!loadedFacets["core.deviceInformation"]) throw new Error("Missing facet: core.deviceInformation");
            const deviceInformationFacet = loadedFacets["core.deviceInformation"]({});
            return {
                __Type: `core.device.display$_$${queryResponseId++}`,
                displayHeight: deviceInformationFacet.displayHeight ?? NaN,
                displayWidth: deviceInformationFacet.displayWidth ?? NaN,
                guiScaleBase: deviceInformationFacet.guiScaleBase ?? NaN,
                guiScaleModifier: deviceInformationFacet.guiScaleModifier ?? NaN,
                pixelsPerMillimeter: deviceInformationFacet.pixelsPerMillimeter ?? NaN,
            };
        },
        "core.device.network"() {
            if (!loadedFacets["core.deviceInformation"]) throw new Error("Missing facet: core.deviceInformation");
            const deviceInformationFacet = /** @type {Required<FacetTypeMap["core.deviceInformation"]>} */ (loadedFacets["core.deviceInformation"]({}));
            return {
                __Type: `core.device.network$_$${queryResponseId++}`,
                isOnline: deviceInformationFacet.isOnline,
                showCellularDataFee: deviceInformationFacet.showCellularDataFee,
                onlyCellularAvailable: deviceInformationFacet.onlyCellularAvailable,
                supportsManualAddedServers: deviceInformationFacet.supportsManualAddedServers,
                isLANAllowed: deviceInformationFacet.isLANAllowed,
                isAdHocModeActive: false,
                defaultNetworkMaxPlayers: 8,
            };
        },
        "core.device.platform"() {
            if (!loadedFacets["core.deviceInformation"]) throw new Error("Missing facet: core.deviceInformation");
            const deviceInformationFacet = /** @type {Required<FacetTypeMap["core.deviceInformation"]>} */ (loadedFacets["core.deviceInformation"]({}));
            return {
                __Type: `core.device.platform$_$${queryResponseId++}`,
                inputMethods: deviceInformationFacet.inputMethods,
                type: deviceInformationFacet.platform,
            };
        },
        "core.device.storage"() {
            if (!loadedFacets["core.deviceInformation"]) throw new Error("Missing facet: core.deviceInformation");
            const deviceInformationFacet = /** @type {Required<FacetTypeMap["core.deviceInformation"]>} */ (loadedFacets["core.deviceInformation"]({}));
            return {
                __Type: `core.device.storage$_$${queryResponseId++}`,
                isStorageFull: deviceInformationFacet.isStorageFull,
                isStorageLow: deviceInformationFacet.isStorageLow,
                isUsingAppDataStorage: deviceInformationFacet.storageType === StorageType.APPDATA,
                isUsingExternalStorage: deviceInformationFacet.storageType === StorageType.EXTERNAL,
                storageAvailableSize: deviceInformationFacet.storageAvailableSize,
                storageSize: deviceInformationFacet.storageSize,
                storageUsed: deviceInformationFacet.storageUsed,
                supportsSizeQuery: deviceInformationFacet.supportsSizeQuery,
            };
        },
        "core.cloudStorage"() {
            return {
                __Type: `core.cloudStorage$_$${queryResponseId++}`,
                cloudStorageSupported: true,
                storageSize: Math.pow(1024, 3) * 4,
                storageUsed: Math.pow(1024, 3) * 3,
                storageAvailableSize: "4.3GB", // TEMP: Figure out if this is actually GiB or GB and whether it is actually the full storageSize, storage remaining, storageUsed, or a different measurement.
                storagePercentage: 0.75, // TEMP: Figure out of this is supposed to be a 0-1 scale or a 0-100 scale.
                isStorageFull: false,
                isStorageLow: false,
            };
        },
        "core.staticFeatureFlag"(featureFlagID) {
            if (!loadedFacets["core.featureFlags"]) throw new Error("Missing facet: core.featureFlags");
            const featureFlagsFacet = loadedFacets["core.featureFlags"]({});
            return {
                __Type: `core.staticFeatureFlag$_$${queryResponseId++}`,
                enabled: featureFlagsFacet.flags.includes(featureFlagID),
            };
        },
        "core.flightingToggle"(flightingToggleID) {
            const activeFlightingToggles = [
                "mc-editor-default-actionbar-crosshair",
                "mc-editor-default-actionbar-export",
                "mc-editor-default-actionbar-hotbar",
                "mc-editor-default-actionbar-keyboard-settings",
                "mc-editor-default-actionbar-structures",
                "mc-create-from-add-on",
                "mc-disable-animated-sign-in-screens",
                "vanilla.friendsDrawerPlayersInMyWorld",
                "mc-hide-ping-and-count",
                "mc-editor-tutorial-hotbar-switch-progress",
                "mc-new-accessibility-settings-screen",
                "mc-new-account-settings-screen",
                "mc-new-audio-settings-screen",
                "mc-new-game-settings-screen",
                "mc-new-general-settings-screen",
                "mc-new-language-settings-screen",
                "vanilla.newMultiplayerSettingsScreen",
                "mc-new-video-settings-screen",
                "mc-new-enable-cloud-storage-manager",
                "mc-parties-chat",
                "mc-realms-pdp-members-cf",
                "mc-realms-plan-picker",
                "mc-realms-terms",
                "vanilla.screenshotsGallery",
                "vanilla.screenshotsShowcase",
                "vanilla.editor.tooltips.showGifs",
                "mc-editor-tutorial-show-video-link",
                "mc-surface-profile-report-button",
                "mc-use-persona-profile-images",
                "mc-create-from-mpp-banner",
                "mc-mpp-free-weekend",
                "mc-servers-tab-v2",
                "mc-cf-price-no-creator",
                "mc-cf-price-no-rating",
                "mc-servers-tab-v1-layout-service",
            ];
            return {
                __Type: `core.flightingToggle$_$${queryResponseId++}`,
                enabled: activeFlightingToggles.includes(flightingToggleID),
            };
        },
        "core.flightingConfig.bool"(flightingConfigEntryID) {
            const activeFlightingConfig = [
                "enable-send-xbl-friend-requests",
                "enable-view-xbl-friend-requests",
                "show-xbl-friends-not-follows",
                "parties-travel-to-external",
                "parties-travel-to-experiences",
            ];
            return {
                __Type: `core.flightingConfig.bool$_$${queryResponseId++}`,
                value: activeFlightingConfig.includes(flightingConfigEntryID),
            };
        },
        "vanilla.core.dataDrivenUICompositionQuery"(screenID) {
            const dduiScreens = getDDUIScreens(getDDUIScreensFolders());
            return {
                __Type: `vanilla.core.dataDrivenUICompositionQuery$_$${queryResponseId++}`,
                children: [],
                ...(dduiScreens[screenID] && resolveDDUIScreen(dduiScreens[screenID])),
            };
        },
        "vanilla.gameplay.furnace"() {
            return {
                __Type: `vanilla.gameplay.furnace$_$${queryResponseId++}`,
                // @ts-ignore: This should throw an error if the facet is not loaded.
                ...loadedFacets["vanilla.gameplay.furnace"](),
            };
        },
        vanillaCoreDataDrivenUIDefinitionQuery(_unknownArg1, screenID) {
            // TODO: Use the unknownArg1 parameter (the first one) once it is figured out what it is.
            const dduiScreens = getDDUIScreens(getDDUIScreensFolders());
            return {
                __Type: `vanillaCoreDataDrivenUIDefinitionQuery$_$${queryResponseId++}`,
                children: [],
                ...(dduiScreens[screenID] && resolveDDUIScreen(dduiScreens[screenID])),
            };
        },
        vanillaCoreDataDrivenUIScreenIdQuery() {
            return {
                __Type: `vanillaCoreDataDrivenUIScreenIdQuery$_$${queryResponseId++}`,
                screenId: new URLSearchParams(loadedFacets["core.router"]?.().history.location.search).get("screenId") ?? null,
            };
        },
        vanillaGameplayContainerItemQuery() {
            return {
                __Type: `vanillaGameplayContainerItemQuery$_$${queryResponseId++}`,
                amount: 69,
                containerItemType: 0,
                damageValue: 0,
                hasDamageValue: false,
                image: "/rp/textures/items/stick",
                maxDamage: 0,
                name: "Sticky the Stick",
            };
        },
        vanillaGameplayContainerSizeQuery() {
            return {
                __Type: `vanillaGameplayContainerSizeQuery$_$${queryResponseId++}`,
                size: 36,
            };
        },
        vanillaGameplayContainerNameQuery() {
            return {
                __Type: `vanillaGameplayContainerNameQuery$_$${queryResponseId++}`,
                name: "CONTAINER TEST",
            };
        },
        vanillaGameplayContainerChestTypeQuery() {
            return {
                __Type: `vanillaGameplayContainerChestTypeQuery$_$${queryResponseId++}`,
                chestType: VanillaGameplayContainerChestType.Barrel,
            };
        },
        vanillaGameplayRecipeBookFilteringQuery() {
            return {
                __Type: `vanillaGameplayRecipeBookFilteringQuery$_$${queryResponseId++}`,
                isFiltering: false,
            };
        },
        vanillaGameplayRecipeBookSearchStringQuery() {
            return {
                __Type: `vanillaGameplayRecipeBookSearchStringQuery$_$${queryResponseId++}`,
                searchString: "",
            };
        },
        vanillaGameplayUIProfile() {
            return {
                __Type: `vanillaGameplayUIProfile$_$${queryResponseId++}`,
                uiProfile: 0,
            };
        },
        vanillaGameplayAnvilQuery() {
            return {
                __Type: `vanillaGameplayAnvilQuery$_$${queryResponseId++}`,
                costText: "69 Levels",
                damageState: 1,
                hasInputItem: true,
                previewItemName: "Rick Astley",
                shouldCrossOutIconBeVisible: false,
            };
        },
        vanillaGameplayTradeOverviewQuery() {
            return {
                __Type: `vanillaGameplayTradeOverviewQuery$_$${queryResponseId++}`,
                experiencePossibleProgress: 5,
                experienceProgress: 0.6,
                isExperienceBarVisible: true,
                traderName: "Rick Astley",
                tradeTiers: 5,
            };
        },
        vanillaGameplayTradeTierQuery(tradeTier) {
            return {
                __Type: `vanillaGameplayTradeTierQuery$_$${queryResponseId++}`,
                isTierUnlocked: true,
                isTierVisible: true,
                tierName: `Tier ${tradeTier} - ${["Never", "gonna", "give", "you", "up."][tradeTier] ?? "UNNAMED"}`,
                tradeOffers: 2,
            };
        },
        vanillaGameplayTradeOfferQuery(tradeTier, tradeIndex) {
            return {
                __Type: `vanillaGameplayTradeOfferQuery$_$${queryResponseId++}`,
                buyAItemAmount: 9999,
                buyAItemImage: "pack://textures/items/diamond.png",
                buyAItemName: "Diamond",
                buyBItemAmount: 9999,
                buyBItemImage: "pack://textures/items/netherite_ingot.png",
                buyBItemName: "Netherite Ingot",
                sellItemAmount: 1,
                sellItemImage: "pack://textures/items/rotten_flesh.png",
                sellItemName: "Rotten Flesh",
                hasSecondaryBuyItem: true,
                isOutOfUses: tradeTier === 2 && tradeIndex === 1,
                isSelectedTrade: tradeTier === 1 && tradeIndex === 0,
                playerHasItemsForTrade: true,
            };
        },
        // TODO: The below party queries should have data synced with the query facets.
        "vanilla.currentParty.membersQuery"() {
            // TEMP: Add some actual fake data here, rather than null data, maybe make it so the party can be actually left (until reload).
            return {
                __Type: `vanilla.currentParty.membersQuery$_$${queryResponseId++}`,
                leaderXuid: "",
                maxMemberCount: 15,
                members: [],
                pendingInvitees: [],
            };
        },
        "vanilla.currentParty.dataQuery"() {
            // TEMP: Add some actual fake data here, rather than null data, maybe make it so the party can be actually left (until reload).
            return {
                __Type: `vanilla.currentParty.dataQuery$_$${queryResponseId++}`,
                isInParty: false,
                partyId: "",
                privacy: 1,
                restrictInvitesToLeader: false,
            };
        },
        "vanilla.currentParty.destinationQuery"() {
            // TEMP: Add some actual fake data here, rather than null data, maybe make it so the party can be actually left and the destination name can be set (until reload).
            return {
                __Type: `vanilla.currentParty.destinationQuery$_$${queryResponseId++}`,
                destinationName: "",
                shouldShowJoinDestination: false,
            };
        },
        "vanilla.partyChat.unreadMessagesQuery"() {
            // TEMP: Add some actual fake data here, rather than null data, maybe make it so the party messages can be marked as read (until reload).
            return {
                __Type: `vanilla.partyChat.unreadMessagesQuery$_$${queryResponseId++}`,
                hasUnreadMessages: false,
            };
        },
        "vanilla.receivedFriendRequests"() {
            if (!loadedFacets["vanilla.recommendedFriendsList"]) throw new Error("Missing facet: vanilla.recommendedFriendsList");
            const recommendedFriendsList = loadedFacets["vanilla.recommendedFriendsList"]();
            return {
                __Type: `vanilla.receivedFriendRequests$_$${queryResponseId++}`,
                isLoading: recommendedFriendsList.isLoading,
                playerList: recommendedFriendsList.playerList
                    .filter((v) => v.isFollowingMe && !v.isFollowedByMe)
                    .map((v) => ({
                        __Type: `AddFriendObject$_$${queryResponseId++}`,
                        ...v,
                        isFriend: false,
                        isFriendRequestReceived: true,
                        isFriendRequestSent: false,
                    })),
                xboxAPICallResult: recommendedFriendsList.xboxAPICallResult,
            };
        },
        "vanilla.menus.buildInfoQuery"() {
            return {
                __Type: `vanilla.menus.buildInfoQuery$_$${queryResponseId++}`,
                treatments:
                    "T: Beetroot Soup, \nMagenta Base Sinister Canton, \nWandering Trader Spawn Egg, \nWhite Per Bend Sinister, \nOrange Lozenge, \nSnow Golem Spawn Egg, \nNetherite Ingot, \nPaper, \nRed Snapper, \nOrange Globe, \nGreen Bordure Indented, \nRed Per Bend Sinister, \nNPC Spawn Egg, \nCyan Bordure, \nOrange Per Fess Inverted, \nRed Snout, \nBlack Tang, \nWhite Inverted Chevron, \nBrewing Stand, \nLight Gray Dye, \nGray Field Masoned, \nFeather, \nLight Gray Field Masoned, \nBlue Base Sinister Canton, \nC418 - 11, \nWhite Bend, \nGreen Gradient, \nGray Bend Sinister, \nGreen Per Bend Sinister Inverted, \nGlass Bottle, \nMagenta Bend Sinister, \nYellow Pale, \nBrown Banner, \nDiamond, \nGray Chief Indented, \nLight Blue Chevron, \nYellow Flower Charge, \nLime Roundel, \nLime Pale Dexter, \nPotato, \nLime Globe, \nMagenta Globe, \nOrange Field Masoned, \nCyan, \nBrown Gradient, \nPink Pale Sinister, \nEnd Rod, \nEye of Ender, \nBlack Pale Sinister, \nGolden Boots, \nAcacia Door, \nOrange Pale Sinister, \nLight Blue, \nOak Door, \nLime Flower Charge, \nGray Snout, \nGray Thing, \nCookie, \nBlack Per Pale Inverted, \nLight Gray Snout, \nLight Gray Bend Sinister, \nGray Bordure Indented, \nCookie[ntrol], \nBrown Pale Dexter, \nPink Chief Dexter Canton, \nTrail, \nC418 - 13, \nBlue Gradient, \nLime Pale Dexter[creen], \nBrown Field Masoned, \nGray Per Fess, \nJungle Door, \nGolden Carrot, \nLight Blue Chief Indented, \nLight Gray Paly, \nBrown Per Bend, \nRedstone Dust, \nPurple Bordure, \nBlack Flower Charge, \nRed Bend, \nGray Pale Dexter, \nGreen Bordure Indented[rawer], \nWhite Chief Sinister Canton, \nCyan Bordure[icons], \nTurtle Scute, \nRed Chief Sinister Canton, \nChainmail Leggings, \nBurst\n\nR: Light Gray Pale Dexter, \nCyan Bordure[ments], \nLime Thing, \nWarped Door, \nWhite Per Pale, \nC418 - strad, \nPink Base Gradient, \nMagenta Lozenge, \nDark Oak Door, \nMagenta Base Sinister Canton[pt_in], \nGoat Spawn Egg, \nGray Field Masoned[_tabs], \nZombie Villager Spawn Egg, \nWhite Chief Indented, \nElytra, \nPurple Cross, \nCyan Bend, \nGray Base Fess, \nSkeleton Skull, \nGray Skull Charge, \nMagenta Flower Charge, \nGreen Per Pale Inverted, \nGolden Chestplate, \nPaper[_flow], \nGhast Spawn Egg, \nBlack Inverted Chevron, \nStick, \nLight Blue Bordure Indented",
                canCopyToClipboard: true,
            };
        },
        "vanilla.menus.localWorldListQuery"() {
            if (!loadedFacets["vanilla.localWorldList"]) throw new Error("Missing facet: vanilla.localWorldList");
            const localWorldListFacet = loadedFacets["vanilla.localWorldList"]();
            return {
                __Type: `vanilla.menus.localWorldListQuery$_$${queryResponseId++}`,
                worlds: localWorldListFacet.localWorlds.map((v) => ({
                    __Type: `LocalWorldListEntry$_$${queryResponseId++}`,
                    id: v.id,
                    name: v.name,
                    allContentOwned: v.allContentOwned,
                })),
            };
        },
        "vanilla.menus.localWorldQuery"(worldId) {
            if (!loadedFacets["vanilla.localWorldList"]) throw new Error("Missing facet: vanilla.localWorldList");
            const localWorldListFacet = loadedFacets["vanilla.localWorldList"]();
            const worldData = /** @type {Required<LocalWorldDataType> | undefined} */ (localWorldListFacet.localWorlds.find((v) => v.id === worldId));
            return {
                __Type: `vanilla.menus.localWorldQuery$_$${queryResponseId++}`,
                ...(worldData ?? {
                    gameVersion: {
                        __Type: `gameVersion$_$${queryResponseId++}`,
                        major: 0,
                        minor: 0,
                        patch: 0,
                        revision: 0,
                        isBeta: false,
                    },
                    templateVersion: {
                        __Type: `templateVersion$_$${queryResponseId++}`,
                        major: 0,
                        minor: 0,
                        patch: 0,
                        revision: 0,
                        isBeta: false,
                    },
                    id: worldId,
                    name: "",
                    lastSaved: 0,
                    gameMode: -1,
                    fileSize: "",
                    previewImgPath: "",
                    isExperimental: false,
                    isHardcore: false,
                    playerHasDied: false,
                    daysPlayed: 0,
                    showDaysPlayed: false,
                    isTemplateCompatibleWithAnyVersion: false,
                    allContentOwned: true,
                    requiresCloudSync: false,
                    isMultiplayerEnabled: false,
                    xblBroadcastIntent: 0,
                    isEditorWorld: false,
                    cloudSyncState: null,
                }),
            };
        },
    },
    /**
     * @type {{[key in EngineEventID]?: ((...args: EngineEvent<EngineEventID extends key ? undefined : key>) => void)[] | undefined}}
     */
    bindings: {},
    WindowLoaded: false,
    BindingsReady: (...version) => console.log(`[EngineWrapper::BindingsReady] BindingsReady called (v${version.join(".")})`),
    on: (id, func) => {
        engine.bindings[id] ??= [];
        engine.bindings[id].push(func);
        return {
            clear: () => engine.off(id, func),
        };
    },
    off: (id, handler) => {
        // @ts-ignore: `handler` might be undefined in older versions.
        if (handler) {
            engine.bindings[id] = engine.bindings[id]?.filter(/** @returns {h is any} */ (h) => h !== handler);
        } else {
            delete engine.bindings[id];
        }
    },
    RemoveOnHandler: (id, func, _) => console.log(`[EngineWrapper::RemoveOnHandler] RemoveOnHandler for ID ${id}. func: ${func}`),
    trigger: /** @template {EngineEventID} T @param {T} id @param {EngineEvent<EngineEventID extends T ? undefined : T>} args */ (id, ...args) => {
        /**
         * @type any
         */
        const queryResolvers = engine.__queryResolvers__;
        while (true) {
            if (!engine.WindowLoaded) continue;
            switch (id) {
                case "facet:request": {
                    const [query, requestId, parameters] = args;
                    if (engine.facets.hasOwnProperty(query)) {
                        console.log(`[EngineWrapper::trigger] Sending Facet: ${query}`, args);
                        if (requestId !== undefined) {
                            console.log(id, query, requestId, parameters);
                            engine.bindings["facet:updated:" + requestId]?.forEach((f) =>
                                f?.(
                                    typeof engine.facets[query] === "function" ?
                                        engine.facets[query](parameters)
                                    :   (console.log("NOT A FUNCTION", query, engine.facets[query]), engine.facets[query])
                                )
                            );
                        } else engine.bindings["facet:updated:" + query]?.forEach((f) => f?.(engine.facets[query]));
                    } else {
                        console.error(`[EngineWrapper::trigger] MISSING FACET: ${query}`);
                        try {
                            engine.bindings["facet:error:" + (requestId ?? query)]?.forEach((f) => f?.(engine.facets[query]));
                        } catch {}
                    }
                    break;
                }
                case "core:exception":
                    console.error(`[EngineWrapper::trigger] OreUI has reported exception:`, ...args);
                    break;
                case "query:subscribe/core.input":
                    engine.bindings[`query:subscribed/${args[0]}`]?.forEach((f) => f?.(engine.facets["core.input"]?.({})));
                    break;
                default:
                    if (id.startsWith("query:subscribe/")) {
                        if (queryResolvers[id.slice("query:subscribe/".length)]) {
                            engine.bindings[`query:subscribed/${args[0]}`]?.forEach((f) =>
                                f?.(queryResolvers[id.slice("query:subscribe/".length)](...args.slice(1)))
                            );
                        } else if (engine.facets[id.slice("query:subscribe/".length)]) {
                            engine.bindings[`query:subscribed/${args[0]}`]?.forEach((f) => f?.(engine.facets[id.slice("query:subscribe/".length)]?.({})));
                        } else {
                            console.error(`[EngineWrapper::trigger] MISSING QUERY RESOLVER: ${id}`, "Args:", ...args);
                        }
                    } else {
                        console.warn(`[EngineWrapper::trigger] OreUI triggered ${id} but we don't handle it!`, "Args:", ...args);
                    }
                    break;
            }
            engine.bindings[id]?.forEach((f) => typeof f === "function" && f(...args));

            return;
        }
    },
    TriggerEvent: {
        // @ts-ignore
        apply: (_, [id, ...args]) => {
            /**
             * @type any
             */
            const queryResolvers = engine.__queryResolvers__;
            while (true) {
                if (!engine.WindowLoaded) continue;
                switch (id) {
                    case "facet:request": {
                        const [query, requestId, parameters] = args;
                        if (engine.facets.hasOwnProperty(query)) {
                            console.log(`[EngineWrapper::TriggerEvent::apply] Sending Facet: ${query}`, args);
                            if (requestId !== undefined) {
                                console.log(id, query, requestId, parameters);
                                engine.bindings["facet:updated:" + requestId]?.forEach((f) =>
                                    f?.(
                                        typeof engine.facets[query] === "function" ?
                                            engine.facets[query](parameters)
                                        :   (console.log("NOT A FUNCTION", query, engine.facets[query]), engine.facets[query])
                                    )
                                );
                            } else engine.bindings["facet:updated:" + query]?.forEach((f) => f?.(engine.facets[query]));
                        } else {
                            console.error(`[EngineWrapper::TriggerEvent::apply] MISSING FACET: ${query}`);
                            try {
                                engine.bindings["facet:error:" + (requestId ?? query)]?.forEach((f) => f?.(engine.facets[query]));
                            } catch {}
                        }
                        break;
                    }
                    case "core:exception":
                        console.error(`[EngineWrapper::TriggerEvent::apply] OreUI has reported exception:`, ...args);
                        break;
                    case "query:subscribe/core.input":
                        engine.bindings[`query:subscribed/${args[0]}`]?.forEach((f) => f?.(engine.facets["core.input"]?.({})));
                        break;
                    default:
                        if (id.startsWith("query:subscribe/")) {
                            if (queryResolvers[id.slice("query:subscribe/".length)]) {
                                engine.bindings[`query:subscribed/${args[0]}`]?.forEach((f) =>
                                    f?.(queryResolvers[id.slice("query:subscribe/".length)](...args.slice(1)))
                                );
                            } else if (engine.facets[id.slice("query:subscribe/".length)]) {
                                engine.bindings[`query:subscribed/${args[0]}`]?.forEach((f) => f?.(engine.facets[id.slice("query:subscribe/".length)]?.({})));
                            } else {
                                console.error(`[EngineWrapper::TriggerEvent::apply] MISSING QUERY RESOLVER: ${id}`, "Args:", ...args);
                            }
                        } else {
                            console.warn(`[EngineWrapper::TriggerEvent::apply] OreUI triggered ${id} but we don't handle it!`, "Args:", ...args);
                        }
                        break;
                }
                engine.bindings[id]?.forEach((f) => typeof f === "function" && f(...args));

                return;
            }
        },
    },
});

globalThis.engine = engine;

let lastDDUINodeID = Object.keys(loadedFacets).length + Object.keys(globalThis.engine.__queryResolvers__).length - 1;

// TODO: Add support for the vanilla commands (the global `__commands__` object).
// Initialize the variable if it doesn't exist.
globalThis.__commands__ ??= /** @type {any} */ ({});
let lastCommandId = 0;
// Assign the value to the variable.
__commands__ = {
    vanillaCoreDataStoreSetCommandGroup: {
        dataStoreButtonPress: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        setDataStorePathBool: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        setDataStorePathNumber: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        setDataStorePathString: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
    },
    vanillaGameplayAnvilCommandGroup: {
        setPreviewItemName: {
            id: ++lastCommandId,
            callable(itemName) {
                return null;
            }, // TODO
        },
    },
    vanillaGameplayRecipeBookFilteringCommandGroup: {
        setRecipeBookFiltering: {
            id: ++lastCommandId,
            callable(enabled) {
                return null;
            }, // TODO
        },
    },
    vanillaGameplayRecipeBookSearchStringCommandGroup: {
        setRecipeBookSearchString: {
            id: ++lastCommandId,
            callable(searchString) {
                return null;
            }, // TODO
        },
    },
    vanillaGameplayTradeCommandGroup: {
        performAutoTrade: {
            id: ++lastCommandId,
            callable(tradeTier, tradeIndex) {
                return null;
            }, // TODO
        },
        pullInIngredientsForSelectedTrade: {
            id: ++lastCommandId,
            callable() {
                return null;
            }, // TODO
        },
        selectTrade: {
            id: ++lastCommandId,
            callable(...args) {
                return null;
            }, // TODO
        },
    },
    vanillaGameplayContainerCommandGroup: {
        autoCraftAllItemsFromRecipe: {
            id: ++lastCommandId,
            callable(...args) {
                return null;
            }, // TODO
        },
        autoCraftOneItemFromRecipe: {
            id: ++lastCommandId,
            callable(...args) {
                return null;
            }, // TODO
        },
        selectRecipe: {
            id: ++lastCommandId,
            callable(...args) {
                return null;
            }, // TODO
        },
        setDistributeAllSource: {
            id: ++lastCommandId,
            callable(...args) {
                return null;
            }, // TODO
        },
        splitSingleItem: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        splitMultipleItems: {
            id: ++lastCommandId,
            callable(...args) {
                return null;
            }, // TODO
        },
        autoPlaceItems: {
            id: ++lastCommandId,
            callable(...args) {
                return null;
            }, // TODO
        },
        coalesceOrAutoPlaceItems: {
            id: ++lastCommandId,
            callable(...args) {
                return null;
            }, // TODO
        },
        coalesceItems: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        dropOneItem: {
            id: ++lastCommandId,
            callable(...args) {
                return null;
            }, // TODO
        },
        dropAllItems: {
            id: ++lastCommandId,
            callable(...args) {
                return null;
            }, // TODO
        },
        placeAmountOfItems: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        placeOneItem: {
            id: ++lastCommandId,
            callable(...args) {
                return null;
            }, // TODO
        },
        placeAllItems: {
            id: ++lastCommandId,
            callable(...args) {
                return null;
            }, // TODO
        },
        takeHalfItems: {
            id: ++lastCommandId,
            callable(...args) {
                return null;
            }, // TODO
        },
        takeOneItem: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        takeAllItems: {
            id: ++lastCommandId,
            callable(...args) {
                return null;
            }, // TODO
        },
        closeContainer: {
            id: ++lastCommandId,
            callable(...args) {
                return null;
            }, // TODO
        },
    },
    vanillaGameInviteCommandGroup: {
        invitePlatformPlayers: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        inviteXboxPlayers: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
    },
    vanilla_partyChatCommandGroup: {
        setIsOpen: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        setComposedMessage: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        sendComposedMessage: {
            id: ++lastCommandId,
            callable() {
                return null;
            },
        },
    },
    vanilla_menus_invoke_action_settings: {
        cancelAsyncAction: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        invokeAction: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
    },
    coreScreenReaderCommandGroup: {
        read: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        clear: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
    },
    routerCommandGroup: {
        go: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        back: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        replace: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        push: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
    },
    soundCommandGroup: {
        isPlaying: {
            id: ++lastCommandId,
            callable(id) {
                return loadedFacets["core.sound"]?.()?.isPlaying(id) ?? false;
            },
        },
        fadeOut: {
            id: ++lastCommandId,
            callable(id, duration) {
                loadedFacets["core.sound"]?.()?.fadeOut(id, duration);
                return null;
            },
        },
        play: {
            id: ++lastCommandId,
            callable(sound, volume, pitch) {
                return loadedFacets["core.sound"]?.()?.play(sound, volume, pitch) ?? -1;
            },
        },
    },
    coreTranslateCommandGroup: {
        getHowLongAgoAsString: {
            id: ++lastCommandId,
            callable(...args) {
                return "0 seconds ago";
            },
        },
        formatDate: {
            id: ++lastCommandId,
            callable(timestampInSeconds) {
                return new Date(timestampInSeconds * 1000).toLocaleDateString();
            },
        },
        translate: {
            id: ++lastCommandId,
            callable(key, parameters) {
                return loadedFacets["core.locale"]?.()?.translateWithParameters(key, parameters) ?? key;
            },
        },
    },
    coreStorageCommandGroup: {
        changeStorage: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
    },
    vanilla_menus_update_settings: {
        commitString: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        updateNumber: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        updateString: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        updateOption: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        updateBoolean: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
    },
    coreHapticsCommandGroup: {
        vibrate: {
            id: ++lastCommandId,
            callable(duration) {
                return null;
            },
        },
    },
    coreApplicationCommandGroup: {
        exit: {
            id: ++lastCommandId,
            callable() {
                window.close();
            },
        },
    },
    vanillaGameplayContainerAPICommands: {
        setPreviewItemName: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        performAutoTrade: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        pullInIngredientsForSelectedTrade: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        selectTrade: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        setRecipeBookTab: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        setRecipeBookFiltering: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        setRecipeBookSearchString: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        setDistributeAllSource: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        resetSplitStack: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        splitSingleItem: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        splitMultipleItemsTouch: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        splitMultipleItems: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        autoPlaceItems: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        coalesceOrAutoPlaceItems: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        coalesceItems: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        dropOneItem: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        dropAllItems: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        placeAmountOfItems: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        placeOneItem: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        placeAllItems: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        takeHalfItems: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        takeOneItem: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        takeAllItems: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        handleBackgroundMouseRelease: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        handlePanelMouseRelease: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        handleSlotMouseDrag: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        handleSlotMouseRelease: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        handleSlotMousePress: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        closeContainer: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
    },
    editorTelemetryCommandGroup: {
        fireScriptAction: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
    },
    vanillaGameplayLocalPlayerWakeUpCommand: {
        wakeUp: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
    },
    vanillaGameplayLocalPlayerRespawnCommand: {
        respawn: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
    },
    realmsServerSettingsCommandGroup: {
        setRealmsServerSimDist: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        setRealmsServerRenderDist: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        setRealmsServerMaxPlayerCount: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        setRealmsServerMode: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        fetchRealmsServerSettings: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
    },
    vanillaRealmsSavesCommandGroup: {
        cancelBackupDownload: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        downloadBackup: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        renameBackup: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        deleteBackup: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        restoreBackup: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        saveAutoBackup: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        saveBackup: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        fetchActiveWorldSize: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        fetchBackupList: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
    },
    vanillaRealmsMembersCommandGroup: {
        addRealmMembers: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
    },
    vanillaAdminLogCommandGroup: {
        fetchAdminLogs: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
    },
    vanilla_menus_auto_save_warning_screen: {
        acknowledge: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
    },
    vanilla_menus_tts_warning_screen: {
        disableTTS: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        markTTSShown: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        doesLanguageSupportTts: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
    },
    personaCommands: {
        equipDefaultSkin: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
    },
    ClientUpdatesCommandGroup: {
        launchStoreForClientUpdates: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
    },
    vanilla_socialSystemCommandGroup: {
        setPollingForReceivedRequests: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        reportIsDrawerVisible: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
    },
    vanilla_inboxCommandGroup: {
        reportSubmit: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        reportClick: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
    },
    vanillaGameplayLeaveGameCommandGroup: {
        leaveGameThenJoinFriendsWorld: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        leaveGame: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
    },
    vanillaWorldStorageCommandGroup: {
        deleteWorld: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
    },
    vanillaWorldCloudSyncCommandGroup: {
        setCloudSaved: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        setLocalOnly: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
    },
    vanillaStorageManagerCommandGroup: {
        convertOldWorld: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        deleteSelectedItems: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        setAllSelected: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        setSelected: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
    },
    vanilla_menus_safe_zone_warning_screen: {
        markShown: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        setSafeZone: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
    },
    editorContentBadgeCommandGroup: {
        restoreAllBadges: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        clearAllBadges: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        clearBadge: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
        setSuppressNewBadges: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
    },
    vanillaRealmsDeleteCommandGroup: {
        deleteRealm: {
            id: ++lastCommandId,
            callable(...args) {}, // TODO
        },
    },
};

const facets = JSON.parse(fs.readFileSync(__dirname + "/src/facets.json").toString());
(async () => {
    for (const facet of facets) await loadFacet(facet);
    engine.WindowLoaded = true;

    /*
						engine.bindings["Editor::ServerUXEvents"](JSON.stringify({
							type: 7,
							id: require("node:crypto").randomUUID(),
							icon: "",
							enabled: true,
							visible: true,
							tooltipData: {
								descriptionString: "",
							},
							toolGroupId: "",
							paneId: "",
						}));
						*/

    /*
						engine.bindings["Editor::ServerUXEvents"](JSON.stringify({
							type: 1,
							id: "1d1323db-f34d-456a-81d7-04a79c8dab04",
							collapsed: false,
							enabled: true,
							visible: true,
							propertyItems: [
								{
									paneId: "1d1323db-f34d-456a-81d7-04a79c8dab04",
									id: require("node:crypto").randomUUID(),
									property: "empty",
									typeName: "editorUI:Divider",
								}
							]
						}));
						*/
})();

{
    const importMapElement = document.createElement("script");
    importMapElement.type = "importmap";

    importMapElement.textContent = JSON.stringify(
        {
            imports: {
                "@ore-ui-types/enums": "/hbui/@ore-ui-types/enums",
            },
        },
        null,
        4
    );

    if (document.documentElement) {
        document.documentElement.appendChild(importMapElement);
    } else {
        const observer = new MutationObserver(() => {
            if (document.documentElement) {
                document.documentElement.appendChild(importMapElement);
                observer.disconnect();
            }
        });
        observer.observe(document, { childList: true, subtree: true });
    }
}

window.addEventListener("DOMContentLoaded", () => {
    // @ts-expect-error: This should error when the value is undefined. When this is converted to TypeScript, make this use `!` instead.
    document.getElementsByTagName("body")[0].style = "user-select: none;";

    // Panorama
    const link = document.createElement("link");
    link.href = "/libs/@hatchibombotar-cubemap/index.css";
    link.type = "text/css";
    link.rel = "stylesheet";
    // @ts-expect-error: This should error when the value is undefined. When this is converted to TypeScript, make this use `!` instead.
    document.getElementsByTagName("head")[0].appendChild(link);

    // @ts-expect-error: This should error when the value is undefined. When this is converted to TypeScript, make this use `!` instead.
    globalThis.__internal_cubemap__ = new Cubemap(
        // @ts-expect-error: This should error when the value is undefined. When this is converted to TypeScript, make this use `!` instead.
        document.getElementsByTagName("body")[0],
        [
            cuebmapImagesPath.replaceAll("\\", "/").replace(/(?<!\/)$/, "/") + __internal_Config__.panorama + "/front.png",
            cuebmapImagesPath.replaceAll("\\", "/").replace(/(?<!\/)$/, "/") + __internal_Config__.panorama + "/right.png",
            cuebmapImagesPath.replaceAll("\\", "/").replace(/(?<!\/)$/, "/") + __internal_Config__.panorama + "/back.png",
            cuebmapImagesPath.replaceAll("\\", "/").replace(/(?<!\/)$/, "/") + __internal_Config__.panorama + "/left.png",
            cuebmapImagesPath.replaceAll("\\", "/").replace(/(?<!\/)$/, "/") + __internal_Config__.panorama + "/top.png",
            cuebmapImagesPath.replaceAll("\\", "/").replace(/(?<!\/)$/, "/") + __internal_Config__.panorama + "/bottom.png",
        ],
        {
            width: "auto",
            height: "100%",
            perspective: 400,
            rotate_type: "auto",
            rotate_speed: 2.5,
        }
    );

    // @ts-expect-error: This should error when the value is undefined. When this is converted to TypeScript, make this use `!` instead.
    window.addEventListener("resize", () => void globalThis.__internal_cubemap__?.update());

    // To fix CSS
    const styleEl = document.createElement("style");
    document.head.appendChild(styleEl);

    const styleSheet = styleEl.sheet;
    if (!styleSheet) throw new ReferenceError("Failed to create style sheet.");
    styleSheet.insertRule(`#root { position: absolute; z-index: 1000; }`, styleSheet.cssRules.length);
    styleSheet.insertRule(`::-webkit-scrollbar { width: 0; }`, styleSheet.cssRules.length);
    styleSheet.insertRule(`input { outline: none; }`, styleSheet.cssRules.length);
    styleSheet.insertRule(`[cohinline] > * { display: inline; }`);
    styleSheet.insertRule(`.RdcBM { flex-wrap: unset; }`, styleSheet.cssRules.length);
    styleSheet.insertRule(
        ".iWrTh,.vPqz2,.XiGeZ,.MneaI," +
            ".c_o_5,.oQouW,.P3s5b,.nDjUk," +
            ".T3q0T,.R8eUQ,.BLVBU,.b_Dcf," +
            ".YZFU6,.An2ie,.r1fl4,.P6Myy," +
            ".c3aSY,.rW6em" +
            `{ width: auto; }`,
        styleSheet.cssRules.length
    );
    styleSheet.insertRule(`.nUoyP { height: 1.5rem; }`, styleSheet.cssRules.length);
    styleSheet.insertRule(`.uHy0P { min-height: 2.8rem; }`, styleSheet.cssRules.length);
    styleSheet.insertRule(`.mbdeF { width: auto; min-width: auto; }`, styleSheet.cssRules.length);
    styleSheet.insertRule(`.JcX32 { padding-bottom: 12px;margin-bottom: -12px; }`, styleSheet.cssRules.length);
    styleSheet.insertRule(`.IxVml { margin-left: -17%; }`, styleSheet.cssRules.length);
    styleSheet.insertRule(`.X5AON { display: none; }`, styleSheet.cssRules.length);
    styleSheet.insertRule(`.CXtm9, .jc_nV { gap: 6px; text-align: center; }`, styleSheet.cssRules.length);
    styleSheet.insertRule(`.yRhRU .qA9dD { height: 100%; width: 100%; }`, styleSheet.cssRules.length);
    styleSheet.insertRule(`.ekhCp { height: fit-content; min-height: 100%; }`, styleSheet.cssRules.length);
    styleSheet.insertRule(`.UedOa { overflow-y: auto; padding-right: 10px; }`, styleSheet.cssRules.length);
    styleSheet.insertRule(`.SDIhK, .XwAx9 { align-items: unset; }`, styleSheet.cssRules.length);
    styleSheet.insertRule(`.JsUBN { gap: 10px; }`, styleSheet.cssRules.length);
    styleSheet.insertRule(`.mSv3v { text-align: center; }`, styleSheet.cssRules.length);

    // To fix box sizing issues.
    styleSheet.insertRule(`* { box-sizing: border-box; flex-shrink: 0; }`, styleSheet.cssRules.length); // styleSheet.insertRule(`body * { box-sizing: border-box; display: flex; }`, styleSheet.cssRules.length); // TODO
    styleSheet.insertRule(`p[cohinline] { display: inline-block; width: 100%; }`, styleSheet.cssRules.length);
    styleSheet.insertRule(
        `div:has(+div div+div):not(:has(+div div+div+div)):not(:has(> :nth-child(3))) div:first-child { min-height: auto; }`,
        styleSheet.cssRules.length
    );
    styleSheet.insertRule(`body > :not(#root) div { min-height: unset; }`, styleSheet.cssRules.length);
    styleSheet.insertRule(`pre { margin: 0; }`, styleSheet.cssRules.length);
    styleSheet.insertRule(
        `div:has(+ div div + div):not(:has(+ div div + div + div)) div:has(> div[data-testid="scroll-view"]) { overflow: auto; }`,
        styleSheet.cssRules.length
    );
    styleSheet.insertRule(`button { width: 100%; }`);
    styleSheet.insertRule(`* { -webkit-user-drag: none; }`, styleSheet.cssRules.length);
    styleSheet.insertRule(`span { display: block; }`, styleSheet.cssRules.length);
});

// This generates the value of the `data` variable. It should be put in the DevTools console in the Ore UI that is added with 8Crafter's Ore UI Customizer.
/* const facetList = [
    "core.animation",
    "core.customScaling",
    "core.deviceInformation",
    "core.featureFlags",
    "core.input",
    "core.locale",
    "core.performanceFacet",
    "core.router",
    "core.safeZone",
    "core.screenReader",
    "core.splitScreen",
    "core.social",
    "core.sound",
    "core.user",
    "core.vrMode", // Found in dev build file.

    "vanilla.achievements",
    "vanilla.achievementsReward",
    "vanilla.buildSettings",
    "vanilla.clipboard",
    "vanilla.createNewWorld",
    "vanilla.createPreviewRealmFacet",
    "vanilla.debugSettings",
    "vanilla.editor",
    "vanilla.editorInput",
    "vanilla.editorLogging",
    "vanilla.editorScripting",
    "vanilla.editorSelectionFacet",
    "vanilla.editorSettings",
    "vanilla.externalServerWorldList",
    "vanilla.followersList",
    "vanilla.friendsListFacet",
    "vanilla.friendsManagerFacet",
    "vanilla.gameplay.activeLevelHardcoreMode",
    "vanilla.gameplay.bedtime",
    "vanilla.gameplay.closeContainerCommand",
    "vanilla.gameplay.containerBlockActorType",
    "vanilla.gameplay.containerItemQuery",
    "vanilla.gameplay.containerSizeQuery",
    "vanilla.gameplay.furnace",
    "vanilla.gameplay.immediateRespawn",
    "vanilla.gameplay.leaveGame",
    "vanilla.gameplay.playerDeathInfo",
    "vanilla.gameplay.playerPositionHudElement",
    "vanilla.gameplay.playerRespawn",
    "vanilla.gamertagSearch",
    "vanilla.inbox",
    "vanilla.lanWorldList",
    "vanilla.localWorldList",
    "vanilla.marketplaceSuggestions",
    "vanilla.marketplacePassWorldTemplateList",
    "vanilla.networkWorldDetails",
    "vanilla.networkWorldJoiner",
    "vanilla.notificationOptions",
    "vanilla.notifications",
    "vanilla.options",
    "vanilla.party", // Found in dev build file.
    "vanilla.playerAchievements",
    "vanilla.playerBanned",
    "vanilla.playerFollowingList",
    "vanilla.playerLinkedPlatformProfile", // Found in dev build file.
    "vanilla.playermessagingservice",
    "vanilla.playerPermissions",
    "vanilla.playerProfile",
    "vanilla.playerReport",
    "vanilla.playerSocialManager",
    "vanilla.playerStatistics",
    "vanilla.privacyAndOnlineSafetyFacet",
    "vanilla.profanityFilter",
    "vanilla.realmsListFacet",
    "vanilla.realmSlots",
    "vanilla.realmsMembership",
    "vanilla.realmsStories.actions",
    "vanilla.realmsStories.localScreenshots",
    "vanilla.realmsStories.persistentData",
    "vanilla.realmsStories.players",
    "vanilla.realmsStories.realmData",
    "vanilla.realmsStories.settings",
    "vanilla.realmsStories.stories",
    "vanilla.RealmsPDPFacet",
    "vanilla.RealmWorldUploaderFacet",
    "vanilla.recentlyPlayedWithList",
    "vanilla.recommendedFriendsList",
    "vanilla.resourcePackOverrides",
    "vanilla.resourcePacks",
    "vanilla.screenshotGalleryList",
    "vanilla.screenSpecificOptions",
    "vanilla.screenTechStack",
    "vanilla.seedTemplates",
    "vanilla.share",
    "vanilla.simulationDistanceOptions",
    "vanilla.telemetry",
    "vanilla.thirdPartyWorldList",
    "vanilla.unpairedRealmsListFacet",
    "vanilla.userAccount",
    "vanilla.webBrowserFacet",
    "vanilla.worldCloudSyncFacet",
    "vanilla.worldEditor",
    "vanilla.worldOperations",
    "vanilla.worldPackages",
    "vanilla.worldPlayersList",
    "vanilla.worldStartup",
    "vanilla.worldTemplateList",
    "vanilla.worldTransfer",

    "vanilla.friendworldlist",
    "vanilla.offerRepository",
    "vanilla.realmsStories.actions",
    "vanilla.realmsStories.realmData",
    "vanilla.realmsStories.persistentData",
    "vanilla.realmsSettingsFacet",

    "vanilla.achievementCategories",
    "vanilla.blockInformation",
    "debug.worldTransfer",
    "vanilla.flatWorldPresets",
    "vanilla.inGame",
    "vanilla.playerPrivacy",
    "vanilla.realmsPurchase",
    "vanilla.realmsSubscriptionsData",
    "vanilla.realmsSubscriptionsMethods",
    "vanilla.realmsWorldContextCommands",
    "vanilla.realmsWorldContextQueries",
    "vanilla.realmsStories.sessions",
    "vanilla.realmsListActionsFacet",
    "vanilla.developerOptionsFacet",
    "vanilla.realmsStories.comments",
    "vanilla.screenshotGallery",
    "vanilla.playerShowcasedGallery",
    "vanilla.trialMode",
    "vanilla.featuredWorldTemplateList",
    "vanilla.ownedWorldTemplateList",
    "vanilla.worldTemplateOperations",
    "test.vector",
    // "vanilla.editorBlockPalette", // Crashes the game.
    // "vanilla.editorInputBinding",
    // "vanilla.editorInputState",
    // "vanilla.editorProjectConstants",
    // "vanilla.editorStructure",
    // "vanilla.editorTutorial",
    "vanilla.gameplay.localPlayerWeatherLightningFacet",
    "vanilla.levelInfo",
    "vanilla.currentParty",
    "vanilla.partyCommands",
    "vanilla.worldRealmEditor", // Found in dev build file.
    "vanilla.worldRealmEditorCommands",
    "vanilla.worldRealmEditorQueries",
    "vanilla.realmBackupsCommands",
    "vanilla.realmBackupsQueries",
    "vanilla.realmsPurchaseCommands",
    "vanilla.realmsPurchaseReconcilerQueries",
    "vanilla.character-selector",
    "vanilla.progressTracker",

    // Found in preview 1.21.100.21.
    "vanilla.realmsWorldEditorGameRulesCommands",
    "vanilla.realmsWorldEditorGameRulesQueries",
    "vanilla.realmsWorldEditorWorldDetailsQueries",
    "vanilla.realmsCommitCommandsFacet",
    "vanilla.realmsCommitQueriesFacet",
    "vanilla.realmsPurchaseQueries",
];

const facetList = [...new Set([...Object.keys(accessedFacets), ...Object.keys(facetSpyData.sharedFacets)])];

Promise.all(facetList.map(v => forceLoadFacet(v).catch(() => {}))).then(() => copyTextToClipboardAsync(
    JSONB.stringify(Object.fromEntries(Object.entries(getAccessibleFacetSpyFacets()).filter(([facetName]) => facetList.includes(facetName))), (k, v) => {
        if (typeof v === "object") {
            return v === null
                ? null
                : "slice" in v && !(v instanceof Array)
                ? Array.from(v)
                : v instanceof Array
                ? v
                : Object.fromEntries(
                      [
                          ...new Set([
                              ...Object.keys(v).filter((key) => !(key in Object.prototype)),
                              ...(() => {
                                  try {
                                      return Object.getOwnPropertyNames(v.__proto__).filter((key) => {
                                          if (key in Object.prototype) return false;
                                          try {
                                              // Make sure the property won't throw an error when accessed.
                                              v[key];
                                              return key in v;
                                          } catch {
                                              return false;
                                          }
                                      });
                                  } catch (e) {
                                      return [];
                                  }
                              })(),
                              ...Object.getOwnPropertyNames(v),
                              ...Object.getOwnPropertySymbols(v),
                          ]),
                      ].map((key) => {
                          try {
                              return [key, v[key]];
                          } catch (e) {
                              return { ERROR: e };
                          }
                      })
                  );
        }
        if (typeof v === "function") {
            if (v.toString() === `function ${v.name ?? ""}() { [native code] }`) {
                return `function ${v.name ?? ""}() { /\* [native code] *\/ }`;
            }
            return v.toString();
        }
        return v;
    })
)); */

/* getAccessibleFacetSpyFacets()["vanilla.clipboard"].copyToClipboard(
    JSONB.stringify(getAccessibleFacetSpyFacets()["vanilla.realmsStories.stories"], (k, v) => {
        if (typeof v === "object") {
            return v === null
                ? null
                : "slice" in v && !(v instanceof Array)
                ? Array.from(v)
                : v instanceof Array
                ? v
                : Object.fromEntries(
                      [
                          ...new Set([
                              ...Object.keys(v).filter((key) => !(key in Object.prototype)),
                              ...(() => {
                                  try {
                                      return Object.getOwnPropertyNames(v.__proto__).filter((key) => {
                                          if (key in Object.prototype) return false;
                                          try {
                                              // Make sure the property won't throw an error when accessed.
                                              v[key];
                                              return key in v;
                                          } catch {
                                              return false;
                                          }
                                      });
                                  } catch (e) {
                                      return [];
                                  }
                              })(),
                              ...Object.getOwnPropertyNames(v),
                              ...Object.getOwnPropertySymbols(v),
                          ]),
                      ].map((key) => {
                          try {
                              return [key, v[key]];
                          } catch (e) {
                              return { ERROR: e };
                          }
                      })
                  );
        }
        if (typeof v === "function") {
            if (v.toString() === `function ${v.name ?? ""}() { [native code] }`) {
                return `function ${v.name ?? ""}() { /\* [native code] *\/ }`;
            }
            return v.toString();
        }
        return v;
    })
); */

const data = {
    // ...
};

/**
 * Checks for missing properties in an object against a base object.
 *
 * @param {Record<PropertyKey, any>} baseObject
 * @param {Record<PropertyKey, any>} objectToCheckForMissingProperties
 * @param {string[]} [path=[]]
 * @param {string[]} [missingProperties=[]]
 * @returns {string[]}
 */
function checkForMissingProperties(baseObject, objectToCheckForMissingProperties, path = [], missingProperties = []) {
    for (const property in baseObject) {
        if (!(property in objectToCheckForMissingProperties)) {
            missingProperties.push([...path, property].join("."));
        } else if (baseObject[property] instanceof Array) {
            // skip empty destination arrays
            if (objectToCheckForMissingProperties[property] instanceof Array && objectToCheckForMissingProperties[property].length === 0) {
                continue;
            }
            if (!Array.isArray(objectToCheckForMissingProperties[property])) {
                missingProperties.push([...path, property].join("."));
                continue;
            }
            for (const [index, item] of baseObject[property].slice(0, objectToCheckForMissingProperties[property].length).entries()) {
                if (typeof item === "object") {
                    const itemPath = [...path, property, index.toString()];
                    for (const itemProperty in item) {
                        if (!(itemProperty in objectToCheckForMissingProperties[property][index])) {
                            if (baseObject[property].filter((item) => typeof item === "object").every((item) => itemProperty in item)) {
                                missingProperties.push([...itemPath, itemProperty].join("."));
                            }
                        }
                    }
                }
            }
        } else if (typeof baseObject[property] === "object") {
            checkForMissingProperties(baseObject[property], objectToCheckForMissingProperties[property], [...path, property], missingProperties);
        }
    }
    return missingProperties;
}
async function scanFacetsForMissingProperties() {
    for (const key of Object.keys(data)) {
        await loadFacet(key);
    }
    return checkForMissingProperties(
        data,
        Object.fromEntries(
            Object.keys(loadedFacets).map((key) => {
                const facet = loadedFacets[key];
                if (typeof facet === "function") {
                    return [key, facet()];
                } else {
                    return [key, facet];
                }
            })
        )
    );
}

globalThis.scanFacetsForMissingProperties = scanFacetsForMissingProperties;
