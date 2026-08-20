// @ts-check
const crypto = require("node:crypto");
const experimentals = () => {
    let amount = 8;
    let experiments = [];
    for (let i = 1; i <= amount; i++) {
        experiments.push({
            id: i,
            title: crypto.randomUUID(),
            description: crypto.randomUUID(),
            isEnabled: Math.round(Math.random()) == 0 ? false : true,
            category: 1,
        });
    }

    return experiments;
};

module.exports =
    /** @type {() => FacetTypeMap["vanilla.createNewWorld"] & Record<"isUsingTemplate" | "isLockedTemplate" | "generalWarningState" | "worldCreationData", unknown>} */ () => ({
        isEditorWorld: false,
        isUsingTemplate: false,
        isLockedTemplate: false,
        generalWarningState: 0,
        showedAchievementWarning: false,
        applyTemplate: (templateId) => console.log("[EngineWrapper/CNWFacet] applyTemplate();", templateId),
        createOnRealms: Object.assign(
            function createOnRealms() {
                console.log("[EngineWrapper/CNWFacet] createOnRealms.call();");
            },
            {
                call: () => console.log("[EngineWrapper/CNWFacet] createOnRealms.call();"),
                error: null,
            }
        ),
        createWorld: Object.assign(
            function createWorld() {
                console.log("[EngineWrapper/CNWFacet] createWorld.call();");
            },
            {
                call: () => console.log("[EngineWrapper/CNWFacet] createWorld.call();"),
                error: null,
            }
        ),
        createWorldOnPreviewRealm: (id) => {},
        unlockTemplateSettings: () => true,
        checkIfUserHasChangedSettings: () => true,
        worldCreationData: {
            general: {
                worldName: "Test World",
                difficulty: 3,
                gameMode: 0,
                isHardcore: true,
            },
            advanced: {
                useFlatWorld: false,
                simulationDistance: 8,
                startWithMap: false,
                bonusChest: false,
                showCoordinates: true,
                recipesUnlock: true,
                firesSpreads: true,
                tntExplodes: true,
                respawnBlocksExplode: true,
                mobLoot: true,
                naturalRegeneration: true,
                tileDrops: true,
                immediateRespawn: true,
                respawnRadius: "5",
                worldSeed: "-1",
            },
            cheats: {
                cheatsEnabled: false,
                tickSpeed: 1,
            },
            betaFeatures: [
                {
                    id: "0",
                    title: "Gameplay Test",
                    description: "Hello!",
                    isEnabled: false,
                    category: 0,
                },
                {
                    id: "0",
                    title: "Add-on Creators Test",
                    description: "Hello!",
                    isEnabled: false,
                    category: 1,
                },
                {
                    id: "0",
                    title: "Internal Test",
                    description: "Hello!",
                    isEnabled: false,
                    category: 2,
                },
            ],
            multiplayer: {
                generalWarningState: 0,
                multiplayerSupported: true,
                playerPermissions: 1,
                multiplayerGame: true,
                playerAccess: 3,
                visibleToLanPlayers: true,
                friendlyFire: true,
                platformPlayerAccess: 3,
                platformPlayerAccessSupported: true,
                platformPlayerAccessEnabled: true,
                platformPlayerInviteAccessSupported: true,
            },
            scriptingCoding: {
                codeBuilderEnabled: true,
            },
        },

        // 1.21.93
        applyTemplateTaskState: 0,
        consumeResetFlag: false,
        inWorldCreation: false,
        worldData: {
            achievementsPermanentlyDisabled: false,
            achievementsDisabled: false,
            isUsingTemplate: false,
            isLockedTemplate: false,
            betaFeatures: [
                {
                    isEnabled: false,
                    isTogglePermanentlyDisabled: false,
                    category: 2,
                    description: "createWorldScreen.experimentalbiomesDescription",
                    title: "createWorldScreen.experimentalbiomes",
                    id: "biom",
                },
                {
                    isEnabled: false,
                    isTogglePermanentlyDisabled: false,
                    category: 2,
                    description: "createWorldScreen.experimentalCreatorFeaturesDescription",
                    title: "createWorldScreen.experimentalCreatorFeatures",
                    id: "ucft",
                },
                {
                    isEnabled: false,
                    isTogglePermanentlyDisabled: false,
                    category: 2,
                    description: "createWorldScreen.experimentalGameTestDescription",
                    title: "createWorldScreen.experimentalGameTest",
                    id: "gtst",
                },
                {
                    isEnabled: false,
                    isTogglePermanentlyDisabled: false,
                    category: 2,
                    description: "createWorldScreen.experimentalCreatorCameraFeaturesDescription",
                    title: "createWorldScreen.experimentalCreatorCameraFeatures",
                    id: "exca",
                },
                {
                    isEnabled: false,
                    isTogglePermanentlyDisabled: false,
                    category: 0,
                    description: "createWorldScreen.experimentalVillagerTradesRebalanceDescription",
                    title: "createWorldScreen.experimentalVillagerTradesRebalance",
                    id: "vtra",
                },
                {
                    isEnabled: false,
                    isTogglePermanentlyDisabled: false,
                    category: 2,
                    description: "createWorldScreen.experimentalDataDrivenJigsawStructuresDescription",
                    title: "createWorldScreen.experimentalDataDrivenJigsawStructures",
                    id: "ddjs",
                },
            ],
            resourcePacks: { sharedPacksEnabled: false },
            cheats: {
                tickSpeed: "1",
                educationEdition: false,
                commandBlocks: true,
                weather: true,
                entitiesDropLoot: true,
                mobGriefing: true,
                mobSpawning: true,
                keepInventory: false,
                daylightCycle: 0,
                cheatsEnabled: false,
            },
            scriptingCoding: { consoleCommandsEnabled: false, codeBuilderEnabled: false },
            multiplayer: {
                locatorBarEnabled: true,
                friendlyFire: true,
                visibleToLanPlayers: true,
                playerPermissions: 1,
                playerAccess: 2,
                generalWarningState: 1,
                platformPlayerFriendsOfFriendsAccessSupported: true,
                platformPlayerInviteAccessSupported: false,
                platformPlayerAccessEnabled: false,
                platformPlayerAccessSupported: false,
                platformPlayerAccess: 2,
                multiplayerGame: true,
                multiplayerSupported: true,
            },
            advanced: {
                flatWorldPreset: "ClassicFlat",
                worldSeed: "0",
                respawnRadius: "10",
                immediateRespawn: false,
                sleepSkipNightPercent: 100,
                sleepSkipNight: true,
                tileDrops: true,
                naturalRegeneration: true,
                mobLoot: true,
                respawnBlocksExplode: true,
                tntExplodes: true,
                recipesUnlock: true,
                firesSpreads: true,
                friendlyFire: true,
                showDaysPlayed: false,
                showCoordinates: false,
                bonusChest: false,
                startWithMap: false,
                simulationDistance: 4,
                generatorType: 1,
                useFlatWorld: false,
            },
            general: { difficulty: 2, playerHasDied: false, isHardcore: false, gameMode: 0, worldName: "" },
        },
        worldPreviewImagePath: "",
        createOnRealmsError: null,
        createWorldError: null,
        isCreatingWorld: false,
        isRandomSeedAllowed: false,
        checkDlcError: "",
        inputError: "",
        clearErrors() {},
        selectRealmToCreateOn() {
            // TO-DO
        },
    });
