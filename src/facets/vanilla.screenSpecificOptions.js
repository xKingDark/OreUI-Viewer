// @ts-check
/** @type {FacetTypeMap["vanilla.screenSpecificOptions"] & {[key in keyof FacetTypeMap["vanilla.screenSpecificOptions"] as `_${key}`]: FacetTypeMap["vanilla.screenSpecificOptions"][key]}} */
const screenSpecificOptionsData = {
    _devPlayScreenHideLanWorlds: false,
    get devPlayScreenHideLanWorlds() {
        return this._devPlayScreenHideLanWorlds;
    },
    set devPlayScreenHideLanWorlds(value) {
        this._devPlayScreenHideLanWorlds = value;
        triggerUpdateSubscriptions(screenSpecificOptionsData);
    },
    _playScreenWorldLayoutMode: 0,
    get playScreenWorldLayoutMode() {
        return this._playScreenWorldLayoutMode;
    },
    set playScreenWorldLayoutMode(value) {
        this._playScreenWorldLayoutMode = value;
        triggerUpdateSubscriptions(screenSpecificOptionsData);
    },
};

module.exports = /** @type {() => FacetTypeMap["vanilla.screenSpecificOptions"]} */ () => screenSpecificOptionsData;
/**
 * @param {ReturnType<typeof module.exports>} value
 */
function triggerUpdateSubscriptions(value) {
    for (const callback of updateSubscriptions) {
        try {
            callback(value)?.catch((e) => {
                console.error("[Facet::vanilla.screenSpecificOptions::triggerUpdateSubscriptions] Error on async callback:", callback, value, e);
            });
        } catch (e) {
            console.error("[Facet::vanilla.screenSpecificOptions::triggerUpdateSubscriptions] Error on callback:", callback, value, e);
        }
    }
}
/** @type {((value: ReturnType<typeof module.exports>) => Promise<void> | void)[]} */
const updateSubscriptions = [];
/**
 * @param {(value: ReturnType<typeof module.exports>) => Promise<void> | void} callback
 */
module.exports.observe = (callback) => {
    if (updateSubscriptions.includes(callback)) return;
    updateSubscriptions.push(callback);
};
/**
 * @param {(value: ReturnType<typeof module.exports>) => Promise<void> | void} callback
 */
module.exports.unobserve = (callback) => {
    if (!updateSubscriptions.includes(callback)) return;
    updateSubscriptions.splice(updateSubscriptions.indexOf(callback), 1);
};
