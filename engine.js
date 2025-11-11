/* eslint-disable no-prototype-builtins */
/* eslint-disable no-undef */
require("v8-compile-cache");
const fs = require("fs");
const path = require("path");
const { Cubemap } = require("./libs/@hatchibombotar-cubemap");
const { ipcRenderer } = require("electron/renderer");
const { VanillaGameplayContainerChestType } = require("./src/types");
/**
 * The path to the config file.
 *
 * @type {string}
 */
const configPath = String(JSON.parse(process.argv.find((arg) => arg.startsWith("--config-path="))?.split("=")[1] || "null") ?? "./config.json");
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
const dduiPath = String(JSON.parse(process.argv.find((arg) => arg.startsWith("--ddui-path="))?.split("=")[1] || "null") ?? __dirname + "/src/ddui/");
/**
 * The path to the folder containing the cubemap images.
 *
 * @type {string}
 */
const cuebmapImagesPath = String(
    JSON.parse(process.argv.find((arg) => arg.startsWith("--cubemap-images-path="))?.split("=")[1] || "null") ?? "/src/assets/cubemap/"
);
/**
 * @type {typeof import("./config.json")}
 */
globalThis.__internal_Config__ =
    JSON.parse(JSON.parse(process.argv.find((arg) => arg.startsWith("--config-data="))?.split("=")[1] || '"null"')) ?? require(configPath);
if (window.location.pathname != __internal_Config__.file) window.location.pathname = __internal_Config__.file;

globalThis.textsPath = String(JSON.parse(process.argv.find((arg) => arg.startsWith("--texts-path="))?.split("=")[1] || "null") ?? __dirname + "/src/texts/");

ipcRenderer.on("oreUIViewer:setConfig", (event, config) => {
    __internal_Config__ = config;
    window.location.pathname = __internal_Config__.file;
});

let loadedFacets = {};
const loadFacet = async (facet) => {
    try {
        const f = await require(path.join(facetsPath, facet + ".js"));

        //console.log( "[EngineWrapper] Facet Loaded: " + facet, f );
        loadedFacets[facet] = f;
    } catch (e) {
        console.error(e);
    }
};

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
            a.name.startsWith("vanilla") && !b.name.startsWith("vanilla")
                ? 1
                : b.name.startsWith("vanilla") && !a.name.startsWith("vanilla")
                ? -1
                : a.name.startsWith("vanilla") && b.name.startsWith("vanilla")
                ? a.name === "vanilla"
                    ? 1
                    : b.name === "vanilla"
                    ? -1
                    : -a.name.localeCompare(b.name)
                : a.name.localeCompare(b.name)
        )
        .map((dirent) => path.join(dirent.parentPath, dirent.name, "ddui"));
    if (folders.length === 0) return [dduiPath];
    return folders;
}

function resolveDDUIScreen(screen) {
    /**
     * @type {{children: any[]}}
     */
    const resolvedDDUIScreen = {
        children: [],
    };
    function resolveComponent(component) {
        const resolvedComponent = {
            __Type: `DataDrivenUIGenericNode$_$${++lastDDUINodeID}`,
            dynamicAttribs: component.attribs ? JSON.stringify(component.attribs) : null,
            text: null, // TODO
            children: component.children?.map((child) => resolveComponent(child)) ?? [],
            tag: component.tag,
        };
        return resolvedComponent;
    }
    screen["minecraft:ui-composition"].layout.markup.forEach((child) => {
        resolvedDDUIScreen.children.push(resolveComponent(child));
    });
    return resolvedDDUIScreen;
}

