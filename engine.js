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
const { VanillaGameplayContainerChestType } = require("@ore-ui-types/enums");
/**
 * The path to the config file.
 *
 * @type {string}
 */
const configPath = String(JSON.parse(process.argv.find((arg) => arg.startsWith("--config-path="))?.split("=")[1] || "null") ?? "./config.json");
/**
 * @type {{ pathname: string; file: string; panorama: string; texts_path?: string | undefined; ddui_path?: string | undefined; } & ({ use_translation: true; locale: string; } | { use_translation: false; locale?: string | undefined; })}
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
var engine = /** @satisfies {Engine} */ ({
    facets: loadedFacets,
    /**
     * @type {{[key in keyof EngineQueryNonFacetResultMap]?: (...args: EngineQuerySubscribeEventParamsMap[key] | (key extends keyof EngineQuerySubscribeEventDeprecatedParamsMap ? EngineQuerySubscribeEventDeprecatedParamsMap[key] : never)) => EngineQueryNonFacetResultMap[key]}}
     */
    __queryResolvers__: {
        "vanilla.core.dataDrivenUICompositionQuery"(screenID) {
            /**
             * @type {any}
             */
            const queryResolvers = engine.__queryResolvers__;
            const dduiScreens = getDDUIScreens(getDDUIScreensFolders());
            return {
                __Type: `vanilla.core.dataDrivenUICompositionQuery$_$${
                    Object.keys(loadedFacets).length + Object.keys(queryResolvers).indexOf("vanilla.core.dataDrivenUICompositionQuery")
                }`,
                children: [],
                ...(dduiScreens[screenID] && resolveDDUIScreen(dduiScreens[screenID])),
            };
        },
        "vanilla.gameplay.furnace"() {
            /**
             * @type {any}
             */
            const queryResolvers = engine.__queryResolvers__;
            return {
                __Type: `vanilla.gameplay.furnace$_$${Object.keys(loadedFacets).length + Object.keys(queryResolvers).indexOf("vanilla.gameplay.furnace")}`,
                // @ts-ignore: This should throw an error if the facet is not loaded.
                ...loadedFacets["vanilla.gameplay.furnace"](),
            };
        },
        vanillaCoreDataDrivenUIDefinitionQuery(_unknownArg1, screenID) {
            // TODO: Use the unknownArg1 parameter (the first one) once it is figured out what it is.
            /**
             * @type {any}
             */
            const queryResolvers = engine.__queryResolvers__;
            const dduiScreens = getDDUIScreens(getDDUIScreensFolders());
            return {
                __Type: `vanillaCoreDataDrivenUIDefinitionQuery$_$${
                    Object.keys(loadedFacets).length + Object.keys(queryResolvers).indexOf("vanillaCoreDataDrivenUIDefinitionQuery")
                }`,
                children: [],
                ...(dduiScreens[screenID] && resolveDDUIScreen(dduiScreens[screenID])),
            };
        },
        vanillaCoreDataDrivenUIScreenIdQuery() {
            /**
             * @type {any}
             */
            const queryResolvers = engine.__queryResolvers__;
            return {
                __Type: `vanillaCoreDataDrivenUIScreenIdQuery$_$${
                    Object.keys(loadedFacets).length + Object.keys(queryResolvers).indexOf("vanillaCoreDataDrivenUIScreenIdQuery")
                }`,
                screenId: new URLSearchParams(loadedFacets["core.router"]?.().history.location.search).get("screenId") ?? null,
            };
        },
        vanillaGameplayContainerItemQuery() {
            /**
             * @type {any}
             */
            const queryResolvers = engine.__queryResolvers__;
            return {
                __Type: `vanillaGameplayContainerItemQuery$_$${
                    Object.keys(loadedFacets).length + Object.keys(queryResolvers).indexOf("vanillaGameplayContainerItemQuery")
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
            /**
             * @type {any}
             */
            const queryResolvers = engine.__queryResolvers__;
            return {
                __Type: `vanillaGameplayContainerSizeQuery$_$${
                    Object.keys(loadedFacets).length + Object.keys(queryResolvers).indexOf("vanillaGameplayContainerSizeQuery")
                }`,
                size: 36,
            };
        },
        vanillaGameplayContainerNameQuery() {
            /**
             * @type {any}
             */
            const queryResolvers = engine.__queryResolvers__;
            return {
                __Type: `vanillaGameplayContainerNameQuery$_$${
                    Object.keys(loadedFacets).length + Object.keys(queryResolvers).indexOf("vanillaGameplayContainerNameQuery")
                }`,
                name: "CONTAINER TEST",
            };
        },
        vanillaGameplayContainerChestTypeQuery() {
            /**
             * @type {any}
             */
            const queryResolvers = engine.__queryResolvers__;
            return {
                __Type: `vanillaGameplayContainerChestTypeQuery$_$${
                    Object.keys(loadedFacets).length + Object.keys(queryResolvers).indexOf("vanillaGameplayContainerChestTypeQuery")
                }`,
                chestType: VanillaGameplayContainerChestType.Barrel,
            };
        },
        vanillaGameplayRecipeBookFilteringQuery() {
            /**
             * @type {any}
             */
            const queryResolvers = engine.__queryResolvers__;
            return {
                __Type: `vanillaGameplayRecipeBookFilteringQuery$_$${
                    Object.keys(loadedFacets).length + Object.keys(queryResolvers).indexOf("vanillaGameplayRecipeBookFilteringQuery")
                }`,
                isFiltering: false,
            };
        },
        vanillaGameplayRecipeBookSearchStringQuery() {
            /**
             * @type {any}
             */
            const queryResolvers = engine.__queryResolvers__;
            return {
                __Type: `vanillaGameplayRecipeBookSearchStringQuery$_$${
                    Object.keys(loadedFacets).length + Object.keys(queryResolvers).indexOf("vanillaGameplayRecipeBookSearchStringQuery")
                }`,
                searchString: "",
            };
        },
        vanillaGameplayUIProfile() {
            /**
             * @type {any}
             */
            const queryResolvers = engine.__queryResolvers__;
            return {
                __Type: `vanillaGameplayUIProfile$_$${Object.keys(loadedFacets).length + Object.keys(queryResolvers).indexOf("vanillaGameplayUIProfile")}`,
                uiProfile: 0,
            };
        },
        vanillaGameplayAnvilQuery() {
            /**
             * @type {any}
             */
            const queryResolvers = engine.__queryResolvers__;
            return {
                __Type: `vanillaGameplayAnvilQuery$_$${Object.keys(queryResolvers).indexOf("vanillaGameplayAnvilQuery")}`,
                costText: "69 Levels",
                damageState: 1,
                hasInputItem: true,
                previewItemName: "Rick Astley",
                shouldCrossOutIconBeVisible: false,
            };
        },
        vanillaGameplayTradeOverviewQuery() {
            /**
             * @type {any}
             */
            const queryResolvers = engine.__queryResolvers__;
            return {
                __Type: `vanillaGameplayTradeOverviewQuery$_$${Object.keys(queryResolvers).indexOf("vanillaGameplayTradeOverviewQuery")}`,
                experiencePossibleProgress: 5,
                experienceProgress: 0.6,
                isExperienceBarVisible: true,
                traderName: "Rick Astley",
                tradeTiers: 5,
            };
        },
        vanillaGameplayTradeTierQuery(tradeTier) {
            /**
             * @type {any}
             */
            const queryResolvers = engine.__queryResolvers__;
            return {
                __Type: `vanillaGameplayTradeTierQuery$_$${Object.keys(queryResolvers).indexOf("vanillaGameplayTradeTierQuery")}`,
                isTierUnlocked: true,
                isTierVisible: true,
                tierName: `Tier ${tradeTier} - ${["Never", "gonna", "give", "you", "up."][tradeTier] ?? "UNNAMED"}`,
                tradeOffers: 2,
            };
        },
        vanillaGameplayTradeOfferQuery(tradeTier, tradeIndex) {
            /**
             * @type {any}
             */
            const queryResolvers = engine.__queryResolvers__;
            return {
                __Type: `vanillaGameplayTradeOfferQuery$_$${Object.keys(queryResolvers).indexOf("vanillaGameplayTradeOfferQuery")}`,
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
// Assign the value to the variable.
__commands__ = {
    vanillaCoreDataStoreSetCommandGroup: {
        dataStoreButtonPress: {
            id: 109,
            callable(...args) {}, // TODO
        },
        setDataStorePathBool: {
            id: 108,
            callable(...args) {}, // TODO
        },
        setDataStorePathNumber: {
            id: 107,
            callable(...args) {}, // TODO
        },
        setDataStorePathString: {
            id: 106,
            callable(...args) {}, // TODO
        },
    },
    vanillaGameplayAnvilCommandGroup: {
        setPreviewItemName: {
            id: 105,
            callable(itemName) {
                return null;
            }, // TODO
        },
    },
    vanillaGameplayRecipeBookFilteringCommandGroup: {
        setRecipeBookFiltering: {
            id: 104,
            callable(enabled) {
                return null;
            }, // TODO
        },
    },
    vanillaGameplayRecipeBookSearchStringCommandGroup: {
        setRecipeBookSearchString: {
            id: 103,
            callable(searchString) {
                return null;
            }, // TODO
        },
    },
    vanillaGameplayTradeCommandGroup: {
        performAutoTrade: {
            id: 102,
            callable(tradeTier, tradeIndex) {
                return null;
            }, // TODO
        },
        pullInIngredientsForSelectedTrade: {
            id: 101,
            callable() {
                return null;
            }, // TODO
        },
        selectTrade: {
            id: 100,
            callable(...args) {
                return null;
            }, // TODO
        },
    },
    vanillaGameplayContainerCommandGroup: {
        autoCraftAllItemsFromRecipe: {
            id: 99,
            callable(...args) {
                return null;
            }, // TODO
        },
        autoCraftOneItemFromRecipe: {
            id: 98,
            callable(...args) {
                return null;
            }, // TODO
        },
        selectRecipe: {
            id: 97,
            callable(...args) {
                return null;
            }, // TODO
        },
        setDistributeAllSource: {
            id: 96,
            callable(...args) {
                return null;
            }, // TODO
        },
        splitSingleItem: {
            id: 95,
            callable(...args) {}, // TODO
        },
        splitMultipleItems: {
            id: 94,
            callable(...args) {
                return null;
            }, // TODO
        },
        autoPlaceItems: {
            id: 93,
            callable(...args) {
                return null;
            }, // TODO
        },
        coalesceOrAutoPlaceItems: {
            id: 92,
            callable(...args) {
                return null;
            }, // TODO
        },
        coalesceItems: {
            id: 91,
            callable(...args) {}, // TODO
        },
        dropOneItem: {
            id: 90,
            callable(...args) {
                return null;
            }, // TODO
        },
        dropAllItems: {
            id: 89,
            callable(...args) {
                return null;
            }, // TODO
        },
        placeAmountOfItems: {
            id: 88,
            callable(...args) {}, // TODO
        },
        placeOneItem: {
            id: 87,
            callable(...args) {
                return null;
            }, // TODO
        },
        placeAllItems: {
            id: 86,
            callable(...args) {
                return null;
            }, // TODO
        },
        takeHalfItems: {
            id: 85,
            callable(...args) {
                return null;
            }, // TODO
        },
        takeOneItem: {
            id: 84,
            callable(...args) {}, // TODO
        },
        takeAllItems: {
            id: 83,
            callable(...args) {
                return null;
            }, // TODO
        },
        closeContainer: {
            id: 82,
            callable(...args) {
                return null;
            }, // TODO
        },
    },
    vanillaGameInviteCommandGroup: {
        invitePlatformPlayers: {
            id: 81,
            callable(...args) {}, // TODO
        },
        inviteXboxPlayers: {
            id: 80,
            callable(...args) {}, // TODO
        },
    },
    vanilla_partyChatCommandGroup: {
        setIsOpen: {
            id: 79,
            callable(...args) {}, // TODO
        },
        setComposedMessage: {
            id: 78,
            callable(...args) {}, // TODO
        },
        sendComposedMessage: {
            id: 77,
            callable() {
                return null;
            },
        },
    },
    vanilla_menus_invoke_action_settings: {
        invokeAction: {
            id: 76,
            callable(...args) {}, // TODO
        },
    },
    coreScreenReaderCommandGroup: {
        read: {
            id: 75,
            callable(...args) {}, // TODO
        },
        clear: {
            id: 74,
            callable(...args) {}, // TODO
        },
    },
    routerCommandGroup: {
        go: {
            id: 73,
            callable(...args) {}, // TODO
        },
        back: {
            id: 72,
            callable(...args) {}, // TODO
        },
        replace: {
            id: 71,
            callable(...args) {}, // TODO
        },
        push: {
            id: 70,
            callable(...args) {}, // TODO
        },
    },
    soundCommandGroup: {
        isPlaying: {
            id: 69,
            callable(id) {
                return loadedFacets["core.sound"]?.()?.isPlaying(id) ?? false;
            },
        },
        fadeOut: {
            id: 68,
            callable(id, duration) {
                loadedFacets["core.sound"]?.()?.fadeOut(id, duration);
                return null;
            },
        },
        play: {
            id: 67,
            callable(sound, volume, pitch) {
                return loadedFacets["core.sound"]?.()?.play(sound, volume, pitch) ?? -1;
            },
        },
    },
    coreTranslateCommandGroup: {
        getHowLongAgoAsString: {
            id: 66,
            callable(...args) {
                return "0 seconds ago";
            },
        },
        formatDate: {
            id: 65,
            callable(timestampInSeconds) {
                return new Date(timestampInSeconds * 1000).toLocaleDateString();
            },
        },
        translate: {
            id: 64,
            callable(key, parameters) {
                return loadedFacets["core.locale"]?.()?.translateWithParameters(key, parameters) ?? key;
            },
        },
    },
    coreStorageCommandGroup: {
        changeStorage: {
            id: 63,
            callable(...args) {}, // TODO
        },
    },
    vanilla_menus_update_settings: {
        updateNumber: {
            id: 62,
            callable(...args) {}, // TODO
        },
        updateString: {
            id: 61,
            callable(...args) {}, // TODO
        },
        updateOption: {
            id: 60,
            callable(...args) {}, // TODO
        },
        updateBoolean: {
            id: 59,
            callable(...args) {}, // TODO
        },
    },
    coreHapticsCommandGroup: {
        vibrate: {
            id: 58,
            callable(duration) {
                return null;
            },
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
    styleSheet.insertRule(`* { box-sizing: border-box; }`, styleSheet.cssRules.length); // styleSheet.insertRule(`body * { box-sizing: border-box; display: flex; }`, styleSheet.cssRules.length); // TODO
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
