// @ts-check
/**
 * Maps world IDs to whether the experimental world warning should not be shown.
 *
 * @type {Map<string, boolean>}
 */
let doNotShowExperimentalWorldWarning = new Map();

module.exports = /** @type {() => FacetTypeMap["vanilla.notificationOptions"]} */ () => ({
    doNotShowFriendsListFTUE: false,
    doNotShowManageFeedDeleteWarning: false,
    doNotShowEntitlementsWarning: false,
    doNotShowOldWorldsWarning: false,
    doNotShowAddonStackingWarning: false,
    doNotShowManageShowcaseReplaceWarning: false,
    doNotShowManageShowcaseClearWarning: false,
    doNotShowAlternativeStorageHasWorlds: false,
    doNotShowHiddenAlternativeStorageWorldsWarning: false,
    doNotShowHiddenLocalWorldsWarning: false,
    doNotShowUsingExternalStorageWarning: false,
    doNotShowMultiplayerOnlineSafetyWarning: false,
    doNotShowMultiplayerIpSafetyWarning: false,
    doNotShowHardcoreModeWarning: false,
    doNotShowUnavailableDependenciesBeta: true,
    /**
     * @param {string} worldId
     * @returns {boolean}
     */
    getDoNotShowExperimentalWorldWarning(worldId) {
        return typeof worldId === "string" ?
                doNotShowExperimentalWorldWarning.get(worldId) || false
            :   /** @type {boolean} */ (/** @type {unknown} */ (undefined));
    },
    /**
     * @param {string} worldId
     * @param {boolean} value
     * @returns {null}
     */
    setDoNotShowExperimentalWorldWarning(worldId, value) {
        return (
            typeof worldId === "string" ?
                typeof value === "boolean" ?
                    (doNotShowExperimentalWorldWarning.set(worldId, value), null)
                :   /** @type {null} */ (/** @type {unknown} */ (undefined))
            :   /** @type {null} */ (/** @type {unknown} */ (undefined))
        );
    },
});
