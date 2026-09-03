// @ts-check
/** @type {Record<string, boolean>} */
const platformLockedWorlds = {};

module.exports = /** @type {() => FacetTypeMap["vanilla.worldStartup"]} */ () => ({
    missingPacksToStart: [],
    backupThenStartLocalWorld: {
        progress: null,
        state: 0,
        result: null,
        run() {},
        cancel() {},
        clear() {},
    },
    startLocalWorld: Object.assign(
        function startLocalWorld(/** @type {unknown} */ worldId) {
            console.log(`[EngineWrapper/VanillaWorldStartupFacet] startLocalWorld(): Starting local world with id: ${worldId}`);
            return null;
        },
        {
            result: 0,
            /**
             * @param {unknown} worldId
             */
            run(worldId) {
                console.log(`[EngineWrapper/VanillaWorldStartupFacet] startLocalWorld.run(): Starting local world with id: ${worldId}`);
            },
            clear: () => {},
        }
    ),
    brokenPacksToStart: [],
    missingPacksSize: "",
    missingTemplateToStart: "",
    hasMissingResources: false,
    startLocalWorldTaskState: 0,
    startLocalWorldResult: null,
    setConfirmedPlatformLockedContentForWorld(worldId) {
        platformLockedWorlds[worldId] = true;
        return null;
    },
    hasConfirmedPlatformLockedContentForWorld(worldId) {
        return platformLockedWorlds[worldId] ?? false;
    },
    clearStartLocalWorldResult() {
        return null;
    },
});
