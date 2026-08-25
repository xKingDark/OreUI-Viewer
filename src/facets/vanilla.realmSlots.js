// @ts-check
let activeSlotIndex = 0;
module.exports = /** @type {() => FacetTypeMap["vanilla.realmSlots"]} */ () => ({
    realmSlots: [
        {
            id: 1,
            worldName: "My World",
            slotImage: "",
            empty: false,
            gameMode: 6,
            hardcore: false,
        },
        {
            id: -1,
            worldName: "New World",
            slotImage: "",
            empty: true,
            gameMode: -1,
            hardcore: false,
        },
        {
            id: 3,
            worldName: "Celebration Map",
            slotImage: "https://packsbedrockstage-endpoint.azureedge.net/pack-images/celebration_world_icon.jpg",
            empty: false,
            gameMode: 0,
            hardcore: true,
        },
    ],
    isLoading: false,
    selectedRealmIndex: 0,
    isSlotSelected: true,
    didFailToActivateSlot: false,
    didFailToQuerySelectedRealmDetails: false,
    isShowingConfirmationModal: false,
    selectedRealmName: "My Realm",
    get activeSlotIndex() {
        return activeSlotIndex;
    },
    getSelectedRealmDetails: (id) => {
        return null;
    },
    selectSlot: (index) => {
        return null;
    },
    activateSlot: (index) => {
        activeSlotIndex = index;
        triggerUpdateSubscriptions(module.exports());
        return null;
    },
    confirm: () => {
        return null;
    },
    reset: () => {
        return null;
    },
    status: 0,
});
/**
 * @param {ReturnType<typeof module.exports>} value
 */
function triggerUpdateSubscriptions(value) {
    for (const callback of updateSubscriptions) {
        try {
            callback(value)?.catch((e) => {
                console.error("[Facet::vanilla.realmSlots::triggerUpdateSubscriptions] Error on async callback:", callback, value, e);
            });
        } catch (e) {
            console.error("[Facet::vanilla.realmSlots::triggerUpdateSubscriptions] Error on callback:", callback, value, e);
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