globalThis.engine = {
    facets: loadedFacets,
    /**
     * @type {{[key in keyof EngineQueryNonFacetResultMap]?: (...args: EngineQuerySubscribeEventParamsMap[key]) => EngineQueryNonFacetResultMap[key]}}
     */
    __queryResolvers__: {
        "vanilla.core.dataDrivenUICompositionQuery"(screenID) {
            const dduiScreens = getDDUIScreens(getDDUIScreensFolders());
            return {
                __Type: `vanilla.core.dataDrivenUICompositionQuery$_$${
                    Object.keys(loadedFacets).length + Object.keys(engine.__queryResolvers__).indexOf("vanilla.core.dataDrivenUICompositionQuery")
                }`,
                children: [],
                ...(dduiScreens[screenID] && resolveDDUIScreen(dduiScreens[screenID])),
            };
        },
        "vanilla.gameplay.furnace"() {
            return {
                __Type: `vanilla.gameplay.furnace$_$${
                    Object.keys(loadedFacets).length + Object.keys(engine.__queryResolvers__).indexOf("vanillaGameplayFurnace")
                }`,
                ...loadedFacets["vanilla.gameplay.furnace"](),
            };
        },
        vanillaGameplayContainerItemQuery() {
            return {
                __Type: `vanillaGameplayContainerItemQuery$_$${
                    Object.keys(loadedFacets).length + Object.keys(engine.__queryResolvers__).indexOf("vanillaGameplayContainerItemQuery")
                }`,
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
                __Type: `vanillaGameplayContainerSizeQuery$_$${
                    Object.keys(loadedFacets).length + Object.keys(engine.__queryResolvers__).indexOf("vanillaGameplayContainerSizeQuery")
                }`,
                size: 36,
            };
        },
        vanillaGameplayContainerNameQuery() {
            return {
                __Type: `vanillaGameplayContainerNameQuery$_$${
                    Object.keys(loadedFacets).length + Object.keys(engine.__queryResolvers__).indexOf("vanillaGameplayContainerNameQuery")
                }`,
                name: "CONTAINER TEST",
            };
        },
        vanillaGameplayContainerChestTypeQuery() {
            return {
                __Type: `vanillaGameplayContainerChestTypeQuery$_$${
                    Object.keys(loadedFacets).length + Object.keys(engine.__queryResolvers__).indexOf("vanillaGameplayContainerChestTypeQuery")
                }`,
                chestType: VanillaGameplayContainerChestType.Barrel,
            };
        },
        vanillaGameplayRecipeBookFilteringQuery() {
            return {
                __Type: `vanillaGameplayRecipeBookFilteringQuery$_$${
                    Object.keys(loadedFacets).length + Object.keys(engine.__queryResolvers__).indexOf("vanillaGameplayRecipeBookFilteringQuery")
                }`,
                isFiltering: false,
            };
        },
        vanillaGameplayRecipeBookSearchStringQuery() {
            return {
                __Type: `vanillaGameplayRecipeBookSearchStringQuery$_$${
                    Object.keys(loadedFacets).length + Object.keys(engine.__queryResolvers__).indexOf("vanillaGameplayRecipeBookSearchStringQuery")
                }`,
                searchString: "",
            };
        },
        vanillaGameplayUIProfile() {
            return {
                __Type: `vanillaGameplayUIProfile$_$${
                    Object.keys(loadedFacets).length + Object.keys(engine.__queryResolvers__).indexOf("vanillaGameplayUIProfile")
                }`,
                uiProfile: 0,
            };
        },
        vanillaGameplayAnvilQuery() {
            return {
                __Type: `vanillaGameplayAnvilQuery$_$${Object.keys(__queryResolvers__).indexOf("vanillaGameplayAnvilQuery")}`,
                costText: "69 Levels",
                damageState: 1,
                hasInputItem: true,
                previewItemName: "Rick Astley",
                shouldCrossOutIconBeVisible: false,
            };
        },
        vanillaGameplayTradeOverviewQuery() {
            return {
                __Type: `vanillaGameplayTradeOverviewQuery$_$${Object.keys(__queryResolvers__).indexOf("vanillaGameplayTradeOverviewQuery")}`,
                experiencePossibleProgress: 5,
                experienceProgress: 0.6,
                isExperienceBarVisible: true,
                traderName: "Rick Astley",
                tradeTiers: 5,
            };
        },
        vanillaGameplayTradeTierQuery(tradeTier) {
            return {
                __Type: `vanillaGameplayTradeTierQuery$_$${Object.keys(__queryResolvers__).indexOf("vanillaGameplayTradeTierQuery")}`,
                isTierUnlocked: true,
                isTierVisible: true,
                tierName: `Tier ${tradeTier} - ${["Never", "gonna", "give", "you", "up."][tradeTier] ?? "UNNAMED"}`,
                tradeOffers: 2,
            };
        },
        vanillaGameplayTradeOfferQuery(tradeTier, tradeIndex) {
            return {
                __Type: `vanillaGameplayTradeOfferQuery$_$${Object.keys(__queryResolvers__).indexOf("vanillaGameplayTradeOfferQuery")}`,
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
    },
    bindings: {},
    WindowLoaded: false,
    BindingsReady: (...version) => console.log(`[EngineWrapper::BindingsReady] BindingsReady called (v${version.join(".")})`),
    on: (id, func) => {
        engine.bindings[id] ??= [];
        engine.bindings[id].push(func);
    },
    off: (id, handler) => {
        if (handler) {
            engine.bindings[id] = engine.bindings[id].filter((h) => h !== handler);
        } else {
            delete engine.bindings[id];
        }
    },
    RemoveOnHandler: (id, func, _) => console.log(`[EngineWrapper::RemoveOnHandler] RemoveOnHandler for ID ${id}. func: ${func}`),
    trigger: (id, ...args) => {
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
                                    typeof engine.facets[query] === "function"
                                        ? engine.facets[query](parameters)
                                        : (console.log("NOT A FUNCTION", query, engine.facets[query]), engine.facets[query])
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
                    engine.bindings[`query:subscribed/${args[0]}`]?.forEach((f) => f?.(engine.facets["core.input"]({})));
                    break;
                default:
                    if (id.startsWith("query:subscribe/")) {
                        if (engine.__queryResolvers__[id.slice("query:subscribe/".length)]) {
                            engine.bindings[`query:subscribed/${args[0]}`]?.forEach((f) =>
                                f?.(engine.__queryResolvers__[id.slice("query:subscribe/".length)](...args.slice(1)))
                            );
                        } else if (engine.facets[id.slice("query:subscribe/".length)]) {
                            engine.bindings[`query:subscribed/${args[0]}`]?.forEach((f) => f?.(engine.facets[id.slice("query:subscribe/".length)]({})));
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
        apply: (_, [id, ...args]) => {
            while (true) {
                if (!engine.WindowLoaded) continue;
                switch (id) {
                    case "facet:request": {
                        const [query, requestId, parameters] = args;
                        if (engine.facets.hasOwnProperty(query)) {
                            console.log(`[EngineWrapper::TriggerEvent] Sending Facet: ${query}`, args);
                            if (requestId !== undefined) {
                                console.log(id, query, requestId, parameters);
                                engine.bindings["facet:updated:" + requestId](
                                    typeof engine.facets[query] === "function"
                                        ? engine.facets[query](parameters)
                                        : (console.log("NOT A FUNCTION", query, engine.facets[query]), engine.facets[query])
                                );
                            } else engine.bindings["facet:updated:" + query]?.forEach((f) => f?.(engine.facets[query]));
                        } else {
                            console.error(`[EngineWrapper::TriggerEvent] MISSING FACET: ${query}`);
                            try {
                                engine.bindings["facet:error:" + (requestId ?? query)]?.forEach((f) => f?.(engine.facets[query]));
                            } catch {}
                        }
                        break;
                    }
                    case "core:exception":
                        console.error(`[EngineWrapper::TriggerEvent] OreUI has reported exception:`, ...args);
                        break;
                    default:
                        console.warn(`[EngineWrapper::TriggerEvent] OreUI triggered ${id} but we don't handle it!`, "Args:", ...args);
                        break;
                }
                engine.bindings[id]?.forEach((f) => f?.(...args));

                return;
            }
        },
    },
};

let lastDDUINodeID = Object.keys(loadedFacets).length + Object.keys(engine.__queryResolvers__).length - 1;

// TODO: Add support for the vanilla commands (the global `__commands__` object).

const facets = JSON.parse(fs.readFileSync(__dirname + "/src/facets.json"));
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

window.addEventListener("DOMContentLoaded", () => {
    document.title = "Ore UI Preview";
    document.getElementsByTagName("body")[0].style = "user-select: none;";

    // Panorama
    const link = document.createElement("link");
    link.href = "/libs/@hatchibombotar-cubemap/index.css";
    link.type = "text/css";
    link.rel = "stylesheet";
    document.getElementsByTagName("head")[0].appendChild(link);

    globalThis.__internal_cubemap__ = new Cubemap(
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

    window.addEventListener("resize", () => void globalThis.__internal_cubemap__?.update());

    // To fix CSS
    const styleEl = document.createElement("style");
    document.head.appendChild(styleEl);

    const styleSheet = styleEl.sheet;
    styleSheet.insertRule(`#root { position: absolute; z-index: 1000; }`, styleSheet.cssRules.length);
    styleSheet.insertRule(`::-webkit-scrollbar { width: 0; }`, styleSheet.cssRules.length);
    styleSheet.insertRule(`input { outline: none; }`, styleSheet.cssRules.length);
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
    styleSheet.insertRule(`* { box-sizing: border-box; }`, styleSheet.cssRules.length);
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
