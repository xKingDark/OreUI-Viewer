require("v8-compile-cache");
const fs = require("fs");
const path = require("path");
const { Cubemap } = require("./libs/@hatchibombotar-cubemap");
const { ipcRenderer } = require("electron/renderer");
/**
 * @type {string}
 */
const configPath = String(JSON.parse(process.argv.find((arg) => arg.startsWith("--config-path="))?.split("=")[1] || "null") ?? "./config.json");
/**
 * @type {string}
 */
const facetsPath = String(JSON.parse(process.argv.find((arg) => arg.startsWith("--facets-path="))?.split("=")[1] || "null") ?? __dirname + "/src/facets/");
/**
 * @type {string}
 */
const cuebmapImagesPath = String(
    JSON.parse(process.argv.find((arg) => arg.startsWith("--cubemap-images-path="))?.split("=")[1] || "null") ?? __dirname + "/src/assets/cubemap/"
);
/**
 * @type {typeof import("./config.json")}
 */
let Config = JSON.parse(JSON.parse(process.argv.find((arg) => arg.startsWith("--config-data="))?.split("=")[1] || "\"null\"")) ?? require(configPath);
if (window.location.pathname != Config.file) window.location.pathname = Config.file;

globalThis.textsPath = String(JSON.parse(process.argv.find((arg) => arg.startsWith("--texts-path="))?.split("=")[1] || "null") ?? __dirname + "/src/texts/");

ipcRenderer.on("oreUIViewer:setConfig", (event, config) => {
    Config = config;
    window.location.pathname = Config.file;
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

globalThis.engine = {
    facets: loadedFacets,
    bindings: {},
    WindowLoaded: false,
    BindingsReady: (...version) => console.log(`[EngineWrapper] BindingsReady called (v${version.join(".")})`),
    on: (id, func) => (engine.bindings[id] = func),
    off: (id) => delete engine.bindings[id],
    RemoveOnHandler: (id, func, _) => console.log(`[EngineWrapper] RemoveOnHandler for ID ${id}. func: ${func}`),
    trigger: (id, query, requestId, parameters) => {
        while (true) {
            if (!engine.WindowLoaded) continue;
            switch (id) {
                case "facet:request":
                    if (engine.facets.hasOwnProperty(query)) {
                        console.log(`[EngineWrapper] Sending Facet: ${query}`);
                        if (requestId !== undefined) {
                            console.log(id, query, requestId, parameters);
                            engine.bindings["facet:updated:" + requestId](
                                typeof engine.facets[query] === "function"
                                    ? engine.facets[query](parameters)
                                    : (console.log("NOT A FUNCTION", query, engine.facets[query]), engine.facets[query])
                            );
                        } else engine.bindings["facet:updated:" + query](engine.facets[query]);
                    } else {
                        console.error(`[EngineWrapper] MISSING FACET: ${query}`);
                        try {
                            engine.bindings["facet:error:" + (requestId ?? query)](engine.facets[query]);
                        } catch {}
                    }
                    break;
                case "core:exception":
                    console.error(`[EngineWrapper] OreUI has reported exception: ${query}`);
                    break;
                default:
                    console.warn(`[EngineWrapper] OreUI triggered ${id} but we don't handle it!`);
                    break;
            }

            return;
        }
    },
    TriggerEvent: {
        apply: (_, [id, facet]) => {
            while (true) {
                if (!engine.WindowLoaded) continue;
                switch (id) {
                    case "facet:request":
                        if (engine.facets.hasOwnProperty(facet)) {
                            console.log(`[EngineWrapper] Sending Facet: ${facet}`);
                            engine.bindings["facet:updated:" + facet](engine.facets[facet]);
                        } else {
                            console.error(`[EngineWrapper] MISSING FACET: ${facet}`);
                            engine.bindings["facet:error:" + facet](engine.facets[facet]);
                        }
                        break;
                    case "core:exception":
                        console.error(`[EngineWrapper] OreUI has reported exception: ${facet}`);
                        break;
                    default:
                        console.warn(`[EngineWrapper] OreUI triggered ${id} but we don't handle it!`);
                        break;
                }

                return;
            }
        },
    },
};

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
            cuebmapImagesPath.replaceAll("\\", "/").replace(/(?<!\/)$/, "/") + Config.panorama + "/front.png",
            cuebmapImagesPath.replaceAll("\\", "/").replace(/(?<!\/)$/, "/") + Config.panorama + "/right.png",
            cuebmapImagesPath.replaceAll("\\", "/").replace(/(?<!\/)$/, "/") + Config.panorama + "/back.png",
            cuebmapImagesPath.replaceAll("\\", "/").replace(/(?<!\/)$/, "/") + Config.panorama + "/left.png",
            cuebmapImagesPath.replaceAll("\\", "/").replace(/(?<!\/)$/, "/") + Config.panorama + "/top.png",
            cuebmapImagesPath.replaceAll("\\", "/").replace(/(?<!\/)$/, "/") + Config.panorama + "/bottom.png",
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
